var A = (window.App = window.App || {});

A.state.allTasks = [];
A.state.taskView = 'list';
A.state.taskStatusFilter = 'all';
A.state.taskSearchQuery = '';
A.state.currentTaskId = null;

A.loadTasks = async function () {
  if (!A.state.ipc) return;
  try {
    A.showSkeleton('taskList', 5, 'card');
    A.state.allTasks = await A.cachedInvoke('db:getAllTasks');
    A.renderTaskList();
    A.renderKanban();
    A.renderPriorityView();
    A.renderTaskAnalytics();
  } catch (e) {
    A.logError('loadTasks', e);
    const mainEl = document.getElementById('taskList')?.parentElement;
    if (mainEl) A.showError(mainEl, _t('error') + ': ' + _t('loading'), () => A.loadTasks());
  }
};

A.showTaskForm = async function (editData) {
  if (!A.state.ipc) return;
  const cases = (await A.cachedInvoke('db:getAllCases')) || [];
  const esc = A.escapeHtml;
  const caseOpts = cases
    .map(c => `<option value="${c.id}" ${editData?.case_id === c.id ? 'selected' : ''}>${esc(c.case_number)} - ${esc(c.title)}</option>`)
    .join('');
  const isEdit = !!editData;
  A.showModal(
    isEdit ? _t('editTask') : _t('addTask'),
    `
    <div class="input-group"><label class="input-label">العنوان</label><input type="text" id="fTaskTitle" class="input" value="${esc(editData ? editData.title : '')}" placeholder="${_t('taskTitleLabel')}"></div>
    <div class="input-group"><label class="input-label">الوصف</label><textarea id="fTaskDesc" class="input" rows="3" placeholder="${_t('taskDescLabel') || _t('edit')}">${esc(editData ? editData.description || '' : '')}</textarea></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">القضية</label><select id="fTaskCase" class="input"><option value="">-- ${_t('selectPlaceholder') || '-- اختر --'} --</option>${caseOpts}</select></div>
      <div class="input-group"><label class="input-label">مسؤول</label><input type="text" id="fTaskAssigned" class="input" value="${esc(editData ? editData.assigned_to || '' : '')}" placeholder="${_t('assignedToLabel') || _t('add')}"></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">الحالة</label><select id="fTaskStatus" class="input">${[['backlog','متراكم'],['todo','قيد الانتظار'],['in_progress','قيد التنفيذ'],['waiting','معلق'],['review','مراجعة'],['done','منجز']].map(([v,l]) => `<option value="${v}" ${editData?.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">الأولوية</label><select id="fTaskPriority" class="input">${[['critical','حرج'],['high','عالي'],['medium','متوسط'],['low','منخفض']].map(([v,l]) => `<option value="${v}" ${editData?.priority === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">تاريخ الاستحقاق</label><input type="date" id="fTaskDue" class="input" value="${esc(editData ? editData.due_date || '' : '')}"></div>
    </div>
    <div class="input-group"><label class="input-label">الوسوم (مفصولة بفواصل)</label><input type="text" id="fTaskTags" class="input" value="${esc(editData ? editData.tags || '' : '')}" placeholder="${_t('priority_high')}، ${_t('priority_critical')}"></div>
  `,
    async () => {
      const title = document.getElementById('fTaskTitle').value.trim();
      if (!title) {
        A.showToast(_t('taskTitleRequired'), 'error');
        return;
      }
      const data = {
        title,
        description: document.getElementById('fTaskDesc').value,
        case_id: parseInt(document.getElementById('fTaskCase').value) || null,
        assigned_to: document.getElementById('fTaskAssigned').value,
        status: document.getElementById('fTaskStatus').value,
        priority: document.getElementById('fTaskPriority').value,
        due_date: document.getElementById('fTaskDue').value || null,
        tags: document.getElementById('fTaskTags').value
      };
      try {
        if (isEdit) {
          await A.mutate('db:updateTask', editData.id, data);
        } else {
          await A.mutate('db:addTask', data);
        }
        A.hideModal();
        A.loadTasks();
      } catch (e) {
        A.logError('showTaskForm', e);
        A.showToast('فشل حفظ المهمة', 'error');
      }
    }
  );
};

A.openTaskDetail = async function (taskId) {
  if (!A.state.ipc) return;
  let t, subtasks, comments;
  try {
    t = await A.cachedInvoke('db:getTask', taskId);
    if (!t) return;
    A.state.currentTaskId = taskId;
    subtasks = (await A.cachedInvoke('db:getSubtasks', taskId)) || [];
    comments = (await A.cachedInvoke('db:getComments', taskId)) || [];
  } catch (e) {
    A.logError('openTaskDetail', e);
    A.showToast('فشل تحميل تفاصيل المهمة', 'error');
    return;
  }

  document.getElementById('taskDetailTitle').textContent = t.title;
  const priorityLabels = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' };
  document.getElementById('taskDetailBadge').textContent = priorityLabels[t.priority] || t.priority;

  A.safeSet(
    document.getElementById('taskDetailBody'),
    esc => `
    <div class="ws-overview-grid">
      <div>
        <div class="task-detail-section">
          <h4>معلومات</h4>
          <div class="ws-info-row"><span class="ws-info-label">الحالة</span><span class="ws-info-value">${esc({backlog:'متراكم',todo:'قيد الانتظار',in_progress:'قيد التنفيذ',waiting:'معلق',review:'مراجعة',done:'منجز'}[t.status] || t.status)}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">الأولوية</span><span class="ws-info-value">${esc({critical:'حرج',high:'عالي',medium:'متوسط',low:'منخفض'}[t.priority] || t.priority)}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">القضية</span><span class="ws-info-value">${esc(t.case_number || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">تاريخ الاستحقاق</span><span class="ws-info-value">${esc(t.due_date || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">مسؤول</span><span class="ws-info-value">${esc(t.assigned_to || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">التقدم</span><span class="ws-info-value">${t.progress || 0}%</span></div>
          <div class="ws-info-row"><span class="ws-info-label">الوقت المسجل</span><span class="ws-info-value">${Math.floor((t.time_tracked || 0) / 60)}س ${(t.time_tracked || 0) % 60}د</span></div>
        </div>
        ${t.description ? `<div class="task-detail-section"><h4>الوصف</h4><p style="font-size:var(--type-caption);color:var(--foreground);line-height:1.6;">${esc(t.description)}</p></div>` : ''}
      </div>
      <div>
        <div class="task-detail-section">
          <h4>المهام الفرعية (${subtasks.filter(s => s.done).length}/${subtasks.length})</h4>
          <div id="subtaskList">${subtasks
            .map(
              s => `<div class="subtask-item">
            <div class="subtask-check ${s.done ? 'done' : ''}" data-click="subtask:toggle:${s.id}">${s.done ? '<i class="ri-check-line" style="font-size:10px;"></i>' : ''}</div>
            <span style="flex:1;font-size:var(--type-caption);${s.done ? 'text-decoration:line-through;color:var(--muted-foreground);' : ''}">${esc(s.title)}</span>
            <button class="btn-icon" data-click="subtask:delete:${s.id}" style="font-size:10px;"><i class="ri-close-line"></i></button>
          </div>`
            )
            .join('')}</div>
          <div style="display:flex;gap:var(--spacing-1-5);margin-top:var(--spacing-1-5);">
            <input type="text" id="newSubtaskInput" class="input input-sm" placeholder="مهمة فرعية..." style="flex:1;">
            <button class="btn btn-primary btn-xs" data-click="task:addSubtask:${taskId}">+</button>
          </div>
        </div>
        <div class="task-detail-section">
          <h4>التعليقات (${comments.length})</h4>
          <div id="commentList">${
            comments
              .map(
                c => `<div class="comment-item">
            <div class="comment-author">${esc(c.author)} <span class="comment-time">${c.created_at ? c.created_at.slice(11, 16) : ''}</span></div>
            <div class="comment-text">${esc(c.text)}</div>
          </div>`
              )
              .join('') || '<p style="font-size:var(--type-caption);color:var(--muted-foreground);">لا توجد تعليقات</p>'
          }</div>
          <div style="display:flex;gap:var(--spacing-1-5);margin-top:var(--spacing-1-5);">
            <input type="text" id="newCommentInput" class="input input-sm" placeholder="أضف تعليقاً..." style="flex:1;">
            <button class="btn btn-primary btn-xs" data-click="task:addComment:${taskId}">إرسال</button>
          </div>
        </div>
      </div>
    </div>`
  );
  document.getElementById('taskDetailEdit').onclick = () => {
    document.getElementById('taskDetailOverlay').style.display = 'none';
    A.showTaskForm(t);
  };
  document.getElementById('taskDetailDelete').onclick = async () => {
    if (await A.showConfirm('حذف هذه المهمة؟')) {
      try {
        await A.mutate('db:deleteTask', taskId);
        document.getElementById('taskDetailOverlay').style.display = 'none';
        A.loadTasks();
      } catch (e) {
        A.logError('deleteTask', e);
        A.showToast('فشل حذف المهمة', 'error');
      }
    }
  };
  document.getElementById('taskDetailOverlay').style.display = 'flex';
};
window.openTaskDetail = A.openTaskDetail;

window.toggleSubtask = async function (id) {
  try {
    await A.mutate('db:toggleSubtask', id);
  } catch (e) {
    A.logError('toggleSubtask', e);
    A.showToast('فشل تحديث المهمة الفرعية', 'error');
    return;
  }
  const allTasks = A.state.allTasks || [];
  const taskId = document.getElementById('taskDetailOverlay').style.display === 'flex' ? allTasks.find(t => t.id === A.state.currentTaskId)?.id : null;
  if (taskId) A.openTaskDetail(taskId);
  A.loadTasks();
};

window.deleteSubtaskItem = async function (id) {
  try {
    await A.mutate('db:deleteSubtask', id);
    A.loadTasks();
  } catch (e) {
    A.logError('deleteSubtask', e);
    A.showToast('فشل حذف المهمة الفرعية', 'error');
  }
};

window.addSubtaskTo = async function (taskId) {
  const input = document.getElementById('newSubtaskInput');
  if (!input || !input.value.trim()) return;
  try {
    await A.mutate('db:addSubtask', { task_id: taskId, title: input.value.trim() });
  } catch (e) {
    A.logError('addSubtask', e);
    A.showToast('فشل إضافة المهمة الفرعية', 'error');
    return;
  }
  input.value = '';
  A.openTaskDetail(taskId);
  A.loadTasks();
};

window.addCommentTo = async function (taskId) {
  const input = document.getElementById('newCommentInput');
  if (!input || !input.value.trim()) return;
  try {
    await A.mutate('db:addComment', { task_id: taskId, text: input.value.trim(), author: 'المحامي' });
  } catch (e) {
    A.logError('addComment', e);
    A.showToast('فشل إضافة التعليق', 'error');
    return;
  }
  input.value = '';
  A.openTaskDetail(taskId);
};

window.applyWorkflow = async function () {
  const wfCaseEl = document.getElementById('wfCaseSelect');
  const wfEl = document.getElementById('wfSelect');
  const overlay = document.getElementById('workflowModalOverlay');
  const caseId = wfCaseEl ? parseInt(wfCaseEl.value) : 0;
  const wfId = wfEl ? parseInt(wfEl.value) : 0;
  if (!caseId || !wfId) {
    A.showToast('اختر القضية وسير العمل', 'error');
    return;
  }
  try {
    await A.mutate('db:applyWorkflow', { caseId, workflowId: wfId });
  } catch (e) {
    A.logError('applyWorkflow', e);
    A.showToast('فشل تطبيق سير العمل', 'error');
    return;
  }
  A.loadTasks();
  if (overlay) overlay.style.display = 'none';
};

window.applyTemplate = async function () {
  const tmplCaseEl = document.getElementById('tmplCaseSelect');
  const tmplEl = document.getElementById('tmplSelect');
  const overlay = document.getElementById('workflowModalOverlay');
  const caseId = tmplCaseEl ? parseInt(tmplCaseEl.value) : 0;
  const tmplId = tmplEl ? parseInt(tmplEl.value) : 0;
  if (!caseId || !tmplId) {
    A.showToast('اختر القضية والقالب', 'error');
    return;
  }
  try {
    await A.mutate('db:applyTemplate', { caseId, templateId: tmplId });
  } catch (e) {
    A.logError('applyTemplate', e);
    A.showToast('فشل تطبيق القالب', 'error');
    return;
  }
  A.loadTasks();
  if (overlay) overlay.style.display = 'none';
};

window.deleteWorkflowItem = async function (id) {
  if (await A.showConfirm('حذف سير العمل؟')) {
    try {
      await A.mutate('db:deleteWorkflow', id);
      document.getElementById('showWorkflowsBtn').click();
    } catch (e) {
      A.logError('deleteWorkflow', e);
      A.showToast('فشل حذف سير العمل', 'error');
    }
  }
};

window.deleteTemplateItem = async function (id) {
  if (await A.showConfirm('حذف هذا القالب؟')) {
    try {
      await A.mutate('db:deleteTemplate', id);
      document.getElementById('showWorkflowsBtn').click();
    } catch (e) {
      A.logError('deleteTemplate', e);
      A.showToast('فشل حذف القالب', 'error');
    }
  }
};

window.showNewWorkflowForm = function () {
  A.showModal(
    'سير عمل جديد',
    `
    <div class="input-group"><label class="input-label">الاسم</label><input type="text" id="wfName" class="input"></div>
    <div class="input-group"><label class="input-label">الوصف</label><textarea id="wfDesc" class="input" rows="2"></textarea></div>
    <div class="input-group"><label class="input-label">نوع القضية</label><input type="text" id="wfCaseType" class="input" placeholder="مدني، أسرة، تجاري..."></div>
    <div class="input-group"><label class="input-label">الخطوات (اسم لكل سطر)</label><textarea id="wfSteps" class="input" rows="4" placeholder="جمع معلومات الموكل&#10;إنشاء ملف القضية&#10;رفع الوثائق الأولية"></textarea></div>
  `,
    async () => {
      const name = document.getElementById('wfName').value.trim();
      if (!name) {
        A.showToast('الاسم مطلوب', 'error');
        return;
      }
      const lines = document.getElementById('wfSteps').value.split('\n').filter(Boolean);
      try {
        await A.mutate('db:addWorkflow', {
          name,
          description: document.getElementById('wfDesc').value,
          case_type: document.getElementById('wfCaseType').value,
          steps: lines.map(l => ({ title: l }))
        });
      } catch (e) {
        A.logError('addWorkflow', e);
        A.showToast('فشل إضافة سير العمل', 'error');
        return;
      }
      A.hideModal();
      document.getElementById('showWorkflowsBtn').click();
    }
  );
};

window.showNewTemplateForm = function () {
  A.showModal(
    'قالب مهام جديد',
    `
    <div class="input-group"><label class="input-label">الاسم</label><input type="text" id="tmplName" class="input"></div>
    <div class="input-group"><label class="input-label">الوصف</label><textarea id="tmplDesc" class="input" rows="2"></textarea></div>
    <div class="input-group"><label class="input-label">المهام (JSON)</label><textarea id="tmplTasks" class="input" rows="6" placeholder='[{"title":"مهمة 1","priority":"high"},{"title":"مهمة 2","priority":"medium","due_days":7}]'></textarea></div>
  `,
    async () => {
      const name = document.getElementById('tmplName').value.trim();
      if (!name) {
        A.showToast('الاسم مطلوب', 'error');
        return;
      }
      try {
        await A.mutate('db:addTemplate', {
          name,
          description: document.getElementById('tmplDesc').value,
          tasks_json: document.getElementById('tmplTasks').value
        });
      } catch (e) {
        A.logError('addTemplate', e);
        A.showToast('فشل إضافة القالب', 'error');
        return;
      }
      A.hideModal();
      document.getElementById('showWorkflowsBtn').click();
    }
  );
};

A.initTasks = function () {
  document.querySelectorAll('#section-tasks .cases-view-toggle .view-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#section-tasks .cases-view-toggle .view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#section-tasks .case-view-panel').forEach(p => p.classList.remove('active'));
      const map = { list: 'taskListPanel', kanban: 'taskKanbanPanel', priority: 'taskPriorityPanel', analytics: 'taskAnalyticsPanel' };
      document.getElementById(map[btn.dataset.view]).classList.add('active');
    })
  );

  document.getElementById('searchTasks')?.addEventListener(
    'input',
    A.debounce(e => {
      A.state.taskSearchQuery = e.target.value;
      A.renderTaskList();
    }, 250)
  );
  document.getElementById('taskStatusFilter')?.addEventListener('change', e => {
    A.state.taskStatusFilter = e.target.value;
    A.renderTaskList();
  });

  document.getElementById('addTaskBtn')?.addEventListener('click', () => A.showTaskForm());

  document.getElementById('showWorkflowsBtn')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const workflows = (await A.cachedInvoke('db:getAllWorkflows')) || [];
    const templates = (await A.cachedInvoke('db:getAllTemplates')) || [];
    const cases = (await A.cachedInvoke('db:getAllCases')) || [];
    const esc = A.escapeHtml;
    const caseOpts = cases.map(c => `<option value="${c.id}">${esc(c.case_number)}</option>`).join('');

    document.getElementById('workflowModalTitle').textContent = 'سير العمل والقالب';
    A.safeSet(
      document.getElementById('workflowModalBody'),
      esc => `
      <div style="margin-bottom:var(--spacing-3);">
        <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">تطبيق سير عمل على قضية</h4>
        <div class="info-grid-2">
          <select id="wfCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--spacing-1-5);">
            <select id="wfSelect" class="input" style="flex:1;">
              <option value="">اختر سير عمل...</option>
              ${workflows.map(w => `<option value="${w.id}">${esc(w.name)} (${w.step_count || 0} خطوات)</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-click="workflow:apply">تطبيق</button>
          </div>
        </div>
      </div>
      <div style="margin-bottom:var(--spacing-3);">
        <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">تطبيق قالب على قضية</h4>
        <div class="info-grid-2">
          <select id="tmplCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--spacing-1-5);">
            <select id="tmplSelect" class="input" style="flex:1;">
              <option value="">اختر قالب...</option>
              ${templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-click="template:apply">تطبيق</button>
          </div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--border);margin:var(--spacing-3) 0;">
      <div style="display:flex;gap:var(--spacing-2);margin-bottom:var(--spacing-2);">
        <button class="btn btn-secondary btn-sm" data-click="workflow:new">+ سير عمل جديد</button>
        <button class="btn btn-secondary btn-sm" data-click="template:new">+ قالب جديد</button>
      </div>
      <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">سير العمل الحالية</h4>
      <div id="workflowList">${
        workflows
          .map(
            w => `<div class="workflow-card">
        <h4>${esc(w.name)}</h4>
        <p>${esc(w.description || '')} · ${w.step_count || 0} خطوات</p>
        <button class="btn-icon" data-click="workflow:delete:${w.id}" style="position:absolute;top:8px;left:8px;"><i class="ri-delete-bin-line"></i></button>
      </div>`
          )
          .join('') || '<p style="color:var(--muted-foreground);">لا توجد سير عمل</p>'
      }</div>
      <h4 style="font-size:var(--type-body);margin:var(--spacing-3) 0 var(--spacing-1-5);">القوالب الحالية</h4>
      <div id="templateList">${
        templates
          .map(
            t => `<div class="workflow-card">
        <h4>${esc(t.name)}</h4>
        <p>${esc(t.description || '')}</p>
        <button class="btn-icon" data-click="template:delete:${t.id}" style="position:absolute;top:8px;left:8px;"><i class="ri-delete-bin-line"></i></button>
      </div>`
          )
          .join('') || '<p style="color:var(--muted-foreground);">لا توجد قوالب</p>'
      }</div>
    `
    );
    document.getElementById('workflowModalOverlay').style.display = 'flex';
  });

  document.getElementById('kanbanBoardV8')?.addEventListener('dragover', e => e.preventDefault());
  document.getElementById('kanbanBoardV8')?.addEventListener('drop', async e => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!taskId) return;
    const col = e.target.closest('.kanban-col-v8');
    if (!col) return;
    const statusMap = { 0: 'backlog', 1: 'todo', 2: 'in_progress', 3: 'waiting', 4: 'review', 5: 'done' };
    const idx = Array.from(col.parentElement.children).indexOf(col);
    const newStatus = statusMap[idx] || 'todo';
    try {
      await A.mutate('db:updateTask', taskId, { status: newStatus });
    } catch (e) {
      A.logError('kanbanDropV8', e);
      A.showToast('فشل تغيير حالة المهمة', 'error');
    }
    A.loadTasks();
  });
};
