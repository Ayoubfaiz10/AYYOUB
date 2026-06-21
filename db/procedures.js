const { query, mutate, validateRef } = require('./utils');

function getProcedures(affaireId) {
  return query('SELECT * FROM procedures WHERE affaire_id = ? ORDER BY date DESC, id DESC', [affaireId]);
}

function addProcedure(data) {
  if (!data.affaire_id || !data.date || !data.type) return null;
  if (!validateRef('cases', data.affaire_id)) return null;
  mutate('INSERT INTO procedures (affaire_id, date, type, description) VALUES (?, ?, ?, ?)', [data.affaire_id, data.date, data.type, data.description]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

module.exports = { getProcedures, addProcedure };
