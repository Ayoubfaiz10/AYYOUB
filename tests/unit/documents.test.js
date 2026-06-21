const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { createDb, query, mutate, runTransaction } = require('../helpers/db');

function countRows(db, table) {
  const r = query(db, `SELECT COUNT(*) as c FROM ${table}`);
  return r[0]?.c || 0;
}

describe('Documents CRUD', () => {
  let db, caseId;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['DOC-CASE', 'Case for docs']);
    caseId = query(db, "SELECT id FROM cases WHERE case_number = 'DOC-CASE'")[0].id;
  });

  it('inserts a document', () => {
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type, tags, notes, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [caseId, 'contract.pdf', '/storage/affaires/1/contract.pdf', 'Contract', 'important, final', 'ملاحظات', '1.2 MB']);
    const d = query(db, "SELECT * FROM documents WHERE filename = 'contract.pdf'");
    assert.equal(d.length, 1);
    assert.equal(d[0].doc_type, 'Contract');
    assert.equal(d[0].tags, 'important, final');
    assert.equal(d[0].visibility, 'case');
  });

  it('inserts multiple document types', () => {
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'jugement.pdf', '/storage/jugement.pdf', 'Jugement']);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'preuve.png', '/storage/preuve.png', 'Preuve']);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'requete.docx', '/storage/requete.docx', 'Requête']);
    assert.equal(countRows(db, 'documents'), 4);
  });

  it('queries documents by case', () => {
    const docs = query(db, "SELECT d.*, COALESCE(c.case_number, '') as case_number FROM documents d LEFT JOIN cases c ON d.case_id = c.id WHERE d.case_id = ? ORDER BY d.upload_date DESC", [caseId]);
    assert.equal(docs.length, 4);
    docs.forEach(d => assert.equal(d.case_number, 'DOC-CASE'));
  });

  it('gets a single document by id', () => {
    const docId = query(db, "SELECT id FROM documents WHERE filename = 'contract.pdf'")[0].id;
    const doc = query(db, "SELECT * FROM documents WHERE id = ?", [docId]);
    assert.equal(doc.length, 1);
    assert.equal(doc[0].filename, 'contract.pdf');
  });

  it('updates document fields', () => {
    const docId = query(db, "SELECT id FROM documents WHERE filename = 'contract.pdf'")[0].id;
    mutate(db, "UPDATE documents SET tags = ?, notes = ?, doc_type = ? WHERE id = ?", ['updated, signed', 'تم التحديث', 'Contract V2', docId]);
    const d = query(db, "SELECT * FROM documents WHERE id = ?", [docId]);
    assert.equal(d[0].tags, 'updated, signed');
    assert.equal(d[0].notes, 'تم التحديث');
  });

  it('deletes a document', () => {
    const docId = query(db, "SELECT id FROM documents WHERE filename = 'preuve.png'")[0].id;
    mutate(db, "DELETE FROM documents WHERE id = ?", [docId]);
    assert.equal(countRows(db, 'documents'), 3);
  });
});

describe('Document Text (OCR)', () => {
  let db, caseId, docId;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['OCR-CASE', 'OCR test case']);
    caseId = query(db, "SELECT id FROM cases WHERE case_number = 'OCR-CASE'")[0].id;
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'scan.pdf', '/tmp/scan.pdf', 'Contract']);
    docId = query(db, "SELECT id FROM documents WHERE filename = 'scan.pdf'")[0].id;
  });

  it('inserts document text', () => {
    const text = 'هذا نص ممسوح ضوئياً من وثيقة قانونية';
    mutate(db, "INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)", [docId, text]);
    const dt = query(db, "SELECT * FROM document_text WHERE document_id = ?", [docId]);
    assert.equal(dt.length, 1);
    assert.equal(dt[0].extracted_text, text);
  });

  it('updates existing document text', () => {
    const newText = 'نص محدث بعد إعادة المسح';
    const existing = query(db, "SELECT id FROM document_text WHERE document_id = ?", [docId]);
    if (existing.length) {
      mutate(db, "UPDATE document_text SET extracted_text = ? WHERE document_id = ?", [newText, docId]);
    } else {
      mutate(db, "INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)", [docId, newText]);
    }
    const dt = query(db, "SELECT extracted_text FROM document_text WHERE document_id = ?", [docId]);
    assert.equal(dt[0].extracted_text, newText);
  });

  it('cascades delete when document is removed', () => {
    mutate(db, "DELETE FROM documents WHERE id = ?", [docId]);
    assert.equal(countRows(db, 'document_text'), 0);
  });
});

describe('Documents — Foreign Key', () => {
  let db, caseId;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['FK-DOC', 'FK test']);
    caseId = query(db, "SELECT id FROM cases WHERE case_number = 'FK-DOC'")[0].id;
  });

  it('cascades delete when case is removed', () => {
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'f1.pdf', '/tmp/f1.pdf', 'Contract']);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [caseId, 'f2.pdf', '/tmp/f2.pdf', 'Jugement']);
    assert.equal(countRows(db, 'documents'), 2);
    runTransaction(db, (d) => {
      mutate(d, "DELETE FROM tasks WHERE case_id = ?", [caseId]);
      mutate(d, "DELETE FROM events WHERE case_id = ?", [caseId]);
      mutate(d, "DELETE FROM communications WHERE case_id = ?", [caseId]);
      mutate(d, "DELETE FROM appointments WHERE case_id = ?", [caseId]);
      mutate(d, "DELETE FROM cases WHERE id = ?", [caseId]);
    });
    assert.equal(countRows(db, 'documents'), 0);
  });

  it('rejects document with non-existent case_id', () => {
    assert.throws(() => {
      mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)", [99999, 'bad.pdf', '/bad.pdf', 'Contract']);
    });
  });
});
