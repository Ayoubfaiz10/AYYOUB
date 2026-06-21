const { query, mutate, validateRef } = require('./utils');

function getDocuments(caseId) {
  return query('SELECT d.*, COALESCE(c.case_number, \'\') as case_number FROM documents d LEFT JOIN cases c ON d.case_id = c.id WHERE d.case_id = ? ORDER BY d.upload_date DESC', [caseId]);
}

function addDocument(data) {
  if (!data.case_id || !data.filename) return null;
  if (!validateRef('cases', data.case_id)) return null;
  mutate('INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)', [data.case_id, data.filename, data.file_path, data.doc_type]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

function getDocument(id) {
  const rows = query('SELECT * FROM documents WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

function updateDocument(id, data) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (['tags', 'notes', 'doc_type', 'filename'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length) {
    values.push(id);
    mutate(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

function addDocumentText(documentId, text) {
  const existing = query('SELECT id FROM document_text WHERE document_id = ?', [documentId]);
  if (existing.length) {
    mutate('UPDATE document_text SET extracted_text = ?, indexed_at = datetime(\'now\', \'localtime\') WHERE document_id = ?', [text, documentId]);
  } else {
    mutate('INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)', [documentId, text]);
  }
}

function getDocumentText(documentId) {
  const rows = query('SELECT * FROM document_text WHERE document_id = ?', [documentId]);
  return rows.length ? rows[0] : null;
}

module.exports = { getDocuments, addDocument, getDocument, updateDocument, addDocumentText, getDocumentText };
