const { query, mutate, validateRef, addLog } = require('./utils');

function getAllEvents() {
  return query(`SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e
    LEFT JOIN cases c ON e.case_id = c.id
    LEFT JOIN clients cl ON e.client_id = cl.id
    ORDER BY e.date DESC, e.time DESC`);
}

function getEvent(id) {
  const rows = query(`SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e
    LEFT JOIN cases c ON e.case_id = c.id
    LEFT JOIN clients cl ON e.client_id = cl.id
    WHERE e.id = ?`, [id]);
  return rows.length ? rows[0] : null;
}

function addEvent(data) {
  if (!data.title || !data.date) return null;
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  mutate(`INSERT INTO events (case_id, client_id, title, type, status, date, time, end_time, court, judge, room, notes, outcome, urgency, recurring_type, recurring_end_date, all_day)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.case_id || null, data.client_id || null, data.title, data.type || 'meeting', data.status || 'scheduled',
     data.date, data.time || null, data.end_time || null, data.court || null, data.judge || null,
     data.room || null, data.notes || null, data.outcome || null, data.urgency || 'medium',
     data.recurring_type || 'none', data.recurring_end_date || null, data.all_day ? 1 : 0]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

function updateEvent(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['case_id','client_id','title','type','status','date','time','end_time','court','judge','room','notes','outcome','urgency','recurring_type','recurring_end_date','all_day','alert_sent_7d','alert_sent_3d','alert_sent_1d'];
  for (const [key, val] of Object.entries(data)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === 'all_day' ? (val ? 1 : 0) : val);
    }
  }
  if (fields.length) {
    values.push(id);
    mutate(`UPDATE events SET ${fields.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`, values);
  }
}

function deleteEvent(id) {
  mutate('DELETE FROM events WHERE id = ?', [id]);
}

function getEventsByCase(caseId) {
  return query(`SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e
    LEFT JOIN cases c ON e.case_id = c.id
    LEFT JOIN clients cl ON e.client_id = cl.id
    WHERE e.case_id = ?
    ORDER BY e.date ASC, e.time ASC`, [caseId]);
}

function getUpcomingDeadlines() {
  return query(`
    SELECT c.id as case_id, c.case_number, c.title, c.deadline_date,
           CAST(ROUND(julianday(c.deadline_date) - julianday('now')) AS INTEGER) as days_remaining
    FROM cases c
    WHERE c.deadline_date IS NOT NULL
      AND c.deadline_date != ''
      AND c.status != 'closed'
      AND julianday(c.deadline_date) - julianday('now') > -1
    ORDER BY days_remaining ASC
  `);
}

function getUpcomingHearings() {
  return query(`
    SELECT p.id, p.date as hearing_date, p.type, p.description,
           c.id as case_id, c.case_number, c.title as case_title,
           CAST(ROUND(julianday(p.date) - julianday('now')) AS INTEGER) as days_remaining
    FROM procedures p
    JOIN cases c ON p.affaire_id = c.id
    WHERE p.date >= date('now')
      AND c.status != 'closed'
    ORDER BY days_remaining ASC
  `);
}

function getTodayProcedures() {
  const todayStr = new Date().toISOString().split('T')[0];
  return query(`
    SELECT p.*, c.case_number, c.title as case_title
    FROM procedures p
    JOIN cases c ON p.affaire_id = c.id
    WHERE p.date = ?
    ORDER BY p.id ASC
  `, [todayStr]);
}

module.exports = {
  getAllEvents, getEvent, addEvent, updateEvent, deleteEvent,
  getEventsByCase, getUpcomingDeadlines, getUpcomingHearings, getTodayProcedures
};
