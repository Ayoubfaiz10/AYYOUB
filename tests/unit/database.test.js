const assert = require('node:assert/strict');
const { createDb, query, mutate, runTransaction, validateRef } = require('../helpers/db');

/** Helper to count rows in a table */
function countRows(db, table) {
  const r = query(db, `SELECT COUNT(*) as c FROM ${table}`);
  return r[0]?.c || 0;
}

describe('Database Schema', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('creates all 17 tables', () => {
    const tables = query(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'search_index_%' ORDER BY name");
    const names = tables.map(t => t.name).sort();
    assert.ok(names.includes('clients'));
    assert.ok(names.includes('cases'));
    assert.ok(names.includes('tasks'));
    assert.ok(names.includes('events'));
    assert.ok(names.includes('documents'));
    assert.ok(names.includes('subtasks'));
    assert.ok(names.includes('task_comments'));
    assert.ok(names.includes('workflows'));
    assert.ok(names.includes('workflow_steps'));
    assert.ok(names.includes('task_templates'));
    assert.ok(names.includes('appointments'));
    assert.ok(names.includes('procedures'));
    assert.ok(names.includes('paiements'));
    assert.ok(names.includes('alert_settings'));
    assert.ok(names.includes('backup_settings'));
    assert.ok(names.includes('document_text'));
    assert.ok(names.includes('jugements'));
    assert.ok(names.includes('communications'));
    assert.ok(names.includes('users'));
    assert.ok(names.includes('permissions'));
    assert.ok(names.includes('case_permissions'));
    assert.ok(names.includes('activity_log'));
    assert.ok(names.includes('search_index'));
    assert.equal(names.length, 25); // 17 business + 5 aux + 1 FTS4 + 1 office_settings + 1 user_pin
  });

  it('seeds default admin user', () => {
    const users = query(db, "SELECT * FROM users WHERE email = 'admin@cabinet.ma'");
    assert.equal(users.length, 1);
    assert.equal(users[0].name, 'المحامي المدير');
    assert.equal(users[0].role, 'admin');
  });

  it('seeds default permissions', () => {
    const perms = query(db, 'SELECT DISTINCT role FROM permissions ORDER BY role');
    const roles = perms.map(p => p.role);
    assert.ok(roles.includes('admin'));
    assert.ok(roles.includes('senior_lawyer'));
    assert.ok(roles.includes('junior_lawyer'));
    assert.ok(roles.includes('assistant'));
    assert.ok(roles.includes('intern'));
    assert.ok(roles.includes('external'));
  });

  it('seeds alert_settings and backup_settings', () => {
    assert.equal(countRows(db, 'alert_settings'), 1);
    assert.equal(countRows(db, 'backup_settings'), 1);
  });
});

describe('query()', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('returns empty array for empty table', () => {
    assert.deepEqual(query(db, 'SELECT * FROM clients'), []);
  });

  it('returns data from seeded tables', () => {
    const result = query(db, 'SELECT name FROM users WHERE id = 1');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'المحامي المدير');
  });

  it('handles parameterized queries', () => {
    const result = query(db, 'SELECT * FROM users WHERE role = ?', ['admin']);
    assert.equal(result.length, 1);
  });

  it('handles undefined params as null', () => {
    const result = query(db, 'SELECT * FROM users WHERE last_login = ?', [undefined]);
    assert.equal(result.length, 0); // null never matches
  });
});

describe('mutate()', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('inserts a row and returns changes', () => {
    mutate(db, 'INSERT INTO clients (name, phone) VALUES (?, ?)', ['Test Client', '0612345678']);
    assert.equal(countRows(db, 'clients'), 1);
  });

  it('updates a row', () => {
    mutate(db, 'UPDATE clients SET phone = ? WHERE name = ?', ['0600000000', 'Test Client']);
    const c = query(db, "SELECT phone FROM clients WHERE name = 'Test Client'");
    assert.equal(c[0].phone, '0600000000');
  });

  it('deletes a row', () => {
    mutate(db, 'DELETE FROM clients WHERE name = ?', ['Test Client']);
    assert.equal(countRows(db, 'clients'), 0);
  });

  it('handles undefined params as null', () => {
    mutate(db, 'INSERT INTO clients (name, phone) VALUES (?, ?)', ['Null Phone', undefined]);
    const c = query(db, "SELECT phone FROM clients WHERE name = 'Null Phone'");
    assert.equal(c[0].phone, null);
  });
});

describe('transaction()', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('commits all operations on success', () => {
    runTransaction(db, d => {
      mutate(d, 'INSERT INTO clients (name) VALUES (?)', ['Txn Client 1']);
      mutate(d, 'INSERT INTO clients (name) VALUES (?)', ['Txn Client 2']);
    });
    assert.equal(countRows(db, 'clients'), 2);
  });

  it('rolls back on error', () => {
    assert.throws(() => {
      runTransaction(db, d => {
        mutate(d, 'INSERT INTO clients (name) VALUES (?)', ['Rollback Test']);
        throw new Error('force rollback');
      });
    });
    assert.equal(countRows(db, 'clients'), 2); // still 2, not 3
  });

  it('preserves foreign key constraints', () => {
    assert.throws(() => {
      runTransaction(db, d => {
        mutate(d, 'INSERT INTO cases (case_number, title, client_id) VALUES (?, ?, ?)', ['FK-001', 'Test Case', 99999]);
      });
    });
  });
});

describe('validateRef()', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('returns true for existing reference', () => {
    mutate(db, 'INSERT INTO clients (name) VALUES (?)', ['Ref Test']);
    const c = query(db, "SELECT id FROM clients WHERE name = 'Ref Test'");
    assert.equal(validateRef(db, 'clients', c[0].id), true);
  });

  it('returns false for non-existent reference', () => {
    assert.equal(validateRef(db, 'clients', 99999), false);
  });

  it('returns true for null/undefined id', () => {
    assert.equal(validateRef(db, 'clients', null), true);
    assert.equal(validateRef(db, 'clients', undefined), true);
  });

  it('returns false for invalid table name', () => {
    assert.equal(validateRef(db, 'nonexistent', 1), false);
  });

  it('validates all allowed tables', () => {
    mutate(db, "INSERT INTO clients (name) VALUES ('v')", []);
    mutate(db, "INSERT INTO cases (case_number, title, client_id) VALUES ('C001', 'v', (SELECT id FROM clients LIMIT 1))", []);
    mutate(db, "INSERT INTO tasks (title, case_id) VALUES ('v', (SELECT id FROM cases LIMIT 1))", []);
    mutate(db, "INSERT INTO events (title, date, case_id) VALUES ('v', '2026-01-01', (SELECT id FROM cases LIMIT 1))", []);
    mutate(db, "INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES ((SELECT id FROM cases LIMIT 1), 'f.pdf', '/tmp/f.pdf', 'Contract')", []);
    assert.equal(validateRef(db, 'cases', query(db, 'SELECT id FROM cases LIMIT 1')[0].id), true);
    assert.equal(validateRef(db, 'tasks', query(db, 'SELECT id FROM tasks LIMIT 1')[0].id), true);
    assert.equal(validateRef(db, 'events', query(db, 'SELECT id FROM events LIMIT 1')[0].id), true);
    assert.equal(validateRef(db, 'documents', query(db, 'SELECT id FROM documents LIMIT 1')[0].id), true);
  });
});

describe('Users CRUD', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('inserts a user', () => {
    mutate(db, 'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)', ['Test User', 'test@law.ma', 'junior_lawyer', '$2a$12$hash']);
    assert.equal(countRows(db, 'users'), 2);
  });

  it('prevents duplicate email', () => {
    assert.throws(() => {
      mutate(db, 'INSERT INTO users (name, email) VALUES (?, ?)', ['Dup', 'test@law.ma']);
    });
  });

  it('updates user', () => {
    mutate(db, 'UPDATE users SET role = ? WHERE email = ?', ['senior_lawyer', 'test@law.ma']);
    const u = query(db, "SELECT role FROM users WHERE email = 'test@law.ma'");
    assert.equal(u[0].role, 'senior_lawyer');
  });

  it('deletes user', () => {
    mutate(db, 'DELETE FROM users WHERE email = ?', ['test@law.ma']);
    assert.equal(countRows(db, 'users'), 1);
  });
});

describe('Foreign Key Enforcement', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('rejects case with non-existent client_id', () => {
    assert.throws(() => {
      mutate(db, 'INSERT INTO cases (case_number, title, client_id) VALUES (?, ?, ?)', ['C001', 'Case', 999]);
    });
  });

  it('rejects document with non-existent case_id', () => {
    assert.throws(() => {
      mutate(db, 'INSERT INTO documents (case_id, filename, file_path, doc_type) VALUES (?, ?, ?, ?)', [999, 'f.pdf', '/tmp/f.pdf', 'Contract']);
    });
  });

  it('rejects task with non-existent parent_id', () => {
    assert.throws(() => {
      mutate(db, 'INSERT INTO tasks (title, parent_id) VALUES (?, ?)', ['Subtask', 999]);
    });
  });

  it('allows null foreign keys', () => {
    mutate(db, 'INSERT INTO cases (case_number, title) VALUES (?, ?)', ['C-NULL', 'No Client']);
    assert.equal(countRows(db, 'cases'), 1);
  });
});

describe('Activity Log', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('inserts log entries', () => {
    mutate(db, 'INSERT INTO activity_log (action, details) VALUES (?, ?)', ['test_action', 'Test log entry']);
    assert.equal(countRows(db, 'activity_log'), 1);
  });

  it('queries logs with ordering', () => {
    mutate(db, 'INSERT INTO activity_log (action, details) VALUES (?, ?)', ['second', 'Second entry']);
    const logs = query(db, 'SELECT * FROM activity_log ORDER BY id DESC');
    assert.equal(logs.length, 2);
    assert.equal(logs[0].action, 'second');
  });
});
