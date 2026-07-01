const assert = require('node:assert/strict');
const { createDb, query, mutate, runTransaction } = require('../helpers/db');

function countRows(db, table) {
  const r = query(db, `SELECT COUNT(*) as c FROM ${table}`);
  return r[0]?.c || 0;
}

describe('Tasks CRUD', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('inserts a task with minimum fields', () => {
    mutate(db, 'INSERT INTO tasks (title) VALUES (?)', ['مهمة بسيطة']);
    const t = query(db, "SELECT * FROM tasks WHERE title = 'مهمة بسيطة'");
    assert.equal(t.length, 1);
    assert.equal(t[0].status, 'todo');
    assert.equal(t[0].priority, 'medium');
  });

  it('inserts a task with all fields', () => {
    mutate(
      db,
      `INSERT INTO tasks (title, description, priority, status, due_date, tags, assigned_to, progress, time_tracked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['مهمة كاملة', 'وصف المهمة', 'high', 'in_progress', '2026-12-31', 'قانوني, عاجل', 'المحامي', 50, 3600]
    );
    const t = query(db, "SELECT * FROM tasks WHERE title = 'مهمة كاملة'");
    assert.equal(t[0].priority, 'high');
    assert.equal(t[0].status, 'in_progress');
    assert.equal(t[0].progress, 50);
  });

  it('updates a task', () => {
    const tId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة بسيطة'")[0].id;
    mutate(db, "UPDATE tasks SET status = ?, priority = ?, updated_at = datetime('now','localtime') WHERE id = ?", ['done', 'low', tId]);
    const t = query(db, 'SELECT * FROM tasks WHERE id = ?', [tId]);
    assert.equal(t[0].status, 'done');
  });

  it('deletes a task with cascade', () => {
    const tId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة كاملة'")[0].id;
    mutate(db, 'INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [tId, 'فرعية 1']);
    mutate(db, 'INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [tId, 'فرعية 2']);
    mutate(db, 'INSERT INTO task_comments (task_id, text) VALUES (?, ?)', [tId, 'تعليق']);
    runTransaction(db, d => {
      mutate(d, 'UPDATE tasks SET parent_id = NULL WHERE parent_id = ?', [tId]);
      mutate(d, 'DELETE FROM subtasks WHERE task_id = ?', [tId]);
      mutate(d, 'DELETE FROM task_comments WHERE task_id = ?', [tId]);
      mutate(d, 'DELETE FROM tasks WHERE id = ?', [tId]);
    });
    assert.equal(countRows(db, 'tasks'), 1);
    assert.equal(countRows(db, 'subtasks'), 0);
    assert.equal(countRows(db, 'task_comments'), 0);
  });
});

describe('Subtasks', () => {
  let db, taskId;
  before(async () => {
    db = await createDb();
    mutate(db, 'INSERT INTO tasks (title) VALUES (?)', ['مهمة بفرعيات']);
    taskId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة بفرعيات'")[0].id;
  });

  it('adds subtasks', () => {
    mutate(db, 'INSERT INTO subtasks (task_id, title, done) VALUES (?, ?, 0)', [taskId, 'فرعية 1']);
    mutate(db, 'INSERT INTO subtasks (task_id, title, done) VALUES (?, ?, 0)', [taskId, 'فرعية 2']);
    mutate(db, 'INSERT INTO subtasks (task_id, title, done) VALUES (?, ?, 0)', [taskId, 'فرعية 3']);
    const subs = query(db, 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC', [taskId]);
    assert.equal(subs.length, 3);
  });

  it('toggles subtask completion', () => {
    const subId = query(db, 'SELECT id FROM subtasks WHERE task_id = ? ORDER BY id ASC LIMIT 1', [taskId])[0].id;
    mutate(db, 'UPDATE subtasks SET done = ? WHERE id = ?', [1, subId]);
    const sub = query(db, 'SELECT done FROM subtasks WHERE id = ?', [subId]);
    assert.equal(sub[0].done, 1);
    // Toggle back
    mutate(db, 'UPDATE subtasks SET done = ? WHERE id = ?', [0, subId]);
    const sub2 = query(db, 'SELECT done FROM subtasks WHERE id = ?', [subId]);
    assert.equal(sub2[0].done, 0);
  });

  it('updates task progress based on subtask completion', () => {
    const subId = query(db, 'SELECT id FROM subtasks WHERE task_id = ? ORDER BY id ASC LIMIT 1', [taskId])[0].id;
    mutate(db, 'UPDATE subtasks SET done = 1 WHERE id = ?', [subId]);
    const stats = query(db, 'SELECT COUNT(*) as total, SUM(done) as done FROM subtasks WHERE task_id = ?', [taskId]);
    const progress = stats[0].total > 0 ? Math.round(((stats[0].done || 0) / stats[0].total) * 100) : 0;
    mutate(db, 'UPDATE tasks SET progress = ? WHERE id = ?', [progress, taskId]);
    const t = query(db, 'SELECT progress FROM tasks WHERE id = ?', [taskId]);
    assert.equal(t[0].progress, 33); // 1/3 ≈ 33%
  });

  it('cascades delete with task', () => {
    runTransaction(db, d => {
      mutate(d, 'DELETE FROM subtasks WHERE task_id = ?', [taskId]);
      mutate(d, 'DELETE FROM task_comments WHERE task_id = ?', [taskId]);
      mutate(d, 'DELETE FROM tasks WHERE id = ?', [taskId]);
    });
    assert.equal(countRows(db, 'subtasks'), 0);
  });
});

describe('Task Comments', () => {
  let db, taskId;
  before(async () => {
    db = await createDb();
    mutate(db, 'INSERT INTO tasks (title) VALUES (?)', ['مهمة مع تعليقات']);
    taskId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة مع تعليقات'")[0].id;
  });

  it('adds comments', () => {
    mutate(db, 'INSERT INTO task_comments (task_id, author, text) VALUES (?, ?, ?)', [taskId, 'المحامي', 'تم البدء في المهمة']);
    mutate(db, 'INSERT INTO task_comments (task_id, author, text) VALUES (?, ?, ?)', [taskId, 'المساعد', 'تم التحديث']);
    const comments = query(db, 'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC', [taskId]);
    assert.equal(comments.length, 2);
    assert.equal(comments[0].text, 'تم البدء في المهمة');
  });

  it('uses default author', () => {
    mutate(db, 'INSERT INTO task_comments (task_id, text) VALUES (?, ?)', [taskId, 'بدون مؤلف']);
    const c = query(db, "SELECT author FROM task_comments WHERE text = 'بدون مؤلف'");
    assert.equal(c[0].author, 'المحامي');
  });
});

describe('Task Analytics', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, 'INSERT INTO tasks (title, status, priority, due_date) VALUES (?, ?, ?, ?)', ['T1', 'todo', 'high', '2025-01-01']);
    mutate(db, 'INSERT INTO tasks (title, status, priority) VALUES (?, ?, ?)', ['T2', 'in_progress', 'medium']);
    mutate(db, 'INSERT INTO tasks (title, status, priority) VALUES (?, ?, ?)', ['T3', 'done', 'low']);
    mutate(db, 'INSERT INTO tasks (title, status, priority, archived) VALUES (?, ?, ?, ?)', ['T4', 'todo', 'medium', 1]);
  });

  it('counts total active tasks', () => {
    const total = query(db, 'SELECT COUNT(*) as c FROM tasks WHERE archived=0');
    assert.equal(total[0].c, 3);
  });

  it('groups by status', () => {
    const byStatus = query(db, 'SELECT status, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY status');
    const map = {};
    byStatus.forEach(r => {
      map[r.status] = r.c;
    });
    assert.equal(map.todo, 1);
    assert.equal(map.in_progress, 1);
    assert.equal(map.done, 1);
  });

  it('groups by priority', () => {
    const byPriority = query(db, 'SELECT priority, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY priority');
    const map = {};
    byPriority.forEach(r => {
      map[r.priority] = r.c;
    });
    assert.equal(map.high, 1);
  });

  it('counts overdue tasks', () => {
    const overdue = query(db, "SELECT COUNT(*) as c FROM tasks WHERE due_date IS NOT NULL AND due_date < date('now') AND status!='done' AND archived=0");
    assert.equal(overdue[0].c, 1);
  });
});

describe('Workflows', () => {
  let db, wfId;
  before(async () => {
    db = await createDb();
  });

  it('creates a workflow with steps', () => {
    mutate(db, 'INSERT INTO workflows (name, description, case_type) VALUES (?, ?, ?)', ['إجراءات مدنية', 'سير عمل قياسي', 'مدني']);
    wfId = query(db, "SELECT id FROM workflows WHERE name = 'إجراءات مدنية'")[0].id;
    mutate(db, 'INSERT INTO workflow_steps (workflow_id, title, step_order, due_days, assigned_role) VALUES (?, ?, ?, ?, ?)', [
      wfId,
      'تقديم الطلب',
      0,
      7,
      'المحامي'
    ]);
    mutate(db, 'INSERT INTO workflow_steps (workflow_id, title, step_order, due_days, assigned_role) VALUES (?, ?, ?, ?, ?)', [
      wfId,
      'مراجعة',
      1,
      14,
      'المساعد'
    ]);
    const wf = query(db, 'SELECT * FROM workflows WHERE id = ?', [wfId])[0];
    assert.equal(wf.name, 'إجراءات مدنية');
    const steps = query(db, 'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [wfId]);
    assert.equal(steps.length, 2);
    assert.equal(steps[0].due_days, 7);
  });

  it('applies workflow to case (creates tasks)', () => {
    mutate(db, 'INSERT INTO cases (case_number, title) VALUES (?, ?)', ['WF-CASE', 'Workflow Test Case']);
    const caseId = query(db, "SELECT id FROM cases WHERE case_number = 'WF-CASE'")[0].id;
    const steps = query(db, 'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [wfId]);
    steps.forEach(s => {
      mutate(
        db,
        "INSERT INTO tasks (title, case_id, status, due_date, workflow_id, priority) VALUES (?, ?, 'todo', date('now', '+' || ? || ' days'), ?, 'medium')",
        [s.title, caseId, s.due_days, wfId]
      );
    });
    const tasks = query(db, 'SELECT * FROM tasks WHERE case_id = ?', [caseId]);
    assert.equal(tasks.length, 2);
  });

  it('deletes workflow with cascade', () => {
    mutate(db, 'DELETE FROM workflow_steps WHERE workflow_id = ?', [wfId]);
    mutate(db, 'DELETE FROM workflows WHERE id = ?', [wfId]);
    assert.equal(countRows(db, 'workflows'), 0);
    assert.equal(countRows(db, 'workflow_steps'), 0);
  });
});

describe('Task Templates', () => {
  let db;
  before(async () => {
    db = await createDb();
  });

  it('creates a template', () => {
    const tasksJson = JSON.stringify([
      { title: 'مهمة 1', priority: 'high' },
      { title: 'مهمة 2', priority: 'medium' }
    ]);
    mutate(db, 'INSERT INTO task_templates (name, description, tasks_json) VALUES (?, ?, ?)', ['قالب التدقيق', 'قاالب لتدقيق القضايا', tasksJson]);
    const t = query(db, "SELECT * FROM task_templates WHERE name = 'قالب التدقيق'");
    assert.equal(t.length, 1);
    assert.equal(t[0].tasks_json, tasksJson);
  });

  it('applies template to case', () => {
    mutate(db, 'INSERT INTO cases (case_number, title) VALUES (?, ?)', ['TPL-CASE', 'Template Test Case']);
    const caseId = query(db, "SELECT id FROM cases WHERE case_number = 'TPL-CASE'")[0].id;
    const template = query(db, "SELECT * FROM task_templates WHERE name = 'قالب التدقيق'")[0];
    JSON.parse(template.tasks_json).forEach(t => {
      mutate(db, "INSERT INTO tasks (title, case_id, status, due_date, priority, template_id) VALUES (?, ?, 'todo', ?, ?, ?)", [
        t.title,
        caseId,
        null,
        t.priority || 'medium',
        template.id
      ]);
    });
    const tasks = query(db, 'SELECT * FROM tasks WHERE case_id = ?', [caseId]);
    assert.equal(tasks.length, 2);
  });

  it('deletes template', () => {
    const tId = query(db, "SELECT id FROM task_templates WHERE name = 'قالب التدقيق'")[0].id;
    mutate(db, 'DELETE FROM task_templates WHERE id = ?', [tId]);
    assert.equal(countRows(db, 'task_templates'), 0);
  });
});

describe('Task Dependencies', () => {
  let db;
  before(async () => {
    db = await createDb();
    mutate(db, 'INSERT INTO tasks (title, depends_on) VALUES (?, ?)', ['مهمة تابعة', '[]']);
    mutate(db, 'INSERT INTO tasks (title) VALUES (?)', ['مهمة مستقلة']);
  });

  it('stores dependencies as JSON array', () => {
    const tId = query(db, "SELECT id, depends_on FROM tasks WHERE title = 'مهمة تابعة'")[0];
    const deps = JSON.parse(tId.depends_on);
    assert.ok(Array.isArray(deps));
  });

  it('removes dependency references on parent delete', () => {
    const parentId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة مستقلة'")[0].id;
    const childId = query(db, "SELECT id FROM tasks WHERE title = 'مهمة تابعة'")[0].id;
    mutate(db, 'UPDATE tasks SET depends_on = ? WHERE id = ?', [JSON.stringify([parentId]), childId]);
    // Simulate parent delete by removing from depends_on
    const child = query(db, 'SELECT depends_on FROM tasks WHERE id = ?', [childId])[0];
    const deps = JSON.parse(child.depends_on).filter(d => d !== parentId);
    mutate(db, 'UPDATE tasks SET depends_on = ? WHERE id = ?', [JSON.stringify(deps), childId]);
    const updated = query(db, 'SELECT depends_on FROM tasks WHERE id = ?', [childId])[0];
    assert.deepEqual(JSON.parse(updated.depends_on), []);
  });
});
