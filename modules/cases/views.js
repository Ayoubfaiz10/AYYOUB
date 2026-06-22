var A = window.App = window.App || {};

A.renderTableView = function(list) {
  const body = document.getElementById('casesBody');
  A.safeSet(body, esc => list.length ? list.map(c => `<tr>
    <td><strong style="cursor:pointer;color:var(--navy);" onclick="openCaseDetail(${c.id})">${esc(c.case_number)}</strong></td>
    <td>${esc(c.title)}</td>
    <td>${esc(c.client_name || '-')}</td>
    <td>${esc(c.court || '-')}</td>
    <td>${esc(c.case_type || '-')}</td>
    <td><span class="badge badge-${c.status}">${A.state.statusLabels[c.status] || esc(c.status)}</span></td>
    <td>${c.priority ? `<span class="badge badge-${c.priority === 'high' ? 'danger' : c.priority === 'medium' ? 'gold' : 'gray'}">${esc(c.priority)}</span>` : '-'}</td>
    <td style="font-size:11px;color:var(--gray-400);">${esc(c.created_date || '-')}</td>
    <td>
      <button class="btn-icon ws-open-btn" data-id="${c.id}"><i class="ri-eye-line"></i></button>
      <button class="btn-icon ws-archive-btn" data-id="${c.id}"><i class="ri-${c.archived ? 'history' : 'archive'}-line"></i></button>
      <button class="btn-icon ws-delete-btn" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
    </td>
  </tr>`).join('') : '<tr><td colspan="9"><div class="empty-state-v2"><i class="ri-briefcase-4-line"></i><h3>لا توجد قضايا</h3><p>أنشئ قضيتك الأولى لبدء التنظيم</p></div></td></tr>');
  A.attachCaseActions();
};

A.renderCardView = function(list) {
  const grid = document.getElementById('casesCardGrid');
  A.safeSet(grid, esc => list.length ? list.map(c => `<div class="case-card" onclick="openCaseDetail(${c.id})">
    <div class="case-card-top">
      <div><div class="case-card-number">${esc(c.case_number)}</div><div class="case-card-client">${esc(c.client_name || '-')}</div></div>
      <span class="badge badge-${c.status}">${A.state.statusLabels[c.status] || esc(c.status)}</span>
    </div>
    <div class="case-card-body"><div style="font-size:var(--font-size-sm);color:var(--gray-700);font-weight:var(--font-weight-medium);margin-bottom:4px;">${esc(c.title)}</div></div>
    <div class="case-card-progress"><div class="case-card-progress-bar" style="width:${c.paid_fees && c.total_fees ? Math.min(100, (c.paid_fees/c.total_fees)*100) : 0}%;background:var(--gold);"></div></div>
    <div class="case-card-meta"><span>${esc(c.court || '')}</span><span class="badge badge-${c.priority === 'high' ? 'danger' : 'gold'}">${esc(c.priority || 'عادي')}</span></div>
    <div class="case-card-footer"><span style="font-size:11px;color:var(--gray-400);">${esc(c.created_date || '')}</span><i class="ri-arrow-left-s-line" style="color:var(--gray-300);"></i></div>
  </div>`).join('') : '<div class="empty-state-v2"><i class="ri-briefcase-4-line"></i><h3>لا توجد قضايا</h3><p>أنشئ قضيتك الأولى لبدء التنظيم</p></div>');
};

A.renderKanbanView = function(list) {
  const cols = { new: [], active: [], pending: [], appeal: [], closed: [], archived: [] };
  list.forEach(c => { const s = c.archived ? 'archived' : cols[c.status] ? c.status : 'new'; cols[s].push(c); });
  Object.keys(cols).forEach(status => {
    const el = document.getElementById('kanban' + status.charAt(0).toUpperCase() + status.slice(1));
    const count = document.getElementById('kanbanCount' + status.charAt(0).toUpperCase() + status.slice(1));
    if (count) count.textContent = cols[status].length;
    if (el) A.safeSet(el, esc => cols[status].map(c => `<div class="kanban-card" draggable="true" data-id="${c.id}">
      <div class="kanban-card-title" onclick="openCaseDetail(${c.id})">${esc(c.case_number)}</div>
      <div class="kanban-card-sub">${esc(c.title)}</div>
      <div class="kanban-card-footer">
        <div class="kanban-card-priority" style="background:${c.priority === 'high' ? 'var(--danger)' : c.priority === 'medium' ? 'var(--gold)' : 'var(--gray-300)'};"></div>
        <span class="kanban-card-client">${esc(c.client_name || '')}</span>
      </div>
    </div>`).join(''));
  });
  A.initKanbanDragDrop();
};

A.attachCaseActions = function() {
  document.querySelectorAll('.ws-open-btn').forEach(b => b.addEventListener('click', () => A.openCaseDetail(parseInt(b.dataset.id))));
  document.querySelectorAll('.ws-archive-btn').forEach(b => b.addEventListener('click', async () => {
    const id = parseInt(b.dataset.id); const c = A.state.allCases.find(x => x.id === id);
    try { if (c && c.archived) await A.mutate('db:unarchiveCase', id); else await A.mutate('db:archiveCase', id); A.showToast(c && c.archived ? 'تم إرجاع القضية' : 'تم أرشفة القضية', 'success'); } catch (e) { A.logError('archiveToggle', e); A.showToast('فشل تغيير حالة الأرشفة', 'error'); }
    A.loadCases();
  }));
  document.querySelectorAll('.ws-delete-btn').forEach(b => b.addEventListener('click', async () => {
    if (await A.showConfirm('حذف هذه القضية؟')) { try { await A.mutate('db:deleteCase', parseInt(b.dataset.id)); A.showToast('تم حذف القضية', 'success'); } catch (e) { A.logError('deleteCase', e); A.showToast('فشل حذف القضية', 'error'); } A.loadCases(); }
  }));
};

A.loadWsOverview = function(c) {
  const el = document.getElementById('wsOverview');
  const total = parseFloat(c.total_fees) || 0;
  const paid = parseFloat(c.paid_fees) || 0;
  A.safeSet(el, esc => `<div class="ws-overview-grid">
    <div>
      <div class="ws-info-card"><h4>معلومات القضية</h4>
        <div class="ws-info-row"><span class="ws-info-label">الموكل</span><span class="ws-info-value">${esc(c.client_name || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">المحكمة</span><span class="ws-info-value">${esc(c.court || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">النوع</span><span class="ws-info-value">${esc(c.case_type || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">الأولوية</span><span class="ws-info-value">${esc(c.priority || 'متوسطة')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">تاريخ الفتح</span><span class="ws-info-value">${esc(c.created_date || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">آخر نشاط</span><span class="ws-info-value">${esc(c.updated_at || c.created_date || '-')}</span></div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--space-4);"><h4>إجراءات سريعة</h4>
        <div class="ws-quick-actions">
          <button class="ws-qa-btn ws-add-doc"><i class="ri-file-add-line"></i> وثيقة</button>
          <button class="ws-qa-btn ws-add-hearing"><i class="ri-scales-line"></i> جلسة</button>
          <button class="ws-qa-btn ws-add-task"><i class="ri-task-add-line"></i> مهمة</button>
          <button class="ws-qa-btn ws-add-note"><i class="ri-edit-2-line"></i> ملاحظة</button>
          <button class="ws-qa-btn ws-add-expense"><i class="ri-money-add-line"></i> مصروف</button>
          <button class="ws-qa-btn" onclick="wsAiTimeline()"><i class="ri-timeline-view"></i> Timeline AI</button>
          <button class="ws-qa-btn" onclick="wsAiRisk()"><i class="ri-shield-flash-line"></i> مخاطر AI</button>
          <button class="ws-qa-btn" onclick="document.querySelector('[data-ws=ai]').click()"><i class="ri-robot-3-line"></i> محادثة AI</button>
        </div>
      </div>
    </div>
    <div>
      <div class="ws-info-card"><h4>آخر الوثائق</h4><div id="wsOverviewDocs"><p class="empty-state-sm">لا توجد</p></div></div>
      <div class="ws-info-card" style="margin-top:var(--space-4);"><h4>الملخص المالي</h4>
        <div class="ws-info-row"><span class="ws-info-label">الأتعاب</span><span class="ws-info-value">${total.toFixed(2)} د.م.</span></div>
        <div class="ws-info-row"><span class="ws-info-label">المدفوع</span><span class="ws-info-value" style="color:var(--success);">${paid.toFixed(2)} د.م.</span></div>
        <div class="ws-info-row"><span class="ws-info-label">المتبقي</span><span class="ws-info-value" style="color:var(--gold);">${(total - paid).toFixed(2)} د.م.</span></div>
      </div>
    </div>
  </div>`);
  A.loadWsOverviewDocs();
  el.querySelector('.ws-add-doc')?.addEventListener('click', () => { document.querySelector('[data-ws="documents"]')?.click(); setTimeout(() => document.getElementById('wsUploadDocBtn')?.click(), 100); });
  el.querySelector('.ws-add-hearing')?.addEventListener('click', () => A.wsAddHearing());
  el.querySelector('.ws-add-task')?.addEventListener('click', () => A.wsAddTask());
  el.querySelector('.ws-add-note')?.addEventListener('click', () => { document.querySelector('[data-ws="notes"]')?.click(); document.getElementById('wsNotesText')?.focus(); });
  el.querySelector('.ws-add-expense')?.addEventListener('click', () => A.wsAddExpense());
};

A.loadWsOverviewDocs = async function() {
  if (!A.state.ipc) return;
  const docs = await A.cachedInvoke('db:getDocuments', A.state.currentCaseId);
  const el = document.getElementById('wsOverviewDocs');
  A.safeSet(el, esc => docs.slice(0, 3).map(d => `<div class="dash-doc-item" style="padding:var(--space-1) 0;">
    <div class="dash-doc-icon" style="width:24px;height:24px;font-size:12px;background:rgba(198,161,91,0.1);color:var(--gold);"><i class="ri-file-4-line"></i></div>
    <div class="dash-doc-body"><div class="dash-doc-name" style="font-size:12px;">${esc(d.filename)}</div></div>
  </div>`).join('') || '<p class="empty-state-sm">لا توجد</p>');
};

A.loadWsTimeline = async function() {
  const el = document.getElementById('wsTimeline');
  if (!A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', {});
    const caseLogs = (logs||[]).filter(l => l.details && l.details.includes('#' + A.state.currentCaseId)).slice(0, 30);
    A.safeSet(el, esc => caseLogs.length ? `<div class="dash-timeline" style="padding:0 !important;">${caseLogs.map(l => `<div class="tl-item">
      <span class="tl-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
      <div class="tl-icon" style="width:24px;height:24px;font-size:11px;background:var(--gray-50);color:var(--gray-500);"><i class="ri-history-line"></i></div>
      <div class="tl-body"><div class="tl-title" style="font-size:13px;">${esc(l.details)}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0, 10) : ''}</div></div>
    </div>`).join('')}</div>` : '<p class="empty-state-sm" style="padding:40px;text-align:center;">لا توجد نشاطات مسجلة</p>');
  } catch (e) { A.logError('loadWsTimeline', e); A.showError(el, 'تعذر تحميل الجدول الزمني.', () => A.loadWsTimeline()); }
};

A.loadWsDocuments = async function() {
  const el = document.getElementById('wsDocuments');
  if (!A.state.ipc) return;
  try {
    const docs = await A.cachedInvoke('db:getDocuments', A.state.currentCaseId);
    A.safeSet(el, esc => `<div class="ws-docs-header">
      <select id="wsDocType" class="input input-sm" style="width:150px;">${['مقال افتتاحي','مذكرة جوابية','حجة وإثبات','حكم أو قرار','عقد','تقرير','أخرى'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
      <button id="wsUploadDocBtn" class="btn btn-primary btn-sm"><i class="ri-upload-2-line"></i> رفع</button>
      <span class="ws-doc-count" style="font-size:12px;color:var(--gray-400);">${docs.length} وثيقة</span>
    </div>
    <div class="ws-docs-grid">${docs.length ? docs.map(d => `<div class="ws-doc-card">
      <i class="ri-file-4-line ws-doc-icon"></i>
      <div class="ws-doc-name">${esc(d.filename)}</div>
      <div class="ws-doc-meta">${esc(d.doc_type)} · ${d.upload_date ? d.upload_date.slice(0, 10) : ''}</div>
      <button class="btn btn-sm btn-outline" onclick="wsAiSummarizeDoc(${d.id},'${esc(d.filename).replace(/'/g,'\\\'')}')" style="margin-top:var(--space-2);font-size:11px;"><i class="ri-robot-3-line"></i> تلخيص AI</button>
    </div>`).join('') : '<p class="empty-state-sm" style="grid-column:1/-1;text-align:center;padding:40px;">لا توجد وثائق</p>'}</div>`);
    document.getElementById('wsUploadDocBtn')?.addEventListener('click', () => {
      const input = document.getElementById('fileInput');
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        let filePath = null;
        try {
          if (window.electron?.webUtils?.getPathForFile) {
            filePath = window.electron.webUtils.getPathForFile(file);
          } else if (file.path) {
            filePath = file.path;
          }
          if (!filePath) { A.showToast('تعذر الحصول على مسار الملف', 'error'); return; }
          await A.mutate('db:uploadDocument', { sourcePath: filePath, caseId: A.state.currentCaseId, docType: document.getElementById('wsDocType').value });
          A.loadWsDocuments(); A.loadWsOverviewDocs();
        } catch (error) {
          A.logError('uploadDoc', error);
          A.showToast('حدث خطأ أثناء رفع الملف', 'error');
        }
      };
      input.click();
    });
  } catch (e) { A.logError('loadWsDocuments', e); A.showError(el, 'تعذر تحميل الوثائق.', () => A.loadWsDocuments()); }
};

A.loadWsHearings = async function() {
  const el = document.getElementById('wsHearings');
  if (!A.state.ipc) return;
  try {
    const procs = await A.cachedInvoke('db:getProcedures', A.state.currentCaseId);
    const hearings = (procs||[]).filter(p => p.type === 'Audience').sort((a, b) => b.date?.localeCompare(a.date));
    const today = new Date().toISOString().slice(0, 10);
    A.safeSet(el, esc => `<div class="toolbar"><button id="wsAddHearingBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> جلسة جديدة</button></div>
      <div style="margin-top:var(--space-4);">${hearings.length ? hearings.map(h => `<div class="tl-item">
        <span class="tl-time">${esc(A.formatDate(h.date))}</span>
        <div class="tl-icon" style="width:28px;height:28px;background:${h.date >= today ? 'rgba(198,161,91,0.12)' : 'var(--gray-50)'};color:${h.date >= today ? 'var(--gold)' : 'var(--gray-400)'};"><i class="ri-scales-3-line"></i></div>
        <div class="tl-body"><div class="tl-title">${esc(A.formatDate(h.date))}</div><div class="tl-sub">${esc(h.description || '')}</div></div>
        <span class="badge ${h.date >= today ? 'badge-active' : 'badge-closed'}">${h.date >= today ? 'قادمة' : 'سابقة'}</span>
      </div>`).join('') : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد جلسات</p>'}</div>`);
    document.getElementById('wsAddHearingBtn')?.addEventListener('click', () => A.wsAddHearing());
  } catch (e) { A.logError('loadWsHearings', e); A.showError(el, 'تعذر تحميل الجلسات.', () => A.loadWsHearings()); }
};

A.wsAddHearing = function() {
  A.showModal('جلسة جديدة', `
    <div class="input-group"><label class="input-label">التاريخ</label><input type="date" id="fWsHearingDate" class="input" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="input-group"><label class="input-label">النوع</label><select id="fWsHearingType" class="input"><option value="Audience">جلسة</option><option value="Plaidoirie">مرافعة</option><option value="Mise en délibéré">تأجيل للنطق</option></select></div>
    <div class="input-group"><label class="input-label">ملاحظات</label><textarea id="fWsHearingNotes" class="input" rows="3"></textarea></div>
  `, async () => {
    try { await A.mutate('db:addProcedure', { affaire_id: A.state.currentCaseId, date: document.getElementById('fWsHearingDate').value, type: document.getElementById('fWsHearingType').value, description: document.getElementById('fWsHearingNotes').value }); } catch (e) { A.logError('addProcedure', e); A.showToast('فشل إضافة الجلسة', 'error'); return; }
    A.hideModal(); A.loadWsHearings();
  });
};

A.loadWsTasks = async function() {
  const el = document.getElementById('wsTasks');
  if (!A.state.ipc) return;
  try {
    const all = await A.cachedInvoke('db:getAllTasks');
    const tasks = all.filter(t => t.case_id === A.state.currentCaseId || (t.notes && t.notes.includes('#' + A.state.currentCaseId)));
    const todo = tasks.filter(t => t.status === 'todo'), inprog = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending'), done = tasks.filter(t => t.status === 'done');
    A.safeSet(el, esc => `<div class="toolbar"><button id="wsAddTaskBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> مهمة جديدة</button></div>
      <div class="ws-kanban-mini" style="margin-top:var(--space-4);">
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--gray-400);"></div><span class="dash-mk-label">للقيام</span><span class="dash-mk-count">${todo.length}</span></div>${todo.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:${t.priority === 'high' ? 'var(--danger)' : 'var(--gold)'};"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:8px 0;">لا توجد</div>'}</div>
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--gold);"></div><span class="dash-mk-label">قيد الإنجاز</span><span class="dash-mk-count">${inprog.length}</span></div>${inprog.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:var(--gold);"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:8px 0;">لا توجد</div>'}</div>
        <div><div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--success);"></div><span class="dash-mk-label">مكتملة</span><span class="dash-mk-count">${done.length}</span></div>${done.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:var(--success);"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:8px 0;">لا توجد</div>'}</div>
      </div>`);
    document.getElementById('wsAddTaskBtn')?.addEventListener('click', () => A.wsAddTask());
  } catch (e) { A.logError('loadWsTasks', e); A.showError(el, 'تعذر تحميل المهام.', () => A.loadWsTasks()); }
};

A.wsAddTask = function() {
  A.showModal('مهمة جديدة', `
    <div class="input-group"><label class="input-label">العنوان</label><input type="text" id="fWsTaskTitle" class="input"></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">الأولوية</label><select id="fWsTaskPriority" class="input"><option value="medium">متوسطة</option><option value="high">عالية</option><option value="low">منخفضة</option></select></div>
      <div class="input-group"><label class="input-label">تاريخ الاستحقاق</label><input type="date" id="fWsTaskDue" class="input"></div>
    </div>
  `, async () => {
    const title = document.getElementById('fWsTaskTitle').value.trim();
    if (!title) { A.showToast('العنوان إجباري', 'error'); return; }
    try { await A.mutate('db:addTask', { title, priority: document.getElementById('fWsTaskPriority').value, due_date: document.getElementById('fWsTaskDue').value, status: 'todo', notes: '#' + A.state.currentCaseId }); } catch (e) { A.logError('addTask', e); A.showToast('فشل إضافة المهمة', 'error'); return; }
    A.hideModal(); A.loadWsTasks(); A.loadDashboard();
  });
};

A.loadWsNotes = async function() {
  const el = document.getElementById('wsNotes');
  if (!A.state.ipc) return;
  try {
    const all = (await A.cachedInvoke('db:getAllCases')) || [];
    const c = all.find(x => x.id === A.state.currentCaseId) || { notes: '', description: '' };
    A.safeSet(el, esc => `<div class="ws-notes-toolbar">
      <button title="عريض" onclick="document.execCommand('bold')"><b>B</b></button>
      <button title="مائل" onclick="document.execCommand('italic')"><i>I</i></button>
      <button title="قائمة" onclick="document.execCommand('insertUnorderedList')"><i class="ri-list-unordered"></i></button>
    </div>
    <div class="ws-notes-area">
      <textarea id="wsNotesText" placeholder="اكتب ملاحظاتك هنا..." class="input">${esc(c.notes || c.description || '')}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:var(--space-2);">
        <span style="font-size:11px;color:var(--gray-400);" id="wsNotesStatus"></span>
        <button id="wsSaveNotesBtn" class="btn btn-primary btn-sm"><i class="ri-save-line"></i> حفظ</button>
      </div>
    </div>`);
    document.getElementById('wsSaveNotesBtn')?.addEventListener('click', async () => {
      const text = document.getElementById('wsNotesText').value;
      try { await A.mutate('db:updateCaseNotes', { id: A.state.currentCaseId, notes: text }); if (A.AutoSave) A.AutoSave.clear('case_notes_' + A.state.currentCaseId); } catch (e) { A.logError('saveNotes', e); A.showToast('فشل حفظ الملاحظات', 'error'); }
      document.getElementById('wsNotesStatus').textContent = 'تم الحفظ';
      setTimeout(() => document.getElementById('wsNotesStatus').textContent = '', 2000);
    });
    const saveNotes = A.debounce(() => { document.getElementById('wsSaveNotesBtn')?.click(); }, 500);
    const wsNotesText = document.getElementById('wsNotesText');
    if (wsNotesText) {
      wsNotesText.addEventListener('input', () => {
        document.getElementById('wsNotesStatus').textContent = 'لم يتم الحفظ بعد...';
        saveNotes();
        if (A.AutoSave) A.AutoSave.markDirty('case_notes_' + A.state.currentCaseId);
      });
      if (A.AutoSave) {
        A.AutoSave.register('case_notes_' + A.state.currentCaseId, {
          getValue: () => document.getElementById('wsNotesText')?.value || '',
          setValue: (v) => { const el = document.getElementById('wsNotesText'); if (el) el.value = v; },
          indicator: () => document.getElementById('wsNotesStatus'),
          debounce: 2000,
          onSave: (val) => localStorage.setItem('autosave_last_note_case_' + A.state.currentCaseId, val)
        });
      }
    }
  } catch (e) { A.logError('loadWsNotes', e); A.showError(el, 'تعذر تحميل الملاحظات.', () => A.loadWsNotes()); }
};

A.loadWsExpenses = async function(c) {
  const el = document.getElementById('wsExpenses');
  if (!A.state.ipc) return;
  try {
    const paiements = await A.cachedInvoke('db:getPaiements', A.state.currentCaseId);
    const total = parseFloat(c.total_fees) || 0;
    const paid = paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0);
    const expenses = parseFloat(c.expenses) || 0;
    A.safeSet(el, esc => `<div class="ws-expenses-stats">
      <div class="ws-exp-card"><div class="ws-exp-number">${total.toFixed(2)}</div><div class="ws-exp-label">الأتعاب</div></div>
      <div class="ws-exp-card"><div class="ws-exp-number" style="color:var(--success);">${paid.toFixed(2)}</div><div class="ws-exp-label">المدفوع</div></div>
      <div class="ws-exp-card"><div class="ws-exp-number" style="color:var(--gold);">${(total - paid).toFixed(2)}</div><div class="ws-exp-label">المتبقي</div></div>
    </div>
    <div class="toolbar"><button id="wsAddExpenseBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> إضافة دفعة</button></div>
    ${paiements.length ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--gray-100);margin-top:var(--space-3);"><table class="table"><thead><tr><th>التاريخ</th><th>المبلغ</th><th>طريقة الدفع</th><th>ملاحظات</th></tr></thead><tbody>${paiements.map(p => `<tr><td>${esc(A.formatDate(p.date))}</td><td>${esc(p.montant)}</td><td>${esc(p.mode_paiement)}</td><td>${esc(p.remarque || '-')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد دفعات</p>'}`);
    document.getElementById('wsAddExpenseBtn')?.addEventListener('click', () => A.wsAddExpense());
  } catch (e) { A.logError('loadWsExpenses', e); A.showError(el, 'تعذر تحميل المصاريف.', () => A.loadWsExpenses({ id: A.state.currentCaseId, total_fees: 0, expenses: 0 })); }
};

A.wsAddExpense = function() {
  A.showModal('إضافة دفعة', `
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">التاريخ</label><input type="date" id="fWsPayDate" class="input" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="input-group"><label class="input-label">المبلغ</label><input type="number" id="fWsPayMontant" class="input" step="0.01" min="0"></div>
    </div>
    <div class="input-group"><label class="input-label">طريقة الدفع</label><select id="fWsPayMode" class="input"><option value="Espèces">نقداً</option><option value="Virement bancaire">تحويل بنكي</option><option value="Chèque">شيك</option></select></div>
    <div class="input-group"><label class="input-label">ملاحظات</label><textarea id="fWsPayRemarque" class="input" rows="2"></textarea></div>
  `, async () => {
    const montant = parseFloat(document.getElementById('fWsPayMontant').value);
    if (!montant || montant <= 0) { A.showToast('المبلغ إجباري', 'error'); return; }
    try {
      await A.mutate('db:addPaiement', { affaire_id: A.state.currentCaseId, date: document.getElementById('fWsPayDate').value, montant, mode_paiement: document.getElementById('fWsPayMode').value, remarque: document.getElementById('fWsPayRemarque').value });
      const allCases = await A.cachedInvoke('db:getAllCases') || [];
      const currentCase = allCases.find(x => x.id === A.state.currentCaseId) || { id: A.state.currentCaseId, total_fees: 0, expenses: 0 };
      A.hideModal(); A.loadWsExpenses(currentCase);
    } catch (e) { A.logError('wsAddExpense', e); A.showToast('فشل إضافة الدفعة', 'error'); }
  });
};

A.loadWsContacts = async function() {
  const el = document.getElementById('wsContacts');
  if (!A.state.ipc) return;
  try {
    const c = (await A.cachedInvoke('db:getAllCases')).find(x => x.id === A.state.currentCaseId);
    const clients = await A.cachedInvoke('db:getAllClients');
    const client = clients.find(x => x.id === c?.client_id);
    A.safeSet(el, esc => `<div class="ws-contacts-grid">
      <div class="ws-contact-card"><div class="ws-contact-name">${esc(client?.name || c?.client_name || '-')}</div><div class="ws-contact-role">الموكل</div><div class="ws-contact-detail">${esc(client?.phone || '')}</div><div class="ws-contact-detail">${esc(client?.email || '')}</div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">المحامي المقابل</div><div class="ws-contact-detail"></div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">الشهود</div><div class="ws-contact-detail"></div></div>
      <div class="ws-contact-card"><div class="ws-contact-name">—</div><div class="ws-contact-role">الخبراء</div><div class="ws-contact-detail"></div></div>
    </div>`);
  } catch (e) { A.logError('loadWsContacts', e); A.showError(el, 'تعذر تحميل جهات الاتصال.', () => A.loadWsContacts()); }
};

A.loadWsAnalytics = async function(c) {
  const el = document.getElementById('wsAnalytics');
  if (!A.state.ipc) return;
  try {
    const docs = await A.cachedInvoke('db:getDocuments', A.state.currentCaseId);
    const procs = await A.cachedInvoke('db:getProcedures', A.state.currentCaseId);
    const paiements = await A.cachedInvoke('db:getPaiements', A.state.currentCaseId);
    const allTasks = await A.cachedInvoke('db:getAllTasks');
    const tasks = allTasks.filter(t => t.case_id === A.state.currentCaseId || (t.notes && t.notes.includes('#' + A.state.currentCaseId)));
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    A.safeSetStatic(el, `<div class="ws-analytics-grid">
      <div class="ws-analytics-card"><h4>الجلسات</h4><div class="ws-analytics-number">${procs.filter(p => p.type === 'Audience').length}</div></div>
      <div class="ws-analytics-card"><h4>الوثائق</h4><div class="ws-analytics-number">${docs.length}</div></div>
      <div class="ws-analytics-card"><h4>المصاريف</h4><div class="ws-analytics-number">${paiements.length}</div><div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${(paiements.reduce((s,p) => s + parseFloat(p.montant||0),0) / (parseFloat(c.total_fees) || 1)) * 100}%;background:var(--gold);"></div></div></div>
      <div class="ws-analytics-card"><h4>إنجاز المهام</h4><div class="ws-analytics-number">${taskRate}%</div><div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${taskRate}%;background:var(--success);"></div></div></div>
    </div>`);
  } catch (e) { A.logError('loadWsAnalytics', e); A.showError(el, 'تعذر تحميل التحليلات.', () => A.loadWsAnalytics({ id: A.state.currentCaseId, total_fees: 0 })); }
};

A.addWsAIMessage = function(text, isUser) {
  const container = document.getElementById('wsAiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = `text-align:${isUser ? 'left' : 'right'};padding:8px 12px;background:${isUser ? 'var(--navy)' : 'var(--gray-50)'};color:${isUser ? '#fff' : 'var(--gray-700)'};border-radius:var(--radius-md);margin-bottom:8px;font-size:13px;line-height:1.6;${!isUser ? 'white-space:pre-wrap;' : ''}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
};

A.loadWsAI = function() {
  const el = document.getElementById('wsAI');
  if (!el) return;
  A.safeSetStatic(el, `<div class="ws-ai-chat">
    <div class="ws-ai-messages" id="wsAiMessages">
      <div style="text-align:center;padding:20px;color:var(--gray-400);font-size:13px;">اطرح سؤالاً حول هذه القضية — التحليل السياقي متاح</div>
    </div>
    <div class="ws-ai-input">
      <input type="text" id="wsAiInput" placeholder="اسأل عن القضية..." class="input" style="flex:1;">
      <button id="wsAiSendBtn" class="btn btn-primary"><i class="ri-send-plane-2-line"></i></button>
    </div>
  </div>`);
  document.getElementById('wsAiSendBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('wsAiInput');
    const msg = input.value.trim(); if (!msg || !A.state.ipc) return;
    A.addWsAIMessage(msg, true);
    input.value = '';
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'text-align:right;padding:8px 12px;color:var(--gray-400);font-size:12px;';
    loadingEl.textContent = '🤖 جاري التحليل...';
    document.getElementById('wsAiMessages')?.appendChild(loadingEl);
    try {
      const res = await A.state.ipc.invoke('ai:askContextual', { mode: 'chat', message: msg, contextType: 'case', contextId: A.state.currentCaseId });
      loadingEl.remove();
      A.addWsAIMessage(res.friendlyError || res.text || '', false);
    } catch (e) {
      loadingEl.remove();
      A.addWsAIMessage('حدث خطأ في الاتصال بالمساعد الذكي. حاول مرة أخرى.', false);
      A.logError('wsAiSend', e);
    }
  });
  document.getElementById('wsAiInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('wsAiSendBtn')?.click(); });
};
