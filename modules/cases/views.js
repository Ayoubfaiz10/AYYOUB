var A = (window.App = window.App || {});

A.renderTableView = function (list) {
  const body = document.getElementById('casesBody');
  A.safeSet(body, esc =>
    list.length
      ? list
          .map(
            c => `<tr>
    <td><strong style="cursor:pointer;color:var(--foreground);" data-click="case:open:${c.id}">${esc(c.case_number)}</strong></td>
    <td>${esc(c.title)}</td>
    <td>${esc(c.client_name || '-')}</td>
    <td>${esc(c.court || '-')}</td>
    <td>${esc(c.case_type || '-')}</td>
    <td><span class="badge badge-${c.status}">${A.state.statusLabels[c.status] || esc(c.status)}</span></td>
    <td>${c.priority ? `<span class="badge badge-${c.priority === 'high' ? 'danger' : c.priority === 'medium' ? 'gold' : 'gray'}">${esc(c.priority)}</span>` : '-'}</td>
    <td style="font-size:11px;color:var(--muted-foreground);">${esc(c.created_date || '-')}</td>
    <td>
      <button class="btn-icon ws-open-btn" data-id="${c.id}"><i class="ri-eye-line"></i></button>
      <button class="btn-icon ws-archive-btn" data-id="${c.id}"><i class="ri-${c.archived ? 'history' : 'archive'}-line"></i></button>
      <button class="btn-icon ws-delete-btn" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
    </td>
  </tr>`
          )
          .join('')
      : `<tr><td colspan="9"><div class="empty-state-v2"><i class="ri-briefcase-4-line"></i><h3>${_t('noCasesInList')}</h3><p>${_t('createFirstCase')}</p></div></td></tr>`
  );
  A.attachCaseActions();
};

A.renderCardView = function (list) {
  const grid = document.getElementById('casesCardGrid');
  A.safeSet(grid, esc =>
    list.length
      ? list
          .map(
            c => `<div class="case-card" data-click="case:open:${c.id}">
    <div class="case-card-top">
      <div><div class="case-card-number">${esc(c.case_number)}</div><div class="case-card-client">${esc(c.client_name || '-')}</div></div>
      <span class="badge badge-${c.status}">${A.state.statusLabels[c.status] || esc(c.status)}</span>
    </div>
    <div class="case-card-body"><div style="font-size:var(--type-body);color:var(--foreground);font-weight:var(--font-weight-medium);margin-bottom:4px;">${esc(c.title)}</div></div>
    <div class="case-card-progress"><div class="case-card-progress-bar" style="width:${c.paid_fees && c.total_fees ? Math.min(100, (c.paid_fees / c.total_fees) * 100) : 0}%;background:var(--gold);"></div></div>
    <div class="case-card-meta"><span>${esc(c.court || '')}</span><span class="badge badge-${c.priority === 'high' ? 'danger' : 'gold'}">${esc(c.priority || _t('defaultPriority'))}</span></div>
    <div class="case-card-footer"><span style="font-size:11px;color:var(--muted-foreground);">${esc(c.created_date || '')}</span><i class="ri-arrow-left-s-line" style="color:var(--muted-foreground);"></i></div>
  </div>`
          )
          .join('')
      : `<div class="empty-state-v2"><i class="ri-briefcase-4-line"></i><h3>${_t('noCasesInList')}</h3><p>${_t('createFirstCase')}</p></div>`
  );
};

A.renderKanbanView = function (list) {
  const cols = { new: [], active: [], pending: [], appeal: [], closed: [], archived: [] };
  list.forEach(c => {
    const s = c.archived ? 'archived' : cols[c.status] ? c.status : 'new';
    cols[s].push(c);
  });
  Object.keys(cols).forEach(status => {
    const el = document.getElementById('kanban' + status.charAt(0).toUpperCase() + status.slice(1));
    const count = document.getElementById('kanbanCount' + status.charAt(0).toUpperCase() + status.slice(1));
    if (count) count.textContent = cols[status].length;
    if (el)
      A.safeSet(el, esc =>
        cols[status]
          .map(
            c => `<div class="kanban-card" draggable="true" data-id="${c.id}">
      <div class="kanban-card-title" data-click="case:open:${c.id}">${esc(c.case_number)}</div>
      <div class="kanban-card-sub">${esc(c.title)}</div>
      <div class="kanban-card-footer">
        <div class="kanban-card-priority" style="background:${c.priority === 'high' ? 'var(--destructive)' : c.priority === 'medium' ? 'var(--gold)' : 'var(--muted-foreground)'};"></div>
        <span class="kanban-card-client">${esc(c.client_name || '')}</span>
      </div>
    </div>`
          )
          .join('')
      );
  });
};

A.attachCaseActions = function () {
  document.querySelectorAll('.ws-open-btn').forEach(b => b.addEventListener('click', () => A.openCaseDetail(parseInt(b.dataset.id, 10))));
  document.querySelectorAll('.ws-archive-btn').forEach(b =>
    b.addEventListener('click', async () => {
      const id = parseInt(b.dataset.id, 10);
      const c = A.state.allCases.find(x => x.id === id);
      try {
        if (c && c.archived) await A.mutate('db:unarchiveCase', id);
        else await A.mutate('db:archiveCase', id);
        A.showToast(c && c.archived ? _t('caseRestored') : _t('caseArchivedToast'), 'success');
      } catch (e) {
        A.logError('archiveToggle', e);
        A.showToast(_t('archiveToggleFailed'), 'error');
      }
      A.loadCases();
    })
  );
  document.querySelectorAll('.ws-delete-btn').forEach(b =>
    b.addEventListener('click', async () => {
      if (await A.showConfirm(_t('deleteCaseConfirm'))) {
        try {
          await A.mutate('db:deleteCase', parseInt(b.dataset.id, 10));
          A.showToast(_t('caseDeleted'), 'success');
        } catch (e) {
          A.logError('deleteCase', e);
          A.showToast(_t('caseDeleteFailed'), 'error');
        }
        A.loadCases();
      }
    })
  );
};

A.loadWsOverview = function (c) {
  const el = document.getElementById('wsOverview');
  const total = parseFloat(c.total_fees) || 0;
  const paid = parseFloat(c.paid_fees) || 0;
  A.safeSet(
    el,
    esc => `<div class="ws-overview-grid">
    <div>
      <div class="ws-info-card"><h4>${_t('caseInfoLabel')}</h4>
        <div class="ws-info-row"><span class="ws-info-label">${_t('clientInfoLabel')}</span><span class="ws-info-value">${esc(c.client_name || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('courtInfoLabel')}</span><span class="ws-info-value">${esc(c.court || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('typeInfoLabel')}</span><span class="ws-info-value">${esc(c.case_type || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('priorityInfoLabel')}</span><span class="ws-info-value">${esc(c.priority || _t('mediumLabel'))}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('openDateInfoLabel')}</span><span class="ws-info-value">${esc(c.created_date || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('lastActivityInfoLabel')}</span><span class="ws-info-value">${esc(c.updated_at || c.created_date || '-')}</span></div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--spacing-3);"><h4>${_t('quickActionsCaseLabel')}</h4>
        <div class="ws-quick-actions">
          <button class="ws-qa-btn ws-add-doc"><i class="ri-file-add-line"></i> ${_t('docQuickActionLabel')}</button>
          <button class="ws-qa-btn ws-add-hearing"><i class="ri-scales-line"></i> ${_t('hearingQuickActionLabel')}</button>
          <button class="ws-qa-btn ws-add-task"><i class="ri-task-add-line"></i> ${_t('taskQuickActionLabel')}</button>
          <button class="ws-qa-btn ws-add-note"><i class="ri-edit-2-line"></i> ${_t('noteQuickActionLabel')}</button>
          <button class="ws-qa-btn ws-add-expense"><i class="ri-money-add-line"></i> ${_t('expenseQuickActionLabel')}</button>
          <button class="ws-qa-btn" data-click="ai:timeline"><i class="ri-timeline-view"></i> ${_t('timelineAILabel')}</button>
          <button class="ws-qa-btn" data-click="ai:risk"><i class="ri-shield-flash-line"></i> ${_t('riskAILabel')}</button>
          <button class="ws-qa-btn" data-click="ai:chat"><i class="ri-robot-3-line"></i> ${_t('chatAILabel')}</button>
        </div>
      </div>
    </div>
    <div>
      <div class="ws-info-card"><h4>${_t('recentDocsLabel')}</h4><div id="wsOverviewDocs"><p class="empty-state-sm">${_t('noRecentDocs')}</p></div></div>
      <div class="ws-info-card" style="margin-top:var(--spacing-3);"><h4>${_t('financialSummaryLabel')}</h4>
        <div class="ws-info-row"><span class="ws-info-label">${_t('feesAmount')}</span><span class="ws-info-value">${total.toFixed(2)} ${_t('currencyMAD')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('paidAmount')}</span><span class="ws-info-value" style="color:var(--success);">${paid.toFixed(2)} ${_t('currencyMAD')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('remainingAmount')}</span><span class="ws-info-value" style="color:var(--gold);">${(total - paid).toFixed(2)} ${_t('currencyMAD')}</span></div>
      </div>
    </div>
  </div>`
  );
  A.loadWsOverviewDocs();
  el.querySelector('.ws-add-doc')?.addEventListener('click', () => {
    document.querySelector('[data-ws="documents"]')?.click();
    setTimeout(() => document.getElementById('wsUploadDocBtn')?.click(), 100);
  });
  el.querySelector('.ws-add-hearing')?.addEventListener('click', () => A.wsAddHearing());
  el.querySelector('.ws-add-task')?.addEventListener('click', () => A.wsAddTask());
  el.querySelector('.ws-add-note')?.addEventListener('click', () => {
    document.querySelector('[data-ws="notes"]')?.click();
    document.getElementById('wsNotesText')?.focus();
  });
  el.querySelector('.ws-add-expense')?.addEventListener('click', () => A.wsAddExpense());
};

A.loadWsOverviewDocs = async function (_token) {
  if (!A.state.ipc) return;
  const docs = await A.cachedInvoke('db:getDocuments', A.state.currentCaseId);
  if (_token !== undefined && _token !== A.state._caseDetailToken) return;
  const el = document.getElementById('wsOverviewDocs');
  A.safeSet(
    el,
    esc =>
      docs
        .slice(0, 3)
        .map(
          d => `<div class="dash-doc-item" style="padding:var(--spacing-px) 0;">
    <div class="dash-doc-icon" style="width:24px;height:24px;font-size:12px;background:rgba(198,161,91,0.1);color:var(--gold);"><i class="ri-file-4-line"></i></div>
    <div class="dash-doc-body"><div class="dash-doc-name" style="font-size:12px;">${esc(d.filename)}</div></div>
  </div>`
        )
        .join('') || `<p class="empty-state-sm">${_t('noRecentDocs')}</p>`
  );
};

A.loadWsTimeline = async function (_token) {
  const el = document.getElementById('wsTimeline');
  if (!A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', {});
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const caseLogs = (logs || []).filter(l => l.details && l.details.includes('#' + A.state.currentCaseId)).slice(0, 30);
    A.safeSet(el, esc =>
      caseLogs.length
        ? `<div class="dash-timeline" style="padding:0 !important;">${caseLogs
            .map(
              l => `<div class="tl-item">
      <span class="tl-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
      <div class="tl-icon" style="width:24px;height:24px;font-size:11px;background:var(--muted);color:var(--muted-foreground);"><i class="ri-history-line"></i></div>
      <div class="tl-body"><div class="tl-title" style="font-size:13px;">${esc(l.details)}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0, 10) : ''}</div></div>
    </div>`
            )
            .join('')}</div>`
        : `<p class="empty-state-sm" style="padding:40px;text-align:center;">${_t('noActivityRecorded')}</p>`
    );
  } catch (e) {
    A.logError('loadWsTimeline', e);
    A.showError(el, _t('failedLoadTimeline'), () => A.loadWsTimeline());
  }
};

A.loadWsDocuments = async function (_token) {
  const el = document.getElementById('wsDocuments');
  if (!A.state.ipc) return;
  try {
    const docs = await A.cachedInvoke('db:getDocuments', A.state.currentCaseId);
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    A.safeSet(
      el,
      esc => `<div class="ws-docs-header">
      <select id="wsDocType" class="input input-sm" style="width:150px;">${[_t('docTypeOpening'), _t('docTypeResponse'), _t('docTypeEvidence'), _t('docTypeJudgment'), _t('docTypeContract'), _t('docTypeReport'), _t('docTypeOther')].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
      <button id="wsUploadDocBtn" class="btn btn-primary btn-sm"><i class="ri-upload-2-line"></i> ${_t('uploadBtnLabel')}</button>
      <span class="ws-doc-count" style="font-size:12px;color:var(--muted-foreground);">${_t('docCount').replace('{n}', docs.length)}</span>
    </div>
    <div class="ws-docs-grid">${
      docs.length
        ? docs
            .map(
              d => `<div class="ws-doc-card">
      <i class="ri-file-4-line ws-doc-icon"></i>
      <div class="ws-doc-name">${esc(d.filename)}</div>
      <div class="ws-doc-meta">${esc(d.doc_type)} · ${d.upload_date ? d.upload_date.slice(0, 10) : ''}</div>
      <button class="btn btn-sm btn-outline" data-click="ai:summarize" data-id="${d.id}" data-name="${esc(d.filename)}" style="margin-top:var(--spacing-1-5);font-size:11px;"><i class="ri-robot-3-line"></i> ${_t('aiSummaryLabel')}</button>
    </div>`
            )
            .join('')
        : `<p class="empty-state-sm" style="grid-column:1/-1;text-align:center;padding:40px;">${_t('noDocsLabel')}</p>`
    }</div>`
    );
    document.getElementById('wsUploadDocBtn')?.addEventListener('click', () => {
      const input = document.getElementById('fileInput');
      input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        let filePath = null;
        try {
          if (window.electron?.webUtils?.getPathForFile) {
            filePath = window.electron.webUtils.getPathForFile(file);
          }
          if (!filePath) {
            A.showToast(_t('filePathError'), 'error');
            return;
          }
          await A.mutate('db:uploadDocument', { sourcePath: filePath, caseId: A.state.currentCaseId, docType: document.getElementById('wsDocType').value });
          A.loadWsDocuments(A.state._caseDetailToken);
          A.loadWsOverviewDocs(A.state._caseDetailToken);
        } catch (error) {
          A.logError('uploadDoc', error);
          A.showToast(_t('fileUploadError'), 'error');
        }
      };
      input.click();
    });
  } catch (e) {
    A.logError('loadWsDocuments', e);
    A.showError(el, _t('failedLoadDocuments'), () => A.loadWsDocuments());
  }
};

A.loadWsHearings = async function (_token) {
  const el = document.getElementById('wsHearings');
  if (!A.state.ipc) return;
  try {
    const procs = await A.cachedInvoke('db:getProcedures', A.state.currentCaseId);
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const hearings = (procs || []).filter(p => p.type === 'Audience').sort((a, b) => b.date?.localeCompare(a.date));
    const today = new Date().toISOString().slice(0, 10);
    A.safeSet(
      el,
      esc => `<div class="toolbar"><button id="wsAddHearingBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> ${_t('newHearingBtn')}</button></div>
      <div style="margin-top:var(--spacing-3);">${
        hearings.length
          ? hearings
              .map(
                h => `<div class="tl-item">
        <span class="tl-time">${esc(A.formatDate(h.date))}</span>
        <div class="tl-icon" style="width:28px;height:28px;background:${h.date >= today ? 'rgba(198,161,91,0.12)' : 'var(--muted)'};color:${h.date >= today ? 'var(--gold)' : 'var(--muted-foreground)'};"><i class="ri-scales-3-line"></i></div>
        <div class="tl-body"><div class="tl-title">${esc(A.formatDate(h.date))}</div><div class="tl-sub">${esc(h.description || '')}</div></div>
        <span class="badge ${h.date >= today ? 'badge-active' : 'badge-closed'}">${h.date >= today ? _t('upcomingBadge') : _t('pastBadge')}</span>
      </div>`
              )
              .join('')
          : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noHearingsLabel')}</p>`
      }</div>`
    );
    document.getElementById('wsAddHearingBtn')?.addEventListener('click', () => A.wsAddHearing());
  } catch (e) {
    A.logError('loadWsHearings', e);
    A.showError(el, _t('failedLoadHearings'), () => A.loadWsHearings());
  }
};

A.wsAddHearing = function () {
  A.showModal(
    _t('newHearingBtn'),
    `
    <div class="input-group"><label class="input-label">${_t('hearingDateLabel')}</label><input type="date" id="fWsHearingDate" class="input" value="${new Date().toISOString().slice(0, 10)}"></div>
    <div class="input-group"><label class="input-label">${_t('hearingTypeLabel')}</label><select id="fWsHearingType" class="input"><option value="Audience">${_t('hearingSession')}</option><option value="Plaidoirie">${_t('hearingPleading')}</option><option value="Mise en délibéré">${_t('hearingDeliberation')}</option></select></div>
    <div class="input-group"><label class="input-label">${_t('hearingNotesLabel')}</label><textarea id="fWsHearingNotes" class="input" rows="3"></textarea></div>
  `,
    async () => {
      try {
        await A.mutate('db:addProcedure', {
          affaire_id: A.state.currentCaseId,
          date: document.getElementById('fWsHearingDate').value,
          type: document.getElementById('fWsHearingType').value,
          description: document.getElementById('fWsHearingNotes').value
        });
      } catch (e) {
        A.logError('addProcedure', e);
        A.showToast(_t('hearingAddFailed'), 'error');
        return;
      }
      A.hideModal();
      A.loadWsHearings();
    }
  );
};

A.loadWsTasks = async function (_token) {
  const el = document.getElementById('wsTasks');
  if (!A.state.ipc) return;
  try {
    const all = await A.cachedInvoke('db:getAllTasks');
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const tasks = all.filter(t => t.case_id === A.state.currentCaseId || (t.notes && t.notes.includes('#' + A.state.currentCaseId)));
    const todo = tasks.filter(t => t.status === 'todo'),
      inprog = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending'),
      done = tasks.filter(t => t.status === 'done');
    A.safeSet(
      el,
      esc => `<div class="toolbar"><button id="wsAddTaskBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> ${_t('newTaskBtn')}</button></div>
      <div class="ws-kanban-mini" style="margin-top:var(--spacing-3);">
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--border);"></div><span class="dash-mk-label">${_t('taskTodoLabel')}</span><span class="dash-mk-count">${todo.length}</span></div>${todo.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:${t.priority === 'high' ? 'var(--destructive)' : 'var(--gold)'};"></div>${esc(t.title)}</div>`).join('') || `<div style="font-size:12px;color:var(--muted-foreground);padding:8px 0;">${_t('taskNoneLabel')}</div>`}</div>
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--gold);"></div><span class="dash-mk-label">${_t('taskInProgressLabel')}</span><span class="dash-mk-count">${inprog.length}</span></div>${inprog.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:var(--gold);"></div>${esc(t.title)}</div>`).join('') || `<div style="font-size:12px;color:var(--muted-foreground);padding:8px 0;">${_t('taskNoneLabel')}</div>`}</div>
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--success);"></div><span class="dash-mk-label">${_t('taskCompletedLabel')}</span><span class="dash-mk-count">${done.length}</span></div>${done.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:var(--success);"></div>${esc(t.title)}</div>`).join('') || `<div style="font-size:12px;color:var(--muted-foreground);padding:8px 0;">${_t('taskNoneLabel')}</div>`}</div>
      </div>`
    );
    document.getElementById('wsAddTaskBtn')?.addEventListener('click', () => A.wsAddTask());
  } catch (e) {
    A.logError('loadWsTasks', e);
    A.showError(el, _t('failedLoadTasksLabel'), () => A.loadWsTasks());
  }
};

A.wsAddTask = function () {
  A.showModal(
    _t('newTaskBtn'),
    `
    <div class="input-group"><label class="input-label">${_t('taskTitleLabel')}</label><input type="text" id="fWsTaskTitle" class="input"></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('taskPriorityLabel')}</label><select id="fWsTaskPriority" class="input"><option value="medium">${_t('mediumLabel')}</option><option value="high">${_t('highLabel')}</option><option value="low">${_t('lowLabel')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('taskDueDateLabel')}</label><input type="date" id="fWsTaskDue" class="input"></div>
    </div>
  `,
    async () => {
      const title = document.getElementById('fWsTaskTitle').value.trim();
      if (!title) {
        A.showToast(_t('taskTitleRequired'), 'error');
        return;
      }
      try {
        await A.mutate('db:addTask', {
          title,
          priority: document.getElementById('fWsTaskPriority').value,
          due_date: document.getElementById('fWsTaskDue').value,
          status: 'todo',
          notes: '#' + A.state.currentCaseId
        });
      } catch (e) {
        A.logError('addTask', e);
        A.showToast(_t('taskAddFailed'), 'error');
        return;
      }
      A.hideModal();
      A.loadWsTasks();
      A.loadDashboard();
    }
  );
};

A.loadWsNotes = async function (_token) {
  const el = document.getElementById('wsNotes');
  if (!A.state.ipc) return;
  try {
    const all = (await A.cachedInvoke('db:getAllCases')) || [];
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const c = all.find(x => x.id === A.state.currentCaseId) || { notes: '', description: '' };
    A.safeSet(
      el,
      esc => `<div class="ws-notes-toolbar">
      <button title="${_t('boldLabel')}" data-click="editor:bold"><b>B</b></button>
      <button title="${_t('italicLabel')}" data-click="editor:italic"><i>I</i></button>
      <button title="${_t('listLabel')}" data-click="editor:list"><i class="ri-list-unordered"></i></button>
    </div>
    <div class="ws-notes-area">
      <textarea id="wsNotesText" placeholder="${_t('notesPlaceholderText')}" class="input">${esc(c.notes || c.description || '')}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:var(--spacing-1-5);">
        <span style="font-size:11px;color:var(--muted-foreground);" id="wsNotesStatus"></span>
        <button id="wsSaveNotesBtn" class="btn btn-primary btn-sm"><i class="ri-save-line"></i> ${_t('saveBtnLabel')}</button>
      </div>
    </div>`
    );
    document.getElementById('wsSaveNotesBtn')?.addEventListener('click', async () => {
      const text = document.getElementById('wsNotesText').value;
      try {
        await A.mutate('db:updateCaseNotes', { id: A.state.currentCaseId, notes: text });
        if (A.AutoSave) A.AutoSave.clear('case_notes_' + A.state.currentCaseId);
      } catch (e) {
        A.logError('saveNotes', e);
        A.showToast(_t('notesSaveFailed'), 'error');
      }
      document.getElementById('wsNotesStatus').textContent = _t('savedStatus');
      setTimeout(() => (document.getElementById('wsNotesStatus').textContent = ''), 2000);
    });
    const saveNotes = A.debounce(() => {
      document.getElementById('wsSaveNotesBtn')?.click();
    }, 500);
    const wsNotesText = document.getElementById('wsNotesText');
    if (wsNotesText) {
      wsNotesText.addEventListener('input', () => {
        document.getElementById('wsNotesStatus').textContent = _t('notSavedYet');
        saveNotes();
        if (A.AutoSave) A.AutoSave.markDirty('case_notes_' + A.state.currentCaseId);
      });
      if (A.AutoSave) {
        A.AutoSave.register('case_notes_' + A.state.currentCaseId, {
          getValue: () => document.getElementById('wsNotesText')?.value || '',
          setValue: v => {
            const el = document.getElementById('wsNotesText');
            if (el) el.value = v;
          },
          indicator: () => document.getElementById('wsNotesStatus'),
          debounce: 2000,
          onSave: val => localStorage.setItem('autosave_last_note_case_' + A.state.currentCaseId, val)
        });
      }
    }
  } catch (e) {
    A.logError('loadWsNotes', e);
    A.showError(el, _t('failedLoadTimeline'), () => A.loadWsNotes());
  }
};

A.loadWsExpenses = async function (c, _token) {
  const el = document.getElementById('wsExpenses');
  if (!A.state.ipc) return;
  try {
    const paiements = await A.cachedInvoke('db:getPaiements', A.state.currentCaseId);
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const total = parseFloat(c.total_fees) || 0;
    const paid = paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0);
    const expenses = parseFloat(c.expenses) || 0;
    A.safeSet(
      el,
      esc => `<div class="ws-expenses-stats">
      <div class="ws-exp-card"><div class="ws-exp-number">${total.toFixed(2)}</div><div class="ws-exp-label">${_t('feesLabel')}</div></div>
      <div class="ws-exp-card"><div class="ws-exp-number" style="color:var(--success);">${paid.toFixed(2)}</div><div class="ws-exp-label">${_t('paidLabel')}</div></div>
      <div class="ws-exp-card"><div class="ws-exp-number" style="color:var(--gold);">${(total - paid).toFixed(2)}</div><div class="ws-exp-label">${_t('remainingLabel')}</div></div>
    </div>
    <div class="toolbar"><button id="wsAddExpenseBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> ${_t('addPaymentBtn')}</button></div>
    ${paiements.length ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--border);margin-top:var(--spacing-2);"><table class="table"><thead><tr><th>${_t('paymentDateLabel')}</th><th>${_t('paymentAmountLabel')}</th><th>${_t('paymentModeLabel')}</th><th>${_t('paymentNotesLabel')}</th></tr></thead><tbody>${paiements.map(p => `<tr><td>${esc(A.formatDate(p.date))}</td><td>${esc(p.montant)}</td><td>${esc(p.mode_paiement)}</td><td>${esc(p.remarque || '-')}</td></tr>`).join('')}</tbody></table></div>` : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noPaymentsLabel')}</p>`}`
    );
    document.getElementById('wsAddExpenseBtn')?.addEventListener('click', () => A.wsAddExpense());
  } catch (e) {
    A.logError('loadWsExpenses', e);
    A.showError(el, _t('failedLoadExpenses'), () => A.loadWsExpenses({ id: A.state.currentCaseId, total_fees: 0, expenses: 0 }));
  }
};

A.wsAddExpense = function () {
  A.showModal(
    _t('addPaymentBtn'),
    `
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('paymentDateLabel')}</label><input type="date" id="fWsPayDate" class="input" value="${new Date().toISOString().slice(0, 10)}"></div>
      <div class="input-group"><label class="input-label">${_t('paymentAmountLabel')}</label><input type="number" id="fWsPayMontant" class="input" step="0.01" min="0"></div>
    </div>
    <div class="input-group"><label class="input-label">${_t('paymentModeLabel')}</label><select id="fWsPayMode" class="input"><option value="Espèces">${_t('paymentCash')}</option><option value="Virement bancaire">${_t('paymentBank')}</option><option value="Chèque">${_t('paymentCheque')}</option></select></div>
    <div class="input-group"><label class="input-label">${_t('paymentNotesLabel')}</label><textarea id="fWsPayRemarque" class="input" rows="2"></textarea></div>
  `,
    async () => {
      const montant = parseFloat(document.getElementById('fWsPayMontant').value);
      if (!montant || montant <= 0) {
        A.showToast(_t('paymentAmountRequired'), 'error');
        return;
      }
      try {
        await A.mutate('db:addPaiement', {
          affaire_id: A.state.currentCaseId,
          date: document.getElementById('fWsPayDate').value,
          montant,
          mode_paiement: document.getElementById('fWsPayMode').value,
          remarque: document.getElementById('fWsPayRemarque').value
        });
        const allCases = (await A.cachedInvoke('db:getAllCases')) || [];
        const currentCase = allCases.find(x => x.id === A.state.currentCaseId) || { id: A.state.currentCaseId, total_fees: 0, expenses: 0 };
        A.hideModal();
        A.loadWsExpenses(currentCase);
      } catch (e) {
        A.logError('wsAddExpense', e);
        A.showToast(_t('paymentAddFailed'), 'error');
      }
    }
  );
};

A.loadWsContacts = async function (_token) {
  const el = document.getElementById('wsContacts');
  if (!A.state.ipc) return;
  try {
    const [allCases, clients] = await Promise.all([
      A.cachedInvoke('db:getAllCases'),
      A.cachedInvoke('db:getAllClients')
    ]);
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const c = allCases.find(x => x.id === A.state.currentCaseId);
    const client = clients.find(x => x.id === c?.client_id);
    A.safeSet(
      el,
      esc => `<div class="ws-contacts-grid">
      <div class="ws-contact-card"><div class="ws-contact-name">${esc(client?.name || c?.client_name || '-')}</div><div class="ws-contact-role">${_t('contactClientRole')}</div><div class="ws-contact-detail">${esc(client?.phone || '')}</div><div class="ws-contact-detail">${esc(client?.email || '')}</div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">${_t('contactOpposing')}</div><div class="ws-contact-detail"></div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">${_t('contactWitnesses')}</div><div class="ws-contact-detail"></div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">${_t('contactExperts')}</div><div class="ws-contact-detail"></div></div>
    </div>`
    );
  } catch (e) {
    A.logError('loadWsContacts', e);
    A.showError(el, _t('failedLoadContacts'), () => A.loadWsContacts());
  }
};

A.loadWsAnalytics = async function (c, _token) {
  const el = document.getElementById('wsAnalytics');
  if (!A.state.ipc) return;
  try {
    const [docs, procs, paiements, allTasks] = await Promise.all([
      A.cachedInvoke('db:getDocuments', A.state.currentCaseId),
      A.cachedInvoke('db:getProcedures', A.state.currentCaseId),
      A.cachedInvoke('db:getPaiements', A.state.currentCaseId),
      A.cachedInvoke('db:getAllTasks')
    ]);
    if (_token !== undefined && _token !== A.state._caseDetailToken) return;
    const tasks = allTasks.filter(t => t.case_id === A.state.currentCaseId || (t.notes && t.notes.includes('#' + A.state.currentCaseId)));
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    A.safeSetStatic(
      el,
      `<div class="ws-analytics-grid">
      <div class="ws-analytics-card"><h4>${_t('analyticsHearings')}</h4><div class="ws-analytics-number">${procs.filter(p => p.type === 'Audience').length}</div></div>
      <div class="ws-analytics-card"><h4>${_t('analyticsDocs')}</h4><div class="ws-analytics-number">${docs.length}</div></div>
      <div class="ws-analytics-card"><h4>${_t('analyticsExpenses')}</h4><div class="ws-analytics-number">${paiements.length}</div><div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${(paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0) / (parseFloat(c.total_fees) || 1)) * 100}%;background:var(--gold);"></div></div></div>
      <div class="ws-analytics-card"><h4>${_t('analyticsTaskCompletion')}</h4><div class="ws-analytics-number">${taskRate}%</div><div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${taskRate}%;background:var(--success);"></div></div></div>
    </div>`
    );
  } catch (e) {
    A.logError('loadWsAnalytics', e);
    A.showError(el, _t('failedLoadAnalytics'), () => A.loadWsAnalytics({ id: A.state.currentCaseId, total_fees: 0 }));
  }
};

A.addWsAIMessage = function (text, isUser) {
  const container = document.getElementById('wsAiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = `text-align:${isUser ? 'left' : 'right'};padding:8px 12px;background:${isUser ? 'var(--primary)' : 'var(--muted)'};color:${isUser ? '#fff' : 'var(--foreground)'};border-radius:var(--rounded-md);margin-bottom:8px;font-size:13px;line-height:1.6;${!isUser ? 'white-space:pre-wrap;' : ''}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
};

A.loadWsAI = function () {
  const el = document.getElementById('wsAI');
  if (!el) return;
  A.safeSetStatic(
    el,
    `<div class="ws-ai-chat">
    <div class="ws-ai-messages" id="wsAiMessages">
      <div style="text-align:center;padding:20px;color:var(--muted-foreground);font-size:13px;">${_t('aiContextualQuestion')}</div>
    </div>
    <div class="ws-ai-input">
      <input type="text" id="wsAiInput" placeholder="${_t('aiInputPlaceholder')}" class="input" style="flex:1;">
      <button id="wsAiSendBtn" class="btn btn-primary"><i class="ri-send-plane-2-line"></i></button>
    </div>
  </div>`
  );
  document.getElementById('wsAiSendBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('wsAiInput');
    const msg = input.value.trim();
    if (!msg || !A.state.ipc) return;
    A.addWsAIMessage(msg, true);
    input.value = '';
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--muted-foreground);font-size:12px;';
    loadingEl.textContent = _t('aiLoadingMsg');
    document.getElementById('wsAiMessages')?.appendChild(loadingEl);
    try {
      const res = await A.state.ipc.invoke('ai:askContextual', { mode: 'chat', message: msg, contextType: 'case', contextId: A.state.currentCaseId });
      loadingEl.remove();
      A.addWsAIMessage(res.friendlyError || res.text || '', false);
    } catch (e) {
      loadingEl.remove();
      A.addWsAIMessage(_t('aiErrorMsg'), false);
      A.logError('wsAiSend', e);
    }
  });
  document.getElementById('wsAiInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('wsAiSendBtn')?.click();
  });
};
