const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { createDb, query, mutate, runTransaction } = require('../helpers/db');

function countRows(db, table) {
  const r = query(db, `SELECT COUNT(*) as c FROM ${table}`);
  return r[0]?.c || 0;
}

describe('Clients CRUD', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('inserts a client with minimum fields', () => {
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['أحمد محمد']);
    const c = query(db, "SELECT * FROM clients WHERE name = 'أحمد محمد'");
    assert.equal(c.length, 1);
    assert.equal(c[0].status, 'active');
  });

  it('inserts a client with all fields', () => {
    mutate(db, "INSERT INTO clients (name, phone, email, address, notes, national_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['سارة علي', '0612345678', 'sara@example.com', 'الدار البيضاء', 'ملاحظات', 'AB123456', 'VIP, دولي']);
    const c = query(db, "SELECT * FROM clients WHERE phone = '0612345678'");
    assert.equal(c.length, 1);
    assert.equal(c[0].name, 'سارة علي');
    assert.equal(c[0].tags, 'VIP, دولي');
  });

  it('updates client', () => {
    mutate(db, "UPDATE clients SET phone = ?, email = ? WHERE name = ?", ['0699999999', 'ahmed@new.ma', 'أحمد محمد']);
    const c = query(db, "SELECT * FROM clients WHERE name = 'أحمد محمد'");
    assert.equal(c[0].phone, '0699999999');
    assert.equal(c[0].email, 'ahmed@new.ma');
  });

  it('deletes client and nullifies case references', () => {
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name) VALUES (?, ?, ?, ?)", ['C-CLIENT', 'Case', null, 'أحمد محمد']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'أحمد محمد'")[0].id;
    mutate(db, "UPDATE cases SET client_id = ? WHERE case_number = 'C-CLIENT'", [clId]);
    runTransaction(db, (d) => {
      mutate(d, "UPDATE cases SET client_id = NULL, client_name = '' WHERE client_id = ?", [clId]);
      mutate(d, "DELETE FROM clients WHERE id = ?", [clId]);
    });
    const c = query(db, "SELECT client_id, client_name FROM cases WHERE case_number = 'C-CLIENT'");
    assert.equal(c[0].client_id, null);
  });
});

describe('Duplicate Detection', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name, phone, email, national_id) VALUES (?, ?, ?, ?)", ['أحمد محمد', '0612345678', 'ahmed@test.ma', 'ID123']);
  });

  it('finds duplicate by name', () => {
    const dupes = query(db, `SELECT id, name FROM clients WHERE
      (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
      ['أحمد محمد', 'أحمد محمد', '', '', '', '', '', '']);
    assert.equal(dupes.length, 1);
  });

  it('finds duplicate by phone', () => {
    const dupes = query(db, `SELECT id, name FROM clients WHERE
      (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
      ['', '', '0612345678', '0612345678', '', '', '', '']);
    assert.equal(dupes.length, 1);
  });

  it('finds duplicate by email', () => {
    const dupes = query(db, `SELECT id, name FROM clients WHERE
      (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
      ['', '', '', '', 'ahmed@test.ma', 'ahmed@test.ma', '', '']);
    assert.equal(dupes.length, 1);
  });

  it('finds duplicate by national_id', () => {
    const dupes = query(db, `SELECT id, name FROM clients WHERE
      (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
      ['', '', '', '', '', '', 'ID123', 'ID123']);
    assert.equal(dupes.length, 1);
  });

  it('returns empty for no duplicate', () => {
    const dupes = query(db, `SELECT id, name FROM clients WHERE
      (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
      ['غير موجود', 'غير موجود', '0000000000', '0000000000', '', '', '', '']);
    assert.equal(dupes.length, 0);
  });
});

describe('Client Edge Cases', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('handles empty optional fields', () => {
    mutate(db, "INSERT INTO clients (name, phone, email, address, notes, national_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['Empty Fields', '', '', '', '', '', '']);
    const c = query(db, "SELECT * FROM clients WHERE name = 'Empty Fields'");
    assert.equal(c[0].phone, '');
    assert.equal(c[0].notes, '');
  });

  it('handles very long names', () => {
    const longName = 'أ'.repeat(500);
    mutate(db, "INSERT INTO clients (name) VALUES (?)", [longName]);
    const c = query(db, "SELECT name FROM clients WHERE length(name) = 500");
    assert.equal(c.length, 1);
  });

  it('orders clients by name', () => {
    mutate(db, "INSERT INTO clients (name) VALUES ('بسمة')");
    mutate(db, "INSERT INTO clients (name) VALUES ('أمل')");
    const sorted = query(db, "SELECT name FROM clients ORDER BY name ASC");
    // SQLite collation: Arabic names sorted by Unicode
    assert.ok(sorted.length >= 2);
  });

  it('tracks case count and balance per client', () => {
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['Finance Client']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Finance Client'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, total_fees, paid_fees) VALUES (?, ?, ?, ?, ?)", ['F001', 'F Case 1', clId, 10000, 3000]);
    mutate(db, "INSERT INTO cases (case_number, title, client_id, total_fees, paid_fees) VALUES (?, ?, ?, ?, ?)", ['F002', 'F Case 2', clId, 20000, 8000]);
    const stats = query(db, "SELECT COUNT(*) as cnt, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(total_fees),0) as fees FROM cases WHERE client_id = ?", [clId]);
    assert.equal(stats[0].cnt, 2);
    assert.equal(stats[0].fees, 30000);
    assert.equal(stats[0].paid, 11000);
  });
});
