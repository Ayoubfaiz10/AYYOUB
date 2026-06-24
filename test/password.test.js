const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; process.stdout.write('  \u2713 '); }
  else { failed++; process.stdout.write('  \u2717 '); }
  console.log(label);
}

function assertDeepEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { passed++; process.stdout.write('  \u2713 '); }
  else { failed++; process.stdout.write('  \u2717 '); console.log('\n    Expected: ' + e + '\n    Actual:   ' + a); }
  console.log(label);
}

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
      if (!parsed || typeof parsed.hash !== 'string') return { error: '\u0645\u0644\u0641 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u062A\u0627\u0644\u0641' };
      return parsed.hash || '';
    }
  } catch (e) { return { error: '\u0645\u0644\u0641 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u062A\u0627\u0644\u0641: ' + e.message }; }
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

function handleAuthHasPassword(pwdPath) {
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  return !!stored;
}

function handleAuthLogin(pwdPath, pwd) {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u0645\u0637\u0644\u0648\u0628\u0629' };
  const stored = getPasswordHash(pwdPath);
  if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
  if (!stored) return { ok: true, firstTime: true };
  if (!verifyPassword(pwd, stored)) return { ok: false, error: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u062E\u0637\u0623' };
  if (isSHA256Hash(stored)) {
    setPasswordHash(pwdPath, hashBcrypt(pwd));
  }
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
    if (isPasswordHashError(verify) || !verify) return { ok: false, error: '\u0641\u0634\u0644 \u062D\u0641\u0638 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: '\u062E\u0637\u0623 \u0641\u064A \u062A\u0634\u0641\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631: ' + e.message };
  }
}

function handleAuthHashPassword(pwd) {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u0645\u0637\u0644\u0648\u0628\u0629' };
  if (pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
  try {
    return { ok: true, hash: hashBcrypt(pwd) };
  } catch (e) {
    return { ok: false, error: '\u062E\u0637\u0623 \u0641\u064A \u062A\u0634\u0641\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631: ' + e.message };
  }
}

function runSuite(name, tests) {
  console.log('\n=== ' + name + ' ===');
  tests.forEach(t => t());
}

// ════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════

runSuite('SHA256 Hash Detection', [
  () => assert(isSHA256Hash('a'.repeat(64)) === true, 'valid 64-char hex returns true'),
  () => assert(isSHA256Hash('ABCDEF'.repeat(10) + '0123') === true, 'uppercase hex returns true'),
  () => assert(isSHA256Hash('') === false, 'empty string returns false'),
  () => assert(isSHA256Hash('abc') === false, 'short string returns false'),
  () => assert(isSHA256Hash(null) === false, 'null returns false'),
  () => assert(isSHA256Hash(undefined) === false, 'undefined returns false'),
  () => assert(isSHA256Hash(12345) === false, 'number returns false'),
  () => assert(isSHA256Hash('z' + 'a'.repeat(63)) === false, 'non-hex char returns false'),
]);

runSuite('Bcrypt Hash Detection', [
  () => assert(isBcryptHash('$2a$12$LJ3m4ys3Lk0TSwHlsVJC') === true, 'valid bcrypt $2a$ returns true'),
  () => assert(isBcryptHash('$2b$12$LJ3m4ys3Lk0TSwHlsVJC') === true, 'valid bcrypt $2b$ returns true'),
  () => assert(isBcryptHash('$2y$12$LJ3m4ys3Lk0TSwHlsVJC') === true, 'valid bcrypt $2y$ returns true'),
  () => assert(isBcryptHash('') === false, 'empty string returns false'),
  () => assert(isBcryptHash('abc') === false, 'no $ prefix returns false'),
  () => assert(isBcryptHash(null) === false, 'null returns false'),
  () => assert(isBcryptHash('$2a$AB$LJ3m4ys3Lk0TSwHlsVJC') === false, 'non-numeric rounds returns false'),
]);

runSuite('SHA256 Hashing', [
  () => {
    const h1 = hashSHA256('hello');
    const h2 = hashSHA256('hello');
    assert(h1 === h2, 'same input produces same hash (deterministic)');
  },
  () => assert(hashSHA256('hello') === '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', 'hello hashes to known value'),
  () => assert(hashSHA256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'empty string hashes correctly'),
  () => assert(hashSHA256('a') !== hashSHA256('b'), 'different inputs produce different hashes'),
]);

runSuite('Bcrypt Hashing', [
  () => {
    const h = hashBcrypt('testpwd');
    assert(isBcryptHash(h), 'produces valid bcrypt hash');
  },
  () => {
    const h1 = hashBcrypt('testpwd');
    const h2 = hashBcrypt('testpwd');
    assert(h1 !== h2, 'each call produces unique salt (different hashes)');
  },
  () => assert(bcrypt.compareSync('testpwd', hashBcrypt('testpwd')) === true, 'bcrypt compare: correct password matches'),
  () => assert(bcrypt.compareSync('wrong', hashBcrypt('testpwd')) === false, 'bcrypt compare: wrong password rejected'),
]);

runSuite('Password Verification', [
  () => {
    const h = hashBcrypt('mypassword');
    assert(verifyPassword('mypassword', h) === true, 'bcrypt: correct password');
  },
  () => {
    const h = hashBcrypt('mypassword');
    assert(verifyPassword('wrong', h) === false, 'bcrypt: wrong password');
  },
  () => {
    const h = hashSHA256('mypassword');
    assert(verifyPassword('mypassword', h) === true, 'SHA256: correct password');
  },
  () => {
    const h = hashSHA256('mypassword');
    assert(verifyPassword('wrong', h) === false, 'SHA256: wrong password');
  },
  () => assert(verifyPassword('any', '') === false, 'empty stored hash returns false'),
  () => assert(verifyPassword('any', 'invalid!!!') === false, 'invalid stored hash returns false'),
  () => assert(verifyPassword('any', null) === false, 'null stored hash returns false'),
]);

// ─── 2. IPC Handler Simulation Tests ───

let testDir, testPwdPath;

runSuite('IPC: auth:hasPassword', [
  () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwd-test-'));
    testPwdPath = path.join(testDir, 'password.json');
    const r = handleAuthHasPassword(testPwdPath);
    assert(r === false, 'no password file returns false');
  },
  () => {
    setPasswordHash(testPwdPath, hashBcrypt('secret'));
    const r = handleAuthHasPassword(testPwdPath);
    assert(r === true, 'existing password returns true');
  },
  () => {
    fs.writeFileSync(testPwdPath, 'not-json');
    const r = handleAuthHasPassword(testPwdPath);
    assert(r.corrupt === true, 'corrupted JSON returns corrupt flag');
  },
  () => {
    fs.writeFileSync(testPwdPath, '{"hash":12345}');
    const r = handleAuthHasPassword(testPwdPath);
    assert(r.corrupt === true, 'non-string hash returns corrupt flag');
  },
]);

runSuite('IPC: auth:setPassword', [
  () => {
    setPasswordHash(testPwdPath, hashBcrypt('existing'));
    const r = handleAuthSetPassword(testPwdPath, 'goodpwd123');
    assert(r.ok === true, 'valid 10-char password returns ok');
  },
  () => {
    const r = handleAuthSetPassword(testPwdPath, '');
    assert(r.ok === false, 'empty password returns error');
  },
  () => {
    const r = handleAuthSetPassword(testPwdPath, 'ab');
    assert(r.ok === false, '2-char password returns error (min 8)');
  },
  () => {
    const r = handleAuthSetPassword(testPwdPath, 'abc');
    assert(r.ok === false, '3-char password returns error (min 8)');
  },
  () => {
    const r = handleAuthSetPassword(testPwdPath, 12345);
    assert(r.ok === false, 'number password returns error');
  },
  () => {
    const r = handleAuthSetPassword(testPwdPath, null);
    assert(r.ok === false, 'null password returns error');
  },
  () => {
    fs.writeFileSync(testPwdPath, 'corrupted');
    const r = handleAuthSetPassword(testPwdPath, 'abcd1234');
    assert(r.ok === false && r.corrupt === true, 'corrupted file returns error');
    setPasswordHash(testPwdPath, hashBcrypt('reset'));
  },
  () => {
    const stored = getPasswordHash(testPwdPath);
    const isBcrypt = isBcryptHash(stored);
    assert(isBcrypt === true, 'after setPassword, stored hash is bcrypt');
  },
  () => assert(bcrypt.compareSync('reset', getPasswordHash(testPwdPath)) === true, 'stored hash verifies correctly'),
]);

runSuite('IPC: auth:login — successful flow', [
  () => {
    setPasswordHash(testPwdPath, hashBcrypt('secret123'));
    const r = handleAuthLogin(testPwdPath, 'secret123');
    assert(r.ok === true && !r.firstTime, 'correct password logs in');
  },
]);

runSuite('IPC: auth:login — wrong password', [
  () => {
    setPasswordHash(testPwdPath, hashBcrypt('secret123'));
    const r = handleAuthLogin(testPwdPath, 'wrongpwd');
    assert(r.ok === false && r.error !== undefined, 'wrong password returns error');
  },
]);

runSuite('IPC: auth:login — empty password', [
  () => {
    setPasswordHash(testPwdPath, hashBcrypt('secret123'));
    const r = handleAuthLogin(testPwdPath, '');
    assert(r.ok === false, 'empty password returns error');
  },
  () => {
    const r = handleAuthLogin(testPwdPath, null);
    assert(r.ok === false, 'null password returns error');
  },
  () => {
    const r = handleAuthLogin(testPwdPath, undefined);
    assert(r.ok === false, 'undefined password returns error');
  },
]);

runSuite('IPC: auth:login — no password set (first time)', [
  () => {
    fs.unlinkSync(testPwdPath);
    const r = handleAuthLogin(testPwdPath, 'anything');
    assert(r.ok === true && r.firstTime === true, 'no password file returns firstTime');
  },
]);

runSuite('IPC: auth:login — corrupted hash', [
  () => {
    fs.writeFileSync(testPwdPath, '{broken json');
    const r = handleAuthLogin(testPwdPath, 'anything');
    assert(r.corrupt === true, 'corrupted JSON returns corrupt flag');
  },
  () => {
    fs.writeFileSync(testPwdPath, '{"hash":null}');
    const r = handleAuthLogin(testPwdPath, 'anything');
    assert(r.corrupt === true, 'null hash returns corrupt flag');
  },
  () => {
    fs.writeFileSync(testPwdPath, '{"hash":123}');
    const r = handleAuthLogin(testPwdPath, 'anything');
    assert(r.corrupt === true, 'number hash returns corrupt flag');
  },
]);

runSuite('IPC: auth:hashPassword', [
  () => {
    const r = handleAuthHashPassword('mysecurepwd');
    assert(r.ok === true && typeof r.hash === 'string' && isBcryptHash(r.hash), 'valid password returns bcrypt hash');
  },
  () => {
    const r = handleAuthHashPassword('');
    assert(r.ok === false, 'empty password returns error');
  },
  () => {
    const r = handleAuthHashPassword('ab');
    assert(r.ok === false, 'short password (2 chars) returns error');
  },
  () => {
    const r = handleAuthHashPassword(null);
    assert(r.ok === false, 'null returns error');
  },
]);

runSuite('IPC: auth:login — SHA256 → bcrypt migration', [
  () => {
    fs.unlinkSync(testPwdPath);
    const sha256Hash = hashSHA256('oldstyle');
    setPasswordHash(testPwdPath, sha256Hash);
    assert(isSHA256Hash(getPasswordHash(testPwdPath)) === true, 'SHA256 hash stored initially');
    const r = handleAuthLogin(testPwdPath, 'oldstyle');
    assert(r.ok === true, 'SHA256 password login succeeds');
    const storedAfter = getPasswordHash(testPwdPath);
    assert(isBcryptHash(storedAfter) === true, 'hash migrated to bcrypt after login');
    assert(bcrypt.compareSync('oldstyle', storedAfter) === true, 'migrated bcrypt hash verifies original password');
  },
]);

// ─── 4. Cleanup ───

try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) {}

// ════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════

console.log('\n═══════════════════════════════════════');
console.log('  Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('═══════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
