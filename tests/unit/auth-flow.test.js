const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createDb, query, mutate } = require('../helpers/db');

const BCRYPT_SALT_ROUNDS = 12;

function hashSHA256(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function hashBcrypt(pwd) {
  return bcrypt.hashSync(pwd, BCRYPT_SALT_ROUNDS);
}

function isSHA256Hash(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash);
}

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[abxy]\$\d+\$/.test(hash);
}

function verifyPassword(pwd, storedHash) {
  if (isBcryptHash(storedHash)) return bcrypt.compareSync(pwd, storedHash);
  if (isSHA256Hash(storedHash)) return hashSHA256(pwd) === storedHash;
  return false;
}

function getPasswordHash(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!parsed || typeof parsed.hash !== 'string') return { error: 'ملف كلمة السر تالف' };
      return parsed.hash || '';
    }
  } catch (e) { return { error: 'ملف كلمة السر تالف: ' + e.message }; }
  return '';
}

function isPasswordHashError(val) {
  return typeof val === 'object' && val !== null && val.error;
}

function setPasswordHash(filePath, hash) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify({ hash }, null, 2));
  fs.renameSync(tempPath, filePath);
}

// ---- Simulated IPC handlers (mirroring fixed main.js logic) ----

function safeAuth(fn) {
  return (...args) => {
    try { return fn(...args); }
    catch (e) { return { ok: false, error: 'حدث خطأ في النظام: ' + (e.message || '') }; }
  };
}

const handleAuthHasPassword = safeAuth((pwdPath) => {
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  return !!stored;
});

const handleAuthLogin = safeAuth((pwdPath, pwd) => {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  if (!stored) return { ok: true, firstTime: true };
  if (!verifyPassword(pwd, stored)) return { ok: false, error: 'كلمة السر خطأ' };
  if (isSHA256Hash(stored)) setPasswordHash(pwdPath, hashBcrypt(pwd));
  return { ok: true };
});

const handleAuthSetPassword = safeAuth((pwdPath, pwd) => {
  if (!pwd || typeof pwd !== 'string' || pwd.length < 4) return { ok: false, error: 'كلمة السر يجب أن تكون 4 أحرف على الأقل' };
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  const hash = hashBcrypt(pwd);
  setPasswordHash(pwdPath, hash);
  const verify = getPasswordHash(pwdPath);
  if (isPasswordHashError(verify) || !verify) return { ok: false, error: 'فشل حفظ كلمة السر — تحقق من صلاحية الكتابة' };
  return { ok: true };
});

const handleAuthHashPassword = safeAuth((pwd) => {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
  if (pwd.length < 4) return { ok: false, error: 'كلمة السر يجب أن تكون 4 أحرف على الأقل' };
  return { ok: true, hash: hashBcrypt(pwd) };
});

// DB operations (mirroring db/users.js + db/utils.js)
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

// ───── Test Suites ─────

describe('Auth Flow — First Admin Setup', () => {
  let db, testDir, pwdPath;

  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-admin-setup-'));
    pwdPath = path.join(testDir, 'password.json');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('hasPassword returns false when no password file exists', () => {
    assert.equal(handleAuthHasPassword(pwdPath), false);
  });

  it('admin user is seeded in DB', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
    assert.equal(users[0].role, 'admin');
    assert.equal(users[0].active, 1);
  });

  it('setPassword creates password file with bcrypt hash', () => {
    const r = handleAuthSetPassword(pwdPath, 'admin1234');
    assert.equal(r.ok, true);
    const hash = getPasswordHash(pwdPath);
    assert.equal(isBcryptHash(hash), true);
  });

  it('hasPassword returns true after setup', () => {
    assert.equal(handleAuthHasPassword(pwdPath), true);
  });

  it('login succeeds with correct password after setup', () => {
    const r = handleAuthLogin(pwdPath, 'admin1234');
    assert.equal(r.ok, true);
    assert.equal(r.firstTime, undefined);
  });

  it('login fails with wrong password after setup', () => {
    const r = handleAuthLogin(pwdPath, 'wrongpassword');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'كلمة السر خطأ');
  });

  it('login with empty password returns error', () => {
    const r = handleAuthLogin(pwdPath, '');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'كلمة السر مطلوبة');
  });

  it('admin user remains in DB after password setup', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
  });

  it('setPassword with short password returns error', () => {
    const r = handleAuthSetPassword(pwdPath, 'ab');
    assert.equal(r.ok, false);
    assert.equal(r.error.includes('4 أحرف'), true);
  });

  it('can re-set password and login with new password', () => {
    const r1 = handleAuthSetPassword(pwdPath, 'newadmin567');
    assert.equal(r1.ok, true);

    const r2 = handleAuthLogin(pwdPath, 'newadmin567');
    assert.equal(r2.ok, true);

    const r3 = handleAuthLogin(pwdPath, 'admin1234');
    assert.equal(r3.ok, false);
  });
});

describe('Auth Flow — Register New User', () => {
  let db, testDir, pwdPath;

  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-register-'));
    pwdPath = path.join(testDir, 'password.json');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

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
    assert.equal(found.active, 1);
  });

  it('getUsers does not expose password_hash', () => {
    const users = getUsers(db);
    users.forEach(u => {
      assert.equal(u.password_hash, undefined);
    });
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

  it('remaining users are admin and lawyer', () => {
    const users = getUsers(db);
    const emails = users.map(u => u.email);
    assert.ok(emails.includes('admin@cabinet.ma'));
    assert.ok(emails.includes('lawyer@example.com'));
    assert.equal(emails.includes('assist@example.com'), false);
  });
});

describe('Auth Flow — Login with Existing Users', () => {
  let db, testDir, pwdPath;

  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-login-flow-'));
    pwdPath = path.join(testDir, 'password.json');
    handleAuthSetPassword(pwdPath, 'masterpwd789');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('hasPassword returns true', () => {
    assert.equal(handleAuthHasPassword(pwdPath), true);
  });

  it('login succeeds with correct master password', () => {
    const r = handleAuthLogin(pwdPath, 'masterpwd789');
    assert.equal(r.ok, true);
  });

  it('login fails with wrong password', () => {
    const r = handleAuthLogin(pwdPath, 'wrongpwd');
    assert.equal(r.ok, false);
  });

  it('login fails with empty password', () => {
    const r = handleAuthLogin(pwdPath, '');
    assert.equal(r.ok, false);
  });

  it('login fails with null password', () => {
    const r = handleAuthLogin(pwdPath, null);
    assert.equal(r.ok, false);
  });

  it('getUsers returns seeded admin', () => {
    const users = getUsers(db);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
  });

  it('login after adding more users still works', () => {
    const hash = hashBcrypt('somepwd');
    addUser(db, { name: 'مستخدم إضافي', email: 'extra@example.com', password_hash: hash, role: 'intern' });
    assert.equal(getUsers(db).length, 2);
    const r = handleAuthLogin(pwdPath, 'masterpwd789');
    assert.equal(r.ok, true);
  });
});

describe('Auth Flow — BCrypt Migration Compatibility', () => {
  let testDir, pwdPath;

  before(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-migrate-flow-'));
    pwdPath = path.join(testDir, 'password.json');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('starts with SHA256 hash', () => {
    const shaHash = hashSHA256('legacy_password');
    setPasswordHash(pwdPath, shaHash);
    assert.equal(isSHA256Hash(getPasswordHash(pwdPath)), true);
    assert.equal(isBcryptHash(getPasswordHash(pwdPath)), false);
  });

  it('login migrates SHA256 to bcrypt', () => {
    const r = handleAuthLogin(pwdPath, 'legacy_password');
    assert.equal(r.ok, true);
    const stored = getPasswordHash(pwdPath);
    assert.equal(isSHA256Hash(stored), false);
    assert.equal(isBcryptHash(stored), true);
  });

  it('login with bcrypt hash works after migration', () => {
    const r = handleAuthLogin(pwdPath, 'legacy_password');
    assert.equal(r.ok, true);
  });

  it('wrong password still fails after migration', () => {
    const r = handleAuthLogin(pwdPath, 'wrong_password');
    assert.equal(r.ok, false);
  });

  it('can login repeatedly without re-migrating', () => {
    for (let i = 0; i < 3; i++) {
      const r = handleAuthLogin(pwdPath, 'legacy_password');
      assert.equal(r.ok, true);
    }
    const stored = getPasswordHash(pwdPath);
    assert.equal(isBcryptHash(stored), true);
  });

  it('migrated hash verifies with bcrypt.compareSync', () => {
    const stored = getPasswordHash(pwdPath);
    assert.equal(bcrypt.compareSync('legacy_password', stored), true);
    assert.equal(bcrypt.compareSync('wrong_password', stored), false);
  });
});

describe('Auth Flow — Empty Database', () => {
  let db, testDir, pwdPath;

  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-empty-'));
    pwdPath = path.join(testDir, 'password.json');
    query(db, 'DELETE FROM users');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('getUsers returns empty array when table exists but no users', () => {
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

  it('setPassword works on empty password file scenario', () => {
    const r = handleAuthSetPassword(pwdPath, 'emptypwd123');
    assert.equal(r.ok, true);
  });

  it('login works after setting up empty DB', () => {
    const r = handleAuthLogin(pwdPath, 'emptypwd123');
    assert.equal(r.ok, true);
  });

  it('no user table returns empty array from getUsers', () => {
    const fakeDb = { exec: () => { throw new Error('no such table'); } };
    const result = getUsers(fakeDb);
    assert.equal(Array.isArray(result), true);
    assert.equal(result.length, 0);
  });
});

describe('Auth Flow — Corrupted User Records', () => {
  let db, testDir, pwdPath;

  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-corrupt-'));
    pwdPath = path.join(testDir, 'password.json');
  });

  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('corrupted password JSON returns corrupt flag', () => {
    fs.writeFileSync(pwdPath, 'this-is-not-json');
    const r = handleAuthHasPassword(pwdPath);
    assert.equal(r.corrupt, true);
  });

  it('login with corrupted password file returns corrupt flag', () => {
    const r = handleAuthLogin(pwdPath, 'anypwd');
    assert.equal(r.corrupt, true);
  });

  it('setPassword with corrupted file returns corrupt flag', () => {
    const r = handleAuthSetPassword(pwdPath, 'newpwd123');
    assert.equal(r.corrupt, true);
  });

  it('fix corrupted file by replacing with valid data', () => {
    setPasswordHash(pwdPath, hashBcrypt('fixedpwd'));
    const stored = getPasswordHash(pwdPath);
    assert.equal(isBcryptHash(stored), true);
    assert.equal(typeof stored, 'string');
  });

  it('login works after fixing corrupted file', () => {
    const r = handleAuthLogin(pwdPath, 'fixedpwd');
    assert.equal(r.ok, true);
  });

  it('user with inactive flag is retrievable but can be filtered', () => {
    const hash = hashBcrypt('inactiveuser');
    mutate(db, 'INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
      ['مستخدم غير نشط', 'inactive@test.com', hash, 'intern', 0]);
    const users = getUsers(db);
    const inactive = users.find(u => u.active === 0);
    assert.ok(inactive);
    assert.equal(inactive.name, 'مستخدم غير نشط');
    const activeUsers = users.filter(u => u.active);
    assert.equal(activeUsers.length, 1);
    assert.equal(activeUsers[0].name, 'المحامي المدير');
  });

  it('hashPassword with short password returns error', () => {
    const r = handleAuthHashPassword('ab');
    assert.equal(r.ok, false);
  });

  it('hashPassword with valid password returns bcrypt hash', () => {
    const r = handleAuthHashPassword('validpassword');
    assert.equal(r.ok, true);
    assert.equal(isBcryptHash(r.hash), true);
  });
});
