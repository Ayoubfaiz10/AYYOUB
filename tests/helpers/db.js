const initSqlJs = require('sql.js');

let SQL = null;

async function createDb() {
  if (!SQL) SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');

  db.run('CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts4(case_id, title, content, tags)');

  db.run(
    "CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, notes TEXT, national_id TEXT, tags TEXT, status TEXT DEFAULT 'active')"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS cases (id INTEGER PRIMARY KEY AUTOINCREMENT, case_number TEXT NOT NULL, title TEXT NOT NULL, client_name TEXT, client_id INTEGER, court TEXT, status TEXT DEFAULT 'active', description TEXT, created_date TEXT DEFAULT (date('now')), next_hearing TEXT, deadline_date TEXT, total_fees REAL DEFAULT 0, paid_fees REAL DEFAULT 0, expenses REAL DEFAULT 0, priority TEXT DEFAULT 'medium', case_type TEXT DEFAULT 'مدني', notes TEXT, archived INTEGER DEFAULT 0, honoraires_totaux REAL DEFAULT 0, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '', priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'todo', due_date TEXT, notes TEXT, case_id INTEGER, client_id INTEGER, tags TEXT DEFAULT '', assigned_to TEXT DEFAULT '', attachments TEXT DEFAULT '[]', parent_id INTEGER, depends_on TEXT DEFAULT '[]', progress INTEGER DEFAULT 0, time_tracked INTEGER DEFAULT 0, workflow_id INTEGER, template_id INTEGER, archived INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')), FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL, FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE SET NULL)"
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS subtasks (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL, title TEXT NOT NULL, done INTEGER DEFAULT 0, FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE)'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS task_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL, author TEXT DEFAULT 'المحامي', text TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now','localtime')), FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS workflows (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', case_type TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now','localtime')))"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS workflow_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, workflow_id INTEGER NOT NULL, title TEXT NOT NULL, step_order INTEGER DEFAULT 0, due_days INTEGER DEFAULT 0, assigned_role TEXT DEFAULT '', FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS task_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', tasks_json TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now','localtime')))"
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, date TEXT, time TEXT, location TEXT, notes TEXT, case_id INTEGER, FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL)'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, filename TEXT NOT NULL, file_path TEXT NOT NULL, doc_type TEXT NOT NULL, tags TEXT DEFAULT '', notes TEXT DEFAULT '', file_size TEXT DEFAULT '', upload_date TEXT DEFAULT (datetime('now', 'localtime')), visibility TEXT DEFAULT 'case', FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE)"
  );
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
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'admin', avatar TEXT DEFAULT '', active INTEGER DEFAULT 1, last_login TEXT, created_at TEXT DEFAULT (datetime('now','localtime')))"
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, permission TEXT NOT NULL, allowed INTEGER DEFAULT 1, UNIQUE(role, permission))'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS case_permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, user_id INTEGER, role TEXT DEFAULT '', access_level TEXT DEFAULT 'team', FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE)"
  );
  db.run('CREATE TABLE IF NOT EXISTS office_settings (key TEXT PRIMARY KEY, value TEXT)');
  db.run(
    'CREATE TABLE IF NOT EXISTS security_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, question_index INTEGER NOT NULL, question TEXT NOT NULL, answer_hash TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(user_id, question_index))'
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER DEFAULT 0, user_name TEXT DEFAULT '', action TEXT NOT NULL, details TEXT, created_at TEXT DEFAULT (datetime('now', 'localtime')))"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER, client_id INTEGER, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'meeting', status TEXT NOT NULL DEFAULT 'scheduled', date TEXT NOT NULL, time TEXT, end_time TEXT, court TEXT, judge TEXT, room TEXT, notes TEXT, outcome TEXT, urgency TEXT DEFAULT 'medium', recurring_type TEXT DEFAULT 'none', recurring_end_date TEXT, all_day INTEGER DEFAULT 0, alert_sent_7d INTEGER DEFAULT 0, alert_sent_3d INTEGER DEFAULT 0, alert_sent_1d INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')), FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL)"
  );

  // Seed default permissions
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

  db.run('INSERT OR IGNORE INTO alert_settings (id, days_before_1, days_before_2, days_before_3, enabled) VALUES (1, 7, 3, 1, 1)');
  db.run('INSERT OR IGNORE INTO backup_settings (id, auto_enabled, frequency_hours, keep_count, last_backup_at) VALUES (1, 1, 24, 30, NULL)');
  db.run("INSERT OR IGNORE INTO users (id, name, email, role, active) VALUES (1, 'المحامي المدير', 'admin@cabinet.ma', 'admin', 1)");

  return db;
}

function query(db, sql, params) {
  try {
    if (params) {
      const stmt = db.prepare(sql);
      stmt.bind(params.map(v => (v === undefined ? null : v)));
      const results = [];
      while (stmt.step()) results.push(stmt.getAsObject());
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
    throw err;
  }
}

function mutate(db, sql, params) {
  db.run(sql, params ? params.map(v => (v === undefined ? null : v)) : []);
}

function runTransaction(db, fn) {
  try {
    db.run('BEGIN TRANSACTION');
    const result = fn(db);
    db.run('COMMIT');
    return result;
  } catch (err) {
    try {
      db.run('ROLLBACK');
    } catch (e) {
      /* ignore */
    }
    throw err;
  }
}

function validateRef(db, table, id) {
  if (!id) return true;
  const allowed = { cases: 'cases', clients: 'clients', tasks: 'tasks', events: 'events', documents: 'documents' };
  if (!allowed[table]) return false;
  const rows = query(db, `SELECT 1 FROM ${allowed[table]} WHERE id = ?`, [id]);
  return rows.length > 0;
}

function getChanges(db) {
  return db.exec('SELECT changes() as c')[0]?.values[0]?.[0] || 0;
}

function setSecurityQuestions(db, userId, questions) {
  mutate(db, 'DELETE FROM security_questions WHERE user_id=?', [userId]);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    mutate(db, 'INSERT OR IGNORE INTO security_questions (user_id, question_index, question, answer_hash) VALUES (?, ?, ?, ?)', [
      userId,
      i + 1,
      q.question,
      q.answerHash
    ]);
  }
}
function getSecurityQuestions(db, userId) {
  return query(db, 'SELECT question_index, question FROM security_questions WHERE user_id=? ORDER BY question_index', [userId]);
}
function getSecurityAnswer(db, userId, questionIndex) {
  const r = query(db, 'SELECT answer_hash FROM security_questions WHERE user_id=? AND question_index=?', [userId, questionIndex]);
  return r.length ? r[0].answer_hash : null;
}

module.exports = { createDb, query, mutate, runTransaction, validateRef, getChanges, setSecurityQuestions, getSecurityQuestions, getSecurityAnswer };
