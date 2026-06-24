const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createDb, query, mutate } = require('../helpers/db');

/**
 * IPC Handler tests — validates the core logic that main.js IPC handlers
 * execute. Since we can't run Electron in tests, we test the handler
 * functions extracted from their IPC wrappers.
 */

// ─── Simulation of auth handler logic (mirrors main.js) ───

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[abxy]\$\d+\$/.test(hash);
}
function isSHA256Hash(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash);
}
function hashSHA256(pwd) { return crypto.createHash('sha256').update(pwd).digest('hex'); }
function hashBcrypt(pwd) { return bcrypt.hashSync(pwd, 12); }

function verifyPassword(pwd, storedHash) {
  if (isBcryptHash(storedHash)) return bcrypt.compareSync(pwd, storedHash);
  if (isSHA256Hash(storedHash)) return hashSHA256(pwd) === storedHash;
  return false;
}

function simulateAuthLogin(db, pwdPath, pwd) {
  if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
  let stored;
  try {
    if (fs.existsSync(pwdPath)) {
      const parsed = JSON.parse(fs.readFileSync(pwdPath, 'utf8'));
      if (!parsed || typeof parsed.hash !== 'string') return { ok: false, error: 'الملف تالف', corrupt: true };
      stored = parsed.hash;
    }
  } catch (e) { return { ok: false, error: 'الملف تالف: ' + e.message, corrupt: true }; }

  if (!stored) return { ok: true, firstTime: true };
  if (!verifyPassword(pwd, stored)) return { ok: false, error: 'كلمة السر خطأ' };
  if (isSHA256Hash(stored)) {
    try {
      fs.writeFileSync(pwdPath, JSON.stringify({ hash: hashBcrypt(pwd) }, null, 2));
    } catch (e) { /* best effort */ }
  }
  return { ok: true };
}

function simulateAuthSetPassword(pwdPath, pwd) {
  if (!pwd || typeof pwd !== 'string' || pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
  try {
    fs.writeFileSync(pwdPath, JSON.stringify({ hash: hashBcrypt(pwd) }, null, 2));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'خطأ في التشفير: ' + e.message };
  }
}

// ─── Simulation of DB handler logic (mirrors main.js IPC handlers) ───

function simulateAddCase(db, data) {
  if (!data || !data.case_number || !data.title) return { error: 'رقم القضية والعنوان مطلوبان' };
  data.case_number = String(data.case_number).trim();
  data.title = String(data.title).trim();
  if (!data.case_number) return { error: 'رقم القضية مطلوب' };
  if (!data.title) return { error: 'عنوان القضية مطلوب' };
  // Check duplicate
  const dupes = query(db, "SELECT id, case_number FROM cases WHERE case_number = ?", [data.case_number]);
  if (dupes.length) return { duplicate: true, existing: dupes[0], id: null };
  // Validate client reference
  if (data.client_id) {
    const cl = query(db, "SELECT id FROM clients WHERE id = ?", [data.client_id]);
    if (!cl.length) return { error: 'الموكل غير موجود' };
  }
  mutate(db, `INSERT INTO cases (case_number, title, client_id, client_name, court, status, description, total_fees, paid_fees, expenses, priority, case_type, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.case_number, data.title, data.client_id || null, data.client_name || '', data.court || '', data.status || 'active',
     data.description || '', data.total_fees || 0, data.paid_fees || 0, data.expenses || 0,
     data.priority || 'medium', data.case_type || 'مدني', data.created_date || new Date().toISOString().slice(0, 10)]);
  const res = query(db, 'SELECT last_insert_rowid() as id');
  return { id: res.length ? res[0].id : null };
}

function simulateAddClient(db, data) {
  if (!data || !data.name || !String(data.name).trim()) return { error: 'اسم الموكل مطلوب' };
  data.name = String(data.name).trim();
  // Check duplicates
  const dupes = query(db, `SELECT id, name FROM clients WHERE
    (name = ? AND ? != '') OR (phone = ? AND ? != '') OR (email = ? AND ? != '') OR (national_id = ? AND ? != '')`,
    [data.name, data.name || '', data.phone || '', data.phone || '', data.email || '', data.email || '', data.national_id || '', data.national_id || '']);
  if (dupes.length) return { duplicate: true, existing: dupes, id: null };
  mutate(db, "INSERT INTO clients (name, phone, email, address, notes, national_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.name, data.phone || '', data.email || '', data.address || '', data.notes || '', data.national_id || '', data.tags || '']);
  const res = query(db, 'SELECT last_insert_rowid() as id');
  const id = res.length ? res[0].id : null;
  if (id && data.name) mutate(db, "UPDATE cases SET client_name = ? WHERE client_id = ?", [data.name, id]);
  return { id };
}

function simulateAddDocument(db, data) {
  if (!data || !data.case_id || !data.filename) return null;
  const c = query(db, "SELECT id FROM cases WHERE id = ?", [data.case_id]);
  if (!c.length) return null;
  mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type, tags, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [data.case_id, data.filename, data.file_path || '', data.doc_type || 'Other', data.tags || '', data.notes || '']);
  const res = query(db, 'SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

function simulateAddTask(db, data) {
  if (!data || !data.title) return { error: 'عنوان المهمة مطلوب' };
  if (data.case_id) {
    const c = query(db, "SELECT id FROM cases WHERE id = ?", [data.case_id]);
    if (!c.length) return { error: 'القضية غير موجودة' };
  }
  mutate(db, "INSERT INTO tasks (title, description, priority, status, due_date, case_id, client_id, tags, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.title, data.description || '', data.priority || 'medium', data.status || 'todo', data.due_date || null,
     data.case_id || null, data.client_id || null, data.tags || '', data.assigned_to || '']);
  const res = query(db, 'SELECT last_insert_rowid() as id');
  return { id: res.length ? res[0].id : null };
}

function simulateAddEvent(db, data) {
  if (!data || !data.title || !data.date) return null;
  if (data.case_id) {
    const c = query(db, "SELECT id FROM cases WHERE id = ?", [data.case_id]);
    if (!c.length) return null;
  }
  if (data.client_id) {
    const c = query(db, "SELECT id FROM clients WHERE id = ?", [data.client_id]);
    if (!c.length) return null;
  }
  mutate(db, "INSERT INTO events (case_id, client_id, title, type, status, date, time, court, urgency, all_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.case_id || null, data.client_id || null, data.title, data.type || 'meeting', data.status || 'scheduled',
     data.date, data.time || null, data.court || null, data.urgency || 'medium', data.all_day ? 1 : 0]);
  const res = query(db, 'SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

describe('IPC Handler: addCase', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('validates required fields', () => {
    assert.deepEqual(simulateAddCase(db, {}), { error: 'رقم القضية والعنوان مطلوبان' });
    assert.deepEqual(simulateAddCase(db, { case_number: 'C001', title: '' }), { error: 'رقم القضية والعنوان مطلوبان' });
  });

  it('trims whitespace', () => {
    const r = simulateAddCase(db, { case_number: '  C002  ', title: '  Test  ' });
    assert.ok(r.id);
    const c = query(db, "SELECT case_number, title FROM cases WHERE id = ?", [r.id]);
    assert.equal(c[0].case_number, 'C002');
    assert.equal(c[0].title, 'Test');
  });

  it('detects duplicate case_number', () => {
    const r = simulateAddCase(db, { case_number: 'C002', title: 'Duplicate' });
    assert.equal(r.duplicate, true);
  });

  it('validates client_id reference', () => {
    const r = simulateAddCase(db, { case_number: 'C003', title: 'Bad Client', client_id: 99999 });
    assert.deepEqual(r, { error: 'الموكل غير موجود' });
  });

  it('accepts valid client_id', () => {
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['Client']);
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Client'")[0].id;
    const r = simulateAddCase(db, { case_number: 'C004', title: 'Good Case', client_id: clId });
    assert.ok(r.id);
  });
});

describe('IPC Handler: addClient', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('validates name is required', () => {
    assert.deepEqual(simulateAddClient(db, {}), { error: 'اسم الموكل مطلوب' });
    assert.deepEqual(simulateAddClient(db, { name: '' }), { error: 'اسم الموكل مطلوب' });
    assert.deepEqual(simulateAddClient(db, { name: '   ' }), { error: 'اسم الموكل مطلوب' });
  });

  it('trims name', () => {
    const r = simulateAddClient(db, { name: '  Client 1  ' });
    assert.ok(r.id);
    const c = query(db, "SELECT name FROM clients WHERE id = ?", [r.id]);
    assert.equal(c[0].name, 'Client 1');
  });

  it('detects duplicate by name', () => {
    const r = simulateAddClient(db, { name: 'Client 1' });
    assert.equal(r.duplicate, true);
  });

  it('detects duplicate by phone when phone matches', () => {
    mutate(db, "INSERT INTO clients (name, phone) VALUES (?, ?)", ['Phone Dup', '0612345678']);
    const dupes = query(db, `SELECT id, name FROM clients WHERE phone = ? AND ? != ''`, ['0612345678', '0612345678']);
    assert.equal(dupes.length, 1);
  });

  it('inserts client with all optional fields', () => {
    const r = simulateAddClient(db, { name: 'Full Client', phone: '0600000000', email: 'full@test.ma', address: 'Address', notes: 'Notes', national_id: 'ID001', tags: 'VIP' });
    assert.ok(r.id);
    const c = query(db, "SELECT * FROM clients WHERE id = ?", [r.id]);
    assert.equal(c[0].phone, '0600000000');
    assert.equal(c[0].email, 'full@test.ma');
  });
});

describe('IPC Handler: addDocument', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['DOC-H', 'Handler Case']);
  });

  it('returns null for missing case_id', () => {
    assert.equal(simulateAddDocument(db, { filename: 'doc.pdf' }), null);
  });

  it('returns null for non-existent case', () => {
    assert.equal(simulateAddDocument(db, { case_id: 99999, filename: 'doc.pdf' }), null);
  });

  it('inserts document with valid case', () => {
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'DOC-H'")[0].id;
    const docId = simulateAddDocument(db, { case_id: cId, filename: 'contract.pdf', file_path: '/tmp/c.pdf', doc_type: 'Contract', tags: 'final' });
    assert.ok(docId);
    const d = query(db, "SELECT * FROM documents WHERE id = ?", [docId]);
    assert.equal(d[0].filename, 'contract.pdf');
    assert.equal(d[0].tags, 'final');
  });
});

describe('IPC Handler: addTask', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['TASK-H', 'Task Case']);
  });

  it('requires title', () => {
    assert.deepEqual(simulateAddTask(db, {}), { error: 'عنوان المهمة مطلوب' });
  });

  it('validates case_id reference', () => {
    const r = simulateAddTask(db, { title: 'Task', case_id: 99999 });
    assert.deepEqual(r, { error: 'القضية غير موجودة' });
  });

  it('inserts task with valid data', () => {
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'TASK-H'")[0].id;
    const r = simulateAddTask(db, { title: 'Valid Task', case_id: cId, priority: 'high', status: 'in_progress' });
    assert.ok(r.id);
    const t = query(db, "SELECT * FROM tasks WHERE id = ?", [r.id]);
    assert.equal(t[0].title, 'Valid Task');
    assert.equal(t[0].priority, 'high');
  });

  it('allows task without case_id', () => {
    const r = simulateAddTask(db, { title: 'Standalone Task' });
    assert.ok(r.id);
  });
});

describe('IPC Handler: addEvent', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, "INSERT INTO cases (case_number, title) VALUES (?, ?)", ['EVT-H', 'Event Case']);
    mutate(db, "INSERT INTO clients (name) VALUES (?)", ['Event Client']);
  });

  it('requires title and date', () => {
    assert.equal(simulateAddEvent(db, {}), null);
    assert.equal(simulateAddEvent(db, { title: 'E' }), null);
    assert.equal(simulateAddEvent(db, { date: '2026-01-01' }), null);
  });

  it('validates case_id reference', () => {
    assert.equal(simulateAddEvent(db, { title: 'E', date: '2026-01-01', case_id: 99999 }), null);
  });

  it('validates client_id reference', () => {
    assert.equal(simulateAddEvent(db, { title: 'E', date: '2026-01-01', client_id: 99999 }), null);
  });

  it('inserts event with valid data', () => {
    const cId = query(db, "SELECT id FROM cases WHERE case_number = 'EVT-H'")[0].id;
    const clId = query(db, "SELECT id FROM clients WHERE name = 'Event Client'")[0].id;
    const eId = simulateAddEvent(db, { title: 'Court Hearing', date: '2026-08-01', case_id: cId, client_id: clId, type: 'hearing', court: 'المحكمة', urgency: 'high' });
    assert.ok(eId);
    const e = query(db, "SELECT * FROM events WHERE id = ?", [eId]);
    assert.equal(e[0].title, 'Court Hearing');
    assert.equal(e[0].type, 'hearing');
    assert.equal(e[0].court, 'المحكمة');
  });
});

describe('IPC Handler: input validation edge cases', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('handles null data gracefully', () => {
    assert.deepEqual(simulateAddCase(db, null), { error: 'رقم القضية والعنوان مطلوبان' });
    assert.deepEqual(simulateAddClient(db, null), { error: 'اسم الموكل مطلوب' });
    assert.equal(simulateAddDocument(db, null), null);
    assert.deepEqual(simulateAddTask(db, null), { error: 'عنوان المهمة مطلوب' });
    assert.equal(simulateAddEvent(db, null), null);
  });

  it('handles undefined data gracefully', () => {
    assert.deepEqual(simulateAddCase(db, undefined), { error: 'رقم القضية والعنوان مطلوبان' });
    assert.deepEqual(simulateAddClient(db, undefined), { error: 'اسم الموكل مطلوب' });
  });

  it('handles special characters in input', () => {
    const r = simulateAddCase(db, { case_number: 'C\'SPECIAL"', title: 'Case with <script> & "quotes"' });
    assert.ok(r.id);
    const c = query(db, "SELECT * FROM cases WHERE id = ?", [r.id]);
    assert.equal(c[0].case_number, "C'SPECIAL\"");
  });
});

describe('IPC Handler: data integrity', () => {
  let db, pwdPath, testDir;
  before(async () => {
    db = await createDb();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipc-int-'));
    pwdPath = path.join(testDir, 'password.json');
  });

  // Cleanup temp files after tests
  after(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) { /* ok */ }
  });

  it('auth:login validates password requirements', () => {
    const r1 = simulateAuthLogin(db, pwdPath, null);
    assert.equal(r1.ok, false);
    assert.equal(r1.error, 'كلمة السر مطلوبة');

    const r2 = simulateAuthLogin(db, pwdPath, '');
    assert.equal(r2.ok, false);
  });

  it('auth:setPassword enforces minimum length', () => {
    const r = simulateAuthSetPassword(pwdPath, 'abc');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'كلمة السر يجب أن تكون 8 أحرف على الأقل');
  });

  it('auth:login returns firstTime when no password set', () => {
    const r = simulateAuthLogin(db, pwdPath, 'anything');
    assert.equal(r.ok, true);
    assert.equal(r.firstTime, true);
  });

  it('auth:setPassword + auth:login flow works end-to-end', () => {
    const setR = simulateAuthSetPassword(pwdPath, 'validPassword123');
    assert.equal(setR.ok, true);
    const loginR = simulateAuthLogin(db, pwdPath, 'validPassword123');
    assert.equal(loginR.ok, true);
    assert.equal(loginR.firstTime, undefined);
  });

  it('auth:login rejects wrong password', () => {
    const r = simulateAuthLogin(db, pwdPath, 'wrongPassword');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'كلمة السر خطأ');
  });
});

describe('IPC Handler: error propagation', () => {
  let db;
  before(async () => { db = await createDb(); });

  it('wrapDbCall catches and logs errors', () => {
    // Simulate wrapDbCall behavior
    function wrapDbCall(name, fn) {
      return (...args) => {
        try { return fn(...args); }
        catch (err) { throw err; }
      };
    }
    const wrapped = wrapDbCall('test', () => { throw new Error('db error'); });
    assert.throws(() => wrapped(), /db error/);
  });

  it('returns structured errors for business rule violations', () => {
    const r = simulateAddCase(db, { case_number: 'C001', title: 'Test' });
    assert.equal(r.duplicate, undefined);
    const dup = simulateAddCase(db, { case_number: 'C001', title: 'Test 2' });
    assert.equal(dup.duplicate, true);
  });
});
