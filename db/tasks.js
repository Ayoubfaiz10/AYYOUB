const { query, mutate, transaction, validateRef, addLog } = require('./utils');

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
  const rows = query(`SELECT t.*, c.case_number, c.title as case_title,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
    (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND done = 1) as subtask_done
    FROM tasks t LEFT JOIN cases c ON t.case_id = c.id WHERE t.id = ?`, [id]);
  if (!rows.length) return null;
  const r = rows[0];
  r.attachments = r.attachments || '[]'; r.depends_on = r.depends_on || '[]';
  return r;
}

function addTask(data) {
  if (!data.title || !String(data.title).trim()) return null;
  data.title = String(data.title).trim();
  if (data.case_id && !validateRef('cases', data.case_id)) return null;
  if (data.client_id && !validateRef('clients', data.client_id)) return null;
  if (data.parent_id && !validateRef('tasks', data.parent_id)) return null;
  mutate(`INSERT INTO tasks (title, description, priority, status, due_date, notes, case_id, client_id, tags, assigned_to, attachments, parent_id, depends_on, progress, time_tracked, workflow_id, template_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description||'', data.priority||'medium', data.status||'todo',
     data.due_date||null, data.notes||'', data.case_id||null, data.client_id||null,
     data.tags||'', data.assigned_to||'', data.attachments||'[]',
     data.parent_id||null, data.depends_on||'[]', data.progress||0,
     data.time_tracked||0, data.workflow_id||null, data.template_id||null]);
  const res = query('SELECT last_insert_rowid() as id');
  addLog('add_task', `إضافة مهمة ${data.title}`);
  return res.length ? res[0].id : null;
}

function updateTask(id, data) {
  const allowed = ['title','description','priority','status','due_date','notes','case_id','client_id','tags','assigned_to','attachments','parent_id','depends_on','progress','time_tracked','workflow_id','template_id','archived'];
  const fields = []; const values = [];
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) { fields.push(`${k} = ?`); values.push(v); }
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
      } catch (e) { /* best effort */ }
    });
    mutate('DELETE FROM subtasks WHERE task_id = ?', [id]);
    mutate('DELETE FROM task_comments WHERE task_id = ?', [id]);
    mutate('DELETE FROM tasks WHERE id = ?', [id]);
  });
}

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
  mutate('UPDATE subtasks SET done = ? WHERE id = ?', [rows[0].done ? 0 : 1, id]);
  const s = query('SELECT task_id FROM subtasks WHERE id = ?', [id]);
  if (s.length) {
    const stats = query('SELECT COUNT(*) as total, SUM(done) as done FROM subtasks WHERE task_id = ?', [s[0].task_id]);
    if (stats.length && stats[0].total > 0) {
      mutate('UPDATE tasks SET progress = ? WHERE id = ?', [Math.round((stats[0].done||0)/stats[0].total*100), s[0].task_id]);
    }
  }
}

function deleteSubtask(id) {
  const rows = query('SELECT task_id FROM subtasks WHERE id = ?', [id]);
  mutate('DELETE FROM subtasks WHERE id = ?', [id]);
  if (rows.length) {
    const stats = query('SELECT COUNT(*) as total, SUM(done) as done FROM subtasks WHERE task_id = ?', [rows[0].task_id]);
    if (stats.length && stats[0].total > 0) {
      mutate('UPDATE tasks SET progress = ? WHERE id = ?', [Math.round((stats[0].done||0)/stats[0].total*100), rows[0].task_id]);
    } else { mutate('UPDATE tasks SET progress = 0 WHERE id = ?', [rows[0].task_id]); }
  }
}

function getComments(taskId) {
  return query('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC', [taskId]);
}

function addComment(data) {
  if (!data || !data.task_id || !data.text || !String(data.text).trim()) return null;
  mutate('INSERT INTO task_comments (task_id, author, text) VALUES (?, ?, ?)', [data.task_id, data.author||'المحامي', data.text]);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

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
  mutate('INSERT INTO workflows (name, description, case_type) VALUES (?, ?, ?)', [data.name, data.description||'', data.case_type||'']);
  const res = query('SELECT last_insert_rowid() as id');
  if (res.length && data.steps) {
    data.steps.forEach((s, i) => mutate('INSERT INTO workflow_steps (workflow_id, title, step_order, due_days, assigned_role) VALUES (?, ?, ?, ?, ?)', [res[0].id, s.title, i, s.due_days||0, s.assigned_role||'']));
  }
  return res.length ? res[0].id : null;
}

function deleteWorkflow(id) {
  mutate('DELETE FROM workflow_steps WHERE workflow_id = ?', [id]); mutate('DELETE FROM workflows WHERE id = ?', [id]);
}

function applyWorkflow(caseId, workflowId) {
  const w = getWorkflow(workflowId);
  if (!w||!w.steps) return;
  w.steps.forEach(s => {
    const dueDate = s.due_days ? new Date(Date.now()+s.due_days*86400000).toISOString().slice(0,10) : null;
    mutate("INSERT INTO tasks (title, case_id, status, due_date, workflow_id, priority) VALUES (?, ?, 'todo', ?, ?, 'medium')", [s.title, caseId, dueDate, workflowId]);
  });
  addLog('apply_workflow', `تطبيق سير عمل #${workflowId} على القضية #${caseId}`);
}

function getAllTemplates() { return query('SELECT * FROM task_templates ORDER BY name ASC'); }

function addTemplate(data) {
  mutate('INSERT INTO task_templates (name, description, tasks_json) VALUES (?, ?, ?)', [data.name, data.description||'', data.tasks_json||'[]']);
  const res = query('SELECT last_insert_rowid() as id');
  return res.length ? res[0].id : null;
}

function applyTemplate(caseId, templateId) {
  const rows = query('SELECT * FROM task_templates WHERE id = ?', [templateId]);
  if (!rows.length) return;
  JSON.parse(rows[0].tasks_json||'[]').forEach(t => mutate("INSERT INTO tasks (title, case_id, status, due_date, priority, template_id) VALUES (?, ?, 'todo', ?, ?, ?)", [t.title, caseId, t.due_date||null, t.priority||'medium', templateId]));
  addLog('apply_template', `تطبيق قالب #${templateId} على القضية #${caseId}`);
}

function getTaskAnalytics() {
  const total = query('SELECT COUNT(*) as c FROM tasks WHERE archived=0');
  const byStatus = query("SELECT status, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY status");
  const byPriority = query("SELECT priority, COUNT(*) as c FROM tasks WHERE archived=0 GROUP BY priority");
  const overdue = query("SELECT COUNT(*) as c FROM tasks WHERE due_date IS NOT NULL AND due_date < date('now') AND status!='done' AND archived=0");
  const completedThisWeek = query("SELECT COUNT(*) as c FROM tasks WHERE status='done' AND updated_at>=datetime('now','-7 days')");
  const avgComp = query("SELECT COALESCE(AVG(CAST(julianday(updated_at)-julianday(created_at) AS REAL)),0) as avg_days FROM tasks WHERE status='done' AND created_at IS NOT NULL AND updated_at IS NOT NULL");
  return { total: total[0]?.c||0, byStatus: byStatus.reduce((a,r)=>{a[r.status]=r.c;return a;},{}), byPriority: byPriority.reduce((a,r)=>{a[r.priority]=r.c;return a;},{}), overdue: overdue[0]?.c||0, completedThisWeek: completedThisWeek[0]?.c||0, avgCompletionDays: Math.round((avgComp[0]?.avg_days||0)*10)/10 };
}

module.exports = {
  getAllTasks, getTask, addTask, updateTask, deleteTask,
  getSubtasks, addSubtask, toggleSubtask, deleteSubtask,
  getComments, addComment,
  getAllWorkflows, getWorkflow, addWorkflow, deleteWorkflow, applyWorkflow,
  getAllTemplates, addTemplate, applyTemplate,
  getTaskAnalytics
};
