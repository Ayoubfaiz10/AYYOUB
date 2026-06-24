const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BCRYPT_SALT_ROUNDS = 12;
let testDir, pwdPath;

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
  fs.writeFileSync(filePath, JSON.stringify({ hash }, null, 2));
}

// ---- IPC Handler Simulations (mirroring main.js logic) ----

function handleAuthHasPassword(pwdPath) {
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  return !!stored;
}

function handleAuthLogin(pwdPath, pwd) {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  if (!stored) return { ok: true, firstTime: true };
  if (!verifyPassword(pwd, stored)) return { ok: false, error: 'كلمة السر خطأ' };
  if (isSHA256Hash(stored)) setPasswordHash(pwdPath, hashBcrypt(pwd));
  return { ok: true };
}

function handleAuthSetPassword(pwdPath, pwd) {
  if (!pwd || typeof pwd !== 'string' || pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  try {
    const hash = hashBcrypt(pwd);
    setPasswordHash(pwdPath, hash);
    const verify = getPasswordHash(pwdPath);
    if (isPasswordHashError(verify) || !verify) return { ok: false, error: 'فشل حفظ كلمة السر' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'خطأ في تشفير كلمة السر: ' + e.message };
  }
}

function handleAuthHashPassword(pwd) {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
  if (pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
  try {
    return { ok: true, hash: hashBcrypt(pwd) };
  } catch (e) {
    return { ok: false, error: 'خطأ في تشفير كلمة السر: ' + e.message };
  }
}

// ───── Test Suites ─────

describe('SHA256 Hash Detection', () => {
  it('valid 64-char hex returns true', () => assert.equal(isSHA256Hash('a'.repeat(64)), true));
  it('uppercase hex returns true', () => assert.equal(isSHA256Hash('ABCDEF'.repeat(10) + '0123'), true));
  it('empty string returns false', () => assert.equal(isSHA256Hash(''), false));
  it('short string returns false', () => assert.equal(isSHA256Hash('abc'), false));
  it('null returns false', () => assert.equal(isSHA256Hash(null), false));
  it('undefined returns false', () => assert.equal(isSHA256Hash(undefined), false));
  it('number returns false', () => assert.equal(isSHA256Hash(12345), false));
  it('non-hex char returns false', () => assert.equal(isSHA256Hash('z' + 'a'.repeat(63)), false));
});

describe('Bcrypt Hash Detection', () => {
  it('valid bcrypt $2a$ returns true', () => assert.equal(isBcryptHash('$2a$12$LJ3m4ys3Lk0TSwHlsVJC'), true));
  it('valid bcrypt $2b$ returns true', () => assert.equal(isBcryptHash('$2b$12$LJ3m4ys3Lk0TSwHlsVJC'), true));
  it('valid bcrypt $2y$ returns true', () => assert.equal(isBcryptHash('$2y$12$LJ3m4ys3Lk0TSwHlsVJC'), true));
  it('empty string returns false', () => assert.equal(isBcryptHash(''), false));
  it('no $ prefix returns false', () => assert.equal(isBcryptHash('abc'), false));
  it('null returns false', () => assert.equal(isBcryptHash(null), false));
});

describe('SHA256 Hashing', () => {
  it('same input produces same hash', () => assert.equal(hashSHA256('hello'), hashSHA256('hello')));
  it('hello hashes to known value', () => assert.equal(hashSHA256('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'));
  it('empty string hashes correctly', () => assert.equal(hashSHA256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));
  it('different inputs produce different hashes', () => assert.notEqual(hashSHA256('a'), hashSHA256('b')));
});

describe('Bcrypt Hashing', () => {
  it('produces valid bcrypt hash', () => assert.ok(isBcryptHash(hashBcrypt('testpwd'))));
  it('each call produces unique salt', () => assert.notEqual(hashBcrypt('testpwd'), hashBcrypt('testpwd')));
  it('bcrypt compare: correct password matches', () => assert.ok(bcrypt.compareSync('testpwd', hashBcrypt('testpwd'))));
  it('bcrypt compare: wrong password rejected', () => assert.equal(bcrypt.compareSync('wrong', hashBcrypt('testpwd')), false));
});

describe('Password Verification', () => {
  it('bcrypt: correct password', () => assert.ok(verifyPassword('mypassword', hashBcrypt('mypassword'))));
  it('bcrypt: wrong password', () => assert.equal(verifyPassword('wrong', hashBcrypt('mypassword')), false));
  it('SHA256: correct password', () => assert.ok(verifyPassword('mypassword', hashSHA256('mypassword'))));
  it('SHA256: wrong password', () => assert.equal(verifyPassword('wrong', hashSHA256('mypassword')), false));
  it('empty stored hash returns false', () => assert.equal(verifyPassword('any', ''), false));
  it('null stored hash returns false', () => assert.equal(verifyPassword('any', null), false));
});

describe('IPC: auth:hasPassword', () => {
  before(() => { testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-test-')); pwdPath = path.join(testDir, 'password.json'); });
  after(() => { try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  it('no password file returns false', () => assert.equal(handleAuthHasPassword(pwdPath), false));
  it('existing password returns true', () => {
    setPasswordHash(pwdPath, hashBcrypt('secret'));
    assert.equal(handleAuthHasPassword(pwdPath), true);
  });
  it('corrupted JSON returns corrupt flag', () => {
    fs.writeFileSync(pwdPath, 'not-json');
    const r = handleAuthHasPassword(pwdPath);
    assert.equal(r.corrupt, true);
  });
  it('non-string hash returns corrupt flag', () => {
    fs.writeFileSync(pwdPath, '{"hash":12345}');
    const r = handleAuthHasPassword(pwdPath);
    assert.equal(r.corrupt, true);
  });
});

describe('IPC: auth:setPassword', () => {
  before(() => { testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-set-')); pwdPath = path.join(testDir, 'password.json'); });
  after(() => { try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  it('valid password returns ok', () => {
    setPasswordHash(pwdPath, hashBcrypt('existing'));
    assert.equal(handleAuthSetPassword(pwdPath, 'goodpwd123').ok, true);
  });
  it('empty password returns error', () => assert.equal(handleAuthSetPassword(pwdPath, '').ok, false));
  it('2-char password returns error', () => assert.equal(handleAuthSetPassword(pwdPath, 'ab').ok, false));
  it('number password returns error', () => assert.equal(handleAuthSetPassword(pwdPath, 12345).ok, false));
  it('null password returns error', () => assert.equal(handleAuthSetPassword(pwdPath, null).ok, false));
  it('corrupted file returns error', () => {
    fs.writeFileSync(pwdPath, 'corrupted');
    const r = handleAuthSetPassword(pwdPath, 'abcd1234');
    assert.equal(r.ok, false);
    assert.equal(r.corrupt, true);
  });
  it('stored hash is bcrypt after valid setPassword', () => {
    setPasswordHash(pwdPath, hashBcrypt('reset'));
    assert.equal(isBcryptHash(getPasswordHash(pwdPath)), true);
  });
  it('stored hash verifies correctly', () => {
    assert.equal(bcrypt.compareSync('reset', getPasswordHash(pwdPath)), true);
  });
});

describe('IPC: auth:login', () => {
  before(() => { testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-login-')); pwdPath = path.join(testDir, 'password.json'); });
  after(() => { try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  it('correct password logs in', () => {
    setPasswordHash(pwdPath, hashBcrypt('secret123'));
    assert.deepEqual(handleAuthLogin(pwdPath, 'secret123'), { ok: true });
  });
  it('wrong password returns error', () => {
    setPasswordHash(pwdPath, hashBcrypt('secret123'));
    assert.equal(handleAuthLogin(pwdPath, 'wrongpwd').ok, false);
  });
  it('empty password returns error', () => assert.equal(handleAuthLogin(pwdPath, '').ok, false));
  it('null password returns error', () => assert.equal(handleAuthLogin(pwdPath, null).ok, false));
  it('undefined password returns error', () => assert.equal(handleAuthLogin(pwdPath, undefined).ok, false));
  it('no password file returns firstTime', () => {
    try { fs.unlinkSync(pwdPath); } catch (e) { /* ok */ }
    assert.deepEqual(handleAuthLogin(pwdPath, 'anything'), { ok: true, firstTime: true });
  });
  it('corrupted JSON returns corrupt flag', () => {
    fs.writeFileSync(pwdPath, '{broken');
    assert.equal(handleAuthLogin(pwdPath, 'anything').corrupt, true);
  });
  it('null hash returns corrupt flag', () => {
    fs.writeFileSync(pwdPath, '{"hash":null}');
    assert.equal(handleAuthLogin(pwdPath, 'anything').corrupt, true);
  });
});

describe('IPC: auth:hashPassword', () => {
  it('valid password returns bcrypt hash', () => {
    const r = handleAuthHashPassword('mysecurepwd');
    assert.equal(r.ok, true);
    assert.equal(isBcryptHash(r.hash), true);
  });
  it('empty password returns error', () => assert.equal(handleAuthHashPassword('').ok, false));
  it('short password returns error', () => assert.equal(handleAuthHashPassword('ab').ok, false));
  it('null returns error', () => assert.equal(handleAuthHashPassword(null).ok, false));
});

describe('IPC: auth:login — SHA256 to bcrypt migration', () => {
  before(() => { testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-migrate-')); pwdPath = path.join(testDir, 'password.json'); });
  after(() => { try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  it('migrates SHA256 hash to bcrypt on successful login', () => {
    const sha256Hash = hashSHA256('oldstyle');
    setPasswordHash(pwdPath, sha256Hash);
    assert.equal(isSHA256Hash(getPasswordHash(pwdPath)), true);
    assert.deepEqual(handleAuthLogin(pwdPath, 'oldstyle'), { ok: true });
    const storedAfter = getPasswordHash(pwdPath);
    assert.equal(isBcryptHash(storedAfter), true);
    assert.equal(bcrypt.compareSync('oldstyle', storedAfter), true);
  });
});
