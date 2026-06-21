const initSqlJs = require('sql.js');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
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

function getDb() { return db; }
function getSQL() { return SQL; }
function setDb(newDb) { db = newDb; }

async function saveDb() {
  try {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    await fsp.writeFile(DB_PATH, buffer);
    console.log('DB saved successfully. Size:', buffer.length);
  } catch (err) {
    console.error('DB save error:', err);
  }
}

async function initDb() {
  SQL = await initSqlJs({
    locateFile: file => path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file)
  });

  console.log('DB_PATH:', DB_PATH);

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing DB, size:', fileBuffer.length);
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory DB');
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run('CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, notes TEXT, national_id TEXT, tags TEXT, status TEXT DEFAULT \'active\')');
  try { db.run("ALTER TABLE clients ADD COLUMN national_id TEXT"); } catch(e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN tags TEXT"); } catch(e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active'"); } catch(e) {}
  db.run('CREATE TABLE IF NOT EXISTS cases (id INTEGER PRIMARY KEY AUTOINCREMENT, case_number TEXT NOT NULL, title TEXT NOT NULL, client_name TEXT, client_id INTEGER, court TEXT, status TEXT DEFAULT \'active\', description TEXT, created_date TEXT DEFAULT (date(\'now\')), next_hearing TEXT, deadline_date TEXT, total_fees REAL DEFAULT 0, paid_fees REAL DEFAULT 0, expenses REAL DEFAULT 0, priority TEXT DEFAULT \'medium\', case_type TEXT DEFAULT \'مدني\', notes TEXT, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL)');

  try { db.run("ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'medium'"); } catch(e) {}
  try { db.run("ALTER TABLE cases ADD COLUMN case_type TEXT DEFAULT 'مدني'"); } catch(e) {}
  try { db.run("ALTER TABLE cases ADD COLUMN notes TEXT"); } catch(e) {}
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
  try { db.run("ALTER TABLE tasks ADD COLUMN case_id INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN client_id INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN description TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN tags TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN assigned_to TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN attachments TEXT DEFAULT '[]'"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN parent_id INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN depends_on TEXT DEFAULT '[]'"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN time_tracked INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN workflow_id INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN template_id INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN created_at TEXT"); } catch(e) {}
  try { db.run("ALTER TABLE tasks ADD COLUMN updated_at TEXT"); } catch(e) {}

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
  db.run('CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, date TEXT, time TEXT, location TEXT, notes TEXT, case_id INTEGER, FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL)');
  db.run('CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, filename TEXT NOT NULL, file_path TEXT NOT NULL, doc_type TEXT NOT NULL, tags TEXT DEFAULT \'\', notes TEXT DEFAULT \'\', file_size TEXT DEFAULT \'\', upload_date TEXT DEFAULT (datetime(\'now\', \'localtime\')), FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE)');
  try { db.run("ALTER TABLE documents ADD COLUMN tags TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE documents ADD COLUMN notes TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE documents ADD COLUMN file_size TEXT DEFAULT ''"); } catch(e) {}
  db.run('CREATE TABLE IF NOT EXISTS procedures (id INTEGER PRIMARY KEY AUTOINCREMENT, affaire_id INTEGER NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, description TEXT, created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')), FOREIGN KEY (affaire_id) REFERENCES cases(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS paiements (id INTEGER PRIMARY KEY AUTOINCREMENT, affaire_id INTEGER NOT NULL, date TEXT NOT NULL, montant REAL NOT NULL, mode_paiement TEXT NOT NULL, remarque TEXT, created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')), FOREIGN KEY (affaire_id) REFERENCES cases(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS alert_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, days_before_1 INTEGER DEFAULT 7, days_before_2 INTEGER DEFAULT 3, days_before_3 INTEGER DEFAULT 1, enabled INTEGER DEFAULT 1)');
  db.run('CREATE TABLE IF NOT EXISTS backup_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, auto_enabled INTEGER DEFAULT 1, frequency_hours INTEGER DEFAULT 24, keep_count INTEGER DEFAULT 30, last_backup_at TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS document_text (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER UNIQUE NOT NULL, extracted_text TEXT, indexed_at TEXT DEFAULT (datetime(\'now\', \'localtime\')), FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS jugements (id INTEGER PRIMARY KEY AUTOINCREMENT, case_number TEXT, sujet TEXT NOT NULL, cour TEXT, annee INTEGER, mots_cles TEXT, contenu TEXT NOT NULL, date_jugement TEXT, created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')))');
  db.run('CREATE TABLE IF NOT EXISTS communications (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, case_id INTEGER, type TEXT NOT NULL, date TEXT NOT NULL, summary TEXT, created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')), FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL, FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL)');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'admin',
    avatar TEXT DEFAULT '', active INTEGER DEFAULT 1,
    last_login TEXT, created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active) VALUES (1, 'المحامي المدير', 'admin@cabinet.ma', '', 'admin', 1)`);
  try { db.run("ALTER TABLE users ADD COLUMN last_login TEXT"); } catch(e) {}
  db.run(`CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL,
    permission TEXT NOT NULL, allowed INTEGER DEFAULT 1,
    UNIQUE(role, permission)
  )`);
  const defaultPerms = {
    admin: ['view_case','edit_case','delete_case','upload_doc','view_finance','manage_tasks','use_ai','export_data','manage_users','view_audit'],
    senior_lawyer: ['view_case','edit_case','delete_case','upload_doc','view_finance','manage_tasks','use_ai','export_data'],
    junior_lawyer: ['view_case','edit_case','upload_doc','manage_tasks','use_ai'],
    assistant: ['view_case','upload_doc','manage_tasks','view_calendar'],
    intern: ['view_case'],
    external: ['view_case']
  };
  for (const [role, perms] of Object.entries(defaultPerms)) {
    perms.forEach(p => {
      try { db.run('INSERT OR IGNORE INTO permissions (role, permission, allowed) VALUES (?, ?, 1)', [role, p]); } catch(e) {}
    });
  }
  db.run(`CREATE TABLE IF NOT EXISTS case_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL,
    user_id INTEGER, role TEXT DEFAULT '',
    access_level TEXT DEFAULT 'team',
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  )`);
  try { db.run("ALTER TABLE cases ADD COLUMN access_level TEXT DEFAULT 'team'"); } catch(e) {}
  try { db.run("ALTER TABLE documents ADD COLUMN visibility TEXT DEFAULT 'case'"); } catch(e) {}

  db.run('CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER DEFAULT 0, user_name TEXT DEFAULT \'\', action TEXT NOT NULL, details TEXT, created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')))');
  try { db.run("ALTER TABLE activity_log ADD COLUMN user_id INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE activity_log ADD COLUMN user_name TEXT DEFAULT ''"); } catch(e) {}
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
  try { db.run("ALTER TABLE events ADD COLUMN alert_sent_7d INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE events ADD COLUMN alert_sent_3d INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE events ADD COLUMN alert_sent_1d INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE events ADD COLUMN updated_at TEXT"); } catch(e) {}

  try {
    const cols = db.exec("PRAGMA table_info('cases')");
    if (cols.length > 0) {
      const hasClientId = cols[0].values.some(v => v[1] === 'client_id');
      if (!hasClientId) {
        db.run("ALTER TABLE cases ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL");
        console.log('Added client_id column');
      }
    }

    const caseCols = db.exec("PRAGMA table_info('cases')");
    if (caseCols.length > 0) {
      if (!caseCols[0].values.some(v => v[1] === 'deadline_date')) {
        db.run("ALTER TABLE cases ADD COLUMN deadline_date TEXT");
        console.log('Added deadline_date column');
      }
      const hasTotalFees = caseCols[0].values.some(v => v[1] === 'total_fees');
      if (!hasTotalFees) {
        db.run("ALTER TABLE cases ADD COLUMN total_fees REAL DEFAULT 0");
        db.run("ALTER TABLE cases ADD COLUMN paid_fees REAL DEFAULT 0");
        db.run("ALTER TABLE cases ADD COLUMN expenses REAL DEFAULT 0");
        console.log('Added financial columns to cases');
      }
      const hasHonorairesTotaux = caseCols[0].values.some(v => v[1] === 'honoraires_totaux');
      if (!hasHonorairesTotaux) {
        db.run("ALTER TABLE cases ADD COLUMN honoraires_totaux REAL DEFAULT 0");
        db.run("UPDATE cases SET honoraires_totaux = total_fees WHERE honoraires_totaux = 0 AND total_fees > 0");
        console.log('Added honoraires_totaux column');
      }
      const hasArchived = caseCols[0].values.some(v => v[1] === 'archived');
      if (!hasArchived) {
        db.run("ALTER TABLE cases ADD COLUMN archived INTEGER DEFAULT 0");
        console.log('Added archived column');
      }
    }

    const appCols = db.exec("PRAGMA table_info('appointments')");
    if (appCols.length > 0) {
      const hasCaseId = appCols[0].values.some(v => v[1] === 'case_id');
      if (!hasCaseId) {
        db.run("ALTER TABLE appointments ADD COLUMN case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL");
        console.log('Added case_id column to appointments');
      }
    }

    db.run("INSERT OR IGNORE INTO alert_settings (id, days_before_1, days_before_2, days_before_3, enabled) VALUES (1, 7, 3, 1, 1)");
    db.run("INSERT OR IGNORE INTO backup_settings (id, auto_enabled, frequency_hours, keep_count, last_backup_at) VALUES (1, 1, 24, 30, NULL)");
  } catch (e) {
    console.error("Schema update warning:", e);
  }

  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_cases_created_date ON cases(created_date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(case_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_events_case ON events(case_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at)');
  } catch (e) {
    console.warn('Index creation warning:', e.message);
  }

  await saveDb();
}

module.exports = { initDb, saveDb, getDb, getSQL, setDb, DB_PATH, STORAGE_DIR, BACKUP_DIR };
