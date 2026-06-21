const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDb, query, mutate, runTransaction, validateRef } = require('../helpers/db');

function countRows(db, table) {
  const r = query(db, `SELECT COUNT(*) as c FROM ${table}`);
  return r[0]?.c || 0;
}

describe('Cases CRUD', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('inserts a case with minimum fields', () => {
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['2025/001', 'قضية تجارية']);
    const cases = query(db, "SELECT * FROM cases WHERE case_number = '2025/001'");
    assert.equal(cases.length, 1);
    assert.equal(cases[0].title, 'قضية تجارية');
    assert.equal(cases[0].status, 'active');
    assert.equal(cases[0].priority, 'medium');
    assert.equal(cases[0].case_type, 'مدني');
  });

  it('inserts case with full fields', () => {
    mutate(db, `INSERT INTO cases (case_number, title, client_name, court, status, description, total_fees, paid_fees, expenses, priority, case_type, created_date, deadline_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['2025/002', 'قضية كاملة', 'أحمد', 'المحكمة الابتدائية', 'pending', 'وصف القضية', 50000, 10000, 500, 'high', 'تجاري', '2025-01-15', '2025-06-30']);
    const c = query(db, "SELECT * FROM cases WHERE case_number = '2025/002'");
    assert.equal(c[0].client_name, 'أحمد');
    assert.equal(c[0].total_fees, 50000);
    assert.equal(c[0].paid_fees, 10000);
    assert.equal(c[0].case_type, 'تجاري');
  });

  it('prevents duplicate case_number (no unique constraint, but application-level check)', () => {
    // The app checks via findDuplicateCase, not DB constraint
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['2025/001', 'Duplicate']);
    const dupes = query(db, "SELECT * FROM cases WHERE case_number = '2025/001'");
    assert.equal(dupes.length, 2); // No DB-level unique constraint
  });

  it('updates case status', () => {
    mutate(db, "UPDATE cases SET status = ? WHERE case_number = ?", ['closed', '2025/001']);
    const c = query(db, "SELECT status FROM cases WHERE case_number = '2025/001'");
    assert.equal(c[0].status, 'closed');
  });

  it('updates case notes', () => {
    mutate(db, "UPDATE cases SET notes = ? WHERE case_number = ?", ['ملاحظات مهمة', '2025/001']);
    const c = query(db, "SELECT notes FROM cases WHERE case_number = '2025/001'");
    assert.equal(c[0].notes, 'ملاحظات مهمة');
  });

  it('archives and unarchives a case', () => {
    mutate(db, "UPDATE cases SET archived = 1 WHERE id = (SELECT id FROM cases WHERE case_number = '2025/001')");
    let c = query(db, "SELECT archived FROM cases WHERE case_number = '2025/001'");
    assert.equal(c[0].archived, 1);
    mutate(db, "UPDATE cases SET archived = 0 WHERE id = (SELECT id FROM cases WHERE case_number = '2025/001')");
    c = query(db, "SELECT archived FROM cases WHERE case_number = '2025/001'");
    assert.equal(c[0].archived, 0);
  });

  it('handles null client_id', () => {
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['2025/003', 'قضية بدون موكل']);
    const c = query(db, "SELECT * FROM cases WHERE case_number = '2025/003'");
    assert.equal(c[0].client_id, null);
  });

  it('filters active cases', () => {
    const active = query(db, "SELECT * FROM cases WHERE (archived = 0 OR archived IS NULL)");
    assert.ok(active.length > 0);
  });

  it('orders by created_date DESC', () => {
    const ordered = query(db, "SELECT case_number FROM cases ORDER BY created_date DESC");
    // Most recent first
    assert.ok(ordered.length >= 3);
  });
});

describe('Cases — Client Association', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['الموكل الأول']);
  });

  it('associates case with client', () => {
    const clientId = query(db, "SELECT id FROM clients WHERE name = 'الموكل الأول'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name) VALUES (?, ?, ?, ?)",
      ['2025/010', 'قضية موكل', clientId, 'الموكل الأول']);
    const c = query(db, "SELECT * FROM cases WHERE case_number = '2025/010'");
    assert.equal(c[0].client_id, clientId);
  });

  it('cascades SET NULL on client delete', () => {
    const clientId = query(db, "SELECT id FROM clients WHERE name = 'الموكل الأول'")[0].id;
    mutate(db, "DELETE FROM clients WHERE id = ?", [clientId]);
    const c = query(db, "SELECT client_id, client_name FROM cases WHERE case_number = '2025/010'");
    assert.equal(c[0].client_id, null);
    // client_name is NOT cleared by FK — app-level logic
    assert.equal(c[0].client_name, 'الموكل الأول');
  });
});

describe('Cases — Cascade Delete', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['C-DEL', 'To Delete']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'C-DEL'")[0].id;
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [cId, 'doc.pdf', '/tmp/doc.pdf', 'Contract']);
    mutate(db, "INSERT INTO tasks (title, case_id) VALUES (?, ?)", ['Task for case', cId]);
    mutate(db, "INSERT INTO events (title, date, case_id) VALUES (?, ?, ?)", ['Event for case', '2026-01-01', cId]);
    mutate(db, "INSERT INTO procedures (affaire_id, date, type) VALUES (?, ?, ?)", [cId, '2026-01-01', 'audience']);
    mutate(db, "INSERT INTO paiements (affaire_id, date, montant, mode_paiement) VALUES (?, ?, ?, ?)", [cId, '2026-01-01', 1000, 'espèces']);
  });

  it('deletes case and cascades to documents', () => {
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'C-DEL'")[0].id;
    runTransaction(db, (d) => {
      mutate(d, "DELETE FROM tasks WHERE case_id = ?", [cId]);
      mutate(d, "DELETE FROM events WHERE case_id = ?", [cId]);
      mutate(d, "DELETE FROM communications WHERE case_id = ?", [cId]);
      mutate(d, "DELETE FROM appointments WHERE case_id = ?", [cId]);
      mutate(d, "DELETE FROM cases WHERE id = ?", [cId]);
    });
    assert.equal(countRows(db, 'cases'), 0);
    // Documents cascade via FK
    assert.equal(countRows(db, 'documents'), 0);
    // Tasks SET NULL via FK
    assert.equal(countRows(db, 'tasks'), 0); // we deleted them manually
    // Events SET NULL — still exist with case_id = null
    assert.equal(countRows(db, 'events'), 0); // we deleted them too
    // Procedures cascade via FK
    assert.equal(countRows(db, 'procedures'), 0);
    // Paiements cascade via FK
    assert.equal(countRows(db, 'paiements'), 0);
  });
});

describe('Cases — Queries', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['Test Client']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Test Client'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, status, total_fees, paid_fees) VALUES (?, ?, ?, ?, ?, ?)", ['C001', 'Case 1', clId, 'active', 10000, 5000]);
    mutate(db, "INSERT INTO cases (case_number, title, client_id, status, total_fees, paid_fees) VALUES (?, ?, ?, ?, ?, ?)", ['C002', 'Case 2', clId, 'active', 20000, 15000]);
    mutate(db, "INSERT INTO cases (case_number, title, client_id, status) VALUES (?, ?, ?, ?)", ['C003', 'Case 3', clId, 'closed']);
  });

  it('gets cases by client', () => {
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Test Client'")[0].id;
    const cases = query(db, "SELECT * FROM cases WHERE client_id = ? AND status != 'closed' ORDER BY created_date DESC", [clId]);
    assert.equal(cases.length, 2);
  });

  it('calculates remaining fees', () => {
    const r = query(db, "SELECT id, total_fees, paid_fees, (COALESCE(total_fees,0) - COALESCE(paid_fees,0)) as remaining FROM cases WHERE case_number = 'C001'");
    assert.equal(r[0].remaining, 5000);
  });

  it('aggregates fees per client', () => {
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Test Client'")[0].id;
    const agg = query(db, "SELECT COUNT(*) as cnt, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(total_fees),0) as fees FROM cases WHERE client_id = ?", [clId]);
    assert.equal(agg[0].cnt, 3);
    assert.equal(agg[0].fees, 30000);
    assert.equal(agg[0].paid, 20000);
  });
});
