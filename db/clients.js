const { query, mutate, transaction, validateRef, addLog } = require('./utils');

function getAllClients() {
  const clients = query('SELECT * FROM clients ORDER BY name ASC');
  return clients.map(c => {
    const cases = query("SELECT COUNT(*) as cnt, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(total_fees),0) as fees FROM cases WHERE client_id = ?", [c.id]);
    const logs = query("SELECT created_at FROM activity_log WHERE details LIKE ? ORDER BY created_at DESC LIMIT 1", ['%@' + c.id + '%']);
    return { ...c, _caseCount: cases[0]?.cnt || 0, _balance: (cases[0]?.fees || 0) - (cases[0]?.paid || 0), _lastActivity: logs[0]?.created_at?.slice(0,10) || '' };
  });
}

function findDuplicateClient(data) {
  const rows = query(`SELECT id, name, phone FROM clients WHERE
    (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
    [data.name, data.name||'', data.phone, data.phone||'', data.email, data.email||'', data.national_id||'', data.national_id||'']);
  if (rows.length) return { duplicate: true, existing: rows };
  return { duplicate: false };
}

function addClient(data) {
  if (!data.name || !String(data.name).trim()) return { error: 'اسم الموكل مطلوب' };
  data.name = String(data.name).trim();
  data.phone = data.phone ? String(data.phone).trim() : '';
  data.email = data.email ? String(data.email).trim() : '';
  const dup = findDuplicateClient(data);
  if (dup.duplicate) return { duplicate: true, existing: dup.existing, id: null };
  mutate('INSERT INTO clients (name, phone, email, address, notes, national_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.name, data.phone, data.email, data.address, data.notes, data.national_id || '', data.tags || '']);
  const res = query('SELECT last_insert_rowid() as id');
  addLog('add_client', `إضافة موكل ${data.name} @${res.id}`);
  const id = res.length ? res[0].id : null;
  if (id) mutate('UPDATE cases SET client_name = ? WHERE client_id = ?', [data.name, id]);
  return { id };
}

function updateClient(data) {
  const old = query('SELECT name FROM clients WHERE id = ?', [data.id]);
  if (!old.length) return null;
  if (data.name && data.name !== (old[0]?.name || '')) {
    mutate('UPDATE cases SET client_name = ? WHERE client_id = ?', [data.name, data.id]);
  }
  mutate('UPDATE clients SET name = ?, phone = ?, email = ?, address = ?, notes = ?, national_id = ?, tags = ? WHERE id = ?',
    [data.name, data.phone||'', data.email||'', data.address||'', data.notes||'', data.national_id||'', data.tags||'', data.id]);
  addLog('update_client', `تحديث بيانات الموكل @${data.id}`);
  return { id: data.id };
}

function deleteClient(id) {
  if (!id || typeof id !== 'number') return;
  transaction(() => {
    mutate('UPDATE cases SET client_id = NULL, client_name = \'\' WHERE client_id = ?', [id]);
    mutate('UPDATE tasks SET client_id = NULL WHERE client_id = ?', [id]);
    mutate('DELETE FROM events WHERE client_id = ?', [id]);
    mutate('DELETE FROM communications WHERE client_id = ?', [id]);
    mutate('DELETE FROM clients WHERE id = ?', [id]);
  });
}

function getCasesByClient(clientId) {
  const cases = query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM procedures p WHERE p.affaire_id = c.id) as procedure_count,
      (SELECT MIN(p.date) FROM procedures p WHERE p.affaire_id = c.id AND p.date >= date('now')) as next_procedure_date,
      (SELECT MIN(p.date) FROM procedures p WHERE p.affaire_id = c.id AND p.date >= date('now')) as next_hearing_date
    FROM cases c
    WHERE c.client_id = ? AND c.status != 'closed'
    ORDER BY c.created_date DESC
  `, [clientId]);
  return cases.map(c => ({
    ...c,
    remaining: (parseFloat(c.honoraires_totaux || c.total_fees || 0) - parseFloat(c.paid_fees || 0)).toFixed(2)
  }));
}

module.exports = { getAllClients, addClient, updateClient, deleteClient, getCasesByClient };
