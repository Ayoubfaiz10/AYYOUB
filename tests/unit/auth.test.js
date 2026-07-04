const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = 12;
const MASTER_KEY = 'test-master-key-for-testing';

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

function signToken(userId, expiryMs) {
  const jti = crypto.randomBytes(8).toString('hex');
  const payload = jti + ':' + userId + ':' + expiryMs;
  const hmac = crypto.createHmac('sha256', MASTER_KEY).update(payload).digest('hex');
  return payload + ':' + hmac;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split(':');
  if (parts.length < 4) return null;
  const payload = parts.slice(0, -1).join(':');
  const sig = parts[parts.length - 1];
  const expected = crypto.createHmac('sha256', MASTER_KEY).update(payload).digest('hex');
  if (sig !== expected) return null;
  const userId = parseInt(parts[1], 10);
  const expiry = parseInt(parts[2], 10);
  if (isNaN(userId) || isNaN(expiry) || Date.now() > expiry) return null;
  return userId;
}

// ───── Token Test Helpers ─────

const ROLE_ACCESS = {
  admin: [
    'dashboard',
    'search',
    'notifications',
    'clients',
    'cases',
    'hearings',
    'documents',
    'calendar',
    'tasks',
    'expenses',
    'reports',
    'ai',
    'archive',
    'support',
    'settings'
  ],
  senior_lawyer: [
    'dashboard',
    'search',
    'notifications',
    'clients',
    'cases',
    'hearings',
    'documents',
    'calendar',
    'tasks',
    'expenses',
    'reports',
    'ai',
    'archive',
    'support'
  ],
  junior_lawyer: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'ai', 'support'],
  assistant: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'support'],
  intern: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'tasks', 'support'],
  external: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'support']
};

function canAccess(role, sectionId) {
  var allowed = ROLE_ACCESS[role] || ROLE_ACCESS.admin;
  return allowed.indexOf(sectionId) !== -1;
}

// ───── SHA256 ─────

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

// ───── Token System ─────

describe('Session Token (signToken / verifyToken)', () => {
  it('signs and verifies a valid token', () => {
    const expiry = Date.now() + 3600000;
    const token = signToken(1, expiry);
    const userId = verifyToken(token);
    assert.equal(userId, 1);
  });

  it('rejects token with tampered payload', () => {
    const expiry = Date.now() + 3600000;
    const token = signToken(1, expiry);
    const parts = token.split(':');
    parts[0] = '2';
    const tampered = parts.join(':');
    assert.equal(verifyToken(tampered), null);
  });

  it('rejects expired token', () => {
    const token = signToken(1, Date.now() - 1000);
    assert.equal(verifyToken(token), null);
  });

  it('rejects null token', () => assert.equal(verifyToken(null), null));
  it('rejects undefined token', () => assert.equal(verifyToken(undefined), null));
  it('rejects empty token', () => assert.equal(verifyToken(''), null));
  it('rejects malformed token', () => assert.equal(verifyToken('abc'), null));
  it('rejects token with non-numeric expiry', () => {
    const token = '1:abc:' + crypto.createHmac('sha256', MASTER_KEY).update('1:abc').digest('hex');
    assert.equal(verifyToken(token), null);
  });
});

// ───── Role-Based Access ─────

describe('Role-Based Navigation Access', () => {
  it('admin can access settings', () => assert.equal(canAccess('admin', 'settings'), true));
  it('senior_lawyer cannot access settings', () => assert.equal(canAccess('senior_lawyer', 'settings'), false));
  it('junior_lawyer cannot access reports', () => assert.equal(canAccess('junior_lawyer', 'reports'), false));
  it('assistant cannot access ai', () => assert.equal(canAccess('assistant', 'ai'), false));
  it('intern cannot access calendar', () => assert.equal(canAccess('intern', 'calendar'), false));
  it('external cannot access tasks', () => assert.equal(canAccess('external', 'tasks'), false));
  it('all roles can access dashboard', () => {
    const roles = ['admin', 'senior_lawyer', 'junior_lawyer', 'assistant', 'intern', 'external'];
    roles.forEach(r => assert.equal(canAccess(r, 'dashboard'), true));
  });
  it('admin can access all sections', () => {
    const sections = [
      'dashboard',
      'search',
      'notifications',
      'clients',
      'cases',
      'hearings',
      'documents',
      'calendar',
      'tasks',
      'expenses',
      'reports',
      'ai',
      'archive',
      'support',
      'settings'
    ];
    sections.forEach(s => assert.equal(canAccess('admin', s), true));
  });
  it('unknown role falls back to admin access', () => assert.equal(canAccess('unknown_role', 'settings'), true));
});
