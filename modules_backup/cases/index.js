window.App = window.App || {};
const A = window.App;

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
    if (mainEl) A.showError(mainEl, 'تعذر تحميل قائمة القضايا.', () => A.loadCases(filter));
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
  loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--gray-400);font-size:12px;';
  loadingEl.textContent = loadingText;
  container.appendChild(loadingEl);
  try {
    const res = await actionFn();
    loadingEl.remove();
    A.addWsAIMessage(res.friendlyError || res.text || '', false);
  } catch (e) {
    loadingEl.remove();
    A.addWsAIMessage('حدث خطأ في الاتصال بالمساعد الذكي. حاول مرة أخرى.', false);
    A.logError('wsAIAction', e);
  }
};

A.wsAiTimeline = async function() {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:generateTimeline', { caseId: A.state.currentCaseId }), '🤖 جاري إنشاء الجدول الزمني...', 'أنشئ جدولاً زمنياً لهذه القضية');
};

A.wsAiRisk = async function() {
  await A.wsAIAction(() => A.state.ipc.invoke('ai:detectRisks', { caseId: A.state.currentCaseId }), '🤖 جاري تحليل المخاطر...', 'حلل المخاطر القانونية لهذه القضية');
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
  loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--gray-400);font-size:12px;';
  loadingEl.textContent = `🤖 جاري تلخيص "${docName}"...`;
  container.appendChild(loadingEl);
  try {
    const res = await A.state.ipc.invoke('ai:summarizeDocument', { docId });
    loadingEl.remove();
    A.addWsAIMessage(res.friendlyError || res.text || '', false);
  } catch (e) {
    loadingEl.remove();
    A.addWsAIMessage('حدث خطأ في الاتصال بالمساعد الذكي. حاول مرة أخرى.', false);
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
    const courts = ['المحكمة الابتدائية', 'محكمة الاستئناف', 'محكمة النقض', 'المحكمة الإدارية', 'المحكمة التجارية', 'المجلس الأعلى'];
    const courtOpts = courts.map(c => `<option value="${c}">${c}</option>`).join('');
    A.showModal('قضية جديدة', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div class="input-group"><label class="input-label">رقم القضية</label><input type="text" id="fCaseNumber" class="input" placeholder="مثال: 2024/123"></div>
        <div class="input-group"><label class="input-label">الموضوع</label><input type="text" id="fTitle" class="input" placeholder="موضوع القضية"></div>
        <div class="input-group"><label class="input-label">الموكل</label><select id="fClientId" class="input"><option value="">-- اختر --</option>${opts}</select></div>
        <div class="input-group"><label class="input-label">الخصم</label><input type="text" id="fOpponent" class="input" placeholder="الطرف المقابل"></div>
        <div class="input-group"><label class="input-label">المحكمة</label><select id="fCourt" class="input"><option value="">-- اختر --</option>${courtOpts}</select></div>
        <div class="input-group"><label class="input-label">النوع</label><select id="fCaseType" class="input"><option value="مدني">مدني</option><option value="تجاري">تجاري</option><option value="إداري">إداري</option><option value="جنائي">جنائي</option><option value="أحوال شخصية">أحوال شخصية</option><option value="اجتماعي">اجتماعي</option><option value="عقاري">عقاري</option></select></div>
        <div class="input-group"><label class="input-label">الحالة</label><select id="fStatus" class="input"><option value="active">نشطة</option><option value="pending">معلقة</option><option value="closed">مغلقة</option></select></div>
        <div class="input-group"><label class="input-label">الأولوية</label><select id="fPriority" class="input"><option value="medium">متوسطة</option><option value="high">عالية</option><option value="low">منخفضة</option></select></div>
        <div class="input-group"><label class="input-label">تاريخ الفتح</label><input type="date" id="fCreatedDate" class="input" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="input-group"><label class="input-label">الأجل الحسمي</label><input type="date" id="fDeadline" class="input"></div>
        <div class="input-group"><label class="input-label">القاضي المقرر</label><input type="text" id="fJudge" class="input"></div>
        <div class="input-group"><label class="input-label">الأتعاب</label><input type="number" id="fFees" class="input" placeholder="0.00" step="0.01"></div>
      </div>
      <div class="input-group" style="margin-top:var(--space-3);"><label class="input-label">ملاحظات</label><textarea id="fDescription" class="input" rows="2"></textarea></div>
    `, async () => {
      const cn = document.getElementById('fCaseNumber').value.trim();
      const ti = document.getElementById('fTitle').value.trim();
      if (!cn || !ti) { A.showToast('رقم القضية والموضوع إجباريان', 'error'); return; }
      try {
        const res = await A.mutate('db:addCase', {
          case_number: cn, title: ti,
          client_id: parseInt(document.getElementById('fClientId').value) || null,
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
        if (res && res.duplicate) { A.showToast('رقم القضية مكرر: ' + (res.existing?.case_number || ''), 'error'); return; }
        A.hideModal(); A.loadCases(); A.showToast('تم إنشاء القضية بنجاح', 'success');
      } catch (e) { A.logError('addCase', e); A.showToast('فشل إنشاء القضية', 'error'); }
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
    if (await A.showConfirm('أرشفة هذه القضية؟', 'أرشفة', 'warning')) {
      try { await A.mutate('db:archiveCase', A.state.currentCaseId); } catch (e) { A.logError('archiveCase', e); A.showToast('فشل الأرشفة', 'error'); return; }
      A.loadCases();
      document.getElementById('caseDetailOverlay').style.display = 'none';
      A.showToast('تم أرشفة القضية بنجاح', 'success');
    }
  });

  document.getElementById('cdEditBtn')?.addEventListener('click', () => {
    if (!A.state.currentCaseId) return;
    A.showToast('سيتم إضافة تعديل القضية قريباً', 'info');
  });

  document.getElementById('cdAiBtn')?.addEventListener('click', () => {
    A.navigateTo('ai');
    setTimeout(() => {
      const label = document.getElementById('cdTitle')?.textContent || 'قضية';
      window.setAiContext('case', A.state.currentCaseId, label);
    }, 200);
  });

  document.getElementById('showWorkflowsBtn')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const workflows = await A.cachedInvoke('db:getAllWorkflows');
    const templates = await A.cachedInvoke('db:getAllTemplates');
    const cases = await A.cachedInvoke('db:getAllCases');
    const caseOpts = cases.map(c => `<option value="${c.id}">${c.case_number}</option>`).join('');

    document.getElementById('workflowModalTitle').textContent = 'سير العمل والقالب';
    A.safeSet(document.getElementById('workflowModalBody'), esc => `
      <div style="margin-bottom:var(--space-4);">
        <h4 style="font-size:var(--font-size-sm);margin-bottom:var(--space-2);">تطبيق سير عمل على قضية</h4>
        <div class="info-grid-2">
          <select id="wfCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--space-2);">
            <select id="wfSelect" class="input" style="flex:1;">
              <option value="">اختر سير عمل...</option>
              ${workflows.map(w => `<option value="${w.id}">${esc(w.name)} (${w.step_count||0} خطوات)</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" onclick="applyWorkflow()">تطبيق</button>
          </div>
        </div>
      </div>
      <div style="margin-bottom:var(--space-4);">
        <h4 style="font-size:var(--font-size-sm);margin-bottom:var(--space-2);">تطبيق قالب على قضية</h4>
        <div class="info-grid-2">
          <select id="tmplCaseSelect" class="input">${caseOpts}</select>
          <div style="display:flex;gap:var(--space-2);">
            <select id="tmplSelect" class="input" style="flex:1;">
              <option value="">اختر قالب...</option>
              ${templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" onclick="applyTemplate()">تطبيق</button>
          </div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--gray-100);margin:var(--space-4) 0;">
      <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-3);">
        <button class="btn btn-secondary btn-sm" onclick="showNewWorkflowForm()">+ سير عمل جديد</button>
        <button class="btn btn-secondary btn-sm" onclick="showNewTemplateForm()">+ قالب جديد</button>
      </div>
      <h4 style="font-size:var(--font-size-sm);margin-bottom:var(--space-2);">سير العمل الحالية</h4>
      <div id="workflowList">${workflows.map(w => `<div class="workflow-card">
        <h4>${esc(w.name)}</h4>
        <p>${esc(w.description||'')} · ${w.step_count||0} خطوات</p>
        <button class="btn-icon" onclick="deleteWorkflowItem(${w.id})" style="position:absolute;top:8px;left:8px;"><i class="ri-delete-bin-line"></i></button>
      </div>`).join('') || '<p style="color:var(--gray-300);">لا توجد سير عمل</p>'}</div>
    `);
    document.getElementById('workflowModalOverlay').style.display = 'flex';
  });
};
