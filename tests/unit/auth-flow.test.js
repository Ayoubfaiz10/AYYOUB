const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { createDb, query, mutate } = require('../helpers/db');

const BCRYPT_SALT_ROUNDS = 12;

function hashBcrypt(pwd) {
  return bcrypt.hashSync(pwd, BCRYPT_SALT_ROUNDS);
}

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[abxy]\$\d+\$/.test(hash);
}

// DB operations (mirroring main.js db calls)
function getUsers(db) {
  try {
    return query(db, 'SELECT id, name, email, role, avatar, active, last_login FROM users ORDER BY id ASC') || [];
  } catch (e) {
    return [];
  }
}

function addUser(db, data) {
  try {
    mutate(db, 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [data.name, data.email || '', data.password_hash || '', data.role || 'assistant']);
    const res = query(db, 'SELECT last_insert_rowid() as id');
    return res.length ? res[0].id : null;
  } catch (e) {
    return null;
  }
}

function deleteUser(db, id) {
  mutate(db, 'DELETE FROM users WHERE id=?', [id]);
}

function getPasswordHashForUser(db, id) {
  const r = query(db, 'SELECT password_hash FROM users WHERE id=?', [id]);
  return r.length ? r[0].password_hash : null;
}

function verifyPassword(pwd, storedHash) {
  if (isBcryptHash(storedHash)) return bcrypt.compareSync(pwd, storedHash);
  return false;
}

function getOfficeSetting(db, key) {
  const r = query(db, 'SELECT value FROM office_settings WHERE key=?', [key]);
  return r.length ? r[0].value : null;
}

function setOfficeSetting(db, key, value) {
  mutate(db, 'INSERT OR REPLACE INTO office_settings (key, value) VALUES (?, ?)', [key, value]);
}

// ───── Setup & First Admin ─────

describe('Auth Flow — First Admin Setup', () => {
  let db;

  before(async () => { db = await createDb(); });

  it('admin user is seeded in DB', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
    assert.equal(users[0].role, 'admin');
    assert.equal(users[0].active, 1);
  });

  it('admin user has no password hash initially', () => {
    const hash = getPasswordHashForUser(db, 1);
    assert.ok(hash === '' || hash === null);
  });

  it('set password hash for admin user', () => {
    const hash = hashBcrypt('admin1234');
    mutate(db, 'UPDATE users SET password_hash = ? WHERE id = 1', [hash]);
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(isBcryptHash(stored), true);
    assert.equal(verifyPassword('admin1234', stored), true);
  });

  it('login succeeds with correct password', () => {
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(verifyPassword('admin1234', stored), true);
  });

  it('login fails with wrong password', () => {
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(verifyPassword('wrongpassword', stored), false);
  });

  it('admin user remains in DB after password setup', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
  });
});

// ───── Office Settings ─────

describe('Office Settings', () => {
  let db;

  before(async () => { db = await createDb(); });

  it('getOfficeSetting returns null for missing key', () => {
    assert.equal(getOfficeSetting(db, 'nonexistent'), null);
  });

  it('setOfficeSetting stores and retrieves value', () => {
    setOfficeSetting(db, 'office_name', 'مكتب المحامي');
    assert.equal(getOfficeSetting(db, 'office_name'), 'مكتب المحامي');
  });

  it('setOfficeSetting overwrites existing value', () => {
    setOfficeSetting(db, 'office_name', 'مكتب جديد');
    assert.equal(getOfficeSetting(db, 'office_name'), 'مكتب جديد');
  });

  it('multiple settings can coexist', () => {
    setOfficeSetting(db, 'setup_date', '2026-01-01');
    setOfficeSetting(db, 'office_phone', '0612345678');
    assert.equal(getOfficeSetting(db, 'office_name'), 'مكتب جديد');
    assert.equal(getOfficeSetting(db, 'setup_date'), '2026-01-01');
    assert.equal(getOfficeSetting(db, 'office_phone'), '0612345678');
  });
});

// ───── Register New User ─────

describe('Auth Flow — Register New User', () => {
  let db;

  before(async () => { db = await createDb(); });

  it('starts with one admin user', () => {
    assert.equal(getUsers(db).length, 1);
  });

  it('adds a new user with password hash', () => {
    const hash = hashBcrypt('userpwd123');
    const id = addUser(db, { name: 'محامي جديد', email: 'lawyer@example.com', password_hash: hash, role: 'junior_lawyer' });
    assert.equal(typeof id, 'number');
    assert.equal(id > 1, true);
  });

  it('getUsers returns both users', () => {
    const users = getUsers(db);
    assert.equal(users.length, 2);
    const found = users.find(u => u.email === 'lawyer@example.com');
    assert.equal(found.name, 'محامي جديد');
    assert.equal(found.role, 'junior_lawyer');
  });

  it('getUsers does not expose password_hash', () => {
    const users = getUsers(db);
    users.forEach(u => {
      assert.equal(u.password_hash, undefined);
    });
  });

  it('new user password verifies correctly', () => {
    const user = getUsers(db).find(u => u.email === 'lawyer@example.com');
    const hash = getPasswordHashForUser(db, user.id);
    assert.equal(verifyPassword('userpwd123', hash), true);
  });

  it('adds a second user', () => {
    const hash = hashBcrypt('assistpwd456');
    addUser(db, { name: 'مساعد', email: 'assist@example.com', password_hash: hash, role: 'assistant' });
    assert.equal(getUsers(db).length, 3);
  });

  it('deletes a user', () => {
    const users = getUsers(db);
    const target = users.find(u => u.email === 'assist@example.com');
    assert.ok(target);
    deleteUser(db, target.id);
    assert.equal(getUsers(db).length, 2);
  });
});

// ───── Login with Existing Users ─────

describe('Auth Flow — Login with Existing Users', () => {
  let db;

  before(async () => {
    db = await createDb();
    const hash = hashBcrypt('masterpwd789');
    mutate(db, 'UPDATE users SET password_hash = ? WHERE id = 1', [hash]);
  });

  it('login succeeds with correct per-user password', () => {
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(verifyPassword('masterpwd789', stored), true);
  });

  it('login fails with wrong password', () => {
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(verifyPassword('wrongpwd', stored), false);
  });

  it('getUsers returns seeded admin', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
  });

  it('adding more users does not affect existing password', () => {
    const hash = hashBcrypt('somepwd');
    addUser(db, { name: 'مستخدم إضافي', email: 'extra@example.com', password_hash: hash, role: 'intern' });
    assert.equal(getUsers(db).length, 2);
    const stored = getPasswordHashForUser(db, 1);
    assert.equal(verifyPassword('masterpwd789', stored), true);
  });
});

// ───── Empty Database ─────

describe('Auth Flow — Empty Database', () => {
  let db;

  before(async () => {
    db = await createDb();
    mutate(db, 'DELETE FROM users');
  });

  it('getUsers returns empty array when no users', () => {
    const users = getUsers(db);
    assert.equal(Array.isArray(users), true);
    assert.equal(users.length, 0);
  });

  it('addUser creates first user in empty DB', () => {
    const hash = hashBcrypt('firstadmin');
    const id = addUser(db, { name: 'المدير الأول', email: 'first@admin.ma', password_hash: hash, role: 'admin' });
    assert.equal(typeof id, 'number');
    assert.equal(getUsers(db).length, 1);
  });

  it('login works with new user password', () => {
    const user = getUsers(db)[0];
    const stored = getPasswordHashForUser(db, user.id);
    assert.equal(verifyPassword('firstadmin', stored), true);
  });

  it('no user table returns empty array from getUsers', () => {
    const fakeDb = { exec: () => { throw new Error('no such table'); } };
    const result = getUsers(fakeDb);
    assert.equal(Array.isArray(result), true);
    assert.equal(result.length, 0);
  });
});

// ───── Permissions & Roles ─────

describe('Auth Flow — Permissions & Roles', () => {
  let db;

  before(async () => { db = await createDb(); });

  it('default permissions exist for admin role', () => {
    const perms = query(db, 'SELECT permission FROM permissions WHERE role=? AND allowed=1', ['admin']);
    const permNames = perms.map(p => p.permission);
    assert.ok(permNames.includes('manage_users'));
    assert.ok(permNames.includes('use_ai'));
    assert.ok(permNames.includes('view_audit'));
  });

  it('junior_lawyer has limited permissions', () => {
    const perms = query(db, 'SELECT permission FROM permissions WHERE role=? AND allowed=1', ['junior_lawyer']);
    const permNames = perms.map(p => p.permission);
    assert.ok(permNames.includes('view_case'));
    assert.ok(permNames.includes('use_ai'));
    assert.equal(permNames.includes('manage_users'), false);
    assert.equal(permNames.includes('export_data'), false);
  });

  it('intern has minimal permissions', () => {
    const perms = query(db, 'SELECT permission FROM permissions WHERE role=? AND allowed=1', ['intern']);
    const permNames = perms.map(p => p.permission);
    assert.equal(permNames.length, 1);
    assert.equal(permNames[0], 'view_case');
  });

  it('user with active=0 is marked inactive', () => {
    const hash = hashBcrypt('inactiveuser');
    mutate(db, 'INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
      ['مستخدم غير نشط', 'inactive@test.com', hash, 'intern', 0]);
    const users = getUsers(db);
    const inactive = users.find(u => u.active === 0);
    assert.ok(inactive);
    assert.equal(inactive.name, 'مستخدم غير نشط');
  });
});
