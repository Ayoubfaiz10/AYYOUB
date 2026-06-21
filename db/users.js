const { query, mutate, addLog } = require('./utils');

function getUsers() { return query('SELECT id, name, email, role, avatar, active, last_login FROM users ORDER BY id ASC'); }

function addUser(data) {
  mutate('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [data.name, data.email||'', data.password_hash||'', data.role||'assistant']);
  addLog('add_user', `إضافة مستخدم ${data.name}`, data._userId, data._userName);
  return query('SELECT last_insert_rowid() as id')[0]?.id;
}

function updateUser(id, data) {
  const fields = []; const vals = [];
  ['name','email','role','active','password_hash'].forEach(k => { if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); } });
  if (fields.length) { vals.push(id); mutate(`UPDATE users SET ${fields.join(',')} WHERE id=?`, vals); }
}

function deleteUser(id) { mutate('DELETE FROM users WHERE id=?', [id]); }

module.exports = { getUsers, addUser, updateUser, deleteUser };
