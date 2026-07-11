var A = (window.App = window.App || {});

A.state.allCases = [];
A.state.currentCaseId = null;
A.state.caseViewMode = 'table';
A.state.showArchived = false;
A.state.currentTaskId = null;
A.state._caseDetailToken = 0;

A._populateCaseFilters = function (allCases) {
  const courtEl = document.getElementById('filterCourt');
  if (courtEl && !courtEl.dataset.populated) {
    const courts = [...new Set(allCases.map(c => c.court).filter(Boolean))];
    courtEl.innerHTML = '<option value="">' + _t('filterCourtPlaceholder') + '</option>' + courts.map(c => `<option value="${A.escapeHtml(c)}">${A.escapeHtml(c)}</option>`).join('');
    courtEl.dataset.populated = 'true';
  }
  const clientEl = document.getElementById('filterClient');
  if (clientEl && !clientEl.dataset.populated) {
    const clients = [...new Set(allCases.map(c => c.client_name).filter(Boolean))];
    clientEl.innerHTML = '<option value="">' + _t('filterClientPlaceholder') + '</option>' + clients.map(c => `<option value="${A.escapeHtml(c)}">${A.escapeHtml(c)}</option>`).join('');
    clientEl.dataset.populated = 'true';
  }
};

A.loadCases = async function (filter) {
  if (!A.state.ipc) return;
  A.showSkeleton('casesBody', 5, 'tableRow');
  try {
    A.state.allCases = A.state.showArchived ? await A.cachedInvoke('db:getArchivedCases') : await A.cachedInvoke('db:getAllCases');
    A._populateCaseFilters(A.state.allCases);
    const q = document.getElementById('searchCases')?.value.toLowerCase() || '';
    let list = A.state.allCases;
    if (q)
      list = list.filter(
        c => (c.case_number || '').toLowerCase().includes(q) || (c.title || '').toLowerCase().includes(q) || (c.client_name || '').toLowerCase().includes(q)
      );
    const fStatus = document.getElementById('filterStatus')?.value;
    const fPriority = document.getElementById('filterPriority')?.value;
    const fCourt = document.getElementById('filterCourt')?.value;
    const fClient = document.getElementById('filterClient')?.value;
    const fDateFrom = document.getElementById('filterDateFrom')?.value;
    if (fStatus) list = list.filter(c => c.status === fStatus);
    if (fPriority) list = list.filter(c => c.priority === fPriority);
    if (fCourt) list = list.filter(c => c.court === fCourt);
    if (fClient) list = list.filter(c => (c.client_name || '') === fClient);
    if (fDateFrom) list = list.filter(c => (c.created_date || '') >= fDateFrom);
    if (filter && filter !== 'all') list = list.filter(c => c.status === filter);
    if (A.state._caseScroll) A.state._caseScroll.destroy();
    A.state._caseScroll = A.VirtualScroll.init(
      'casesBody',
      list,
      function (displayed) {
        A.renderTableView(displayed);
      },
      30
    );
    A.renderCardView(list);
    A.renderKanbanView(list);
  } catch (e) {
    A.logError('loadCases', e);
    const mainEl = document.getElementById('casesBody')?.parentElement;
    if (mainEl) A.showError(mainEl, _t('failedLoadCases'), () => A.loadCases(filter));
  }
};

A.openCaseDetail = async function (caseId) {
  if (!A.state.ipc || !caseId) return;
  const all = (await A.cachedInvoke('db:getAllCases')) || [];
  const c = all.find(x => x.id === caseId);
  if (!c) return;
  if (A.addRecentItem) A.addRecentItem('case', c.id, (c.case_number || '') + ' — ' + (c.title || ''), c.client_name || '', 'cases');
  A.state.currentCaseId = caseId;
  const _token = ++A.state._caseDetailToken;

  const cdTitleEl = document.getElementById('cdTitle');
  if (cdTitleEl) cdTitleEl.textContent = `${c.case_number} — ${c.title}`;
  const leaf = document.getElementById('cdBreadcrumbLeaf');
  if (leaf) leaf.textContent = `${c.case_number} — ${c.title}`;
  const badgeEl = document.getElementById('cdStatusBadge');
  if (badgeEl) {
    badgeEl.textContent = A.state.statusLabels[c.status] || c.status;
    badgeEl.className = 'ws-badge badge-' + c.status;
  }

  A.loadWsOverview(c, _token);
  A.loadWsTimeline(_token);
  A.loadWsDocuments(_token);
  A.loadWsHearings(_token);
  A.loadWsTasks(_token);
  A.loadWsNotes(_token);
  A.loadWsExpenses(c, _token);
  A.loadWsContacts(_token);
  A.loadWsAnalytics(c, _token);
  A.loadWsAI();

  const overlayEl = document.getElementById('caseDetailOverlay');
  if (overlayEl) overlayEl.style.display = 'flex';
};

A.wsAIAction = async function (actionFn, loadingText, userText) {
  if (!A.state.ipc || !A.state.currentCaseId) return;
  const aiTab = document.querySelector('[data-ws=ai]');
  if (aiTab) aiTab.click();
  const container = document.getElementById('wsAiMessages');
  if (!container) return;
  container.innerHTML = '';
  A.addWsAIMessage(userText, true);
  const loadingEl = document.createElement('div');
  loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--muted-foreground);font-size:12px;';
  loadingEl.textContent = loadingText;
  container.appendChild(loadingEl);
  try {
    const res = await actionFn();
    loadingEl.remove();
    A.addWsAIMessage(res.friendlyError || res.text || '', false);
  } catch (e) {
    loadingEl.remove();
    A.addWsAIMessage(_t('aiErrorMsg'), false);
    A.logError('wsAIAction', e);
  }
};

A.wsAiTimeline = async function () {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:generateTimeline', { caseId: A.state.currentCaseId }), _t('aiLoadingMsg'), _t('aiTimelinePrompt'));
};

A.wsAiRisk = async function () {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:detectRisks', { caseId: A.state.currentCaseId }), _t('aiLoadingMsg'), _t('aiRiskPrompt'));
};

A.wsAiSummarizeDoc = async function (docId, docName) {
  if (!A.state.ipc) return;
  const aiTab = document.querySelector('[data-ws=ai]');
  if (aiTab) aiTab.click();
  const container = document.getElementById('wsAiMessages');
  if (!container) return;
  container.innerHTML = '';
  A.addWsAIMessage(_t('aiSummarizePrompt').replace('{docName}', docName), true);
  const loadingEl = document.createElement('div');
  loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--muted-foreground);font-size:12px;';
  loadingEl.textContent = _t('aiLoadingMsg');
  container.appendChild(loadingEl);
  try {
    const res = await A.state.ipc.invoke('ai:summarizeDocument', { docId });
    loadingEl.remove();
    A.addWsAIMessage(res.friendlyError || res.text || '', false);
  } catch (e) {
    loadingEl.remove();
    A.addWsAIMessage(_t('aiErrorMsg'), false);
    A.logError('wsAiSummarize', e);
  }
};

window.openCaseDetail = A.openCaseDetail;
window.wsAiTimeline = A.wsAiTimeline;
window.wsAiRisk = A.wsAiRisk;
window.wsAiSummarizeDoc = A.wsAiSummarizeDoc;

A.initCases = function () {
  document.querySelectorAll('#section-cases .view-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#section-cases .view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      A.state.caseViewMode = btn.dataset.view;
      document.querySelectorAll('#section-cases .case-view-panel').forEach(p => p.classList.remove('active'));
      const id = 'cases' + A.state.caseViewMode.charAt(0).toUpperCase() + A.state.caseViewMode.slice(1) + 'View';
      document.getElementById(id)?.classList.add('active');
    })
  );

  document.getElementById('casesFilterBtn')?.addEventListener('click', () => {
    const bar = document.getElementById('casesFilterBar');
    if (bar) bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('searchCases')?.addEventListener(
    'input',
    A.debounce(() => A.loadCases(), 250)
  );
  try {
    A.state.showArchived = localStorage.getItem('casesShowArchived') === 'true';
  } catch (e) {}
  document.getElementById('toggleArchivedBtn')?.addEventListener('click', () => {
    A.state.showArchived = !A.state.showArchived;
    try { localStorage.setItem('casesShowArchived', A.state.showArchived); } catch (e) {}
    A.loadCases();
  });
  document.getElementById('filterApplyBtn')?.addEventListener('click', () => A.loadCases());
  document.getElementById('filterResetBtn')?.addEventListener('click', () => {
    document.querySelectorAll('#casesFilterBar select, #casesFilterBar input').forEach(el => (el.value = ''));
    A.loadCases();
  });

  document.getElementById('addCaseBtn')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const clients = (await A.cachedInvoke('db:getAllClients')) || [];
    const esc = A.escapeHtml;
    const opts = clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    const courts = [_t('court1stInstance'), _t('courtAppeal'), _t('courtCassation'), _t('courtAdmin'), _t('courtCommercial'), _t('courtSupreme')];
    const courtOpts = courts.map(c => `<option value="${c}">${c}</option>`).join('');
    A.showModal(
      _t('newCaseTitle'),
      `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-3);">
        <div class="input-group"><label class="input-label">${_t('caseNumberLabel')}</label><input type="text" id="fCaseNumber" class="input" placeholder="${_t('exampleCaseNumber')}"></div>
        <div class="input-group"><label class="input-label">${_t('subjectLabel')}</label><input type="text" id="fTitle" class="input" placeholder="${_t('subjectPlaceholder')}"></div>
        <div class="input-group"><label class="input-label">${_t('clientSelectLabel')}</label><select id="fClientId" class="input"><option value="">${_t('selectPlaceholder')}</option>${opts}</select></div>
        <div class="input-group"><label class="input-label">${_t('courtSelectLabel')}</label><select id="fCourt" class="input"><option value="">${_t('selectPlaceholder')}</option>${courtOpts}</select></div>
        <div class="input-group"><label class="input-label">${_t('caseTypeLabel')}</label><select id="fCaseType" class="input"><option value="مدني">${_t('caseTypeCivil')}</option><option value="تجاري">${_t('caseTypeCommercial')}</option><option value="إداري">${_t('caseTypeAdministrative')}</option><option value="جنائي">${_t('caseTypeCriminal')}</option><option value="أحوال شخصية">${_t('caseTypePersonalStatus')}</option><option value="اجتماعي">${_t('caseTypeSocial')}</option><option value="عقاري">${_t('caseTypeRealEstate')}</option></select></div>
        <div class="input-group"><label class="input-label">${_t('statusHeader')}</label><select id="fStatus" class="input"><option value="active">${_t('activeF')}</option><option value="pending">${_t('pendingF')}</option><option value="closed">${_t('closedF')}</option></select></div>
        <div class="input-group"><label class="input-label">${_t('priorityHeader')}</label><select id="fPriority" class="input"><option value="medium">${_t('mediumLabel')}</option><option value="high">${_t('highLabel')}</option><option value="low">${_t('lowLabel')}</option></select></div>
        <div class="input-group"><label class="input-label">${_t('openDateLabel')}</label><input type="date" id="fCreatedDate" class="input" value="${A.todayLocal()}"></div>
        <div class="input-group"><label class="input-label">${_t('deadlineDateLabel')}</label><input type="date" id="fDeadline" class="input"></div>
        <div class="input-group"><label class="input-label">${_t('feesLabelCase')}</label><input type="number" id="fFees" class="input" placeholder="0.00" step="0.01"></div>
      </div>
      <div class="input-group" style="margin-top:var(--spacing-2);"><label class="input-label">${_t('notesLabelCase')}</label><textarea id="fDescription" class="input" rows="2"></textarea></div>
    `,
      async () => {
        const cn = document.getElementById('fCaseNumber').value.trim();
        const ti = document.getElementById('fTitle').value.trim();
        if (!cn || !ti) {
          A.showToast(_t('caseFieldsRequired'), 'error');
          return;
        }
        try {
          const clientId = parseInt(document.getElementById('fClientId').value, 10) || null;
          const res = await A.mutate('db:addCase', {
            case_number: cn,
            title: ti,
            client_id: clientId,
            client_name: clientId ? clients.find(c => c.id === clientId)?.name || '' : '',
            court: document.getElementById('fCourt').value,
            status: document.getElementById('fStatus').value,
            priority: document.getElementById('fPriority').value,
            case_type: document.getElementById('fCaseType').value,
            created_date: document.getElementById('fCreatedDate').value,
            deadline_date: document.getElementById('fDeadline').value,
            total_fees: parseFloat(document.getElementById('fFees').value) || 0,
            description: document.getElementById('fDescription').value
          });
          if (res && res.error) {
            A.showToast(res.error, 'error');
            return;
          }
          if (res && res.duplicate) {
            if (res.archived) {
              A.showToast(_t('caseDuplicateNumberArchived').replace('{n}', res.existing?.case_number || ''), 'warning');
            } else {
              A.showToast(_t('caseDuplicateNumber').replace('{n}', res.existing?.case_number || ''), 'error');
            }
            return;
          }
          A.hideModal();
          A.loadCases();
          A.showToast(_t('caseCreated'), 'success');
        } catch (e) {
          A.logError('addCase', e);
          A.showToast(_t('caseCreateFailed'), 'error');
        }
      }
    );
  });

  const overlay = document.getElementById('caseDetailOverlay');
  if (overlay && !overlay.dataset._wsActions) {
    overlay.dataset._wsActions = '1';
    overlay.addEventListener('click', e => {
      const tab = e.target.closest('.ws-tab');
      if (tab) {
        document.querySelectorAll('#caseDetailOverlay .ws-tab').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('#caseDetailOverlay .ws-panel').forEach(p => p.classList.remove('active'));
        const panelId = 'ws' + tab.dataset.ws.charAt(0).toUpperCase() + tab.dataset.ws.slice(1);
        document.getElementById(panelId)?.classList.add('active');
        return;
      }
      const qa = e.target.closest('.ws-qa-btn');
      if (!qa) return;
      if (qa.classList.contains('ws-add-doc')) {
        document.querySelector('[data-ws="documents"]')?.click();
        setTimeout(() => document.getElementById('wsUploadDocBtn')?.click(), 100);
      } else if (qa.classList.contains('ws-add-hearing')) {
        A.wsAddHearing();
      } else if (qa.classList.contains('ws-add-task')) {
        A.wsAddTask();
      } else if (qa.classList.contains('ws-add-note')) {
        document.querySelector('[data-ws="notes"]')?.click();
        document.getElementById('wsNotesText')?.focus();
      } else if (qa.classList.contains('ws-add-expense')) {
        A.wsAddExpense();
      } else if (qa.dataset.click === 'ai:timeline') {
        A.wsAiTimeline();
      } else if (qa.dataset.click === 'ai:risk') {
        A.wsAiRisk();
      }
    });
  }

  A.attachCaseActions();

  document.getElementById('caseDetailClose')?.addEventListener('click', () => {
    const el = document.getElementById('caseDetailOverlay');
    if (el) el.style.display = 'none';
  });
  document.getElementById('caseDetailCloseBtn')?.addEventListener('click', () => {
    const el = document.getElementById('caseDetailOverlay');
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('#caseDetailOverlay .ws-breadcrumb-link').forEach(function (link) {
    link.addEventListener('click', function () {
      document.getElementById('caseDetailOverlay').style.display = 'none';
      A.navigateTo(link.dataset.section);
    });
  });

  document.getElementById('cdArchiveBtn')?.addEventListener('click', async () => {
    if (!A.state.currentCaseId) return;
    if (await A.showConfirm(_t('archiveCaseConfirm'), _t('archiveBtn'), 'warning')) {
      try {
        await A.mutate('db:archiveCase', A.state.currentCaseId);
      } catch (e) {
        A.logError('archiveCase', e);
        A.showToast(_t('archiveFailed'), 'error');
        return;
      }
      A.loadCases();
      document.getElementById('caseDetailOverlay').style.display = 'none';
      A.showToast(_t('caseArchivedSuccess'), 'success');
    }
  });

  document.getElementById('cdEditBtn')?.addEventListener('click', () => {
    if (!A.state.currentCaseId) return;
    A.showToast(_t('editCaseComing'), 'info');
  });

  document.getElementById('cdAiBtn')?.addEventListener('click', () => {
    A.navigateTo('ai');
    setTimeout(() => {
      const label = document.getElementById('cdTitle')?.textContent || _t('caseLabel');
      window.setAiContext('case', A.state.currentCaseId, label);
    }, 200);
  });

  document.querySelector('#casesKanbanView .kanban-board-full')?.addEventListener('dragover', e => {
    const col = e.target.closest('.kanban-col-body');
    if (!col) return;
    e.preventDefault();
    col.parentElement.classList.add('drag-over');
  });
  document.querySelector('#casesKanbanView .kanban-board-full')?.addEventListener('dragleave', e => {
    const col = e.target.closest('.kanban-col-body');
    if (!col) return;
    col.parentElement.classList.remove('drag-over');
  });
  document.querySelector('#casesKanbanView .kanban-board-full')?.addEventListener('drop', async e => {
    e.preventDefault();
    const col = e.target.closest('.kanban-col-body');
    if (!col) return;
    col.parentElement.classList.remove('drag-over');
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    const id = parseInt(dragging.dataset?.id, 10);
    if (!id) return;
    const newStatus = col.parentElement.dataset.status;
    try {
      if (newStatus === 'archived') await A.mutate('db:archiveCase', id);
      else if (newStatus) {
        const statusMap = { new: 'active', appeal: 'pending' };
        await A.mutate('db:updateCaseStatus', { id, status: statusMap[newStatus] || newStatus });
      }
      A.showToast(_t('caseStatusChanged'), 'success');
    } catch (e) {
      A.logError('kanbanDrop', e);
      A.showToast(_t('failedStatusChange'), 'error');
    }
    A.loadCases();
  });
};
