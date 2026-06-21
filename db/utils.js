const { getDb } = require('./connection');
const fs = require('fs');
const path = require('path');
const { STORAGE_DIR } = require('./connection');

function query(sql, params) {
  const db = getDb();
  try {
    if (params) {
      const stmt = db.prepare(sql);
      stmt.bind(params.map(v => v === undefined ? null : v));
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }

    const result = db.exec(sql);
    if (!result || result.length === 0) return [];

    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  } catch (err) {
    console.error('SQL Query Error:', err, 'SQL:', sql);
    return [];
  }
}

function mutate(sql, params) {
  const db = getDb();
  try {
    db.run(sql, params ? params.map(v => v === undefined ? null : v) : []);
    const { saveDb } = require('./connection');
    saveDb().catch(e => console.error('DB background save error:', e));
  } catch (err) {
    console.error('SQL Mutate Error:', err, 'SQL:', sql);
  }
}

function transaction(fn) {
  const db = getDb();
  try {
    db.run('BEGIN TRANSACTION');
    const result = fn();
    db.run('COMMIT');
    const { saveDb } = require('./connection');
    saveDb().catch(e => console.error('DB save error after transaction:', e));
    return result;
  } catch (err) {
    try { db.run('ROLLBACK'); } catch (e) { /* ignore rollback error */ }
    console.error('Transaction Error:', err);
    throw err;
  }
}

function validateRef(table, id) {
  if (!id) return true;
  const allowed = { cases: 'cases', clients: 'clients', tasks: 'tasks', events: 'events', documents: 'documents' };
  if (!allowed[table]) return false;
  try {
    const rows = query(`SELECT 1 FROM ${allowed[table]} WHERE id = ?`, [id]);
    return rows.length > 0;
  } catch (e) {
    console.error('validateRef error:', e);
    return false;
  }
}

function addLog(action, details, userId, userName) {
  try {
    mutate('INSERT INTO activity_log (action, details, user_id, user_name) VALUES (?, ?, ?, ?)',
    [action, details || '', userId || 0, userName || '']);
  } catch (e) {
    console.error('Log error:', e);
  }
}

function findDuplicateCase(caseNumber) {
  const rows = query('SELECT id, case_number, title FROM cases WHERE case_number = ?', [caseNumber]);
  if (rows.length) return { duplicate: true, existing: rows[0] };
  return { duplicate: false };
}

function getAllCases(includeArchived) {
  const sql = includeArchived
    ? `SELECT cases.id, cases.case_number, cases.title, cases.court, cases.status, cases.description, cases.created_date, cases.next_hearing, cases.client_id, cases.total_fees, cases.paid_fees, cases.expenses, cases.archived, COALESCE(clients.name, cases.client_name) as client_name FROM cases LEFT JOIN clients ON cases.client_id = clients.id ORDER BY cases.created_date DESC`
    : `SELECT cases.id, cases.case_number, cases.title, cases.court, cases.status, cases.description, cases.created_date, cases.next_hearing, cases.client_id, cases.total_fees, cases.paid_fees, cases.expenses, cases.archived, COALESCE(clients.name, cases.client_name) as client_name FROM cases LEFT JOIN clients ON cases.client_id = clients.id WHERE cases.archived = 0 OR cases.archived IS NULL ORDER BY cases.created_date DESC`;
  return query(sql);
}

function addCase(data) {
  if (!data.case_number || !data.title) return { error: 'رقم القضية والعنوان مطلوبان' };
  data.case_number = String(data.case_number).trim();
  data.title = String(data.title).trim();
  if (!data.case_number) return { error: 'رقم القضية مطلوب' };
  if (!data.title) return { error: 'عنوان القضية مطلوب' };
  const dup = findDuplicateCase(data.case_number);
  if (dup.duplicate) return { duplicate: true, existing: dup.existing, id: null };
  if (data.client_id && !validateRef('clients', data.client_id)) return { error: 'الموكل غير موجود' };
  mutate('INSERT INTO cases (case_number, title, client_id, client_name, court, status, description, next_hearing, total_fees, paid_fees, expenses, deadline_date, honoraires_totaux, priority, case_type, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [data.case_number, data.title, data.client_id, data.client_name || '', data.court, data.status, data.description, data.next_hearing, data.total_fees, data.paid_fees, data.expenses, data.deadline_date, data.total_fees, data.priority || 'medium', data.case_type || 'مدني', data.created_date || new Date().toISOString().slice(0,10)]);
  const res = query('SELECT last_insert_rowid() as id');
  return { id: res.length ? res[0].id : null };
}

function deleteCase(id) {
  if (!id || typeof id !== 'number') return;
  transaction(() => {
    const caseData = query('SELECT id FROM cases WHERE id = ?', [id]);
    if (!caseData.length) return;
    const docs = query('SELECT file_path FROM documents WHERE case_id = ?', [id]);
    docs.forEach(d => {
      try { if (d.file_path && fs.existsSync(d.file_path)) fs.unlinkSync(d.file_path); } catch (e) { /* best effort */ }
    });
    const caseDir = path.join(STORAGE_DIR, String(id));
    try { if (fs.existsSync(caseDir)) fs.rmSync(caseDir, { recursive: true, force: true }); } catch (e) { /* best effort */ }
    mutate('DELETE FROM tasks WHERE case_id = ?', [id]);
    mutate('DELETE FROM events WHERE case_id = ?', [id]);
    mutate('DELETE FROM communications WHERE case_id = ?', [id]);
    mutate('DELETE FROM appointments WHERE case_id = ?', [id]);
    mutate('DELETE FROM cases WHERE id = ?', [id]);
  });
}

function archiveCase(id) {
  mutate("UPDATE cases SET archived = 1 WHERE id = ?", [id]);
}

function unarchiveCase(id) {
  mutate("UPDATE cases SET archived = 0 WHERE id = ?", [id]);
}

function autoArchive() {
  mutate("UPDATE cases SET archived = 1 WHERE status = 'closed' AND (archived = 0 OR archived IS NULL) AND created_date < date('now', '-90 days')");
  const db = getDb();
  const count = db.getRowsModified();
  return count;
}

function updateCaseStatus(id, status) {
  const VALID_STATUSES = ['active', 'pending', 'closed'];
  if (!VALID_STATUSES.includes(status)) {
    console.warn(`حالة غير صالحة: ${status}`);
    return;
  }
  mutate('UPDATE cases SET status = ? WHERE id = ?', [status, id]);
  addLog('update_case_status', `تغيير حالة القضية #${id} إلى ${status}`);
}

function updateCaseNotes(id, notes) {
  mutate('UPDATE cases SET notes = ? WHERE id = ?', [notes, id]);
  addLog('update_case_notes', `تحديث ملاحظات القضية #${id}`);
}

function getDashboardStats() {
  const res = query("SELECT (SELECT COUNT(*) FROM cases WHERE status = 'active') as activeCases, (SELECT COUNT(*) FROM appointments WHERE strftime('%Y-%m-%d', date) >= strftime('%Y-%m-%d', 'now', 'weekday 0', '-7 days')) as thisWeekAppointments, (SELECT COUNT(*) FROM tasks WHERE status = 'todo') as pendingTasks, (SELECT COUNT(*) FROM clients) as totalClients");
  return res.length ? res[0] : { activeCases: 0, thisWeekAppointments: 0, pendingTasks: 0, totalClients: 0 };
}

function getChartData() {
  const statuses = query("SELECT status, COUNT(*) as count FROM cases GROUP BY status");
  const monthly = query("SELECT strftime('%m', created_date) as month, COUNT(*) as count FROM cases WHERE created_date IS NOT NULL AND created_date >= date('now', '-11 months') GROUP BY strftime('%m', created_date) ORDER BY month");
  const courts = query("SELECT court, COUNT(*) as count FROM cases WHERE court IS NOT NULL AND court != '' GROUP BY court ORDER BY count DESC LIMIT 5");
  const totalFees = query("SELECT COALESCE(SUM(total_fees),0) as total, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(expenses),0) as expenses FROM cases")[0] || { total: 0, paid: 0, expenses: 0 };
  const monthNames = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
  return { statuses, monthly, courts, fees: totalFees, monthNames };
}

function integrityCheck() {
  const report = { orphans: [], warnings: [], stats: {} };
  try {
    report.stats.totalCases = query('SELECT COUNT(*) as c FROM cases')[0]?.c || 0;
    report.stats.totalClients = query('SELECT COUNT(*) as c FROM clients')[0]?.c || 0;
    report.stats.totalTasks = query('SELECT COUNT(*) as c FROM tasks')[0]?.c || 0;
    report.stats.totalEvents = query('SELECT COUNT(*) as c FROM events')[0]?.c || 0;
    report.stats.totalDocs = query('SELECT COUNT(*) as c FROM documents')[0]?.c || 0;

    const orphanTasks = query(`SELECT t.id, t.title FROM tasks t WHERE t.case_id IS NOT NULL AND t.case_id NOT IN (SELECT id FROM cases)`);
    orphanTasks.forEach(t => report.orphans.push({ type: 'task_no_case', id: t.id, title: t.title }));

    const orphanEvents = query(`SELECT e.id, e.title FROM events e WHERE e.case_id IS NOT NULL AND e.case_id NOT IN (SELECT id FROM cases)`);
    orphanEvents.forEach(e => report.orphans.push({ type: 'event_no_case', id: e.id, title: e.title }));

    const orphanClientEvents = query(`SELECT e.id, e.title FROM events e WHERE e.client_id IS NOT NULL AND e.client_id NOT IN (SELECT id FROM clients)`);
    orphanClientEvents.forEach(e => report.orphans.push({ type: 'event_no_client', id: e.id, title: e.title }));

    const orphanDocs = query(`SELECT d.id, d.filename FROM documents d WHERE d.case_id NOT IN (SELECT id FROM cases)`);
    orphanDocs.forEach(d => report.orphans.push({ type: 'doc_no_case', id: d.id, filename: d.filename }));

    const orphanProcedures = query(`SELECT p.id FROM procedures p WHERE p.affaire_id NOT IN (SELECT id FROM cases)`);
    orphanProcedures.forEach(p => report.orphans.push({ type: 'procedure_no_case', id: p.id }));

    const orphanPaiements = query(`SELECT p.id FROM paiements p WHERE p.affaire_id NOT IN (SELECT id FROM cases)`);
    orphanPaiements.forEach(p => report.orphans.push({ type: 'paiement_no_case', id: p.id }));

    const orphanCommunications = query(`SELECT c.id FROM communications c WHERE c.case_id IS NOT NULL AND c.case_id NOT IN (SELECT id FROM cases)`);
    orphanCommunications.forEach(c => report.orphans.push({ type: 'comm_no_case', id: c.id }));

    const orphanClientCommunications = query(`SELECT c.id FROM communications c WHERE c.client_id IS NOT NULL AND c.client_id NOT IN (SELECT id FROM clients)`);
    orphanClientCommunications.forEach(c => report.orphans.push({ type: 'comm_no_client', id: c.id }));

    const orphanSubtasks = query(`SELECT s.id FROM subtasks s WHERE s.task_id NOT IN (SELECT id FROM tasks)`);
    orphanSubtasks.forEach(s => report.orphans.push({ type: 'subtask_no_task', id: s.id }));

    const orphanComments = query(`SELECT c.id FROM task_comments c WHERE c.task_id NOT IN (SELECT id FROM tasks)`);
    orphanComments.forEach(c => report.orphans.push({ type: 'comment_no_task', id: c.id }));

    const orphanWorkflowSteps = query(`SELECT s.id FROM workflow_steps s WHERE s.workflow_id NOT IN (SELECT id FROM workflows)`);
    orphanWorkflowSteps.forEach(s => report.orphans.push({ type: 'step_no_workflow', id: s.id }));

    const orphanDocText = query(`SELECT dt.id FROM document_text dt WHERE dt.document_id NOT IN (SELECT id FROM documents)`);
    orphanDocText.forEach(dt => report.orphans.push({ type: 'doctext_no_doc', id: dt.id }));

    const duplicateCases = query(`SELECT case_number, COUNT(*) as cnt FROM cases GROUP BY case_number HAVING cnt > 1`);
    duplicateCases.forEach(d => report.warnings.push({ type: 'duplicate_case_number', case_number: d.case_number, count: d.cnt }));

    const duplicateClients = query(`SELECT name, COUNT(*) as cnt FROM clients GROUP BY name HAVING cnt > 1`);
    duplicateClients.forEach(d => report.warnings.push({ type: 'duplicate_client_name', name: d.name, count: d.cnt }));

  } catch (e) {
    console.error('integrityCheck error:', e);
    report.error = e.message;
  }
  return report;
}

function repairOrphans() {
  const report = integrityCheck();
  if (report.error) return { repaired: 0, errors: [report.error] };
  let repaired = 0;
  const errors = [];
  try {
    transaction(() => {
      report.orphans.forEach(o => {
        try {
          switch (o.type) {
            case 'task_no_case': mutate('UPDATE tasks SET case_id = NULL WHERE id = ?', [o.id]); repaired++; break;
            case 'event_no_case': mutate('UPDATE events SET case_id = NULL WHERE id = ?', [o.id]); repaired++; break;
            case 'event_no_client': mutate('UPDATE events SET client_id = NULL WHERE id = ?', [o.id]); repaired++; break;
            case 'subtask_no_task': mutate('DELETE FROM subtasks WHERE id = ?', [o.id]); repaired++; break;
            case 'comment_no_task': mutate('DELETE FROM task_comments WHERE id = ?', [o.id]); repaired++; break;
            case 'step_no_workflow': mutate('DELETE FROM workflow_steps WHERE id = ?', [o.id]); repaired++; break;
            case 'doctext_no_doc': mutate('DELETE FROM document_text WHERE id = ?', [o.id]); repaired++; break;
            default: break;
          }
        } catch (e) {
          errors.push(`Failed to repair ${o.type} #${o.id}: ${e.message}`);
        }
      });
    });
  } catch (e) {
    errors.push('Transaction failed: ' + e.message);
  }
  return { repaired, errors };
}

function dedupeDocuments(arr) {
  const seen = new Set();
  return arr.filter(d => { const k = d.id; if (seen.has(k)) return false; seen.add(k); return true; });
}

function globalSearch(queryTerm) {
  const q = queryTerm ? queryTerm.trim() : '';
  const empty = { cases: [], clients: [], hearings: [], documents: [], tasks: [], expenses: [] };
  if (!q) return empty;

  const like = '%' + q + '%';
  const prefix = q + '%';

  const cases = query(`
    SELECT id,
      CASE WHEN case_number = ?1 THEN 100
           WHEN case_number LIKE ?2 THEN 80
           WHEN title = ?1 THEN 90
           WHEN title LIKE ?2 THEN 70
           ELSE 50
      END as score,
      case_number, title,
      COALESCE(client_name, clients.name, '') as client_name, status
    FROM cases LEFT JOIN clients ON cases.client_id = clients.id
    WHERE case_number LIKE ?3 OR title LIKE ?3 OR court LIKE ?3 OR description LIKE ?3
    ORDER BY score DESC, case_number ASC LIMIT 6
  `, [q, prefix, like]);

  const clients = query(`
    SELECT id,
      CASE WHEN name = ?1 THEN 100
           WHEN name LIKE ?2 THEN 80
           WHEN phone = ?1 THEN 90
           WHEN phone LIKE ?2 THEN 70
           ELSE 50
      END as score,
      name, phone, email
    FROM clients
    WHERE name LIKE ?3 OR phone LIKE ?3 OR email LIKE ?3 OR address LIKE ?3
    ORDER BY score DESC, name ASC LIMIT 6
  `, [q, prefix, like]);

  const hearings = query(`
    SELECT e.id,
      CASE WHEN e.title = ?1 THEN 100
           WHEN e.title LIKE ?2 THEN 80
           ELSE 60
      END as score,
      e.title, e.date, COALESCE(c.case_number, '') as case_number
    FROM events e LEFT JOIN cases c ON e.case_id = c.id
    WHERE e.title LIKE ?3 OR e.type LIKE ?3 OR e.court LIKE ?3 OR e.notes LIKE ?3
    ORDER BY score DESC, e.date DESC LIMIT 6
  `, [q, prefix, like]);

  const documents = query(`
    SELECT d.id,
      CASE WHEN d.filename = ?1 THEN 100
           WHEN d.filename LIKE ?2 THEN 80
           WHEN d.doc_type = ?1 THEN 90
           ELSE 50
      END as score,
      d.filename, d.doc_type, COALESCE(c.case_number, '') as case_number
    FROM documents d LEFT JOIN cases c ON d.case_id = c.id
    WHERE d.filename LIKE ?3 OR d.doc_type LIKE ?3
    ORDER BY score DESC, d.filename ASC LIMIT 6
  `, [q, prefix, like]);

  const docTexts = query(`
    SELECT DISTINCT d.id, 40 as score,
      d.filename, d.doc_type, COALESCE(c.case_number, '') as case_number
    FROM documents d LEFT JOIN cases c ON d.case_id = c.id
    JOIN document_text dt ON d.id = dt.document_id
    WHERE dt.extracted_text LIKE ?
    LIMIT 3
  `, [like]);

  const tasks = query(`
    SELECT t.id,
      CASE WHEN t.title = ?1 THEN 100
           WHEN t.title LIKE ?2 THEN 80
           WHEN t.description LIKE ?2 THEN 60
           ELSE 50
      END as score,
      t.title, t.priority, t.status, COALESCE(c.case_number, '') as case_number
    FROM tasks t LEFT JOIN cases c ON t.case_id = c.id
    WHERE t.title LIKE ?3 OR t.description LIKE ?3 OR t.tags LIKE ?3
    ORDER BY score DESC, t.title ASC LIMIT 6
  `, [q, prefix, like]);

  const expenses = query(`
    SELECT p.id,
      CASE WHEN c.case_number = ?1 THEN 100
           WHEN c.case_number LIKE ?2 THEN 80
           WHEN p.remarque LIKE ?2 THEN 60
           ELSE 50
      END as score,
      p.montant, p.mode_paiement, p.date as paiement_date, p.remarque, COALESCE(c.case_number, '') as case_number
    FROM paiements p LEFT JOIN cases c ON p.affaire_id = c.id
    WHERE c.case_number LIKE ?3 OR p.remarque LIKE ?3 OR p.mode_paiement LIKE ?3
    ORDER BY score DESC, p.date DESC LIMIT 6
  `, [q, prefix, like]);

  return {
    cases,
    clients,
    hearings,
    documents: dedupeDocuments(documents.concat(docTexts)).slice(0, 6),
    tasks,
    expenses
  };
}

function getSearchIndex() {
  const { getAllCases } = require('./clients');
  const { getAllClients } = require('./clients');
  const { getAllEvents } = require('./events');
  const { getDocuments } = require('./documents');
  const { getAllTasks } = require('./tasks');
  const { getPaiements } = require('./payments');

  const cases = getAllCases().map(c => ({
    id: c.id, type: 'case', label: c.case_number + ' — ' + c.title,
    sub: c.client_name || '', nav: 'cases',
    text: (c.case_number||'') + ' ' + (c.title||'') + ' ' + (c.client_name||'') + ' ' + (c.court||'') + ' ' + (c.description||''),
    status: c.status || ''
  }));
  const clients = getAllClients().map(c => ({
    id: c.id, type: 'client', label: c.name, sub: c.phone || c.email || '',
    nav: 'clients', text: (c.name||'') + ' ' + (c.phone||'') + ' ' + (c.email||'') + ' ' + (c.address||'') + ' ' + (c.national_id||'')
  }));
  const events = getAllEvents().filter(e => ['hearing','deadline'].includes(e.type)).map(e => ({
    id: e.id, type: 'hearing', label: e.title, sub: e.date + ' — ' + (e.case_number||''), nav: 'calendar',
    text: (e.title||'') + ' ' + (e.case_number||'') + ' ' + (e.court||'') + ' ' + (e.notes||'') + ' ' + (e.type||'')
  }));
  const allCases = getAllCases();
  let docs = [];
  for (const c of allCases) {
    const d = getDocuments(c.id);
    d.forEach(doc => docs.push({
      id: doc.id, type: 'document', label: doc.filename, sub: doc.doc_type + ' — ' + (c.case_number||''), nav: 'documents',
      text: (doc.filename||'') + ' ' + (doc.doc_type||'') + ' ' + (c.case_number||'') + ' ' + (doc.tags||'') + ' ' + (doc.notes||'')
    }));
  }
  const tasks = getAllTasks().map(t => ({
    id: t.id, type: 'task', label: t.title, sub: t.status + ' — ' + (t.case_number||''), nav: 'tasks',
    text: (t.title||'') + ' ' + (t.description||'') + ' ' + (t.case_number||'') + ' ' + (t.tags||'') + ' ' + (t.status||'') + ' ' + (t.priority||'')
  }));
  let payments = [];
  for (const c of allCases) {
    const p = getPaiements(c.id);
    p.forEach(pay => payments.push({
      id: pay.id, type: 'expense', label: (c.case_number||'') + ' — ' + (pay.montant||0) + ' درهم',
      sub: pay.date + ' ' + (pay.mode_paiement||''), nav: 'expenses',
      text: (c.case_number||'') + ' ' + (pay.montant||'') + ' ' + (pay.mode_paiement||'') + ' ' + (pay.remarque||'') + ' ' + (pay.date||'')
    }));
  }
  return [...cases, ...clients, ...events, ...docs, ...tasks, ...payments];
}

function getLogs(filters) {
  filters = filters || {};
  let sql = 'SELECT * FROM activity_log WHERE 1=1';
  const params = [];

  if (filters.search && filters.search.trim()) {
    sql += ' AND (action LIKE ? OR details LIKE ?)';
    const q = '%' + filters.search.trim() + '%';
    params.push(q, q);
  }

  if (filters.action && filters.action !== 'all') {
    sql += ' AND action = ?';
    params.push(filters.action);
  }

  if (filters.dateFrom) {
    sql += ' AND created_at >= ?';
    params.push(filters.dateFrom + ' 00:00:00');
  }

  if (filters.dateTo) {
    sql += ' AND created_at <= ?';
    params.push(filters.dateTo + ' 23:59:59');
  }

  sql += ' ORDER BY created_at DESC';

  const limit = filters.limit ? parseInt(filters.limit) : 500;
  sql += ' LIMIT ?';
  params.push(limit);

  if (filters.offset) {
    sql += ' OFFSET ?';
    params.push(parseInt(filters.offset));
  }

  return query(sql, params);
}

function getAlertSettings() {
  const rows = query('SELECT * FROM alert_settings WHERE id = 1');
  return rows.length ? rows[0] : { days_before_1: 7, days_before_2: 3, days_before_3: 1, enabled: 1 };
}

function updateAlertSettings(data) {
  mutate('UPDATE alert_settings SET days_before_1 = ?, days_before_2 = ?, days_before_3 = ?, enabled = ? WHERE id = 1',
    [data.days_before_1, data.days_before_2, data.days_before_3, data.enabled ? 1 : 0]);
}

function addCommunication(data) {
  if (!data.type || !data.date) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  mutate('INSERT INTO communications (client_id, case_id, type, date, summary) VALUES (?, ?, ?, ?, ?)',
    [data.client_id || null, data.case_id || null, data.type, data.date, data.summary || null]);
  return query('SELECT last_insert_rowid() as id')[0]?.id || null;
}

function getClientCommunications(clientId) {
  return query(`SELECT comm.*, ca.case_number FROM communications comm
    LEFT JOIN cases ca ON comm.case_id = ca.id
    WHERE comm.client_id = ?
    ORDER BY comm.date DESC, comm.created_at DESC`, [clientId]);
}

module.exports = {
  query, mutate, transaction, validateRef, addLog,
  getAllCases, addCase, deleteCase, archiveCase, unarchiveCase, autoArchive,
  updateCaseStatus, updateCaseNotes, getChartData, getDashboardStats,
  integrityCheck, repairOrphans, globalSearch, getSearchIndex,
  getLogs, getAlertSettings, updateAlertSettings,
  addCommunication, getClientCommunications
};
