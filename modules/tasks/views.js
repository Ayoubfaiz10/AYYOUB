var A = window.App = window.App || {};

A.filterTasks = function() {
  let list = A.state.allTasks;
  if (A.state.taskStatusFilter !== 'all') list = list.filter(t => t.status === A.state.taskStatusFilter);
  if (A.state.taskSearchQuery) {
    const q = A.state.taskSearchQuery.toLowerCase();
    list = list.filter(t => (t.title||'').toLowerCase().includes(q) || (t.case_number||'').toLowerCase().includes(q) || (t.tags||'').toLowerCase().includes(q));
  }
  return list;
};

A._renderTaskCards = function(displayed, container) {
  A.safeSet(container, esc => displayed.length ? displayed.map(t => {
    const isDone = t.status === 'done';
    const priorityColors = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--gold)', low: 'var(--success)' };
    const tags = (t.tags||'').split(',').filter(Boolean);
    const progress = t.subtask_count > 0 ? Math.round(t.subtask_done / t.subtask_count * 100) : t.progress || 0;
    const isOverdue = t.due_date && t.due_date < new Date().toISOString().slice(0,10) && !isDone;
    return `<div class="task-card-v8 ${isDone ? 'done' : ''}" onclick="openTaskDetail(${t.id})">
      <div class="priority-indicator" style="background:${priorityColors[t.priority] || 'var(--gray-200)'};"></div>
      <div class="task-check ${isDone ? 'checked' : ''}" onclick="event.stopPropagation();toggleTaskStatus(${t.id})">${isDone ? '<i class="ri-check-line" style="font-size:10px;"></i>' : ''}</div>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          ${t.case_number ? `<span>📁 ${esc(t.case_number)}</span>` : ''}
          ${t.due_date ? `<span style="color:${isOverdue ? 'var(--danger)' : 'var(--gray-400)'};">⏰ ${esc(t.due_date)}${isOverdue ? ' (متأخرة)' : ''}</span>` : ''}
          ${t.assigned_to ? `<span>👤 ${esc(t.assigned_to)}</span>` : ''}
        </div>
        ${tags.length ? `<div class="task-tags">${tags.slice(0,3).map(tag => `<span class="task-tag">${esc(tag.trim())}</span>`).join('')}</div>` : ''}
      </div>
      <div class="task-progress"><div class="task-progress-bar" style="width:${progress}%;background:${progress === 100 ? 'var(--success)' : 'var(--gold)'};"></div></div>
      <div class="task-actions">
        <button class="btn-icon" onclick="event.stopPropagation();openTaskDetail(${t.id})"><i class="ri-eye-line"></i></button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:60px 20px;color:var(--gray-300);"><i class="ri-checkbox-line" style="font-size:48px;display:block;margin-bottom:8px;"></i>لا توجد مهام</div>');
};

A.renderTaskList = function() {
  const list = A.filterTasks();
  if (A.state._taskScroll) A.state._taskScroll.destroy();
  A.state._taskScroll = A.VirtualScroll.init('tasksContainer', list, A._renderTaskCards, 30);
};

A.toggleTaskStatus = async function(id) {
  const allTasks = A.state.allTasks || [];
  const t = allTasks.find(x => x.id === id);
  if (!t) return;
  try { await A.mutate('db:updateTask', id, { status: t.status === 'done' ? 'todo' : 'done' }); } catch (e) { A.logError('toggleTaskStatus', e); A.showToast('فشل تحديث المهمة', 'error'); return; }
  A.loadTasks();
};
window.toggleTaskStatus = A.toggleTaskStatus;

A.renderKanban = function() {
  const cols = ['backlog','todo','in_progress','waiting','review','done'];
  cols.forEach(col => {
    const el = document.getElementById(`kanban${col.charAt(0).toUpperCase()+col.slice(1)}`);
    if (!el) return;
    const items = A.state.allTasks.filter(t => t.status === col);
    A.safeSet(el, esc => items.length ? items.map(t => `<div class="kanban-card-v8" draggable="true" data-id="${t.id}" data-status="${col}">
      <div class="kanban-card-title">${esc(t.title)}</div>
      <div class="kanban-card-meta">${esc(t.case_number||'')} ${t.due_date ? '· '+esc(t.due_date) : ''}</div>
    </div>`).join('') : '<div style="font-size:10px;color:var(--gray-300);text-align:center;padding:20px 0;">—</div>');
    el.querySelectorAll('.kanban-card-v8').forEach(card => {
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', card.dataset.id); card.classList.add('dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
  });
};

A.renderPriorityView = function() {
  const container = document.getElementById('priorityView');
  if (!container) return;
  const groups = [
    { key: 'critical', label: 'حرج', color: 'var(--danger)' },
    { key: 'high', label: 'عالي', color: 'var(--warning)' },
    { key: 'medium', label: 'متوسط', color: 'var(--gold)' },
    { key: 'low', label: 'منخفض', color: 'var(--success)' }
  ];
  A.safeSet(container, esc => groups.map(g => {
    const items = A.state.allTasks.filter(t => t.priority === g.key && t.status !== 'done');
    if (!items.length) return '';
    return `<div class="priority-group">
      <div class="priority-group-header"><span class="priority-dot" style="background:${g.color};"></span>${g.label} <span style="font-size:11px;color:var(--gray-400);font-weight:normal;">(${items.length})</span></div>
      ${items.map(t => `<div class="task-card-v8" onclick="openTaskDetail(${t.id})" style="padding:var(--space-2) var(--space-3);">
        <div class="priority-indicator" style="background:${g.color};height:24px;"></div>
        <div class="task-body">
          <div class="task-title">${esc(t.title)}</div>
          <div class="task-meta">${esc(t.case_number||'')} ${t.due_date ? '⏰ '+esc(t.due_date) : ''}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('') || '<div style="text-align:center;padding:40px;color:var(--gray-300);">جميع المهام منجزة</div>');
};

A.renderTaskAnalytics = async function() {
  const container = document.getElementById('taskAnalyticsContainer');
  if (!container || !A.state.ipc) return;
  const stats = await A.cachedInvoke('db:getTaskAnalytics');
  A.safeSetStatic(container, `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-4);">
    <div class="task-analytics-card"><h4>إجمالي المهام</h4><div class="task-analytics-number">${stats.total}</div></div>
    <div class="task-analytics-card"><h4>منجز هذا الأسبوع</h4><div class="task-analytics-number">${stats.completedThisWeek}</div></div>
    <div class="task-analytics-card"><h4>متأخرة</h4><div class="task-analytics-number" style="color:${stats.overdue > 0 ? 'var(--danger)' : 'var(--success)'};">${stats.overdue}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);">
    <div class="task-analytics-card"><h4>متروكة</h4><div class="task-analytics-number">${stats.byStatus.backlog||0}</div></div>
    <div class="task-analytics-card"><h4>قيد التنفيذ</h4><div class="task-analytics-number">${(stats.byStatus.todo||0)+(stats.byStatus.in_progress||0)}</div></div>
    <div class="task-analytics-card"><h4>معدل الإنجاز</h4><div class="task-analytics-number" style="font-size:20px;">${stats.avgCompletionDays} يوم</div></div>
  </div>`);
};
