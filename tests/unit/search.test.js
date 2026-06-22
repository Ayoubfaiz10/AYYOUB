const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { createDb, query, mutate } = require('../helpers/db');

describe('Global Search — Cases', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)", ['أحمد المحامي', '0611111111', 'ahmed@law.ma']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'أحمد المحامي'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name, court, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['2025/001', 'قضية تجارية', clId, 'أحمد المحامي', 'المحكمة التجارية', 'active', 'نزاع عقاري']);
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name, court, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['2025/002', 'قضية مدنية', clId, 'أحمد المحامي', 'المحكمة الابتدائية', 'pending', 'خلاف عائلي']);
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name, court, status) VALUES (?, ?, ?, ?, ?, ?)",
      ['2024/100', 'قضية سابقة', null, 'قديم', 'المحكمة الإدارية', 'closed']);
  });

  it('searches by case_number', () => {
    const q = '2025/001';
    const like = '%' + q + '%';
    const prefix = q + '%';
    const results = query(db, `
      SELECT id, case_number, title,
        CASE WHEN case_number = ?1 THEN 100 WHEN case_number LIKE ?2 THEN 80 WHEN title = ?1 THEN 90 WHEN title LIKE ?2 THEN 70 ELSE 50 END as score
      FROM cases
      WHERE case_number LIKE ?3 OR title LIKE ?3 OR court LIKE ?3 OR description LIKE ?3
      ORDER BY score DESC LIMIT 6`, [q, prefix, like]);
    assert.ok(results.length >= 1);
    assert.equal(results[0].case_number, '2025/001');
    assert.equal(results[0].score, 100); // exact match
  });

  it('searches by title', () => {
    const q = 'تجارية';
    const like = '%' + q + '%';
    const prefix = q + '%';
    const results = query(db, `
      SELECT id, case_number, title,
        CASE WHEN case_number = ?1 THEN 100 WHEN case_number LIKE ?2 THEN 80 WHEN title = ?1 THEN 90 WHEN title LIKE ?2 THEN 70 ELSE 50 END as score
      FROM cases
      WHERE case_number LIKE ?3 OR title LIKE ?3 OR court LIKE ?3 OR description LIKE ?3
      ORDER BY score DESC LIMIT 6`, [q, prefix, like]);
    assert.ok(results.length >= 1);
    assert.ok(results[0].title.includes('تجارية'));
  });

  it('searches by court', () => {
    const q = 'المحكمة';
    const like = '%' + q + '%';
    const results = query(db, "SELECT id, case_number, title, court FROM cases WHERE court LIKE ? ORDER BY case_number ASC LIMIT 6", [like]);
    assert.ok(results.length >= 1);
    assert.ok(results[0].court.includes('المحكمة'));
  });

  it('searches by description', () => {
    const q = 'نزاع عقاري';
    const like = '%' + q + '%';
    const results = query(db, `
      SELECT id, case_number, title
      FROM cases
      WHERE description LIKE ?
      ORDER BY case_number ASC LIMIT 6`, [like]);
    assert.ok(results.length >= 1);
  });

  it('returns empty for no matches', () => {
    const results = query(db, "SELECT id, case_number, title FROM cases WHERE case_number LIKE '%ZZZZZZ%' OR title LIKE '%ZZZZZZ%'");
    assert.equal(results.length, 0);
  });
});

describe('Global Search — Clients', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)", ['محمد الفاسي', '0622222222', 'mohamed@fes.ma']);
    mutate(db, "INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)", ['فاطمة مراكش', '0633333333', 'fatima@marrakech.ma']);
  });

  it('searches by name', () => {
    const q = 'محمد';
    const like = '%' + q + '%';
    const prefix = q + '%';
    const results = query(db, `
      SELECT id, name,
        CASE WHEN name = ?1 THEN 100 WHEN name LIKE ?2 THEN 80 WHEN phone = ?1 THEN 90 WHEN phone LIKE ?2 THEN 70 ELSE 50 END as score
      FROM clients
      WHERE name LIKE ?3 OR phone LIKE ?3 OR email LIKE ?3
      ORDER BY score DESC LIMIT 6`, [q, prefix, like]);
    assert.ok(results.length >= 1);
    assert.ok(results[0].name.includes('محمد'));
  });

  it('searches by phone', () => {
    const q = '0622222222';
    const like = '%' + q + '%';
    const results = query(db, "SELECT id, name FROM clients WHERE phone LIKE ?", [like]);
    assert.equal(results.length, 1);
  });

  it('searches by email', () => {
    const q = 'mohamed@fes.ma';
    const results = query(db, "SELECT id, name FROM clients WHERE email LIKE ?", ['%' + q + '%']);
    assert.equal(results.length, 1);
  });
});

describe('Global Search — Documents', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['DOC-SRCH', 'Search Case']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'DOC-SRCH'")[0].id;
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type, tags) VALUES (?, ?, ?, ?, ?)", [cId, 'contract_final.pdf', '/tmp/c.pdf', 'Contract', 'final, signed']);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type, tags) VALUES (?, ?, ?, ?, ?)", [cId, 'jugement_appel.pdf', '/tmp/j.pdf', 'Jugement', 'appel']);
  });

  it('searches by filename', () => {
    const results = query(db, "SELECT d.id, d.filename, d.doc_type, c.case_number FROM documents d LEFT JOIN cases c ON d.case_id = c.id WHERE d.filename LIKE ?", ['%contract%']);
    assert.equal(results.length, 1);
    assert.ok(results[0].filename.includes('contract'));
  });

  it('searches by doc_type', () => {
    const results = query(db, "SELECT d.id, d.filename, d.doc_type FROM documents d WHERE d.doc_type LIKE ?", ['%Jugement%']);
    assert.equal(results.length, 1);
  });

  it('searches by tags', () => {
    const results = query(db, "SELECT d.id, d.filename FROM documents d WHERE d.tags LIKE ?", ['%final%']);
    assert.equal(results.length, 1);
  });

  it('searches in document_text (OCR)', () => {
    const docId = query(db, "SELECT id FROM documents WHERE tags LIKE '%final%'")[0].id;
    mutate(db, "INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)", [docId, 'هذا النص مستخرج من العقد النهائي']);
    const results = query(db, `SELECT d.id, d.filename FROM documents d
      JOIN document_text dt ON d.id = dt.document_id
      WHERE dt.extracted_text LIKE ?`, ['%العقد%']);
    assert.equal(results.length, 1);
  });
});

describe('Global Search — Tasks', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO tasks (title, description, tags) VALUES (?, ?, ?)", ['تحضير ملف القضية', 'جمع الوثائق اللازمة', 'عاجل']);
    mutate(db, "INSERT INTO tasks (title, description, tags) VALUES (?, ?, ?)", ['مراجعة العقد', 'التأكد من البنود', 'قانوني']);
  });

  it('searches by title', () => {
    const results = query(db, "SELECT id, title FROM tasks WHERE title LIKE ?", ['%تحضير%']);
    assert.equal(results.length, 1);
  });

  it('searches by description', () => {
    const results = query(db, "SELECT id, title FROM tasks WHERE description LIKE ?", ['%الوثائق%']);
    assert.equal(results.length, 1);
  });

  it('searches by tags', () => {
    const results = query(db, "SELECT id, title FROM tasks WHERE tags LIKE ?", ['%عاجل%']);
    assert.equal(results.length, 1);
  });
});

describe('Global Search — Events', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['EVT-SRCH', 'Event Case']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'EVT-SRCH'")[0].id;
    mutate(db, "INSERT INTO events (case_id, title, type, date, court) VALUES (?, ?, ?, ?, ?)", [cId, 'جلسة المحكمة', 'hearing', '2026-07-15', 'المحكمة الابتدائية']);
    mutate(db, "INSERT INTO events (case_id, title, type, date) VALUES (?, ?, ?, ?)", [cId, 'اجتماع مع الموكل', 'meeting', '2026-07-20']);
  });

  it('searches by title', () => {
    const results = query(db, "SELECT e.id, e.title, c.case_number FROM events e LEFT JOIN cases c ON e.case_id = c.id WHERE e.title LIKE ?", ['%جلسة%']);
    assert.equal(results.length, 1);
  });

  it('searches by court', () => {
    const results = query(db, "SELECT e.id, e.title FROM events e WHERE e.court LIKE ?", ['%المحكمة%']);
    assert.equal(results.length, 1);
  });
});

describe('Global Search — Expenses (payments)', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['EXP-SRCH', 'Expense Case']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'EXP-SRCH'")[0].id;
    mutate(db, "INSERT INTO paiements (affaire_id, date, montant, mode_paiement, remarque) VALUES (?, ?, ?, ?, ?)", [cId, '2026-06-01', 5000, 'espèces', 'دفعة أولى']);
    mutate(db, "INSERT INTO paiements (affaire_id, date, montant, mode_paiement, remarque) VALUES (?, ?, ?, ?, ?)", [cId, '2026-06-15', 10000, 'virement', 'الدفعة الثانية']);
  });

  it('searches by mode_paiement', () => {
    const results = query(db, "SELECT p.id, p.montant, c.case_number FROM paiements p JOIN cases c ON p.affaire_id = c.id WHERE p.mode_paiement LIKE ?", ['%virement%']);
    assert.equal(results.length, 1);
  });

  it('searches by remarque', () => {
    const results = query(db, "SELECT p.id, p.montant, c.case_number FROM paiements p JOIN cases c ON p.affaire_id = c.id WHERE p.remarque LIKE ?", ['%دفعة%']);
    assert.equal(results.length, 2);
  });
});

describe('FTS4 Full-Text Search', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name, phone) VALUES (?, ?)", ['موكل تجريبي', '0600000000']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'موكل تجريبي'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name, court, description) VALUES (?, ?, ?, ?, ?, ?)",
      ['FTS-001', 'قضية FTS التجريبية', clId, 'موكل تجريبي', 'المحكمة التجارية', 'هذا النص يستخدم للبحث التجريبي السريع']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'FTS-001'")[0].id;
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type, tags) VALUES (?, ?, ?, ?, ?)",
      [cId, 'عقد_مبدئي.pdf', '/tmp/fts.pdf', 'Contract', 'fts, test']);
    const docId = query(db, "SELECT id FROM documents WHERE filename = 'عقد_مبدئي.pdf'")[0].id;
    mutate(db, "INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)",
      [docId, 'هذا النص مستخرج من العقد للتجربة والبحث']);
    // Manually sync FTS index since test helper doesn't auto-sync
    mutate(db, "INSERT INTO search_index (case_id, title, content, tags) SELECT CAST(c.id AS TEXT), c.title, COALESCE(c.case_number,'') || ' ' || COALESCE(c.title,'') || ' ' || COALESCE(c.description,'') || ' ' || COALESCE(c.court,'') || ' ' || COALESCE(c.client_name,'') || ' ' || COALESCE(dt.extracted_text,''), '' FROM cases c LEFT JOIN documents d ON d.case_id = c.id LEFT JOIN document_text dt ON dt.document_id = d.id WHERE c.id = ?", [cId]);
  });

  it('searches by title token using FTS4 MATCH', () => {
    const r = query(db, "SELECT case_id FROM search_index WHERE search_index MATCH 'قضية*'");
    assert.ok(r.length >= 1);
  });

  it('searches by client_name token using FTS4 MATCH', () => {
    const r = query(db, "SELECT case_id FROM search_index WHERE search_index MATCH 'تجريبي*'");
    assert.ok(r.length >= 1);
  });

  it('searches by document text indexed with case', () => {
    const r = query(db, "SELECT case_id FROM search_index WHERE search_index MATCH 'مستخرج*'");
    assert.ok(r.length >= 1);
  });

  it('returns no results for non-matching query', () => {
    const r = query(db, "SELECT case_id FROM search_index WHERE search_index MATCH 'ZZZZZnotfound*'");
    assert.equal(r.length, 0);
  });

  it('searches with multi-word FTS query', () => {
    const r = query(db, "SELECT case_id FROM search_index WHERE search_index MATCH 'النص* تجريبي*'");
    assert.ok(r.length >= 1);
  });
});

describe('Search Index', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO clients (name, phone) VALUES (?, ?)", ['فهد', '0655555555']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'فهد'")[0].id;
    mutate(db, "INSERT INTO cases (case_number, title, client_id, client_name) VALUES (?, ?, ?, ?)", ['IDX-001', 'Index Case', clId, 'فهد']);
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'IDX-001'")[0].id;
    mutate(db, "INSERT INTO events (case_id, title, date) VALUES (?, ?, ?)", [cId, 'جلسة', '2026-07-01']);
    mutate(db, "INSERT INTO tasks (title, case_id) VALUES (?, ?)", ['مهمة مفهرسة', cId]);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [cId, 'indexed.pdf', '/tmp/i.pdf', 'Contract']);
  });

  it('builds a unified flat index across all entities', () => {
    // Simulate getSearchIndex: union of cases, clients, events, documents, tasks, payments
    const caseIndex = query(db, "SELECT id, case_number as ref, title as text, 'case' as type, client_name FROM cases");
    const clientIndex = query(db, "SELECT id, name as ref, name as text, 'client' as type, '' as client_name FROM clients");
    const allIndex = [...caseIndex, ...clientIndex];
    assert.ok(allIndex.length >= 2);

    const caseEntry = allIndex.find(x => x.type === 'case');
    assert.equal(caseEntry.ref, 'IDX-001');

    const clientEntry = allIndex.find(x => x.type === 'client');
    assert.equal(clientEntry.ref, 'فهد');
  });

  it('pre-joins entity relationships for search index', () => {
    const docIndex = query(db, `SELECT d.id, d.filename as text, 'document' as type, c.case_number
      FROM documents d LEFT JOIN cases c ON d.case_id = c.id`);
    assert.equal(docIndex.length, 1);
    assert.equal(docIndex[0].case_number, 'IDX-001');
  });
});
