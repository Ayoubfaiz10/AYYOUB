const initSqlJs = require('sql.js');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

const USER_DATA = app.getPath('userData');
const DB_PATH = path.join(USER_DATA, 'lawyer.db');
const STORAGE_DIR = path.join(USER_DATA, 'storage', 'affaires');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
const BACKUP_DIR = path.join(USER_DATA, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let db = null;
let SQL = null;
let _lastAutoBackup = 0;
let _encryptionKey = null;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
const DB_ENC_MAGIC = Buffer.from('LAWYER_DB_ENC', 'utf8');
const DB_ENC_ALGO = 'aes-256-gcm';

function setEncryptionKey(key) {
  _encryptionKey = key;
}

function encryptDbBuffer(buffer) {
  if (!_encryptionKey) return buffer;
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.scryptSync(_encryptionKey, salt, 32);
  const cipher = crypto.createCipheriv(DB_ENC_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([DB_ENC_MAGIC, salt, iv, authTag, encrypted]);
}

function decryptDbBuffer(buffer) {
  if (!_encryptionKey) return buffer;
  if (!buffer.slice(0, DB_ENC_MAGIC.length).equals(DB_ENC_MAGIC)) return buffer;
  let offset = DB_ENC_MAGIC.length;
  const salt = buffer.slice(offset, offset + 32);
  offset += 32;
  const iv = buffer.slice(offset, offset + 16);
  offset += 16;
  const authTag = buffer.slice(offset, offset + 16);
  offset += 16;
  const encrypted = buffer.slice(offset);
  const key = crypto.scryptSync(_encryptionKey, salt, 32);
  const decipher = crypto.createDecipheriv(DB_ENC_ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function safeAlter(sql) {
  try { db.run(sql); }
  catch (e) {
    if (!/duplicate column name/i.test(e.message)) {
      console.error('Migration error:', sql, e.message);
    }
  }
}

async function initDb() {
  SQL = await initSqlJs({
    locateFile: file => path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file)
  });

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = decryptDbBuffer(fs.readFileSync(DB_PATH));
      db = new SQL.Database(fileBuffer);
      db.exec('SELECT count(*) FROM sqlite_master');
    } catch (e) {
      console.error('DB corrupted, attempting auto-restore from backup:', e.message);
      try {
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter(f => f.endsWith('.db'))
          .filter(f => isManualBackup(f) || isAutoBackup(f) || f.startsWith('auto_backup_'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        if (!files.length) throw new Error('No backup files found');
        const buf = decryptDbBuffer(fs.readFileSync(path.join(BACKUP_DIR, files[0].name)));
        db = new SQL.Database(buf);
        db.exec('SELECT count(*) FROM sqlite_master');
        console.log('Auto-restored from:', files[0].name);
      } catch (re) {
        console.error('Auto-restore failed, creating fresh DB:', re.message);
        db = new SQL.Database();
      }
    }
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run(
    "CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, notes TEXT, national_id TEXT, tags TEXT, status TEXT DEFAULT 'active')"
  );
  safeAlter('ALTER TABLE clients ADD COLUMN national_id TEXT');
  safeAlter('ALTER TABLE clients ADD COLUMN tags TEXT');
  safeAlter('ALTER TABLE clients ADD COLUMN created_at TEXT');
  safeAlter("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active'");
  safeAlter("ALTER TABLE clients ADD COLUMN archived INTEGER DEFAULT 0");
  db.run(
    "CREATE TABLE IF NOT EXISTS cases (id INTEGER PRIMARY KEY AUTOINCREMENT, case_number TEXT NOT NULL, title TEXT NOT NULL, client_name TEXT, client_id INTEGER, court TEXT, status TEXT DEFAULT 'active', description TEXT, created_date TEXT DEFAULT (date('now')), next_hearing TEXT, deadline_date TEXT, total_fees REAL DEFAULT 0, paid_fees REAL DEFAULT 0, expenses REAL DEFAULT 0, priority TEXT DEFAULT 'medium', case_type TEXT DEFAULT 'مدني', notes TEXT, archived INTEGER DEFAULT 0, honoraires_totaux REAL DEFAULT 0, access_level TEXT DEFAULT 'team', FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL)"
  );

  safeAlter("ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'medium'");
  safeAlter("ALTER TABLE cases ADD COLUMN case_type TEXT DEFAULT 'مدني'");
  safeAlter('ALTER TABLE cases ADD COLUMN notes TEXT');
  safeAlter('ALTER TABLE cases ADD COLUMN archived INTEGER DEFAULT 0');
  safeAlter('ALTER TABLE cases ADD COLUMN honoraires_totaux REAL DEFAULT 0');
  safeAlter("ALTER TABLE cases ADD COLUMN access_level TEXT DEFAULT 'team'");
  safeAlter('ALTER TABLE cases ADD COLUMN deadline_date TEXT');
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    description TEXT DEFAULT '', priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo', due_date TEXT, notes TEXT,
    case_id INTEGER, client_id INTEGER,
    tags TEXT DEFAULT '', assigned_to TEXT DEFAULT '',
    attachments TEXT DEFAULT '[]',
    parent_id INTEGER, depends_on TEXT DEFAULT '[]',
    progress INTEGER DEFAULT 0, time_tracked INTEGER DEFAULT 0,
    workflow_id INTEGER, template_id INTEGER,
    archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL,
    title TEXT NOT NULL, done INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL,
    author TEXT DEFAULT 'المحامي', text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT DEFAULT '', case_type TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT, workflow_id INTEGER NOT NULL,
    title TEXT NOT NULL, step_order INTEGER DEFAULT 0,
    due_days INTEGER DEFAULT 0, assigned_role TEXT DEFAULT '',
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT DEFAULT '', tasks_json TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(
    'CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, date TEXT, time TEXT, location TEXT, notes TEXT, case_id INTEGER, FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL)'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, filename TEXT NOT NULL, file_path TEXT NOT NULL, doc_type TEXT NOT NULL, tags TEXT DEFAULT '', notes TEXT DEFAULT '', file_size TEXT DEFAULT '', upload_date TEXT DEFAULT (datetime('now', 'localtime')), visibility TEXT DEFAULT 'case', FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE)"
  );
  safeAlter("ALTER TABLE documents ADD COLUMN tags TEXT DEFAULT ''");
  safeAlter("ALTER TABLE documents ADD COLUMN notes TEXT DEFAULT ''");
  safeAlter("ALTER TABLE documents ADD COLUMN file_size TEXT DEFAULT ''");
  safeAlter("ALTER TABLE documents ADD COLUMN visibility TEXT DEFAULT 'case'");
  safeAlter("ALTER TABLE documents ADD COLUMN ai_analysis TEXT DEFAULT ''");
  db.run(
    "CREATE TABLE IF NOT EXISTS procedures (id INTEGER PRIMARY KEY AUTOINCREMENT, affaire_id INTEGER NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, description TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (affaire_id) REFERENCES cases(id) ON DELETE CASCADE)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS paiements (id INTEGER PRIMARY KEY AUTOINCREMENT, affaire_id INTEGER NOT NULL, date TEXT NOT NULL, montant REAL NOT NULL, mode_paiement TEXT NOT NULL, remarque TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (affaire_id) REFERENCES cases(id) ON DELETE CASCADE)"
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS alert_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, days_before_1 INTEGER DEFAULT 7, days_before_2 INTEGER DEFAULT 3, days_before_3 INTEGER DEFAULT 1, enabled INTEGER DEFAULT 1)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS backup_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, auto_enabled INTEGER DEFAULT 1, frequency_hours INTEGER DEFAULT 24, keep_count INTEGER DEFAULT 30, last_backup_at TEXT)'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS document_text (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER UNIQUE NOT NULL, extracted_text TEXT, indexed_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS jugements (id INTEGER PRIMARY KEY AUTOINCREMENT, case_number TEXT, sujet TEXT NOT NULL, cour TEXT, annee INTEGER, mots_cles TEXT, contenu TEXT NOT NULL, date_jugement TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')))"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS communications (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, case_id INTEGER, type TEXT NOT NULL, date TEXT NOT NULL, summary TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL, FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL)"
  );
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'admin',
    avatar TEXT DEFAULT '', active INTEGER DEFAULT 1,
    last_login TEXT, created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active) VALUES (1, 'المحامي المدير', 'admin@cabinet.ma', '!disabled-' || hex(randomblob(16)), 'admin', 1)`
  );
  safeAlter('ALTER TABLE users ADD COLUMN last_login TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN phone TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN bar_number TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN city TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN specialties TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN experience_years INTEGER DEFAULT 0');
  db.run('CREATE TABLE IF NOT EXISTS office_settings (key TEXT PRIMARY KEY, value TEXT)');
  db.run(`CREATE TABLE IF NOT EXISTS security_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, question_index)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL,
    permission TEXT NOT NULL, allowed INTEGER DEFAULT 1,
    UNIQUE(role, permission)
  )`);
  const defaultPerms = {
    admin: [
      'view_case',
      'edit_case',
      'delete_case',
      'upload_doc',
      'delete_document',
      'view_finance',
      'manage_tasks',
      'use_ai',
      'export_data',
      'manage_users',
      'view_audit'
    ],
    senior_lawyer: ['view_case', 'edit_case', 'delete_case', 'upload_doc', 'delete_document', 'view_finance', 'manage_tasks', 'use_ai', 'export_data'],
    junior_lawyer: ['view_case', 'edit_case', 'upload_doc', 'delete_document', 'manage_tasks', 'use_ai'],
    assistant: ['view_case', 'upload_doc', 'delete_document', 'manage_tasks', 'view_calendar'],
    intern: ['view_case'],
    external: ['view_case']
  };
  for (const [role, perms] of Object.entries(defaultPerms)) {
    perms.forEach(p => {
      try {
        db.run('INSERT OR IGNORE INTO permissions (role, permission, allowed) VALUES (?, ?, 1)', [role, p]);
      } catch (e) {}
    });
  }
  db.run(`CREATE TABLE IF NOT EXISTS case_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL,
    user_id INTEGER, role TEXT DEFAULT '',
    access_level TEXT DEFAULT 'team',
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  )`);

  db.run(
    "CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER DEFAULT 0, user_name TEXT DEFAULT '', action TEXT NOT NULL, details TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')))"
  );
  safeAlter('ALTER TABLE activity_log ADD COLUMN user_id INTEGER DEFAULT 0');
  safeAlter("ALTER TABLE activity_log ADD COLUMN user_name TEXT DEFAULT ''");
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER, client_id INTEGER,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'meeting',
    status TEXT NOT NULL DEFAULT 'scheduled',
    date TEXT NOT NULL, time TEXT, end_time TEXT,
    court TEXT, judge TEXT, room TEXT,
    notes TEXT, outcome TEXT,
    urgency TEXT DEFAULT 'medium',
    recurring_type TEXT DEFAULT 'none',
    recurring_end_date TEXT,
    all_day INTEGER DEFAULT 0,
    alert_sent_7d INTEGER DEFAULT 0,
    alert_sent_3d INTEGER DEFAULT 0,
    alert_sent_1d INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
  )`);

  db.run(
    "CREATE TABLE IF NOT EXISTS sent_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, sent_at TEXT DEFAULT (datetime('now', 'localtime')))"
  );
  db.run("CREATE TABLE IF NOT EXISTS revoked_tokens (jti TEXT PRIMARY KEY, expiry INTEGER NOT NULL)");
  db.run('CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expiry ON revoked_tokens(expiry)');
  db.run('INSERT OR IGNORE INTO alert_settings (id, days_before_1, days_before_2, days_before_3, enabled) VALUES (1, 7, 3, 1, 1)');
  db.run('INSERT OR IGNORE INTO backup_settings (id, auto_enabled, frequency_hours, keep_count, last_backup_at) VALUES (1, 1, 24, 36, NULL)');

  db.run('CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_cases_created_date ON cases(created_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id)');
  try {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_case_number_unique ON cases(case_number)');
  } catch (e) {
    console.warn('تعذر إنشاء الفهرس الفريد لرقم القضية:', e.message);
  }
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(case_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_events_case ON events(case_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at)');

  // Migration: fix honoraires_totaux corrupted by the addPaiement bug
  // (honoraires_totaux was being incremented by each payment instead of
  //  storing the total agreed fee). Reset to total_fees where inflation
  //  is detected (honoraires_totaux == paid_fees with both > 0).
  try {
    const corrupted = query('SELECT id FROM cases WHERE honoraires_totaux > 0 AND paid_fees > 0 AND ABS(honoraires_totaux - paid_fees) < 0.01');
    if (corrupted.length) {
      db.run(
        'UPDATE cases SET honoraires_totaux = COALESCE(NULLIF(total_fees, 0), honoraires_totaux) WHERE honoraires_totaux > 0 AND paid_fees > 0 AND ABS(honoraires_totaux - paid_fees) < 0.01'
      );
      console.log('Migrated honoraires_totaux for', corrupted.length, 'corrupted cases');
    }
  } catch (e) {
    console.error('honoraires_totaux migration error:', e.message);
  }

  db.run('CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts4(case_id, title, content, tags)');

  db.create_function('search_rank', function (matchinfoBlob) {
    try {
      const buf = new Uint32Array(matchinfoBlob);
      if (buf.length < 14) return 0;
      const nPhrase = buf[0],
        nCol = buf[1];
      let score = 0;
      for (let p = 0; p < nPhrase; p++) {
        for (let c = 0; c < nCol; c++) {
          const idx = 2 + (p * nCol + c) * 3;
          if (idx + 2 < buf.length) {
            const thisRow = buf[idx];
            const docs = buf[idx + 2];
            if (thisRow > 0) {
              const colWeight = c === 1 ? 3 : c === 3 ? 2 : c === 2 ? 1 : 0.5;
              score += thisRow * colWeight * (1 + Math.log(1 + (docs > 0 ? 10 / docs : 1)));
            }
          }
        }
      }
      return Math.round(score * 100);
    } catch (e) {
      return 0;
    }
  });

  await saveDb();
  try {
    db.run("DELETE FROM activity_log WHERE created_at < datetime('now', '-90 days')");
  } catch (e) {
    /* ignore */
  }
}

function safeJson(val, def) {
  if (!val) return def || '[]';
  try {
    JSON.parse(val);
    return val;
  } catch {
    return def || '[]';
  }
}

/* ─── Async write queue: serializes saves without blocking ─── */
let _dbWriteQueue = Promise.resolve();
let _savePending = false;

function queueSave() {
  if (_savePending) return _dbWriteQueue;
  _savePending = true;
  _dbWriteQueue = _dbWriteQueue.then(
    () => {
      _savePending = false;
      const err = saveDbSync();
      if (err) throw new Error('DB write failed: ' + err.message);
    },
    () => {
      _savePending = false;
    }
  );
  return _dbWriteQueue;
}

function flushWrites() {
  return _dbWriteQueue;
}

/* ─── Synchronous save: guarantees durability after every mutation ─── */
function saveDbSync() {
  if (!db) return;
  try {
    if (fs.existsSync(DB_PATH) && Date.now() - _lastAutoBackup > BACKUP_INTERVAL_MS) {
      _lastAutoBackup = Date.now();
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const ts =
        now.getFullYear() +
        '-' +
        pad(now.getMonth() + 1) +
        '-' +
        pad(now.getDate()) +
        '_' +
        pad(now.getHours()) +
        '-' +
        pad(now.getMinutes()) +
        '-' +
        pad(now.getSeconds());
      const backupPath = path.join(BACKUP_DIR, 'auto_backup_' + ts + '.db');
      try {
        fs.copyFileSync(DB_PATH, backupPath);
      } catch (e) {
        /* best effort on first write */
      }
      try {
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith('auto_backup_') && f.endsWith('.db'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 5) {
          for (const f of files.slice(5)) {
            try {
              fs.unlinkSync(path.join(BACKUP_DIR, f.name));
            } catch (e) {
              /* best effort */
            }
          }
        }
      } catch (e) {
        console.error('Rotating backup error:', e.message);
      }
    }
    const data = db.export();
    const buffer = encryptDbBuffer(Buffer.from(data));
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    try {
      if (fs.existsSync(DB_PATH + '.tmp')) fs.unlinkSync(DB_PATH + '.tmp');
    } catch {}
    console.error('DB sync save error:', err);
    return err;
  }
}

/* ─── Tradeoff: saveDbSync writes to disk synchronously after every mutation.
     This guarantees durability at the cost of ~5-20ms per write.
     For a single-user desktop app this is negligible; the benefit —
     zero data loss on crash — is far more important. ─── */

async function saveDb() {
  try {
    if (!db) return;
    saveDbSync();
  } catch (err) {
    console.error('DB save error:', err);
  }
}

function query(sql, params) {
  try {
    if (params) {
      const stmt = db.prepare(sql);
      stmt.bind(params.map(v => (v === undefined ? null : v)));
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }

    const result = db.exec(sql);
    if (!result || result.length === 0) return [];

    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (err) {
    console.error('SQL Query Error:', err, process.env.NODE_ENV !== 'production' ? 'SQL: ' + sql : '');
    return [];
  }
}

let _txCounter = 0;

function mutate(sql, params) {
  db.run(sql, params ? params.map(v => (v === undefined ? null : v)) : []);
  if (!_txCounter) return queueSave();
}

function transaction(fn) {
  try {
    db.run('BEGIN TRANSACTION');
    _txCounter++;
    const result = fn();
    _txCounter--;
    if (!_txCounter) {
      db.run('COMMIT');
      return queueSave();
    }
    return result;
  } catch (err) {
    _txCounter = 0;
    try {
      db.run('ROLLBACK');
    } catch (e) {
      /* ignore rollback error */
    }
    console.error('Transaction Error:', err);
    throw err;
  }
}

function syncSearchIndex(caseId) {
  if (caseId == null || typeof caseId !== 'number') return;
  try {
    db.run('DELETE FROM search_index WHERE case_id = ?', [String(caseId)]);
    const rows = query('SELECT * FROM cases WHERE id = ?', [caseId]);
    if (!rows.length) return;
    const c = rows[0];
    const docs = query(
      `SELECT d.filename, d.doc_type, d.tags, d.notes, dt.extracted_text FROM documents d LEFT JOIN document_text dt ON d.id = dt.document_id WHERE d.case_id = ?`,
      [caseId]
    );
    const docText = docs.map(d => [d.filename, d.doc_type, d.tags, d.notes, d.extracted_text].filter(Boolean).join(' ')).join(' ');
    const content = [c.case_number, c.title, c.description, c.court, c.client_name, c.notes, docText].filter(Boolean).join(' ');
    db.run('INSERT INTO search_index (case_id, title, content, tags) VALUES (?, ?, ?, ?)', [String(caseId), c.title || '', content || '', c.tags || '']);
  } catch (e) {
    console.error('syncSearchIndex error for case', caseId, ':', e.message);
  }
}

function rebuildSearchIndex() {
  try {
    db.run('DELETE FROM search_index');
    const cases = query('SELECT id FROM cases WHERE archived = 0 OR archived IS NULL');
    cases.forEach(c => syncSearchIndex(c.id));
    console.log('Rebuilt search index for', cases.length, 'cases');
  } catch (e) {
    console.error('rebuildSearchIndex error:', e.message);
  }
}

function getAllCases(includeArchived = false, userId = null, userRole = null) {
  let sql = 'SELECT cases.id, cases.case_number, cases.title, cases.court, cases.status, cases.description, cases.created_date, cases.next_hearing, cases.client_id, cases.total_fees, cases.paid_fees, cases.expenses, cases.archived, COALESCE(clients.name, cases.client_name) as client_name FROM cases LEFT JOIN clients ON cases.client_id = clients.id';
  const params = [];
  const conditions = [];

  if (!includeArchived) conditions.push("(cases.archived = 0 OR cases.archived IS NULL)");

  if (userId && userRole && !['admin', 'senior_lawyer'].includes(userRole)) {
    conditions.push("(cases.access_level = 'team' OR cases.id IN (SELECT case_id FROM case_permissions WHERE user_id = ?))");
    params.push(userId);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY cases.created_date DESC';
  return query(sql, params);
}

function addCase(data) {
  if (!data.case_number || !data.title) return { error: 'رقم القضية والعنوان مطلوبان' };
  data.case_number = String(data.case_number).trim();
  data.title = String(data.title).trim();
  if (!data.case_number) return { error: 'رقم القضية مطلوب' };
  if (!data.title) return { error: 'عنوان القضية مطلوب' };
  const dup = findDuplicateCase(data.case_number);
  if (dup.duplicate) return { duplicate: true, archived: dup.archived, existing: dup.existing, id: null };
  if (data.client_id && !validateRef('clients', data.client_id)) return { error: 'الموكل غير موجود' };
  mutate(
    'INSERT INTO cases (case_number, title, client_id, client_name, court, status, description, next_hearing, total_fees, paid_fees, expenses, deadline_date, honoraires_totaux, priority, case_type, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.case_number,
      data.title,
      data.client_id,
      data.client_name || '',
      data.court,
      data.status,
      data.description,
      data.next_hearing,
      data.total_fees,
      data.paid_fees,
      data.expenses,
      data.deadline_date,
      data.total_fees || 0,
      data.priority || 'medium',
      data.case_type || 'مدني',
      data.created_date || new Date().toISOString().slice(0, 10)
    ]
  );
  const res = query('SELECT last_insert_rowid() as id');
  const id = res.length ? res[0].id : null;
  if (id) syncSearchIndex(id);
  return { id };
}

function deleteCase(id) {
  if (!id || typeof id !== 'number') return;
  transaction(() => {
    mutate('DELETE FROM tasks WHERE case_id = ?', [id]);
    mutate('DELETE FROM events WHERE case_id = ?', [id]);
    mutate('DELETE FROM communications WHERE case_id = ?', [id]);
    mutate('DELETE FROM appointments WHERE case_id = ?', [id]);
    mutate('DELETE FROM search_index WHERE case_id = ?', [String(id)]);
    mutate('DELETE FROM cases WHERE id = ?', [id]);
  });
}

function archiveCase(id) {
  mutate('UPDATE cases SET archived = 1 WHERE id = ?', [id]);
}
function unarchiveCase(id) {
  mutate('UPDATE cases SET archived = 0 WHERE id = ?', [id]);
}
function archiveClient(id) {
  mutate('UPDATE clients SET archived = 1 WHERE id = ?', [id]);
}
function unarchiveClient(id) {
  mutate('UPDATE clients SET archived = 0 WHERE id = ?', [id]);
}

function getArchivedCases() {
  return query("SELECT cases.id, cases.case_number, cases.title, cases.court, cases.status, cases.description, cases.created_date, cases.next_hearing, cases.client_id, cases.total_fees, cases.paid_fees, cases.expenses, cases.archived, COALESCE(clients.name, cases.client_name) as client_name FROM cases LEFT JOIN clients ON cases.client_id = clients.id WHERE cases.archived = 1 ORDER BY cases.created_date DESC");
}

function autoArchive() {
  mutate("UPDATE cases SET archived = 1 WHERE status = 'closed' AND (archived = 0 OR archived IS NULL) AND created_date < date('now', '-90 days')");
  return db.getRowsModified();
}

function getCasesByClient(clientId) {
  const cases = query(
    `
    SELECT c.*, 
      (SELECT COUNT(*) FROM procedures p WHERE p.affaire_id = c.id) as procedure_count,
      (SELECT MIN(p.date) FROM procedures p WHERE p.affaire_id = c.id AND p.date >= date('now')) as next_procedure_date,
      (SELECT MIN(p.date) FROM procedures p WHERE p.affaire_id = c.id AND p.date >= date('now')) as next_hearing_date
    FROM cases c WHERE c.client_id = ? AND c.status != 'closed'
    ORDER BY c.created_date DESC
  `,
    [clientId]
  );
  return cases.map(c => ({
    ...c,
    remaining: (parseFloat(c.honoraires_totaux || c.total_fees || 0) - parseFloat(c.paid_fees || 0)).toFixed(2)
  }));
}

function getAllClients() {
  const clients = query('SELECT * FROM clients ORDER BY name ASC');
  return clients.map(c => {
    const cases = query('SELECT COUNT(*) as cnt, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(total_fees),0) as fees FROM cases WHERE client_id = ?', [
      c.id
    ]);
    const logs = query('SELECT created_at FROM activity_log WHERE details LIKE ? ORDER BY created_at DESC LIMIT 1', ['%@' + c.id + '%']);
    return {
      ...c,
      _caseCount: cases[0]?.cnt || 0,
      _balance: (cases[0]?.fees || 0) - (cases[0]?.paid || 0),
      _lastActivity: logs[0]?.created_at?.slice(0, 10) || ''
    };
  });
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\+\(\)\.]/g, '');
}

function findDuplicateClient(data) {
  const nName = (data.name || '').trim();
  const nPhone = normalizePhone(data.phone);
  const nEmail = (data.email || '').trim();
  const nNid = (data.national_id || '').trim();
  const rows = query(
    `SELECT id, name, phone FROM clients WHERE (LOWER(TRIM(name)) = LOWER(TRIM(?)) AND ? != '') OR (REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '+', ''), '-', ''), '(', '') = ? AND ? != '') OR (LOWER(TRIM(email)) = LOWER(TRIM(?)) AND ? != '') OR (TRIM(national_id) = ? AND ? != '')`,
    [nName, nName, nPhone, nPhone, nEmail, nEmail, nNid, nNid]
  );
  if (rows.length) return { duplicate: true, existing: rows };
  return { duplicate: false };
}

function updateClient(data) {
  const old = query('SELECT name FROM clients WHERE id = ?', [data.id]);
  if (!old.length) return null;
  return transaction(() => {
    const allowed = ['name', 'phone', 'email', 'address', 'notes', 'national_id', 'tags'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (data.name && data.name !== (old[0]?.name || '')) {
      mutate('UPDATE cases SET client_name = ? WHERE client_id = ?', [data.name, data.id]);
    }
    if (fields.length) {
      values.push(data.id);
      mutate(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    addLog('update_client', `تحديث بيانات الموكل @${data.id}`);
    try {
      const clientCases = query('SELECT id FROM cases WHERE client_id = ?', [data.id]);
      clientCases.forEach(c => syncSearchIndex(c.id));
    } catch (e) {
      console.error('syncSearchIndex after updateClient failed:', e.message);
    }
    return { id: data.id };
  });
}

function addClient(data) {
  if (!data.name || !String(data.name).trim()) return { error: 'اسم الموكل مطلوب' };
  data.name = String(data.name).trim();
  data.phone = data.phone ? String(data.phone).trim() : '';
  data.email = data.email ? String(data.email).trim() : '';
  const dup = findDuplicateClient(data);
  if (dup.duplicate) return { duplicate: true, archived: dup.archived, existing: dup.existing, id: null };
  return transaction(() => {
    mutate(
      "INSERT INTO clients (name, phone, email, address, notes, national_id, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))",
      [data.name, data.phone, data.email, data.address, data.notes, data.national_id || '', data.tags || '']
    );
    const res = query('SELECT last_insert_rowid() as id');
    const id = res.length ? res[0].id : null;
    if (id) mutate('UPDATE cases SET client_name = ? WHERE client_id = ?', [data.name, id]);
    return { id };
  });
}

function deleteClient(id) {
  if (!id || typeof id !== 'number') return;
  transaction(() => {
    mutate("UPDATE cases SET client_id = NULL, client_name = '' WHERE client_id = ?", [id]);
    mutate('UPDATE tasks SET client_id = NULL WHERE client_id = ?', [id]);
    mutate('DELETE FROM events WHERE client_id = ?', [id]);
    mutate('DELETE FROM communications WHERE client_id = ?', [id]);
    mutate('DELETE FROM clients WHERE id = ?', [id]);
  });
}

function findDuplicateCase(caseNumber, excludeId) {
  const nCaseNumber = (caseNumber || '').trim();
  const excludeSql = excludeId ? ' AND id != ?' : '';
  const params = excludeId ? [nCaseNumber, excludeId] : [nCaseNumber];
  // فحص القضايا النشطة أولاً
  const activeRows = query(
    `SELECT id, case_number, title FROM cases WHERE LOWER(TRIM(case_number)) = LOWER(TRIM(?)) AND (archived = 0 OR archived IS NULL)${excludeSql}`,
    params
  );
  if (activeRows.length) return { duplicate: true, archived: false, existing: activeRows[0] };
  // فحص القضايا المؤرشفة
  const archivedRows = query(
    `SELECT id, case_number, title FROM cases WHERE LOWER(TRIM(case_number)) = LOWER(TRIM(?)) AND archived = 1${excludeSql}`,
    params
  );
  if (archivedRows.length) return { duplicate: true, archived: true, existing: archivedRows[0] };
  return { duplicate: false };
}

function validateRef(table, id) {
  if (id == null) return true;
  const allowed = { cases: 'cases', clients: 'clients', tasks: 'tasks', events: 'events', documents: 'documents' };
  if (!allowed[table]) return false;
  try {
    const rows = query(`SELECT 1 FROM ${allowed[table]} WHERE id = ?`, [id]);
    return rows.length > 0;
  } catch (e) {
    console.error('validateRef error:', e);
    return false;
  }
}

function integrityCheck() {
  const report = { orphans: [], warnings: [], stats: {} };
  try {
    report.stats.totalCases = query('SELECT COUNT(*) as c FROM cases')[0]?.c || 0;
    report.stats.totalClients = query('SELECT COUNT(*) as c FROM clients')[0]?.c || 0;
    report.stats.totalTasks = query('SELECT COUNT(*) as c FROM tasks')[0]?.c || 0;
    report.stats.totalEvents = query('SELECT COUNT(*) as c FROM events')[0]?.c || 0;
    report.stats.totalDocs = query('SELECT COUNT(*) as c FROM documents')[0]?.c || 0;

    const orphanTasks = query(`SELECT t.id, t.title FROM tasks t WHERE t.case_id IS NOT NULL AND t.case_id NOT IN (SELECT id FROM cases)`);
    orphanTasks.forEach(t => report.orphans.push({ type: 'task_no_case', id: t.id, title: t.title }));

    const orphanEvents = query(`SELECT e.id, e.title FROM events e WHERE e.case_id IS NOT NULL AND e.case_id NOT IN (SELECT id FROM cases)`);
    orphanEvents.forEach(e => report.orphans.push({ type: 'event_no_case', id: e.id, title: e.title }));

    const orphanClientEvents = query(`SELECT e.id, e.title FROM events e WHERE e.client_id IS NOT NULL AND e.client_id NOT IN (SELECT id FROM clients)`);
    orphanClientEvents.forEach(e => report.orphans.push({ type: 'event_no_client', id: e.id, title: e.title }));

    const orphanDocs = query(`SELECT d.id, d.filename FROM documents d WHERE d.case_id NOT IN (SELECT id FROM cases)`);
    orphanDocs.forEach(d => report.orphans.push({ type: 'doc_no_case', id: d.id, filename: d.filename }));

    const orphanProcedures = query(`SELECT p.id FROM procedures p WHERE p.affaire_id NOT IN (SELECT id FROM cases)`);
    orphanProcedures.forEach(p => report.orphans.push({ type: 'procedure_no_case', id: p.id }));

    const orphanPaiements = query(`SELECT p.id FROM paiements p WHERE p.affaire_id NOT IN (SELECT id FROM cases)`);
    orphanPaiements.forEach(p => report.orphans.push({ type: 'paiement_no_case', id: p.id }));

    const orphanCommunications = query(`SELECT c.id FROM communications c WHERE c.case_id IS NOT NULL AND c.case_id NOT IN (SELECT id FROM cases)`);
    orphanCommunications.forEach(c => report.orphans.push({ type: 'comm_no_case', id: c.id }));

    const orphanClientCommunications = query(`SELECT c.id FROM communications c WHERE c.client_id IS NOT NULL AND c.client_id NOT IN (SELECT id FROM clients)`);
    orphanClientCommunications.forEach(c => report.orphans.push({ type: 'comm_no_client', id: c.id }));

    const orphanSubtasks = query(`SELECT s.id FROM subtasks s WHERE s.task_id NOT IN (SELECT id FROM tasks)`);
    orphanSubtasks.forEach(s => report.orphans.push({ type: 'subtask_no_task', id: s.id }));

    const orphanComments = query(`SELECT c.id FROM task_comments c WHERE c.task_id NOT IN (SELECT id FROM tasks)`);
    orphanComments.forEach(c => report.orphans.push({ type: 'comment_no_task', id: c.id }));

    const orphanWorkflowSteps = query(`SELECT s.id FROM workflow_steps s WHERE s.workflow_id NOT IN (SELECT id FROM workflows)`);
    orphanWorkflowSteps.forEach(s => report.orphans.push({ type: 'step_no_workflow', id: s.id }));

    const orphanDocText = query(`SELECT dt.id FROM document_text dt WHERE dt.document_id NOT IN (SELECT id FROM documents)`);
    orphanDocText.forEach(dt => report.orphans.push({ type: 'doctext_no_doc', id: dt.id }));

    const duplicateCases = query(`SELECT case_number, COUNT(*) as cnt FROM cases GROUP BY case_number HAVING cnt > 1`);
    duplicateCases.forEach(d => report.warnings.push({ type: 'duplicate_case_number', case_number: d.case_number, count: d.cnt }));

    const duplicateClients = query(`SELECT name, COUNT(*) as cnt FROM clients GROUP BY name HAVING cnt > 1`);
    duplicateClients.forEach(d => report.warnings.push({ type: 'duplicate_client_name', name: d.name, count: d.cnt }));
  } catch (e) {
    console.error('integrityCheck error:', e);
    report.error = e.message;
  }
  return report;
}

function repairOrphans() {
  const report = integrityCheck();
  if (report.error) return { repaired: 0, errors: [report.error] };
  let repaired = 0;
  const errors = [];
  try {
    transaction(() => {
      report.orphans.forEach(o => {
        try {
          switch (o.type) {
            case 'task_no_case':
              mutate('UPDATE tasks SET case_id = NULL WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'event_no_case':
              mutate('UPDATE events SET case_id = NULL WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'event_no_client':
              mutate('UPDATE events SET client_id = NULL WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'subtask_no_task':
              mutate('DELETE FROM subtasks WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'comment_no_task':
              mutate('DELETE FROM task_comments WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'step_no_workflow':
              mutate('DELETE FROM workflow_steps WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'doctext_no_doc':
              mutate('DELETE FROM document_text WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'doc_no_case':
              const docRow = query('SELECT file_path FROM documents WHERE id = ?', [o.id]);
              if (docRow.length && docRow[0].file_path) {
                const fp = path.resolve(docRow[0].file_path);
                if (fp.startsWith(path.resolve(STORAGE_DIR))) {
                  try { fs.unlinkSync(fp); } catch (e) { /* best effort */ }
                }
              }
              mutate('DELETE FROM documents WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'procedure_no_case':
              mutate('DELETE FROM procedures WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'paiement_no_case':
              mutate('DELETE FROM paiements WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'comm_no_case':
              mutate('UPDATE communications SET case_id = NULL WHERE id = ?', [o.id]);
              repaired++;
              break;
            case 'comm_no_client':
              mutate('UPDATE communications SET client_id = NULL WHERE id = ?', [o.id]);
              repaired++;
              break;
            default:
              break;
          }
        } catch (e) {
          errors.push(`Failed to repair ${o.type} #${o.id}: ${e.message}`);
        }
      });
    });
  } catch (e) {
    errors.push('Transaction failed: ' + e.message);
  }
  return { repaired, errors };
}

function getAllTasks(includeArchived) {
  let sql = `SELECT t.*, c.case_number,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND done = 1) as subtask_done
    FROM tasks t LEFT JOIN cases c ON t.case_id = c.id`;
  if (!includeArchived) sql += ' WHERE t.archived = 0';
  sql += " ORDER BY CASE t.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.created_at DESC";
  return query(sql).map(r => ({ ...r, attachments: r.attachments || '[]', depends_on: r.depends_on || '[]' }));
}

function getTask(id) {
  const rows = query(
    `SELECT t.*, c.case_number, c.title as case_title,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND done = 1) as subtask_done
    FROM tasks t LEFT JOIN cases c ON t.case_id = c.id WHERE t.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  r.attachments = r.attachments || '[]';
  r.depends_on = r.depends_on || '[]';
  return r;
}

function addTask(data) {
  if (!data.title || !String(data.title).trim()) return null;
  data.title = String(data.title).trim();
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  if (data.parent_id && !validateRef('tasks', data.parent_id)) return null;
  mutate(
    `INSERT INTO tasks (title, description, priority, status, due_date, notes, case_id, client_id, tags, assigned_to, attachments, parent_id, depends_on, progress, time_tracked, workflow_id, template_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description || '',
      data.priority || 'medium',
      data.status || 'todo',
      data.due_date || null,
      data.notes || '',
      data.case_id || null,
      data.client_id || null,
      data.tags || '',
      data.assigned_to || '',
      safeJson(data.attachments, '[]'),
      data.parent_id || null,
      safeJson(data.depends_on, '[]'),
      data.progress || 0,
      data.time_tracked || 0,
      data.workflow_id || null,
      data.template_id || null
    ]
  );
  const res = query('SELECT last_insert_rowid() as id');
  addLog('add_task', `إضافة مهمة ${data.title}`);
  return res.length ? res[0].id : null;
}

function updateTask(id, data) {
  const allowed = [
    'title',
    'description',
    'priority',
    'status',
    'due_date',
    'notes',
    'case_id',
    'client_id',
    'tags',
    'assigned_to',
    'attachments',
    'parent_id',
    'depends_on',
    'progress',
    'time_tracked',
    'workflow_id',
    'template_id',
    'archived'
  ];
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (fields.length) {
    values.push(id);
    mutate(`UPDATE tasks SET ${fields.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`, values);
    addLog('update_task', `تحديث مهمة #${id}`);
  }
}

function deleteTask(id) {
  if (!id || typeof id !== 'number') return;
  transaction(() => {
    mutate('UPDATE tasks SET parent_id = NULL WHERE parent_id = ?', [id]);
    const allTasks = query('SELECT id, depends_on FROM tasks WHERE depends_on LIKE ?', ['%"' + id + '"%']);
    allTasks.forEach(t => {
      try {
        const deps = JSON.parse(t.depends_on || '[]');
        const filtered = deps.filter(d => d !== id);
        mutate('UPDATE tasks SET depends_on = ? WHERE id = ?', [JSON.stringify(filtered), t.id]);
      } catch (e) {
        /* best effort */
      }
    });
    mutate('DELETE FROM subtasks WHERE task_id = ?', [id]);
    mutate('DELETE FROM task_comments WHERE task_id = ?', [id]);
    mutate('DELETE FROM tasks WHERE id = ?', [id]);
  });
}

// Subtasks
function getSubtasks(taskId) {
  return query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC', [taskId]);
}
function addSubtask(data) {
  if (!data || !data.task_id || !data.title || !String(data.title).trim()) return null;
  data.title = String(data.title).trim();
  mutate('INSERT INTO subtasks (task_id, title, done) VALUES (?, ?, 0)', [data.task_id, data.title]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}
function toggleSubtask(id) {
  const rows = query('SELECT done FROM subtasks WHERE id = ?', [id]);
  if (!rows.length) return;
  transaction(() => {
    mutate('UPDATE subtasks SET done = ? WHERE id = ?', [rows[0].done ? 0 : 1, id]);
    const s = query('SELECT task_id FROM subtasks WHERE id = ?', [id]);
    if (s.length) {
      const stats = query('SELECT COUNT(*) as total, SUM(done) as done FROM subtasks WHERE task_id = ?', [s[0].task_id]);
      if (stats.length && stats[0].total > 0) {
        mutate('UPDATE tasks SET progress = ? WHERE id = ?', [Math.round(((stats[0].done || 0) / stats[0].total) * 100), s[0].task_id]);
      }
    }
  });
}
function deleteSubtask(id) {
  const rows = query('SELECT task_id FROM subtasks WHERE id = ?', [id]);
  mutate('DELETE FROM subtasks WHERE id = ?', [id]);
  if (rows.length) {
    const stats = query('SELECT COUNT(*) as total, SUM(done) as done FROM subtasks WHERE task_id = ?', [rows[0].task_id]);
    if (stats.length && stats[0].total > 0) {
      mutate('UPDATE tasks SET progress = ? WHERE id = ?', [Math.round(((stats[0].done || 0) / stats[0].total) * 100), rows[0].task_id]);
    } else {
      mutate('UPDATE tasks SET progress = 0 WHERE id = ?', [rows[0].task_id]);
    }
  }
}

// Comments
function getComments(taskId) {
  return query('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC', [taskId]);
}
function addComment(data) {
  if (!data || !data.task_id || !data.text || !String(data.text).trim()) return null;
  mutate('INSERT INTO task_comments (task_id, author, text) VALUES (?, ?, ?)', [data.task_id, data.author || 'المحامي', data.text]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}
function deleteComment(id) {
  if (!id || typeof id !== 'number') return;
  mutate('DELETE FROM task_comments WHERE id = ?', [id]);
}

// Workflows
function getAllWorkflows() {
  return query(`SELECT w.*, (SELECT COUNT(*) FROM workflow_steps WHERE workflow_id = w.id) as step_count FROM workflows w ORDER BY w.name`);
}
function getWorkflow(id) {
  const rows = query('SELECT * FROM workflows WHERE id = ?', [id]);
  if (!rows.length) return null;
  const w = rows[0];
  w.steps = query('SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC', [id]);
  return w;
}
function addWorkflow(data) {
  mutate('INSERT INTO workflows (name, description, case_type) VALUES (?, ?, ?)', [data.name, data.description || '', data.case_type || '']);
  const res = query('SELECT last_insert_rowid() as id');
  if (res.length && data.steps) {
    data.steps.forEach((s, i) =>
      mutate('INSERT INTO workflow_steps (workflow_id, title, step_order, due_days, assigned_role) VALUES (?, ?, ?, ?, ?)', [
        res[0].id,
        s.title,
        i,
        s.due_days || 0,
        s.assigned_role || ''
      ])
    );
  }
  return res.length ? res[0].id : null;
}
function deleteWorkflow(id) {
  mutate('DELETE FROM workflow_steps WHERE workflow_id = ?', [id]);
  mutate('DELETE FROM workflows WHERE id = ?', [id]);
}
function applyWorkflow(caseId, workflowId) {
  const w = getWorkflow(workflowId);
  if (!w || !w.steps) return;
  transaction(() => {
    w.steps.forEach(s => {
      const dueDate = s.due_days ? new Date(Date.now() + s.due_days * 86400000).toISOString().slice(0, 10) : null;
      mutate("INSERT INTO tasks (title, case_id, status, due_date, workflow_id, priority) VALUES (?, ?, 'todo', ?, ?, 'medium')", [
        s.title,
        caseId,
        dueDate,
        workflowId
      ]);
    });
    addLog('apply_workflow', `تطبيق سير عمل #${workflowId} على القضية #${caseId}`);
  });
}

// Templates
function getAllTemplates() {
  return query('SELECT * FROM task_templates ORDER BY name ASC');
}
function addTemplate(data) {
  mutate('INSERT INTO task_templates (name, description, tasks_json) VALUES (?, ?, ?)', [data.name, data.description || '', safeJson(data.tasks_json, '[]')]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}
function deleteTemplate(id) {
  mutate('DELETE FROM task_templates WHERE id = ?', [id]);
}
function applyTemplate(caseId, templateId) {
  const rows = query('SELECT * FROM task_templates WHERE id = ?', [templateId]);
  if (!rows.length) return;
  transaction(() => {
    JSON.parse(rows[0].tasks_json || '[]').forEach(t =>
      mutate("INSERT INTO tasks (title, case_id, status, due_date, priority, template_id) VALUES (?, ?, 'todo', ?, ?, ?)", [
        t.title,
        caseId,
        t.due_date || null,
        t.priority || 'medium',
        templateId
      ])
    );
    addLog('apply_template', `تطبيق قالب #${templateId} على القضية #${caseId}`);
  });
}

// Task Analytics
function getTaskAnalytics() {
  const total = query('SELECT COUNT(*) as c FROM tasks WHERE archived=0');
  const byStatus = query('SELECT status, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY status');
  const byPriority = query('SELECT priority, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY priority');
  const overdue = query("SELECT COUNT(*) as c FROM tasks WHERE due_date IS NOT NULL AND due_date < date('now') AND status!='done' AND archived=0");
  const completedThisWeek = query("SELECT COUNT(*) as c FROM tasks WHERE status='done' AND updated_at>=datetime('now','-7 days')");
  const avgComp = query(
    "SELECT COALESCE(AVG(CAST(julianday(updated_at)-julianday(created_at) AS REAL)),0) as avg_days FROM tasks WHERE status='done' AND created_at IS NOT NULL AND updated_at IS NOT NULL"
  );
  return {
    total: total[0]?.c || 0,
    byStatus: byStatus.reduce((a, r) => {
      a[r.status] = r.c;
      return a;
    }, {}),
    byPriority: byPriority.reduce((a, r) => {
      a[r.priority] = r.c;
      return a;
    }, {}),
    overdue: overdue[0]?.c || 0,
    completedThisWeek: completedThisWeek[0]?.c || 0,
    avgCompletionDays: Math.round((avgComp[0]?.avg_days || 0) * 10) / 10
  };
}

function getAllAppointments() {
  return query(
    `SELECT appointments.*, cases.case_number, cases.title as case_title FROM appointments LEFT JOIN cases ON appointments.case_id = cases.id ORDER BY appointments.date DESC, appointments.time DESC`
  );
}
function addAppointment(data) {
  mutate('INSERT INTO appointments (title, date, time, location, notes, case_id) VALUES (?, ?, ?, ?, ?, ?)', [
    data.title,
    data.date,
    data.time,
    data.location,
    data.notes,
    data.case_id
  ]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}
function deleteAppointment(id) {
  mutate('DELETE FROM appointments WHERE id = ?', [id]);
}

function getDashboardStats() {
  const res = query(
    "SELECT (SELECT COUNT(*) FROM cases WHERE status = 'active') as activeCases, (SELECT COUNT(*) FROM events WHERE type='hearing' AND status != 'cancelled' AND date >= date('now') AND date <= date('now','+7 days')) as thisWeekAppointments, (SELECT COUNT(*) FROM tasks WHERE status IN ('todo','in_progress')) as pendingTasks, (SELECT COUNT(*) FROM clients) as totalClients"
  );
  const base = res.length ? res[0] : { activeCases: 0, thisWeekAppointments: 0, pendingTasks: 0, totalClients: 0 };
  const casesByStatus = query('SELECT status, COUNT(*) as count FROM cases GROUP BY status');
  const tasksByPriority = query('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority');
  return { ...base, casesByStatus, tasksByPriority };
}

function getDashboardExtendedStats() {
  const totalCases = (query('SELECT COUNT(*) as c FROM cases')[0] || {}).c || 0;
  const overdueTasks =
    (query("SELECT COUNT(*) as c FROM tasks WHERE due_date IS NOT NULL AND due_date < date('now') AND status NOT IN ('done','archived')")[0] || {}).c || 0;
  const thisMonthHearings =
    (query("SELECT COUNT(*) as c FROM events WHERE type='hearing' AND status!='cancelled' AND strftime('%Y-%m',date)=strftime('%Y-%m','now')")[0] || {}).c || 0;
  const opened = (query("SELECT COUNT(*) as c FROM cases WHERE created_date >= date('now','start of month')")[0] || {}).c || 0;
  const closed =
    (query("SELECT COUNT(*) as c FROM cases WHERE (archived=1 OR status='closed') AND created_date >= date('now','start of month')")[0] || {}).c || 0;
  const casesByType = query(
    "SELECT case_type, COUNT(*) as count FROM cases WHERE case_type IS NOT NULL AND case_type!='' GROUP BY case_type ORDER BY count DESC"
  );
  const tasksByStatus = query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
  const paymentByMethod = query('SELECT mode_paiement, COUNT(*) as count, SUM(montant) as total FROM paiements GROUP BY mode_paiement ORDER BY total DESC');
  const monthlyRevenue = query(
    "SELECT strftime('%m',date) as month, SUM(montant) as total FROM paiements WHERE date >= date('now','-11 months') GROUP BY strftime('%m',date) ORDER BY month"
  );
  const docsByType = query('SELECT doc_type, COUNT(*) as count FROM documents GROUP BY doc_type ORDER BY count DESC');
  const casesByCourt = query("SELECT court, COUNT(*) as count FROM cases WHERE court IS NOT NULL AND court!='' GROUP BY court ORDER BY count DESC LIMIT 5");
  const totalPaid = (query('SELECT COALESCE(SUM(paid_fees),0) as c FROM cases')[0] || {}).c || 0;
  const totalFees = (query('SELECT COALESCE(SUM(total_fees),0) as c FROM cases')[0] || {}).c || 0;
  /* Trend data: compare current month with previous month */
  const trend = {};
  const _now = new Date();
  const _month = String(_now.getMonth() + 1).padStart(2, '0');
  const _sm = _now.getFullYear() + '-' + _month + '-01';
  trend.activeCasesNow = (query(`SELECT COUNT(*) as c FROM cases WHERE status='active'`)[0] || {}).c || 0;
  trend.activeCasesPrev = (query(`SELECT COUNT(*) as c FROM cases WHERE status='active' AND created_date < ?`, [_sm])[0] || {}).c || 0;
  trend.clientsNow = (query(`SELECT COUNT(*) as c FROM clients`)[0] || {}).c || 0;
  trend.clientsPrev =
    (
      query(`SELECT COUNT(*) as c FROM clients WHERE id NOT IN (SELECT id FROM clients WHERE created_at >= ? AND created_at IS NOT NULL)`, [_sm])[0] ||
      {}
    ).c || 0;
  trend.hearingsNow = thisMonthHearings;
  trend.hearingsPrev =
    (
      query(
        `SELECT COUNT(*) as c FROM events WHERE type='hearing' AND status!='cancelled' AND strftime('%Y-%m',date)=strftime('%Y-%m',date('now','-1 month'))`
      )[0] || {}
    ).c || 0;
  trend.revenueNow = (query(`SELECT COALESCE(SUM(montant),0) as c FROM paiements WHERE strftime('%Y-%m',date)=strftime('%Y-%m','now')`)[0] || {}).c || 0;
  trend.revenuePrev =
    (query(`SELECT COALESCE(SUM(montant),0) as c FROM paiements WHERE strftime('%Y-%m',date)=strftime('%Y-%m',date('now','-1 month'))`)[0] || {}).c || 0;
  trend.tasksNow = (query(`SELECT COUNT(*) as c FROM tasks WHERE status='todo'`)[0] || {}).c || 0;
  trend.tasksPrev = (query(`SELECT COUNT(*) as c FROM tasks WHERE status='todo' AND created_at < ?`, [_sm])[0] || {}).c || 0;
  trend.docsNow = (query(`SELECT COUNT(*) as c FROM documents`)[0] || {}).c || 0;
  trend.docsPrev = (query(`SELECT COUNT(*) as c FROM documents WHERE upload_date < ?`, [_sm])[0] || {}).c || 0;
  return {
    totalCases,
    overdueTasks,
    thisMonthHearings,
    opened,
    closed,
    casesByType,
    tasksByStatus,
    paymentByMethod,
    monthlyRevenue,
    docsByType,
    casesByCourt,
    totalPaid,
    totalFees,
    trend
  };
}

function updateCaseStatus(id, status) {
  const VALID_STATUSES = ['active', 'pending', 'closed'];
  if (!VALID_STATUSES.includes(status)) {
    console.warn(`حالة غير صالحة: ${status}`);
    return false;
  }
  mutate('UPDATE cases SET status = ? WHERE id = ?', [status, id]);
  addLog('update_case_status', `تغيير حالة القضية #${id} إلى ${status}`);
  return true;
}
function updateCaseNotes(id, notes) {
  mutate('UPDATE cases SET notes = ? WHERE id = ?', [notes, id]);
  addLog('update_case_notes', `تحديث ملاحظات القضية #${id}`);
  syncSearchIndex(id);
}

function getChartData() {
  const statuses = query('SELECT status, COUNT(*) as count FROM cases GROUP BY status');
  const monthly = query(
    "SELECT strftime('%m', created_date) as month, COUNT(*) as count FROM cases WHERE created_date IS NOT NULL AND created_date >= date('now', '-11 months') GROUP BY strftime('%m', created_date) ORDER BY month"
  );
  const courts = query("SELECT court, COUNT(*) as count FROM cases WHERE court IS NOT NULL AND court != '' GROUP BY court ORDER BY count DESC LIMIT 5");
  const totalFees = query(
    'SELECT COALESCE(SUM(total_fees),0) as total, COALESCE(SUM(paid_fees),0) as paid, COALESCE(SUM(expenses),0) as expenses FROM cases'
  )[0] || { total: 0, paid: 0, expenses: 0 };
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  return { statuses, monthly, courts, fees: totalFees, monthNames };
}

function getDocuments(caseId) {
  return query(
    "SELECT d.*, COALESCE(c.case_number, '') as case_number, COALESCE(cl.name, '') as client_name FROM documents d LEFT JOIN cases c ON d.case_id = c.id LEFT JOIN clients cl ON c.client_id = cl.id WHERE d.case_id = ? ORDER BY d.upload_date DESC",
    [caseId]
  );
}
function getAllDocuments(userId, userRole) {
  if (userId && userRole && !['admin', 'senior_lawyer'].includes(userRole)) {
    return query(
      `SELECT d.*, COALESCE(c.case_number, '') as case_number, COALESCE(cl.name, '') as client_name FROM documents d LEFT JOIN cases c ON d.case_id = c.id LEFT JOIN clients cl ON c.client_id = cl.id WHERE (c.access_level = 'team' OR c.id IN (SELECT case_id FROM case_permissions WHERE user_id = ?)) ORDER BY d.upload_date DESC`,
      [userId]
    );
  }
  return query(
    "SELECT d.*, COALESCE(c.case_number, '') as case_number, COALESCE(cl.name, '') as client_name FROM documents d LEFT JOIN cases c ON d.case_id = c.id LEFT JOIN clients cl ON c.client_id = cl.id ORDER BY d.upload_date DESC"
  );
}
function addDocument(data) {
  if (!data.case_id || !data.filename) return null;
  if (!validateRef('cases', data.case_id)) return null;
  mutate('INSERT INTO documents (case_id, filename, file_path, doc_type, file_size, tags) VALUES (?, ?, ?, ?, ?, ?)', [
    data.case_id,
    data.filename,
    data.file_path,
    data.doc_type,
    data.file_size || '',
    data.tags || ''
  ]);
  const res = query('SELECT last_insert_rowid() as id');
  if (res.length && data.case_id) syncSearchIndex(data.case_id);
  return res.length ? res[0].id : null;
}
function getDocument(id) {
  const rows = query('SELECT * FROM documents WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}
function deleteDocument(id) {
  const doc = query('SELECT case_id FROM documents WHERE id = ?', [id]);
  mutate('DELETE FROM documents WHERE id = ?', [id]);
  if (doc.length && doc[0].case_id) syncSearchIndex(doc[0].case_id);
}
function updateDocument(id, data) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (['tags', 'notes', 'doc_type', 'filename', 'ai_analysis'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length) {
    values.push(id);
    mutate(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  if (id) {
    const doc = query('SELECT case_id FROM documents WHERE id = ?', [id]);
    if (doc.length && doc[0].case_id) syncSearchIndex(doc[0].case_id);
  }
}
function addDocumentText(documentId, text) {
  const existing = query('SELECT id FROM document_text WHERE document_id = ?', [documentId]);
  if (existing.length) {
    mutate("UPDATE document_text SET extracted_text = ?, indexed_at = datetime('now', 'localtime') WHERE document_id = ?", [text, documentId]);
  } else {
    mutate('INSERT INTO document_text (document_id, extracted_text) VALUES (?, ?)', [documentId, text]);
  }
  if (documentId) {
    const doc = query('SELECT case_id FROM documents WHERE id = ?', [documentId]);
    if (doc.length && doc[0].case_id) syncSearchIndex(doc[0].case_id);
  }
}
function getDocumentText(documentId) {
  const rows = query('SELECT * FROM document_text WHERE document_id = ?', [documentId]);
  return rows.length ? rows[0] : null;
}

function getDocumentAnalysis(documentId) {
  const rows = query('SELECT ai_analysis FROM documents WHERE id = ?', [documentId]);
  return rows.length && rows[0].ai_analysis ? rows[0].ai_analysis : null;
}

function saveDocumentAnalysis(documentId, analysis) {
  updateDocument(documentId, { ai_analysis: analysis });
  addLog('doc_analysis', `تحليل ذكي للوثيقة #${documentId}`);
}

// Events
function getAllEvents() {
  return query(`SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id
    ORDER BY e.date DESC, e.time DESC`);
}
function getEvent(id) {
  const rows = query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id WHERE e.id = ?`,
    [id]
  );
  return rows.length ? rows[0] : null;
}
function addEvent(data) {
  if (!data.title || !data.date) return null;
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  mutate(
    `INSERT INTO events (case_id, client_id, title, type, status, date, time, end_time, court, judge, room, notes, outcome, urgency, recurring_type, recurring_end_date, all_day)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.case_id || null,
      data.client_id || null,
      data.title,
      data.type || 'meeting',
      data.status || 'scheduled',
      data.date,
      data.time || null,
      data.end_time || null,
      data.court || null,
      data.judge || null,
      data.room || null,
      data.notes || null,
      data.outcome || null,
      data.urgency || 'medium',
      data.recurring_type || 'none',
      data.recurring_end_date || null,
      data.all_day ? 1 : 0
    ]
  );
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}
function updateEvent(id, data) {
  const fields = [];
  const values = [];
  const allowed = [
    'case_id',
    'client_id',
    'title',
    'type',
    'status',
    'date',
    'time',
    'end_time',
    'court',
    'judge',
    'room',
    'notes',
    'outcome',
    'urgency',
    'recurring_type',
    'recurring_end_date',
    'all_day',
    'alert_sent_7d',
    'alert_sent_3d',
    'alert_sent_1d'
  ];
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
function getEventsByDateRange(start, end) {
  return query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id
    WHERE e.date >= ? AND e.date <= ? ORDER BY e.date ASC, e.time ASC`,
    [start, end]
  );
}
function getEventsByCase(caseId) {
  return query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id WHERE e.case_id = ? ORDER BY e.date ASC, e.time ASC`,
    [caseId]
  );
}
function getEventsByClient(clientId) {
  return query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id WHERE e.client_id = ? ORDER BY e.date ASC, e.time ASC`,
    [clientId]
  );
}
function getTodayEvents() {
  const today = new Date().toISOString().split('T')[0];
  return query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id WHERE e.date = ? ORDER BY e.time ASC`,
    [today]
  );
}
function getAlertsNeeded() {
  const today = new Date().toISOString().split('T')[0];
  return query(
    `SELECT e.*, c.case_number, c.title as case_title FROM events e LEFT JOIN cases c ON e.case_id = c.id
    WHERE e.status = 'scheduled' AND ((julianday(e.date) - julianday(?) = 7 AND e.alert_sent_7d = 0)
    OR (julianday(e.date) - julianday(?) = 3 AND e.alert_sent_3d = 0)
    OR (julianday(e.date) - julianday(?) = 1 AND e.alert_sent_1d = 0)
    OR (julianday(e.date) - julianday(?) = 0 AND (e.alert_sent_1d = 0 OR e.alert_sent_3d = 0 OR e.alert_sent_7d = 0))
    OR (julianday(e.date) - julianday(?) < 0 AND julianday(?) - julianday(e.date) <= 1 AND e.status = 'scheduled'))
    ORDER BY e.date ASC`,
    [today, today, today, today, today, today]
  );
}
function detectConflicts(eventId, date, time, endTime) {
  const excludeSql = eventId ? 'AND e.id != ?' : '';
  const params = [date];
  if (eventId) params.push(eventId);
  if (time) {
    if (endTime) {
      return query(
        `SELECT e.* FROM events e WHERE e.date = ? AND e.status != 'cancelled' ${excludeSql}
        AND ((e.time <= ? AND e.end_time >= ?) OR (e.time >= ? AND e.time <= ?) OR (e.end_time >= ? AND e.end_time <= ?))
        ORDER BY e.time ASC`,
        [date, time, time, time, endTime, time, endTime, ...(eventId ? [eventId] : [])]
      );
    }
    return query(`SELECT e.* FROM events e WHERE e.date = ? AND e.time = ? AND e.status != 'cancelled' ${excludeSql}`, [
      date,
      time,
      ...(eventId ? [eventId] : [])
    ]);
  }
  return query(`SELECT e.* FROM events e WHERE e.date = ? AND e.status != 'cancelled' ${excludeSql}`, [date, ...(eventId ? [eventId] : [])]);
}

function isSent(key) {
  const r = query('SELECT id FROM sent_notifications WHERE key=?', [key]);
  return r.length > 0;
}

function markSent(key) {
  try {
    db.run('INSERT OR IGNORE INTO sent_notifications (key) VALUES (?)', [key]);
  } catch (e) {}
}

function cleanOldSentNotifications() {
  db.run("DELETE FROM sent_notifications WHERE datetime(sent_at) < datetime('now', '-30 days')");
}

function cleanOrphanedFiles() {
  const docPaths = new Set(query("SELECT file_path FROM documents WHERE file_path IS NOT NULL AND file_path != ''").map(r => path.resolve(r.file_path)));
  let deletedCount = 0;
  let freedBytes = 0;
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        try {
          const remaining = fs.readdirSync(fullPath);
          if (remaining.length === 0) {
            fs.rmdirSync(fullPath);
          }
        } catch {}
      } else if (entry.isFile()) {
        const resolved = fs.realpathSync(path.resolve(fullPath));
        const allowedBase = path.resolve(STORAGE_DIR);
        const isInAllowedDir = resolved.startsWith(allowedBase + path.sep) || resolved === allowedBase;
        if (!docPaths.has(resolved) && isInAllowedDir) {
          try {
            const stat = fs.statSync(fullPath);
            freedBytes += stat.size;
            fs.unlinkSync(fullPath);
            deletedCount++;
          } catch {}
        }
      }
    }
  }
  if (fs.existsSync(STORAGE_DIR)) {
    walk(STORAGE_DIR);
  }
  const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);
  return { deletedCount, freedBytes, freedMB: parseFloat(freedMB) };
}

function getEventsByDate(dateStr) {
  return query(
    `SELECT e.*, c.case_number, c.title as case_title, cl.name as client_name
    FROM events e LEFT JOIN cases c ON e.case_id = c.id LEFT JOIN clients cl ON e.client_id = cl.id
    WHERE e.date = ? AND e.status != 'cancelled' ORDER BY e.time ASC`,
    [dateStr]
  );
}

function getTomorrowHearings() {
  const fromProcedures = query(`SELECT p.id, p.date as hearing_date, p.type, p.description,
    c.id as case_id, c.case_number, c.title as case_title, c.court
    FROM procedures p JOIN cases c ON p.affaire_id = c.id
    WHERE p.date = date('now', '+1 day') AND c.status != 'closed'`);
  const fromEvents = query(`SELECT e.id, e.date as hearing_date, e.type, e.notes as description,
    c.id as case_id, c.case_number, c.title as case_title, c.court
    FROM events e JOIN cases c ON e.case_id = c.id
    WHERE e.type = 'hearing' AND e.status != 'cancelled' AND e.date = date('now', '+1 day') AND c.status != 'closed'`);
  return [...fromProcedures, ...fromEvents];
}

function globalSearch(queryTerm, userId, userRole) {
  const q = queryTerm ? queryTerm.trim() : '';
  const empty = { cases: [], clients: [], hearings: [], documents: [], tasks: [], expenses: [] };
  if (!q) return empty;
  const like = '%' + q + '%';
  const restrictCases = userId && userRole && !['admin', 'senior_lawyer'].includes(userRole);

  const ftsQuery = q
    .replace(/[*"()+\-^]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t + '*')
    .join(' ');

  let ftsResults = [];
  if (ftsQuery) {
    try {
      const stmt = db.prepare('SELECT case_id, search_rank(matchinfo(search_index)) as score FROM search_index WHERE search_index MATCH ? ORDER BY score DESC');
      stmt.bind([ftsQuery]);
      while (stmt.step()) ftsResults.push(stmt.getAsObject());
      stmt.free();
    } catch (e) {
      console.error('FTS search error:', e.message);
    }
  }

  const uniqueCaseIds = [...new Set(ftsResults.map(r => parseInt(r.case_id)).filter(id => !isNaN(id)))];
  const scoreMap = {};
  ftsResults.forEach(r => {
    const id = parseInt(r.case_id);
    if (!isNaN(id)) scoreMap[id] = (scoreMap[id] || 0) + (r.score || 0);
  });
  const rankedIds = uniqueCaseIds.sort((a, b) => (scoreMap[b] || 0) - (scoreMap[a] || 0)).slice(0, 10);

  let cases = [];
  if (rankedIds.length) {
    const safeIds = rankedIds.filter(id => Number.isInteger(id) && id > 0);
    if (safeIds.length) {
      const placeholders = safeIds.map(() => '?').join(',');
      const orderCases = safeIds.map((_, i) => `WHEN ? THEN ${i}`).join(' ');
      let casesSql = `SELECT id, case_number, title, COALESCE(client_name, '') as client_name, status FROM cases WHERE id IN (${placeholders})`;
      const casesParams = [...safeIds, ...safeIds];
      if (restrictCases) {
        casesSql += ` AND (access_level = 'team' OR id IN (SELECT case_id FROM case_permissions WHERE user_id = ?))`;
        casesParams.push(userId);
      }
      cases = query(casesSql + ` ORDER BY CASE id ${orderCases} END`, casesParams);
    }
  }

  const clients = query(
    `SELECT id, name, phone, email FROM clients WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR address LIKE ? ORDER BY name ASC LIMIT 6`,
    [like, like, like, like]
  );
  const hearings = query(
    `SELECT e.id, e.title, e.date, COALESCE(c.case_number, '') as case_number FROM events e LEFT JOIN cases c ON e.case_id = c.id WHERE e.title LIKE ? OR e.type LIKE ? OR e.court LIKE ? OR e.notes LIKE ? ORDER BY e.date DESC LIMIT 6`,
    [like, like, like, like]
  );
  const documents = query(
    `SELECT d.id, d.filename, d.doc_type, COALESCE(c.case_number, '') as case_number FROM documents d LEFT JOIN cases c ON d.case_id = c.id WHERE d.filename LIKE ? OR d.doc_type LIKE ? ORDER BY d.filename ASC LIMIT 6`,
    [like, like]
  );
  const tasks = query(
    `SELECT t.id, t.title, t.priority, t.status, COALESCE(c.case_number, '') as case_number FROM tasks t LEFT JOIN cases c ON t.case_id = c.id WHERE t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ? ORDER BY t.title ASC LIMIT 6`,
    [like, like, like]
  );
  const expenses = query(
    `SELECT p.id, p.montant, p.mode_paiement, p.date as paiement_date, p.remarque, COALESCE(c.case_number, '') as case_number FROM paiements p LEFT JOIN cases c ON p.affaire_id = c.id WHERE c.case_number LIKE ? OR p.remarque LIKE ? OR p.mode_paiement LIKE ? ORDER BY p.date DESC LIMIT 6`,
    [like, like, like]
  );

  return { cases, clients, hearings, documents: documents.slice(0, 6), tasks, expenses };
}

function getSearchIndex(userId, userRole) {
  const cases = getAllCases(false, userId, userRole).map(c => ({
    id: c.id,
    type: 'case',
    label: c.case_number + ' — ' + c.title,
    sub: c.client_name || '',
    nav: 'cases',
    text: (c.case_number || '') + ' ' + (c.title || '') + ' ' + (c.client_name || '') + ' ' + (c.court || '') + ' ' + (c.description || ''),
    status: c.status || ''
  }));
  const clients = getAllClients().map(c => ({
    id: c.id,
    type: 'client',
    label: c.name,
    sub: c.phone || c.email || '',
    nav: 'clients',
    text: (c.name || '') + ' ' + (c.phone || '') + ' ' + (c.email || '') + ' ' + (c.address || '') + ' ' + (c.national_id || '')
  }));
  const events = getAllEvents()
    .filter(e => ['hearing', 'deadline'].includes(e.type))
    .map(e => ({
      id: e.id,
      type: 'hearing',
      label: e.title,
      sub: e.date + ' — ' + (e.case_number || ''),
      nav: 'calendar',
      text: (e.title || '') + ' ' + (e.case_number || '') + ' ' + (e.court || '') + ' ' + (e.notes || '') + ' ' + (e.type || '')
    }));
  const allCases = getAllCases(false, userId, userRole);
  let docs = [];
  for (const c of allCases) {
    const d = getDocuments(c.id);
    d.forEach(doc =>
      docs.push({
        id: doc.id,
        type: 'document',
        label: doc.filename,
        sub: doc.doc_type + ' — ' + (c.case_number || ''),
        nav: 'documents',
        text: (doc.filename || '') + ' ' + (doc.doc_type || '') + ' ' + (c.case_number || '') + ' ' + (doc.tags || '') + ' ' + (doc.notes || '')
      })
    );
  }
  const tasks = getAllTasks().map(t => ({
    id: t.id,
    type: 'task',
    label: t.title,
    sub: t.status + ' — ' + (t.case_number || ''),
    nav: 'tasks',
    text: (t.title || '') + ' ' + (t.description || '') + ' ' + (t.case_number || '') + ' ' + (t.tags || '') + ' ' + (t.status || '') + ' ' + (t.priority || '')
  }));
  let payments = [];
  for (const c of allCases) {
    const p = getPaiements(c.id);
    p.forEach(pay =>
      payments.push({
        id: pay.id,
        type: 'expense',
        label: (c.case_number || '') + ' — ' + (pay.montant || 0) + ' درهم',
        sub: pay.date + ' ' + (pay.mode_paiement || ''),
        nav: 'expenses',
        text: (c.case_number || '') + ' ' + (pay.montant || '') + ' ' + (pay.mode_paiement || '') + ' ' + (pay.remarque || '') + ' ' + (pay.date || '')
      })
    );
  }
  return [...cases, ...clients, ...events, ...docs, ...tasks, ...payments];
}

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
function updateProcedure(id, data) {
  if (!id || typeof id !== 'number') return;
  if (!query('SELECT id FROM procedures WHERE id = ?', [id]).length) return;
  if (!data.date || !data.type) return;
  mutate('UPDATE procedures SET date = ?, type = ?, description = ? WHERE id = ?', [data.date, data.type, data.description || '', id]);
}
function deleteProcedure(id) {
  if (!id || typeof id !== 'number') return;
  mutate('DELETE FROM procedures WHERE id = ?', [id]);
}

function getPaiements(affaireId) {
  return query('SELECT * FROM paiements WHERE affaire_id = ? ORDER BY date DESC, id DESC', [affaireId]);
}
function addPaiement(data) {
  if (!data.affaire_id || !data.date || data.montant === undefined || !data.mode_paiement) return null;
  if (!validateRef('cases', data.affaire_id)) return null;
  if (isNaN(parseFloat(data.montant)) || parseFloat(data.montant) < 0) return null;
  return transaction(() => {
    mutate('INSERT INTO paiements (affaire_id, date, montant, mode_paiement, remarque) VALUES (?, ?, ?, ?, ?)', [
      data.affaire_id,
      data.date,
      parseFloat(data.montant),
      data.mode_paiement,
      data.remarque
    ]);
    const res = query('SELECT last_insert_rowid() as id');
    syncPaidFees(data.affaire_id);
    return res.length ? res[0].id : null;
  });
}
function updatePaiement(id, data) {
  if (!id || typeof id !== 'number') return;
  const old = query('SELECT affaire_id FROM paiements WHERE id = ?', [id]);
  if (!old.length) return;
  if (!data.date || !data.mode_paiement || data.montant === undefined) return;
  transaction(() => {
    mutate('UPDATE paiements SET date = ?, montant = ?, mode_paiement = ?, remarque = ? WHERE id = ?', [
      data.date,
      parseFloat(data.montant) || 0,
      data.mode_paiement,
      data.remarque || '',
      id
    ]);
    syncPaidFees(old[0].affaire_id);
  });
}
function deletePaiement(id) {
  if (!id || typeof id !== 'number') return;
  const old = query('SELECT affaire_id FROM paiements WHERE id = ?', [id]);
  transaction(() => {
    mutate('DELETE FROM paiements WHERE id = ?', [id]);
    if (old.length) syncPaidFees(old[0].affaire_id);
  });
}
function syncPaidFees(affaireId) {
  const rows = query('SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE affaire_id = ?', [affaireId]);
  mutate('UPDATE cases SET paid_fees = ? WHERE id = ?', [rows.length ? rows[0].total : 0, affaireId]);
}
function updateHonorairesTotaux(caseId, montant) {
  mutate('UPDATE cases SET honoraires_totaux = ? WHERE id = ?', [montant, caseId]);
}

function getWeekDeadlines() {
  return query(
    `SELECT c.id, c.case_number, c.title, c.deadline_date, c.client_name, CAST(ROUND(julianday(c.deadline_date) - julianday('now')) AS INTEGER) as days_remaining FROM cases c WHERE c.deadline_date IS NOT NULL AND c.deadline_date != '' AND c.status != 'closed' AND (c.archived = 0 OR c.archived IS NULL) AND julianday(c.deadline_date) BETWEEN julianday('now') AND julianday('now', '+7 days') ORDER BY days_remaining ASC`
  );
}
function getUnpaidFees() {
  return query(
    `SELECT c.id, c.case_number, c.title, c.client_name, COALESCE(c.honoraires_totaux, c.total_fees, 0) as total_fees, COALESCE(c.paid_fees, 0) as paid_fees, ROUND(COALESCE(c.honoraires_totaux, c.total_fees, 0) - COALESCE(c.paid_fees, 0), 2) as remaining FROM cases c WHERE c.status != 'closed' AND COALESCE(c.honoraires_totaux, c.total_fees, 0) > COALESCE(c.paid_fees, 0) ORDER BY remaining DESC`
  );
}
function getStaleCases() {
  return query(
    `SELECT c.id, c.case_number, c.title, c.client_name, c.status, COALESCE(MAX(COALESCE((SELECT MAX(p.date) FROM procedures p WHERE p.affaire_id = c.id), '2000-01-01'), COALESCE((SELECT MAX(d.upload_date) FROM documents d WHERE d.case_id = c.id), '2000-01-01'), COALESCE((SELECT MAX(pa.date) FROM paiements pa WHERE pa.affaire_id = c.id), '2000-01-01')), '2000-01-01') as last_activity FROM cases c WHERE c.status != 'closed' GROUP BY c.id HAVING last_activity < date('now', '-30 days') ORDER BY last_activity ASC`
  );
}
function getUrgentTasks() {
  return query(`SELECT * FROM tasks WHERE status = 'todo' AND priority = 'high' ORDER BY due_date ASC`);
}

function addJugement(data) {
  if (!data || !data.sujet || !data.contenu) return null;
  mutate('INSERT INTO jugements (case_number, sujet, cour, annee, mots_cles, contenu, date_jugement) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    data.case_number || null,
    data.sujet,
    data.cour || null,
    data.annee || null,
    data.mots_cles || null,
    data.contenu,
    data.date_jugement || null
  ]);
  return query('SELECT last_insert_rowid() as id')[0]?.id || null;
}
function getAllJugements() {
  return query('SELECT * FROM jugements ORDER BY created_at DESC');
}
function searchJugements(filters) {
  let sql = 'SELECT * FROM jugements WHERE 1=1';
  const params = [];
  if (filters.sujet?.trim()) {
    sql += ' AND sujet LIKE ?';
    params.push('%' + filters.sujet.trim() + '%');
  }
  if (filters.cour?.trim()) {
    sql += ' AND cour LIKE ?';
    params.push('%' + filters.cour.trim() + '%');
  }
  if (filters.annee) {
    sql += ' AND annee = ?';
    params.push(parseInt(filters.annee));
  }
  if (filters.mots_cles?.trim()) {
    sql += ' AND mots_cles LIKE ?';
    params.push('%' + filters.mots_cles.trim() + '%');
  }
  sql += ' ORDER BY created_at DESC';
  return query(sql, params);
}
function deleteJugement(id) {
  if (!id || typeof id !== 'number') return;
  mutate('DELETE FROM jugements WHERE id = ?', [id]);
}

function addCommunication(data) {
  if (!data.type || !data.date) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  mutate('INSERT INTO communications (client_id, case_id, type, date, summary) VALUES (?, ?, ?, ?, ?)', [
    data.client_id || null,
    data.case_id || null,
    data.type,
    data.date,
    data.summary || null
  ]);
  return query('SELECT last_insert_rowid() as id')[0]?.id || null;
}
function getAllCommunications(userId, userRole) {
  if (userId && userRole && !['admin', 'senior_lawyer'].includes(userRole)) {
    return query(
      `SELECT comm.*, cl.name as client_name, ca.case_number FROM communications comm LEFT JOIN clients cl ON comm.client_id = cl.id LEFT JOIN cases ca ON comm.case_id = ca.id WHERE (ca.access_level = 'team' OR ca.id IN (SELECT case_id FROM case_permissions WHERE user_id = ?)) ORDER BY comm.date DESC, comm.created_at DESC`,
      [userId]
    );
  }
  return query(
    `SELECT comm.*, cl.name as client_name, ca.case_number FROM communications comm LEFT JOIN clients cl ON comm.client_id = cl.id LEFT JOIN cases ca ON comm.case_id = ca.id ORDER BY comm.date DESC, comm.created_at DESC`
  );
}
function getClientCommunications(clientId) {
  return query(
    `SELECT comm.*, ca.case_number FROM communications comm LEFT JOIN cases ca ON comm.case_id = ca.id WHERE comm.client_id = ? ORDER BY comm.date DESC, comm.created_at DESC`,
    [clientId]
  );
}
function deleteCommunication(id) {
  if (!id || typeof id !== 'number') return;
  mutate('DELETE FROM communications WHERE id = ?', [id]);
}

function addLog(action, details, userId, userName) {
  try {
    mutate('INSERT INTO activity_log (action, details, user_id, user_name) VALUES (?, ?, ?, ?)', [action, details || '', userId || 0, userName || '']);
  } catch (e) {
    console.error('Log error:', e);
  }
}

// Users & Permissions
function getUsers() {
  return query('SELECT id, name, email, role, avatar, active, last_login, phone, bar_number, city, specialties, experience_years FROM users ORDER BY id ASC');
}
function getAllUsers() {
  return query('SELECT id, name, email, role, avatar, active, last_login, phone, bar_number, city, specialties, experience_years, password_hash FROM users ORDER BY id ASC');
}
function addUser(data) {
  const hash = data.password_hash || '';
  if (hash && !/^\$2[aby]\$/.test(hash)) {
    addLog('add_user_failed', `محاولة إضافة مستخدم ${data.name} بهاش غير صالح`);
    return null;
  }
  mutate('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [data.name, data.email || '', hash, data.role || 'assistant']);
  addLog('add_user', `إضافة مستخدم ${data.name}`, data._userId, data._userName);
  return query('SELECT last_insert_rowid() as id')[0]?.id;
}
function updateUser(id, data) {
  const fields = [];
  const vals = [];
  ['name', 'email', 'role', 'active', 'password_hash'].forEach(k => {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      vals.push(data[k]);
    }
  });
  if (fields.length) {
    vals.push(id);
    mutate(`UPDATE users SET ${fields.join(',')} WHERE id=?`, vals);
  }
}
function deleteUser(id) {
  mutate('DELETE FROM users WHERE id=?', [id]);
}
function getUserById(id) {
  const r = query('SELECT * FROM users WHERE id=?', [id]);
  return r.length ? r[0] : null;
}
function getPasswordHashForUser(id) {
  const r = query('SELECT password_hash FROM users WHERE id=?', [id]);
  return r.length ? r[0].password_hash : null;
}
function updateOwnProfile(id, data) {
  const fields = [];
  const vals = [];
  ['name', 'email', 'phone', 'bar_number', 'city', 'specialties', 'experience_years', 'avatar'].forEach(k => {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      vals.push(data[k]);
    }
  });
  if (fields.length) {
    vals.push(id);
    mutate(`UPDATE users SET ${fields.join(',')} WHERE id=?`, vals);
  }
}
function getUserByEmail(email) {
  const r = query('SELECT * FROM users WHERE email=?', [email]);
  return r.length ? r[0] : null;
}
function getOfficeSetting(key) {
  const r = query('SELECT value FROM office_settings WHERE key=?', [key]);
  return r.length ? r[0].value : null;
}
function setOfficeSetting(key, value) {
  mutate('INSERT OR REPLACE INTO office_settings (key, value) VALUES (?, ?)', [key, value]);
}
function setSecurityQuestions(userId, questions) {
  mutate('DELETE FROM security_questions WHERE user_id=?', [userId]);
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    mutate('INSERT OR IGNORE INTO security_questions (user_id, question_index, question, answer_hash) VALUES (?, ?, ?, ?)', [
      userId,
      i + 1,
      q.question,
      q.answerHash
    ]);
  }
}
function getSecurityQuestions(userId) {
  return query('SELECT question_index, question FROM security_questions WHERE user_id=? ORDER BY question_index', [userId]);
}
function getSecurityAnswer(userId, questionIndex) {
  var r = query('SELECT answer_hash FROM security_questions WHERE user_id=? AND question_index=?', [userId, questionIndex]);
  return r.length ? r[0].answer_hash : null;
}
function checkPermission(role, permission) {
  const r = query('SELECT allowed FROM permissions WHERE role=? AND permission=?', [role, permission]);
  return r.length ? !!r[0].allowed : false;
}
function getPermissions(role) {
  return query('SELECT permission, allowed FROM permissions WHERE role=?', [role]).reduce((a, r) => {
    a[r.permission] = !!r.allowed;
    return a;
  }, {});
}
function setPermission(role, permission, allowed) {
  try {
    mutate('INSERT OR REPLACE INTO permissions (role, permission, allowed) VALUES (?, ?, ?)', [role, permission, allowed ? 1 : 0]);
  } catch (e) {
    mutate('UPDATE permissions SET allowed=? WHERE role=? AND permission=?', [allowed ? 1 : 0, role, permission]);
  }
}
function getCaseAccessLevel(caseId) {
  const r = query('SELECT access_level FROM cases WHERE id=?', [caseId]);
  return r.length ? r[0].access_level : 'team';
}
function setCaseAccessLevel(caseId, level) {
  mutate('UPDATE cases SET access_level=? WHERE id=?', [level, caseId]);
}
function getDocumentVisibility(docId) {
  const r = query('SELECT visibility FROM documents WHERE id=?', [docId]);
  return r.length ? r[0].visibility : 'case';
}

function getLogs(filters) {
  filters = filters || {};
  let sql = 'SELECT * FROM activity_log WHERE 1=1';
  const params = [];
  if (filters.search?.trim()) {
    const q = '%' + filters.search.trim() + '%';
    sql += ' AND (action LIKE ? OR details LIKE ?)';
    params.push(q, q);
  }
  if (filters.action && filters.action !== 'all') {
    sql += ' AND action = ?';
    params.push(filters.action);
  }
  if (filters.dateFrom) {
    sql += ' AND created_at >= ?';
    params.push(filters.dateFrom + ' 00:00:00');
  }
  if (filters.dateTo) {
    sql += ' AND created_at <= ?';
    params.push(filters.dateTo + ' 23:59:59');
  }
  sql += ' ORDER BY created_at DESC';
  const limit = Math.min(Math.max(parseInt(filters.limit) || 500, 1), 10000);
  sql += ' LIMIT ?';
  params.push(limit);
  if (filters.offset) {
    sql += ' OFFSET ?';
    params.push(Math.max(parseInt(filters.offset), 0));
  }
  return query(sql, params);
}

function getAlertSettings() {
  const rows = query('SELECT * FROM alert_settings WHERE id = 1');
  return rows.length ? rows[0] : { days_before_1: 7, days_before_2: 3, days_before_3: 1, enabled: 1 };
}
function updateAlertSettings(data) {
  mutate('UPDATE alert_settings SET days_before_1 = ?, days_before_2 = ?, days_before_3 = ?, enabled = ? WHERE id = 1', [
    data.days_before_1,
    data.days_before_2,
    data.days_before_3,
    data.enabled ? 1 : 0
  ]);
}
function getUpcomingDeadlines() {
  return query(
    `SELECT c.id as case_id, c.case_number, c.title, c.deadline_date, CAST(ROUND(julianday(c.deadline_date) - julianday('now')) AS INTEGER) as days_remaining FROM cases c WHERE c.deadline_date IS NOT NULL AND c.deadline_date != '' AND c.status != 'closed' AND (c.archived = 0 OR c.archived IS NULL) AND julianday(c.deadline_date) - julianday('now') > -1 ORDER BY days_remaining ASC`
  );
}
function getUpcomingHearings() {
  const fromProcedures = query(
    `SELECT p.id, p.date as hearing_date, p.type, p.description, c.id as case_id, c.case_number, c.title as case_title, CAST(ROUND(julianday(p.date) - julianday('now')) AS INTEGER) as days_remaining FROM procedures p JOIN cases c ON p.affaire_id = c.id WHERE p.date >= date('now') AND c.status != 'closed' AND (c.archived = 0 OR c.archived IS NULL)`
  );
  const fromEvents = query(
    `SELECT e.id, e.date as hearing_date, e.type, e.notes as description, c.id as case_id, c.case_number, c.title as case_title, CAST(ROUND(julianday(e.date) - julianday('now')) AS INTEGER) as days_remaining FROM events e JOIN cases c ON e.case_id = c.id WHERE e.type = 'hearing' AND e.status != 'cancelled' AND e.date >= date('now') AND c.status != 'closed' AND (c.archived = 0 OR c.archived IS NULL)`
  );
  const merged = [...fromProcedures, ...fromEvents];
  merged.sort((a, b) => (a.days_remaining || 0) - (b.days_remaining || 0));
  return merged;
}
function getTodayProcedures() {
  const todayStr = new Date().toISOString().split('T')[0];
  return query(`SELECT p.*, c.case_number, c.title as case_title FROM procedures p JOIN cases c ON p.affaire_id = c.id WHERE p.date = ? ORDER BY p.id ASC`, [
    todayStr
  ]);
}
function getBackupSettings() {
  const rows = query('SELECT * FROM backup_settings WHERE id = 1');
  return rows.length ? rows[0] : { auto_enabled: 1, frequency_hours: 24, keep_count: 30, last_backup_at: null };
}
function updateBackupSettings(data) {
  mutate('UPDATE backup_settings SET auto_enabled = ?, frequency_hours = ?, keep_count = ? WHERE id = 1', [
    data.auto_enabled ? 1 : 0,
    data.frequency_hours,
    data.keep_count
  ]);
}

function isManualBackup(filename) {
  return filename.startsWith('manual_') || filename.startsWith('backup_') || filename.startsWith('archive_');
}
function isAutoBackup(filename) {
  return filename.startsWith('auto_') && !filename.startsWith('auto_backup_');
}

function createBackup(reason) {
  const data = db.export();
  const buffer = encryptDbBuffer(Buffer.from(data));
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts =
    now.getFullYear() +
    '-' +
    pad(now.getMonth() + 1) +
    '-' +
    pad(now.getDate()) +
    '_' +
    pad(now.getHours()) +
    '-' +
    pad(now.getMinutes()) +
    '-' +
    pad(now.getSeconds());
  const isManual = reason === 'manual' || reason === 'export';
  const prefix = isManual ? 'manual' : 'auto';
  const suffix = isManual ? '' : '_' + reason;
  const filename = prefix + '_' + ts + suffix + '.db';
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  mutate('UPDATE backup_settings SET last_backup_at = ? WHERE id = 1', [now.toISOString()]);
  const settings = getBackupSettings();
  const maxKeep = settings.keep_count || 30;
  const allAutoFiles = fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db') && isAutoBackup(f))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (allAutoFiles.length > maxKeep) {
    allAutoFiles.slice(maxKeep).forEach(f => {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, f.name));
      } catch (e) {
        /* best effort */
      }
    });
  }
  return filename;
}

function listBackups() {
  return fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      let type = 'unknown';
      if (isManualBackup(f)) type = 'manual';
      else if (isAutoBackup(f)) type = 'auto';
      else if (f.startsWith('auto_backup_')) type = 'crash';
      return { name: f, size: stat.size, mtime: stat.mtime.toISOString(), type };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

function restoreFromBuffer(buffer) {
  if (buffer.length > 100 * 1024 * 1024) throw new Error('الملف كبير جداً (أقصى 100MB) / Fichier trop volumineux (max 100MB)');
  const newDb = new SQL.Database(buffer);
  const tables = newDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.length > 0 ? tables[0].values.map(v => v[0]) : [];
  if (!tableNames.includes('cases') || !tableNames.includes('clients')) throw new Error('ملف غير صالح - الجداول الأساسية مفقودة / Fichier invalide');
  db = newDb;
  db.run('PRAGMA foreign_keys = ON;');
  saveDb();
}

function exportTableCSV(tableName) {
  var sql;
  switch (tableName) {
    case 'cases':
      sql = 'SELECT * FROM cases';
      break;
    case 'clients':
      sql = 'SELECT * FROM clients';
      break;
    default:
      throw new Error('الجدول غير مدعوم للتصدير / Table non prise en charge');
  }
  const rows = query(sql);
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCSV = val => {
    const s = val == null ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(escapeCSV).join(',')];
  rows.forEach(row => lines.push(headers.map(h => escapeCSV(row[h])).join(',')));
  return lines.join('\n');
}

function validateBackupFile(filename) {
  if (!filename || typeof filename !== 'string') throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const safeName = path.basename(filename);
  if (safeName !== filename) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, safeName);
  if (path.resolve(filepath) !== filepath) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  const stat = fs.statSync(filepath);
  if (stat.size === 0) throw new Error('الملف فارغ / Fichier vide');
  if (stat.size > 100 * 1024 * 1024) throw new Error('الملف كبير جداً / Fichier trop volumineux');
  const buffer = decryptDbBuffer(fs.readFileSync(filepath));
  try {
    const testDb = new SQL.Database(buffer);
    const tables = testDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.length > 0 ? tables[0].values.map(v => v[0]) : [];
    if (!tableNames.includes('cases') || !tableNames.includes('clients')) throw new Error('الجداول الأساسية مفقودة');
    const integ = testDb.exec('PRAGMA integrity_check');
    const ok = integ.length > 0 && integ[0].values[0][0] === 'ok';
    testDb.close();
    return { valid: ok, tables: tableNames, tableCount: tableNames.length, size: stat.size, mtime: stat.mtime.toISOString(), filename };
  } catch (e) {
    if (e.message === 'الجداول الأساسية مفقودة') throw e;
    throw new Error('ملف تالف / Fichier corrompu: ' + e.message);
  }
}

function deleteBackupFile(filename) {
  if (!filename || typeof filename !== 'string') throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const safeName = path.basename(filename);
  if (safeName !== filename) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, safeName);
  if (path.resolve(filepath) !== filepath) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  // Validate integrity before deletion to warn about corrupt backups
  let validation = null;
  try {
    validation = validateBackupFile(safeName);
  } catch (e) {
    validation = { valid: false, error: e.message };
  }
  fs.unlinkSync(filepath);
  return { ok: true, validation: validation ? { valid: validation.valid } : null };
}

function restoreFromBackup(filename) {
  if (!filename || typeof filename !== 'string') throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const safeName = path.basename(filename);
  if (safeName !== filename) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, safeName);
  if (path.resolve(filepath) !== filepath) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  // Validate integrity before restore
  const validation = validateBackupFile(safeName);
  if (!validation.valid) throw new Error('النسخة الاحتياطية تالفة / Fichier de sauvegarde corrompu');
  const buffer = decryptDbBuffer(fs.readFileSync(filepath));
  restoreFromBuffer(buffer);
  return { ok: true, time: new Date().toISOString() };
}

function exportFullArchive() {
  const data = db.export();
  const buffer = encryptDbBuffer(Buffer.from(data));
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '_' + pad(now.getHours()) + '-' + pad(now.getMinutes());
  const filename = 'archive_' + ts + '.db';
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const meta = {
    timestamp: now.toISOString(),
    version: '2.0',
    stats: { cases: getAllCases().length, clients: getAllClients().length, tasks: getAllTasks().length, events: getAllEvents().length }
  };
  return { filename, size: buffer.length, meta };
}

function getClientsWithUnpaidBalance() {
  return query(`
    SELECT cl.id, cl.name,
      COALESCE(SUM(c.total_fees),0) - COALESCE(SUM(c.paid_fees),0) as balance
    FROM clients cl
    LEFT JOIN cases c ON c.client_id = cl.id
    GROUP BY cl.id
    HAVING balance > 0
  `);
}

function getCaseById(id) {
  if (!id || typeof id !== 'number') return null;
  const rows = query('SELECT * FROM cases WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

function getClientById(id) {
  if (!id || typeof id !== 'number') return null;
  const rows = query('SELECT * FROM clients WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

function revokeToken(jti, expiry) {
  if (!jti || typeof jti !== 'string') return;
  try {
    query('INSERT OR IGNORE INTO revoked_tokens (jti, expiry) VALUES (?, ?)', [jti, expiry]);
    queueSave();
  } catch (e) {
    console.error('revokeToken error:', e);
  }
}

function isTokenRevoked(jti) {
  if (!jti || typeof jti !== 'string') return true;
  try {
    const rows = query('SELECT 1 FROM revoked_tokens WHERE jti = ?', [jti]);
    return rows.length > 0;
  } catch (e) {
    return true;
  }
}

function cleanExpiredRevokedTokens() {
  try {
    query('DELETE FROM revoked_tokens WHERE expiry < ?', [Date.now()]);
  } catch (e) {
    console.error('cleanExpiredRevokedTokens error:', e);
  }
}

module.exports = {
  initDb,
  saveDb,
  saveDbSync,
  setEncryptionKey,
  getAllCases,
  addCase,
  deleteCase,
  getCasesByClient,
  getAllClients,
  addClient,
  deleteClient,
  updateClient,
  validateRef,
  getAllTasks,
  getTask,
  addTask,
  updateTask,
  deleteTask,
  getSubtasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getComments,
  addComment,
  getAllWorkflows,
  getWorkflow,
  addWorkflow,
  deleteWorkflow,
  applyWorkflow,
  getAllTemplates,
  addTemplate,
  deleteTemplate,
  applyTemplate,
  getTaskAnalytics,
  getDashboardStats,
  getDashboardExtendedStats,
  STORAGE_DIR,
  getDocuments,
  getAllDocuments,
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getAllEvents,
  getEvent,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventsByCase,
  getProcedures,
  addProcedure,
  getPaiements,
  addPaiement,
  getTodayProcedures,
  getAlertSettings,
  updateAlertSettings,
  getUpcomingDeadlines,
  getUpcomingHearings,
  getBackupSettings,
  updateBackupSettings,
  createBackup,
  addDocumentText,
  getDocumentText,
  getDocumentAnalysis,
  saveDocumentAnalysis,
  globalSearch,
  getSearchIndex,
  syncSearchIndex,
  rebuildSearchIndex,
  addCommunication,
  getClientCommunications,
  getAllCommunications,
  addLog,
  getLogs,
  listBackups,
  validateBackupFile,
  deleteBackupFile,
  restoreFromBackup,
  exportFullArchive,
  getChartData,
  updateCaseStatus,
  updateCaseNotes,
  archiveCase,
  unarchiveCase,
  archiveClient,
  unarchiveClient,
  autoArchive,
  getArchivedCases,
  updateHonorairesTotaux,
  getUsers,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  getUserById,
  getPasswordHashForUser,
  updateOwnProfile,
  setSecurityQuestions,
  getSecurityQuestions,
  getSecurityAnswer,
  integrityCheck,
  repairOrphans,
  transaction,
  checkPermission,
  getPermissions,
  getOfficeSetting,
  setOfficeSetting,
  getEventsByDate,
  getTomorrowHearings,
  isSent,
  markSent,
  cleanOldSentNotifications,
  cleanOrphanedFiles,
  getClientsWithUnpaidBalance,
  getCaseById,
  getClientById,
  revokeToken,
  isTokenRevoked,
  cleanExpiredRevokedTokens,
  flushWrites
};
