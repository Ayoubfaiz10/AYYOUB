const { query, mutate, validateRef } = require('./utils');

function getPaiements(affaireId) {
  return query('SELECT * FROM paiements WHERE affaire_id = ? ORDER BY date DESC, id DESC', [affaireId]);
}

function addPaiement(data) {
  if (!data.affaire_id || !data.date || data.montant === undefined || !data.mode_paiement) return null;
  if (!validateRef('cases', data.affaire_id)) return null;
  if (isNaN(parseFloat(data.montant)) || parseFloat(data.montant) < 0) return null;
  mutate('INSERT INTO paiements (affaire_id, date, montant, mode_paiement, remarque) VALUES (?, ?, ?, ?, ?)', [data.affaire_id, data.date, parseFloat(data.montant), data.mode_paiement, data.remarque]);
  const res = query('SELECT last_insert_rowid() as id');
  syncPaidFees(data.affaire_id);
  return res.length ? res[0].id : null;
}

function syncPaidFees(affaireId) {
  const rows = query('SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE affaire_id = ?', [affaireId]);
  const totalPaid = rows.length ? rows[0].total : 0;
  mutate('UPDATE cases SET paid_fees = ? WHERE id = ?', [totalPaid, affaireId]);
}

module.exports = { getPaiements, addPaiement };
