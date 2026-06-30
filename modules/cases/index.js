var A = window.App = window.App || {};

A.state.allCases = [];
A.state.currentCaseId = null;
A.state.caseViewMode = 'table';
A.state.showArchived = false;
A.state.currentTaskId = null;

A.loadCases = async function(filter) {
  if (!A.state.ipc) return;
  A.showSkeleton('casesBody', 5, 'tableRow');
  try {
    A.state.allCases = A.state.showArchived ? await A.cachedInvoke('db:getArchivedCases') : await A.cachedInvoke('db:getAllCases');
    const q = document.getElementById('searchCases').value.toLowerCase();
    let list = A.state.allCases;
    if (q) list = list.filter(c => (c.case_number||'').toLowerCase().includes(q) || (c.title||'').toLowerCase().includes(q) || (c.client_name||'').toLowerCase().includes(q));
    if (filter && filter !== 'all') list = list.filter(c => c.status === filter);
    if (A.state._caseScroll) A.state._caseScroll.destroy();
    A.state._caseScroll = A.VirtualScroll.init('casesBody', list, function(displayed) { A.renderTableView(displayed); }, 30);
    A.renderCardView(list);
    A.renderKanbanView(list);
  } catch (e) {
    A.logError('loadCases', e);
    const mainEl = document.getElementById('casesBody')?.parentElement;
    if (mainEl) A.showError(mainEl, _t('failedLoadCases'), () => A.loadCases(filter));
  }
};

A.openCaseDetail = async function(caseId) {
  if (!A.state.ipc || !caseId) return;
  const all = (await A.cachedInvoke('db:getAllCases')) || [];
  const c = all.find(x => x.id === caseId);
  if (!c) return;
  if (A.addRecentItem) A.addRecentItem('case', c.id, (c.case_number||'') + ' — ' + (c.title||''), c.client_name || '', 'cases');
  A.state.currentCaseId = caseId;

  document.getElementById('cdTitle').textContent = `${c.case_number} — ${c.title}`;
  document.getElementById('cdStatusBadge').textContent = A.state.statusLabels[c.status] || c.status;
  document.getElementById('cdStatusBadge').className = 'ws-badge badge-' + c.status;

  A.loadWsOverview(c);
  A.loadWsTimeline();
  A.loadWsDocuments();
  A.loadWsHearings();
  A.loadWsTasks();
  A.loadWsNotes();
  A.loadWsExpenses(c);
  A.loadWsContacts();
  A.loadWsAnalytics(c);
  A.loadWsAI();

  document.getElementById('caseDetailOverlay').style.display = 'flex';
};

A.wsAIAction = async function(actionFn, loadingText, userText) {
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

A.wsAiTimeline = async function() {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:generateTimeline', { caseId: A.state.currentCaseId }), _t('aiLoadingMsg'), 'أنشئ جدولاً زمنياً لهذه القضية');
};

A.wsAiRisk = async function() {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:detectRisks', { caseId: A.state.currentCaseId }), _t('aiLoadingMsg'), 'حلل المخاطر القانونية لهذه القضية');
};

A.wsAiSummarizeDoc = async function(docId, docName) {
  if (!A.state.ipc) return;
  const aiTab = document.querySelector('[data-ws=ai]');
  if (aiTab) aiTab.click();
  const container = document.getElementById('wsAiMessages');
  if (!container) return;
  container.innerHTML = '';
  A.addWsAIMessage(`لخص "${docName}"`, true);
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

A.initCases = function() {
  document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    A.state.caseViewMode = btn.dataset.view;
    document.querySelectorAll('.case-view-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('cases' + A.state.caseViewMode.charAt(0).toUpperCase() + A.state.caseViewMode.slice(1) + 'View').classList.add('active');
  }));

  document.getElementById('casesFilterBtn').addEventListener('click', () => {
    const bar = document.getElementById('casesFilterBar');
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('searchCases').addEventListener('input', A.debounce(() => A.loadCases(), 250));
  document.getElementById('toggleArchivedBtn').addEventListener('click', () => { A.state.showArchived = !A.state.showArchived; A.loadCases(); });
  document.getElementById('filterApplyBtn').addEventListener('click', () => A.loadCases());
  document.getElementById('filterResetBtn').addEventListener('click', () => {
    document.querySelectorAll('#casesFilterBar select, #casesFilterBar input').forEach(el => el.value = '');
    A.loadCases();
  });

  document.getElementById('addCaseBtn').addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const clients = (await A.cachedInvoke('db:getAllClients')) || [];
    const esc = A.escapeHtml;
    const opts = clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    const courts = [_t('court1stInstance'), _t('courtAppeal'), _t('courtCassation'), _t('courtAdmin'), _t('courtCommercial'), _t('courtSupreme')];
    const courtOpts = courts.map(c => `<option value="${c}">${c}</option>`).join('');
    A.showModal(_t('newCaseTitle'), `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-3);">
        <div class="input-group"><label class="input-label">${_t('caseNumberLabel')}</label><input type="text" id="fCaseNumber" class="input" placeholder="${_t('exampleCaseNumber')}"></div>
        <div class="input-group"><label class="input-label">${_t('subjectLabel')}</label><input type="text" id="fTitle" class="input" placeholder="${_t('subjectPlaceholder')}"></div>
        <div class="input-group"><label class="input-label">${_t('clientSelectLabel')}</label><select id="fClientId" class="input"><option value="">${_t('selectPlaceholder')}</option>${opts}</select></div>
        <div class="input-group"><label class="input-label">${_t('courtSelectLabel')}</label><select id="fCourt" class="input"><option value="">${_t('selectPlaceholder')}</option>${courtOpts}</select></div>
        <div class="input-group"><label class="input-label">${_t('caseTypeLabel')}</label><select id="fCaseType" class="input"><option value="مدني">مدني</option><option value="تجاري">تجاري</option><option value="إداري">إداري</option><option value="جنائي">جنائي</option><option value="أحوال شخصية">أحوال شخصية</option><option value="اجتماعي">اجتماعي</option><option value="عقاري">عقاري</option></select></div>
        <div class="input-group"><label class="input-label">${_t('statusHeader')}</label><select id="fStatus" class="input"><option value="active">${_t('activeF')}</option><option value="pending">${_t('pendingF')}</option><option value="closed">${_t('closedF')}</option></select></div>
        <div class="input-group"><label class="input-label">${_t('priorityHeader')}</label><select id="fPriority" class="input"><option value="medium">${_t('mediumLabel')}</option><option value="high">${_t('highLabel')}</option><option value="low">${_t('lowLabel')}</option></select></div>
        <div class="input-group"><label class="input-label">${_t('openDateLabel')}</label><input type="date" id="fCreatedDate" class="input" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="input-group"><label class="input-label">${_t('deadlineDateLabel')}</label><input type="date" id="fDeadline" class="input"></div>
        <div class="input-group"><label class="input-label">${_t('feesLabelCase')}</label><input type="number" id="fFees" class="input" placeholder="0.00" step="0.01"></div>
      </div>
      <div class="input-group" style="margin-top:var(--spacing-2);"><label class="input-label">${_t('notesLabelCase')}</label><textarea id="fDescription" class="input" rows="2"></textarea></div>
    `, async () => {
      const cn = document.getElementById('fCaseNumber').value.trim();
      const ti = document.getElementById('fTitle').value.trim();
      if (!cn || !ti) { A.showToast(_t('caseFieldsRequired'), 'error'); return; }
      try {
        const clientId = parseInt(document.getElementById('fClientId').value) || null;
        const res = await A.mutate('db:addCase', {
          case_number: cn, title: ti,
          client_id: clientId,
          client_name: clientId ? (clients.find(c => c.id === clientId)?.name || '') : '',
          court: document.getElementById('fCourt').value,
          status: document.getElementById('fStatus').value,
          priority: document.getElementById('fPriority').value,
          case_type: document.getElementById('fCaseType').value,
          created_date: document.getElementById('fCreatedDate').value,
          deadline_date: document.getElementById('fDeadline').value,
          total_fees: parseFloat(document.getElementById('fFees').value) || 0,
          description: document.getElementById('fDescription').value
        });
        if (res && res.error) { A.showToast(res.error, 'error'); return; }
        if (res && res.duplicate) { A.showToast(_t('caseDuplicateNumber').replace('{n}', res.existing?.case_number || ''), 'error'); return; }
        A.hideModal(); A.loadCases(); A.showToast(_t('caseCreated'), 'success');
      } catch (e) { A.logError('addCase', e); A.showToast(_t('caseCreateFailed'), 'error'); }
    });
  });

  document.querySelectorAll('.ws-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.ws-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.ws-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('ws' + btn.dataset.ws.charAt(0).toUpperCase() + btn.dataset.ws.slice(1)).classList.add('active');
  }));

  document.getElementById('caseDetailClose').addEventListener('click', () => document.getElementById('caseDetailOverlay').style.display = 'none');
  document.getElementById('caseDetailCloseBtn').addEventListener('click', () => document.getElementById('caseDetailOverlay').style.display = 'none');

  document.getElementById('cdArchiveBtn')?.addEventListener('click', async () => {
    if (!A.state.currentCaseId) return;
    if (await A.showConfirm(_t('archiveCaseConfirm'), _t('archiveBtn'), 'warning')) {
      try { await A.mutate('db:archiveCase', A.state.currentCaseId); } catch (e) { A.logError('archiveCase', e); A.showToast(_t('archiveFailed'), 'error'); return; }
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

};
