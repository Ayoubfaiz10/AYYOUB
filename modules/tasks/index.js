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
    <div class="input-group"><label class="input-label">${_t('taskTitleLabel')}</label><input type="text" id="fTaskTitle" class="input" value="${esc(editData ? editData.title : '')}" placeholder="${_t('taskTitleLabel')}"></div>
    <div class="input-group"><label class="input-label">${_t('taskDescLabel')}</label><textarea id="fTaskDesc" class="input" rows="3" placeholder="${_t('taskDescLabel')}">${esc(editData ? editData.description || '' : '')}</textarea></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('eventCaseLabel')}</label><select id="fTaskCase" class="input"><option value="">-- ${_t('selectPlaceholder')} --</option>${caseOpts}</select></div>
      <div class="input-group"><label class="input-label">${_t('assignedToLabel')}</label><input type="text" id="fTaskAssigned" class="input" value="${esc(editData ? editData.assigned_to || '' : '')}" placeholder="${_t('assignedToLabel')}"></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">${_t('eventStatusLabel')}</label><select id="fTaskStatus" class="input">${[['backlog',_t('taskBacklog')],['todo',_t('taskTodo')],['in_progress',_t('taskInProgress')],['waiting',_t('taskWaiting')],['review',_t('taskReview')],['done',_t('taskDone')]].map(([v,l]) => `<option value="${v}" ${editData?.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">${_t('taskPriorityLabel')}</label><select id="fTaskPriority" class="input">${[['critical',_t('priorityCritical')],['high',_t('priorityHigh')],['medium',_t('priorityMedium')],['low',_t('priorityLow')]].map(([v,l]) => `<option value="${v}" ${editData?.priority === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">${_t('taskDueDateLabel')}</label><input type="date" id="fTaskDue" class="input" value="${esc(editData ? editData.due_date || '' : A.todayLocal())}"></div>
    </div>
    <div class="input-group"><label class="input-label">${_t('labelTags')}</label><input type="text" id="fTaskTags" class="input" value="${esc(editData ? editData.tags || '' : '')}" placeholder="${_t('tagPlaceholder')}"></div>
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
        case_id: parseInt(document.getElementById('fTaskCase').value, 10) || null,
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
        A.showToast(_t('taskSaveFailed'), 'error');
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
    A.showToast(_t('taskLoadDetailFailed'), 'error');
    return;
  }

  document.getElementById('taskDetailTitle').textContent = t.title;
  const priorityLabels = { critical: _t('priorityCritical'), high: _t('priorityHigh'), medium: _t('priorityMedium'), low: _t('priorityLow') };
  document.getElementById('taskDetailBadge').textContent = priorityLabels[t.priority] || t.priority;

  A.safeSet(
    document.getElementById('taskDetailBody'),
    esc => `
    <div class="ws-overview-grid">
      <div>
        <div class="task-detail-section">
          <h4 data-i18n="labelInfo">${_t('labelInfo')}</h4>
          <div class="ws-info-row"><span class="ws-info-label" data-i18n="thStatus">${_t('thStatus')}</span><span class="ws-info-value">${esc({backlog:_t('taskBacklog'),todo:_t('taskTodo'),in_progress:_t('taskInProgress'),waiting:_t('taskWaiting'),review:_t('taskReview'),done:_t('taskDone')}[t.status] || t.status)}</span></div>
          <div class="ws-info-row"><span class="ws-info-label" data-i18n="taskPriorityLabel">${_t('taskPriorityLabel')}</span><span class="ws-info-value">${esc({critical:_t('priorityCritical'),high:_t('priorityHigh'),medium:_t('priorityMedium'),low:_t('priorityLow')}[t.priority] || t.priority)}</span></div>
          <div class="ws-info-row"><span class="ws-info-label" data-i18n="thCaseNumber">${_t('thCaseNumber')}</span><span class="ws-info-value">${esc(t.case_number || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label" data-i18n="taskDueDateLabel">${_t('taskDueDateLabel')}</span><span class="ws-info-value">${esc(t.due_date || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">${_t('responsibleLabel')}</span><span class="ws-info-value">${esc(t.assigned_to || '—')}</span></div>
          <div class="ws-info-row"><span class="ws-info-label">${_t('progressLabel')}</span><span class="ws-info-value">${t.progress || 0}%</span></div>
          <div class="ws-info-row"><span class="ws-info-label">${_t('timeTrackedLabel')}</span><span class="ws-info-value">${Math.floor((t.time_tracked || 0) / 60)}${_t('hoursAbbrev')} ${(t.time_tracked || 0) % 60}${_t('minutesAbbrev')}</span></div>
        </div>
        ${t.description ? `<div class="task-detail-section"><h4 data-i18n="taskDescLabel">${_t('taskDescLabel')}</h4><p style="font-size:var(--type-caption);color:var(--foreground);line-height:1.6;">${esc(t.description)}</p></div>` : ''}
      </div>
      <div>
        <div class="task-detail-section">
          <h4>${_t('subtasksLabel')} (${subtasks.filter(s => s.done).length}/${subtasks.length})</h4>
          <div id="subtaskList" class="subtask-list">${subtasks
            .map(
              s => `<div class="subtask-item">
            <div class="subtask-check ${s.done ? 'done' : ''}" data-click="subtask:toggle:${s.id}">${s.done ? '<i class="ri-check-line" style="font-size:10px;"></i>' : ''}</div>
            <span style="flex:1;font-size:var(--type-caption);${s.done ? 'text-decoration:line-through;color:var(--muted-foreground);' : ''}">${esc(s.title)}</span>
            <button class="btn-icon" data-click="subtask:delete:${s.id}" style="font-size:10px;"><i class="ri-close-line"></i></button>
          </div>`
            )
            .join('')}</div>
          <div style="display:flex;gap:var(--spacing-1-5);margin-top:var(--spacing-1-5);">
            <input type="text" id="newSubtaskInput" class="input input-sm" placeholder="${_t('subtaskPlaceholder')}" style="flex:1;">
            <button class="btn btn-primary btn-xs" data-click="task:addSubtask:${taskId}">+</button>
          </div>
        </div>
        <div class="task-detail-section">
          <h4>${_t('commentsLabel')} (${comments.length})</h4>
          <div id="commentList">${
            comments
              .map(
                c => `<div class="comment-item">
            <div class="comment-author">${esc(c.author)} <span class="comment-time">${c.created_at ? c.created_at.slice(11, 16) : ''}</span></div>
            <div class="comment-text">${esc(c.text)}</div>
          </div>`
              )
              .join('') || '<p style="font-size:var(--type-caption);color:var(--muted-foreground);">' + _t('noCommentsLabel') + '</p>'
          }</div>
          <div style="display:flex;gap:var(--spacing-1-5);margin-top:var(--spacing-1-5);">
            <input type="text" id="newCommentInput" class="input input-sm" placeholder="${_t('addCommentPlaceholder')}" style="flex:1;">
            <button class="btn btn-primary btn-xs" data-click="task:addComment:${taskId}">${_t('sendBtn')}</button>
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
    if (await A.showConfirm(_t('deleteTaskConfirm'))) {
      try {
        await A.mutate('db:deleteTask', taskId);
        document.getElementById('taskDetailOverlay').style.display = 'none';
        A.loadTasks();
      } catch (e) {
        A.logError('deleteTask', e);
        A.showToast(_t('taskDeleteFailed'), 'error');
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
    A.showToast(_t('subtaskToggleFailed'), 'error');
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
    A.showToast(_t('subtaskDeleteFailed'), 'error');
  }
};

window.addSubtaskTo = async function (taskId) {
  const input = document.getElementById('newSubtaskInput');
  if (!input || !input.value.trim()) return;
  try {
    await A.mutate('db:addSubtask', { task_id: taskId, title: input.value.trim() });
  } catch (e) {
    A.logError('addSubtask', e);
    A.showToast(_t('subtaskAddFailed'), 'error');
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
    await A.mutate('db:addComment', { task_id: taskId, text: input.value.trim(), author: _t('defaultAuthorValue') });
  } catch (e) {
    A.logError('addComment', e);
    A.showToast(_t('commentAddFailed'), 'error');
    return;
  }
  input.value = '';
  A.openTaskDetail(taskId);
};

window.applyWorkflow = async function () {
  const wfCaseEl = document.getElementById('wfCaseSelect');
  const wfEl = document.getElementById('wfSelect');
  const overlay = document.getElementById('workflowModalOverlay');
  const caseId = wfCaseEl ? parseInt(wfCaseEl.value, 10) : 0;
  const wfId = wfEl ? parseInt(wfEl.value, 10) : 0;
  if (!caseId || !wfId) {
    A.showToast(_t('selectCaseAndWorkflow'), 'error');
    return;
  }
  try {
    await A.mutate('db:applyWorkflow', { caseId, workflowId: wfId });
  } catch (e) {
    A.logError('applyWorkflow', e);
    A.showToast(_t('workflowApplyFailed'), 'error');
    return;
  }
  A.loadTasks();
  if (overlay) overlay.style.display = 'none';
};

window.applyTemplate = async function () {
  const tmplCaseEl = document.getElementById('tmplCaseSelect');
  const tmplEl = document.getElementById('tmplSelect');
  const overlay = document.getElementById('workflowModalOverlay');
  const caseId = tmplCaseEl ? parseInt(tmplCaseEl.value, 10) : 0;
  const tmplId = tmplEl ? parseInt(tmplEl.value, 10) : 0;
  if (!caseId || !tmplId) {
    A.showToast(_t('selectCaseAndTemplate'), 'error');
    return;
  }
  try {
    await A.mutate('db:applyTemplate', { caseId, templateId: tmplId });
  } catch (e) {
    A.logError('applyTemplate', e);
    A.showToast(_t('templateApplyFailed'), 'error');
    return;
  }
  A.loadTasks();
  if (overlay) overlay.style.display = 'none';
};

window.deleteWorkflowItem = async function (id) {
  if (await A.showConfirm(_t('deleteWorkflowConfirm'))) {
    try {
      await A.mutate('db:deleteWorkflow', id);
      document.getElementById('showWorkflowsBtn').click();
    } catch (e) {
      A.logError('deleteWorkflow', e);
      A.showToast(_t('workflowDeleteFailed'), 'error');
    }
  }
};

window.deleteTemplateItem = async function (id) {
  if (await A.showConfirm(_t('deleteTemplateConfirm'))) {
    try {
      await A.mutate('db:deleteTemplate', id);
      document.getElementById('showWorkflowsBtn').click();
    } catch (e) {
      A.logError('deleteTemplate', e);
      A.showToast(_t('templateDeleteFailed'), 'error');
    }
  }
};

window.showNewWorkflowForm = function () {
  A.showModal(
    _t('newWorkflowTitle'),
    `
    <div class="input-group"><label class="input-label">${_t('nameLabel')}</label><input type="text" id="wfName" class="input"></div>
    <div class="input-group"><label class="input-label">${_t('taskDescLabel')}</label><textarea id="wfDesc" class="input" rows="2"></textarea></div>
    <div class="input-group"><label class="input-label">${_t('caseTypeLabel')}</label><input type="text" id="wfCaseType" class="input" placeholder="${_t('caseTypePlaceholder')}"></div>
    <div class="input-group"><label class="input-label">${_t('workflowStepsLabel')}</label><textarea id="wfSteps" class="input" rows="4" placeholder="${_t('workflowStepsPlaceholder')}"></textarea></div>
  `,
    async () => {
      const name = document.getElementById('wfName').value.trim();
      if (!name) {
        A.showToast(_t('nameRequired'), 'error');
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
        A.showToast(_t('workflowAddFailed'), 'error');
        return;
      }
      A.hideModal();
      document.getElementById('showWorkflowsBtn').click();
    }
  );
};

window.showNewTemplateForm = function () {
  A.showModal(
    _t('newTemplateTitle'),
    `
    <div class="input-group"><label class="input-label">${_t('nameLabel')}</label><input type="text" id="tmplName" class="input"></div>
    <div class="input-group"><label class="input-label">${_t('taskDescLabel')}</label><textarea id="tmplDesc" class="input" rows="2"></textarea></div>
    <div class="input-group"><label class="input-label">${_t('tasksJsonLabel')}</label><textarea id="tmplTasks" class="input" rows="6" placeholder='${_t('tasksJsonPlaceholder')}'></textarea></div>
  `,
    async () => {
      const name = document.getElementById('tmplName').value.trim();
      if (!name) {
        A.showToast(_t('nameRequired'), 'error');
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
        A.showToast(_t('templateAddFailed'), 'error');
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

    document.getElementById('workflowModalTitle').textContent = _t('workflowsAndTemplatesTitle');
    A.safeSet(
      document.getElementById('workflowModalBody'),
      esc => `
      <div style="margin-bottom:var(--spacing-3);">
        <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">${_t('applyWorkflowToCase')}</h4>
        <div class="info-grid-2">
          <select id="wfCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--spacing-1-5);">
            <select id="wfSelect" class="input" style="flex:1;">
              <option value="">${_t('selectWorkflowPlaceholder')}</option>
              ${workflows.map(w => `<option value="${w.id}">${esc(w.name)} (${w.step_count || 0} ${_t('stepsCountLabel')})</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-click="workflow:apply">${_t('applyBtn')}</button>
          </div>
        </div>
      </div>
      <div style="margin-bottom:var(--spacing-3);">
        <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">${_t('applyTemplateToCase')}</h4>
        <div class="info-grid-2">
          <select id="tmplCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--spacing-1-5);">
            <select id="tmplSelect" class="input" style="flex:1;">
              <option value="">${_t('selectTemplatePlaceholder')}</option>
              ${templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-click="template:apply">${_t('applyBtn')}</button>
          </div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--border);margin:var(--spacing-3) 0;">
      <div style="display:flex;gap:var(--spacing-2);margin-bottom:var(--spacing-2);">
        <button class="btn btn-secondary btn-sm" data-click="workflow:new">+ ${_t('newWorkflowBtn')}</button>
        <button class="btn btn-secondary btn-sm" data-click="template:new">+ ${_t('newTemplateBtn')}</button>
      </div>
      <h4 style="font-size:var(--type-body);margin-bottom:var(--spacing-1-5);">${_t('currentWorkflowsLabel')}</h4>
      <div id="workflowList">${
        workflows
          .map(
            w => `<div class="workflow-card">
        <h4>${esc(w.name)}</h4>
        <p>${esc(w.description || '')} · ${w.step_count || 0} ${_t('stepsCountLabel')}</p>
        <button class="btn-icon" data-click="workflow:delete:${w.id}" style="position:absolute;top:8px;left:8px;"><i class="ri-delete-bin-line"></i></button>
      </div>`
          )
          .join('') || '<p style="color:var(--muted-foreground);">' + _t('noWorkflowsLabel') + '</p>'
      }</div>
      <h4 style="font-size:var(--type-body);margin:var(--spacing-3) 0 var(--spacing-1-5);">${_t('currentTemplatesLabel')}</h4>
      <div id="templateList">${
        templates
          .map(
            t => `<div class="workflow-card">
        <h4>${esc(t.name)}</h4>
        <p>${esc(t.description || '')}</p>
        <button class="btn-icon" data-click="template:delete:${t.id}" style="position:absolute;top:8px;left:8px;"><i class="ri-delete-bin-line"></i></button>
      </div>`
          )
          .join('') || '<p style="color:var(--muted-foreground);">' + _t('noTemplatesLabel') + '</p>'
      }</div>
    `
    );
    document.getElementById('workflowModalOverlay').style.display = 'flex';
  });

  document.getElementById('kanbanBoardV8')?.addEventListener('dragover', e => e.preventDefault());
  document.getElementById('kanbanBoardV8')?.addEventListener('drop', async e => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
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
      A.showToast(_t('taskStatusChangeFailed'), 'error');
    }
    A.loadTasks();
  });
};
