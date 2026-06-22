var A = window.App = window.App || {};

A.state.calView = 'month';
A.state.calDate = new Date();

A.loadCalendar = async function() {
  if (!A.state.ipc) return;
  const grid = document.getElementById('calGrid') || document.getElementById('calMonthGrid');
  if (grid) A.showSkeleton(grid, 6, 'calDay');
  try {
    A.state.allEvents = (await A.cachedInvoke('events:getAll')) || [];
    A.renderCalendar();
    A.renderMiniCalendar();
  } catch (e) {
    A.logError('loadCalendar', e);
    if (grid) A.showError(grid, 'تعذر تحميل التقويم.', () => A.loadCalendar());
  }
};

A.showEventForm = async function(editData) {
  const cases = (await A.cachedInvoke('db:getAllCases')) || [];
  const clients = (await A.cachedInvoke('db:getAllClients')) || [];
  const esc = A.escapeHtml;
  const caseOpts = cases.map(c => `<option value="${c.id}" ${editData && editData.case_id === c.id ? 'selected' : ''}>${esc(c.case_number)} - ${esc(c.title)}</option>`).join('');
  const clientOpts = clients.map(c => `<option value="${c.id}" ${editData && editData.client_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const isEdit = !!editData;
  const typeOpts = ['hearing','deadline','meeting','task','document','payment'].map(t => `<option value="${t}" ${editData && editData.type === t ? 'selected' : ''}>${{hearing:'⚖️ جلسة',deadline:'⏰ موعد نهائي',meeting:'📋 اجتماع',task:'✅ مهمة',document:'📄 تقديم وثائق',payment:'💰 دفعة'}[t]}</option>`).join('');
  const statusOpts = ['scheduled','postponed','completed','cancelled'].map(s => `<option value="${s}" ${editData && editData.status === s ? 'selected' : ''}>${{scheduled:'مجدول',postponed:'مؤجل',completed:'مكتمل',cancelled:'ملغي'}[s]}</option>`).join('');

  A.showModal(isEdit ? 'تعديل الحدث' : 'حدث جديد', `
    <div class="input-group"><label class="input-label">العنوان</label><input type="text" id="fEventTitle" class="input" value="${esc(editData ? editData.title : '')}" placeholder="عنوان الحدث"></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">القضية</label><select id="fEventCase" class="input"><option value="">-- اختياري --</option>${caseOpts}</select></div>
      <div class="input-group"><label class="input-label">الموكل</label><select id="fEventClient" class="input"><option value="">-- اختياري --</option>${clientOpts}</select></div>
    </div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">النوع</label><select id="fEventType" class="input">${typeOpts}</select></div>
      <div class="input-group"><label class="input-label">الحالة</label><select id="fEventStatus" class="input">${statusOpts}</select></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">التاريخ</label><input type="date" id="fEventDate" class="input" value="${esc(editData ? editData.date : new Date().toISOString().slice(0,10))}"></div>
      <div class="input-group"><label class="input-label">من</label><input type="time" id="fEventTime" class="input" value="${esc(editData ? editData.time || '' : '')}"></div>
      <div class="input-group"><label class="input-label">إلى</label><input type="time" id="fEventEndTime" class="input" value="${esc(editData ? editData.end_time || '' : '')}"></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">المحكمة</label><input type="text" id="fEventCourt" class="input" value="${esc(editData ? editData.court || '' : '')}"></div>
      <div class="input-group"><label class="input-label">القاضي</label><input type="text" id="fEventJudge" class="input" value="${esc(editData ? editData.judge || '' : '')}"></div>
      <div class="input-group"><label class="input-label">الغرفة</label><input type="text" id="fEventRoom" class="input" value="${esc(editData ? editData.room || '' : '')}"></div>
    </div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">الأولوية</label><select id="fEventUrgency" class="input">${['low','medium','high','critical'].map(u => `<option value="${u}" ${editData && editData.urgency === u ? 'selected' : ''}>${{low:'منخفضة',medium:'متوسطة',high:'عالية',critical:'حرجة'}[u]}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">تكرار</label><select id="fEventRecurring" class="input">${['none','daily','weekly','monthly','yearly'].map(r => `<option value="${r}" ${editData && editData.recurring_type === r ? 'selected' : ''}>${{none:'بدون',daily:'يومي',weekly:'أسبوعي',monthly:'شهري',yearly:'سنوي'}[r]}</option>`).join('')}</select></div>
    </div>
    <div class="input-group"><label class="input-label">ملاحظات</label><textarea id="fEventNotes" class="input" rows="3">${esc(editData ? editData.notes || '' : '')}</textarea></div>
    <div class="input-group"><label class="input-label">النتيجة (للجلسات المنجزة)</label><textarea id="fEventOutcome" class="input" rows="2">${esc(editData ? editData.outcome || '' : '')}</textarea></div>
  `, async () => {
    const title = document.getElementById('fEventTitle').value.trim();
    if (!title) { A.showToast('العنوان مطلوب', 'error'); return; }
    const data = {
      title,
      case_id: parseInt(document.getElementById('fEventCase').value) || null,
      client_id: parseInt(document.getElementById('fEventClient').value) || null,
      type: document.getElementById('fEventType').value,
      status: document.getElementById('fEventStatus').value,
      date: document.getElementById('fEventDate').value,
      time: document.getElementById('fEventTime').value || null,
      end_time: document.getElementById('fEventEndTime').value || null,
      court: document.getElementById('fEventCourt').value || null,
      judge: document.getElementById('fEventJudge').value || null,
      room: document.getElementById('fEventRoom').value || null,
      urgency: document.getElementById('fEventUrgency').value,
      recurring_type: document.getElementById('fEventRecurring').value,
      notes: document.getElementById('fEventNotes').value || null,
      outcome: document.getElementById('fEventOutcome').value || null
    };
    try {
      if (isEdit) {
        await A.mutate('events:update', editData.id, data);
      } else {
        const id = await A.mutate('events:add', data);
        if (data.recurring_type !== 'none') {
          const numRecur = 4;
          const interval = { daily: 1, weekly: 7, monthly: 30, yearly: 365 }[data.recurring_type] || 7;
          for (let i = 1; i <= numRecur; i++) {
            const nextDate = new Date(data.date + 'T12:00:00');
            nextDate.setDate(nextDate.getDate() + interval * i);
            await A.mutate('events:add', { ...data, date: nextDate.toISOString().slice(0,10), recurring_type: 'none' });
          }
        }
      }
      A.hideModal();
      A.loadHearings();
      if (typeof A.loadCalendar === 'function') A.loadCalendar();
    } catch (e) { A.logError('saveEvent', e); A.showToast('فشل حفظ الحدث', 'error'); }
  });
};

A.openEventDetail = async function(eventId) {
  if (!A.state.ipc) return;
  let e;
  try { e = await A.cachedInvoke('events:get', eventId); } catch (error) { A.logError('openEventDetail', error); A.showToast('حدث خطأ أثناء تحميل الحدث', 'error'); return; }
  if (!e) { A.showToast('الحدث غير موجود', 'error'); return; }
  const titleEl = document.getElementById('eventDetailTitle');
  const badgeEl = document.getElementById('eventDetailBadge');
  const bodyEl = document.getElementById('eventDetailBody');
  const editBtn = document.getElementById('eventEditBtn');
  const deleteBtn = document.getElementById('eventDeleteBtn');
  const overlay = document.getElementById('eventDetailOverlay');
  if (!titleEl || !bodyEl || !editBtn || !deleteBtn || !overlay) return;
  titleEl.textContent = e.title;
  const typeIcons = { hearing: '⚖️', deadline: '⏰', meeting: '📋', task: '✅', document: '📄', payment: '💰' };
  badgeEl.textContent = `${typeIcons[e.type] || '📌'} ${e.type}`;
  const statusColors = { scheduled: 'badge-active', postponed: 'badge-gold', completed: 'badge-closed', cancelled: 'badge-closed' };
  A.safeSet(bodyEl, esc => `
    <div class="ws-info-card">
      <h4>معلومات الحدث</h4>
      <div class="ws-info-row"><span class="ws-info-label">النوع</span><span class="ws-info-value">${esc(e.type)}</span></div>
      <div class="ws-info-row"><span class="ws-info-label">الحالة</span><span class="ws-info-value"><span class="badge ${statusColors[e.status] || 'badge-active'}">${esc(e.status)}</span></span></div>
      <div class="ws-info-row"><span class="ws-info-label">التاريخ</span><span class="ws-info-value">${esc(e.date)} ${e.time ? esc(e.time) : ''}</span></div>
      <div class="ws-info-row"><span class="ws-info-label">الأولوية</span><span class="ws-info-value">${esc(e.urgency)}</span></div>
      ${e.court ? `<div class="ws-info-row"><span class="ws-info-label">المحكمة</span><span class="ws-info-value">${esc(e.court)}</span></div>` : ''}
      ${e.judge ? `<div class="ws-info-row"><span class="ws-info-label">القاضي</span><span class="ws-info-value">${esc(e.judge)}</span></div>` : ''}
      ${e.room ? `<div class="ws-info-row"><span class="ws-info-label">الغرفة</span><span class="ws-info-value">${esc(e.room)}</span></div>` : ''}
    </div>
    <div>
      <div class="ws-info-card" style="margin-bottom:var(--space-4);">
        <h4>الارتباط</h4>
        <div class="ws-info-row"><span class="ws-info-label">القضية</span><span class="ws-info-value" style="cursor:pointer;color:var(--navy);" onclick="navigateTo('cases');setTimeout(()=>openCaseDetail(${e.case_id}),200)">${esc(e.case_number || '—')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">الموكل</span><span class="ws-info-value">${esc(e.client_name || '—')}</span></div>
      </div>
      ${e.notes ? `<div class="ws-info-card" style="margin-bottom:var(--space-4);"><h4>ملاحظات</h4><p style="font-size:var(--font-size-xs);color:var(--gray-600);line-height:1.6;">${esc(e.notes)}</p></div>` : ''}
      ${e.outcome ? `<div class="ws-info-card"><h4>النتيجة</h4><p style="font-size:var(--font-size-xs);color:var(--gray-600);line-height:1.6;">${esc(e.outcome)}</p></div>` : ''}
    </div>
  `);
  editBtn.onclick = () => { overlay.style.display = 'none'; A.showEventForm(e); };
  deleteBtn.onclick = async () => {
    if (await A.showConfirm('حذف هذا الحدث؟')) {
      try { await A.mutate('events:delete', e.id); } catch (er) { A.logError('deleteEvent', er); A.showToast('فشل حذف الحدث', 'error'); return; }
      overlay.style.display = 'none';
      A.loadHearings();
      if (typeof A.loadCalendar === 'function') A.loadCalendar();
    }
  };
  overlay.style.display = 'flex';
};

A.initCalendar = function() {
  document.getElementById('searchHearings')?.addEventListener('input', A.debounce(() => A.renderHearingsTable(), 250));
  document.getElementById('hearingsFilterType')?.addEventListener('change', () => A.renderHearingsTable());

  document.querySelectorAll('#section-hearings .filter-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#section-hearings .filter-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    A.state.hearingsFilter = b.dataset.filter;
    A.renderHearingsTable();
  }));

  document.querySelectorAll('#section-calendar .view-btn').forEach(btn => btn.addEventListener('click', () => A.switchCalView(btn.dataset.view)));

  document.getElementById('calPrev').addEventListener('click', () => {
    if (A.state.calView === 'month') A.state.calDate.setMonth(A.state.calDate.getMonth() - 1);
    else if (A.state.calView === 'week') A.state.calDate.setDate(A.state.calDate.getDate() - 7);
    else A.state.calDate.setDate(A.state.calDate.getDate() - 1);
    A.renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    if (A.state.calView === 'month') A.state.calDate.setMonth(A.state.calDate.getMonth() + 1);
    else if (A.state.calView === 'week') A.state.calDate.setDate(A.state.calDate.getDate() + 7);
    else A.state.calDate.setDate(A.state.calDate.getDate() + 1);
    A.renderCalendar();
  });
  document.getElementById('calToday').addEventListener('click', () => {
    A.state.calDate = new Date();
    A.renderCalendar();
  });

  document.getElementById('addHearingBtn').addEventListener('click', () => A.showEventForm());
  document.getElementById('addEventBtn').addEventListener('click', () => A.showEventForm());

  document.getElementById('eventEditBtn').addEventListener('click', () => {});
  document.getElementById('eventDeleteBtn').addEventListener('click', () => {});
};

window.switchCalView = A.switchCalView;
window.goToDate = A.goToDate;
window.openEventDetail = A.openEventDetail;
