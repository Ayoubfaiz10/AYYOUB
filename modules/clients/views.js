var A = window.App = window.App || {};

A.renderClientTable = function(list) {
  const body = document.getElementById('clientsBody');
  A.safeSet(body, esc => list.length ? list.map(c => `<tr>
    <td><strong style="cursor:pointer;color:var(--navy);" onclick="openClientDetail(${c.id})">${esc(c.name)}</strong></td>
    <td>${esc(c.phone || '-')}</td>
    <td>${esc(c.email || '-')}</td>
    <td>${c._caseCount || 0}</td>
    <td style="font-size:11px;color:var(--gray-400);">${esc(c._lastActivity || '-')}</td>
    <td>${c._balance ? (c._balance + ' د.م.') : '-'}</td>
    <td>
      <button class="btn-icon client-open-btn" data-id="${c.id}"><i class="ri-eye-line"></i></button>
      <button class="btn-icon client-del-btn" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
    </td>
  </tr>`).join('') : '<tr><td colspan="7"><div class="empty-state-v2"><i class="ri-user-3-line"></i><h3>لا توجد نتائج</h3><p>ابحث باسم أو رقم هاتف أو بريد إلكتروني</p></div></td></tr>');
  document.querySelectorAll('.client-open-btn').forEach(b => b.addEventListener('click', () => A.openClientDetail(parseInt(b.dataset.id))));
  document.querySelectorAll('.client-del-btn').forEach(b => b.addEventListener('click', async () => {
    if (await A.showConfirm('حذف هذا الموكل؟')) { try { await A.mutate('db:deleteClient', parseInt(b.dataset.id)); } catch (e) { A.logError('deleteClient', e); A.showToast('فشل حذف الموكل', 'error'); } A.loadClients(); }
  }));
};

A.renderClientCards = function(list) {
  const grid = document.getElementById('clientsCardGrid');
  A.safeSet(grid, esc => list.length ? list.map(c => `<div class="client-card" onclick="openClientDetail(${c.id})">
    <div class="client-card-top">
      <div class="client-card-avatar">${esc((c.name||'?').charAt(0))}</div>
      <div class="client-card-body">
        <div class="client-card-name">${esc(c.name)}</div>
        <div class="client-card-contact">${esc(c.phone || c.email || '')}</div>
      </div>
      <span class="badge badge-active">نشط</span>
    </div>
    <div class="client-card-stats"><span>${c._caseCount || 0} قضايا</span><span>${c._balance || 0} د.م.</span></div>
    <div class="client-card-actions">
      <button class="btn-icon" onclick="event.stopPropagation();openClientDetail(${c.id})" title="فتح"><i class="ri-eye-line"></i></button>
      <button class="btn-icon" onclick="event.stopPropagation();window.open('tel:${esc(c.phone)}','_self')" title="اتصال"><i class="ri-phone-line"></i></button>
      <button class="btn-icon" onclick="event.stopPropagation();window.open('mailto:${esc(c.email)}','_self')" title="بريد"><i class="ri-mail-line"></i></button>
    </div>
  </div>`).join('') : '<div class="empty-state-v2"><i class="ri-user-3-line"></i><h3>لا يوجد موكلون</h3><p>أضف موكلك الأول لتبدأ</p></div>');
};

A.renderClientSegments = function(list) {
  const container = document.getElementById('clientsSegments');
  const segments = [
    { label: 'نشطون', icon: 'ri-user-star-line', color: '#1A8A5C', filter: c => c._caseCount > 0 },
    { label: 'جدد', icon: 'ri-user-add-line', color: '#4A8BC2', filter: c => c._caseCount === 0 },
    { label: 'قضايا متعددة', icon: 'ri-briefcase-4-line', color: '#C6A15B', filter: c => c._caseCount >= 3 },
    { label: 'ذوو قيمة', icon: 'ri-vip-crown-line', color: '#8B5CF6', filter: c => c._balance > 5000 },
  ];
  A.safeSet(container, esc => segments.map(s => `<div class="cl-segment">
    <h3><i class="${s.icon}" style="color:${s.color};margin-left:6px;"></i>${s.label}</h3>
    <div class="cl-segment-cards">${list.filter(s.filter).slice(0, 6).map(c => `<div class="cl-segment-card" onclick="openClientDetail(${c.id})">
      <div class="cl-avatar-sm">${esc((c.name||'?').charAt(0))}</div>
      <div class="cl-segment-info"><div class="cl-segment-name">${esc(c.name)}</div><div class="cl-segment-meta">${c._caseCount || 0} قضايا · ${c._balance || 0} د.م.</div></div>
    </div>`).join('') || `<div style="font-size:12px;color:var(--gray-300);padding:8px;">لا يوجد</div>`}</div>
  </div>`).join(''));
};

A.loadWsClOverview = async function(c) {
  const el = document.getElementById('wsClOverview');
  const cases = (await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId)) || [];
  const comms = (await A.cachedInvoke('db:getClientCommunications', A.state.currentClientId)) || [];
  const activeCases = cases.filter(ca => ca.status === 'active').length;
  const totalPaid = cases.reduce((s, ca) => s + parseFloat(ca.paid_fees || 0), 0);
  const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
  A.safeSet(el, esc => `<div class="ws-cl-overview-grid">
    <div>
      <div class="cl-profile-header">
        <div class="cl-profile-avatar">${esc((c.name||'?').charAt(0))}</div>
        <div><div class="cl-profile-name">${esc(c.name)}</div>
          <div class="cl-profile-contact">${esc(c.phone || '')}${c.email ? ' · ' + esc(c.email) : ''}</div>
          <div class="cl-profile-stats">
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${cases.length}</div><div class="cl-profile-stat-label">قضايا</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${activeCases}</div><div class="cl-profile-stat-label">نشطة</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${totalPaid.toFixed(0)}</div><div class="cl-profile-stat-label">مدفوع</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${(totalFees - totalPaid).toFixed(0)}</div><div class="cl-profile-stat-label">متبقي</div></div>
          </div>
        </div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--space-4);"><h4>إجراءات سريعة</h4>
        <div class="ws-quick-actions">
          <button class="ws-qa-btn cl-add-case"><i class="ri-briefcase-add-line"></i> قضية</button>
          <button class="ws-qa-btn cl-add-comm"><i class="ri-chat-3-line"></i> اتصال</button>
          <button class="ws-qa-btn cl-add-doc"><i class="ri-file-add-line"></i> وثيقة</button>
          <button class="ws-qa-btn" onclick="document.querySelector('#clientDetailOverlay [data-ws=clnotes]').click()"><i class="ri-edit-2-line"></i> ملاحظة</button>
        </div>
      </div>
    </div>
    <div>
      <div class="ws-info-card"><h4>معلومات الاتصال</h4>
        <div class="ws-info-row"><span class="ws-info-label">الهاتف</span><span class="ws-info-value">${esc(c.phone || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">البريد</span><span class="ws-info-value">${esc(c.email || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">العنوان</span><span class="ws-info-value">${esc(c.address || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">آخر اتصال</span><span class="ws-info-value">${comms.length ? esc(comms[0].date) : '-'}</span></div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--space-4);"><h4>آخر النشاطات</h4><div id="clOverviewActivity"></div></div>
    </div>
  </div>`);
  const logs = await A.cachedInvoke('db:getLogs', {});
  const clLogs = (logs||[]).filter(l => l.details && l.details.includes('@' + A.state.currentClientId)).slice(0, 4);
  A.safeSet(document.getElementById('clOverviewActivity'), esc => clLogs.length
    ? clLogs.map(l => `<div class="tl-item" style="padding:var(--space-1) 0;"><span class="tl-time" style="min-width:36px;">${l.created_at ? l.created_at.slice(11,16) : ''}</span><div class="tl-body"><div class="tl-title" style="font-size:12px;">${esc(l.details)}</div></div></div>`).join('')
    : '<p class="empty-state-sm">لا توجد</p>');
  el.querySelector('.cl-add-case')?.addEventListener('click', () => { document.getElementById('addCaseBtn')?.click(); });
  el.querySelector('.cl-add-comm')?.addEventListener('click', () => A.clAddComm());
  el.querySelector('.cl-add-doc')?.addEventListener('click', () => { document.querySelector('#clientDetailOverlay [data-ws=cldocs]')?.click(); });
};

A.loadWsClCases = async function(c) {
  const el = document.getElementById('wsClCases');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  A.safeSet(el, esc => `<div class="toolbar"><button class="btn btn-primary btn-sm" onclick="document.getElementById('addCaseBtn').click()"><i class="ri-add-line"></i> قضية جديدة</button></div>
    ${cases.length ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--gray-100);margin-top:var(--space-3);"><table class="table"><thead><tr><th>رقم القضية</th><th>الموضوع</th><th>المحكمة</th><th>الحالة</th><th>الأولوية</th><th></th></tr></thead><tbody>${cases.map(ca => `<tr>
      <td>${esc(ca.case_number)}</td><td>${esc(ca.title)}</td><td>${esc(ca.court || '-')}</td>
      <td><span class="badge badge-${ca.status}">${A.state.statusLabels[ca.status] || esc(ca.status)}</span></td>
      <td>${esc(ca.priority || '-')}</td>
      <td><button class="btn-icon" onclick="openCaseDetail(${ca.id})"><i class="ri-eye-line"></i></button></td>
    </tr>`).join('')}</tbody></table></div>` : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد قضايا لهذا الموكل</p>'}`);
};

A.loadWsClDocs = async function(c) {
  const el = document.getElementById('wsClDocs');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  let allDocs = [];
  for (const ca of cases) {
    const docs = await A.cachedInvoke('db:getDocuments', ca.id);
    docs.forEach(d => allDocs.push({ ...d, case_number: ca.case_number }));
  }
  A.safeSet(el, esc => `<div class="ws-docs-header"><span style="font-size:13px;color:var(--gray-400);">${allDocs.length} وثيقة</span></div>
    <div class="ws-docs-grid">${allDocs.length ? allDocs.map(d => `<div class="ws-doc-card">
      <i class="ri-file-4-line ws-doc-icon"></i>
      <div class="ws-doc-name">${esc(d.filename)}</div>
      <div class="ws-doc-meta">${esc(d.case_number || '')} · ${d.upload_date ? d.upload_date.slice(0,10) : ''}</div>
    </div>`).join('') : '<p class="empty-state-sm" style="grid-column:1/-1;text-align:center;padding:40px;">لا توجد وثائق</p>'}</div>`);
};

A.loadWsClComms = async function(c) {
  const el = document.getElementById('wsClComms');
  const comms = await A.cachedInvoke('db:getClientCommunications', A.state.currentClientId);
  const iconMap = { call: 'ri-phone-line', email: 'ri-mail-line', meeting: 'ri-group-line', message: 'ri-chat-1-line', default: 'ri-chat-3-line' };
  const colorMap = { call: '#4A8BC2', email: '#8B5CF6', meeting: '#1A8A5C', message: '#C6A15B', default: '#8C8A84' };
  A.safeSet(el, esc => `<div class="toolbar"><button id="clAddCommBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> اتصال جديد</button></div>
    <div class="cl-comms-list" style="margin-top:var(--space-3);">${comms.length ? comms.map(co => `<div class="cl-comms-item">
      <div class="cl-comms-icon" style="background:${(colorMap[co.type] || colorMap.default)}12;color:${colorMap[co.type] || colorMap.default};"><i class="${iconMap[co.type] || iconMap.default}"></i></div>
      <div class="cl-comms-body"><div class="cl-comms-title">${esc(co.type)} · ${esc(co.date)}</div><div class="cl-comms-sub">${esc(co.summary || '')}</div></div>
    </div>`).join('') : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد اتصالات</p>'}</div>`);
  document.getElementById('clAddCommBtn')?.addEventListener('click', () => A.clAddComm());
};

A.clAddComm = function() {
  A.showModal('اتصال جديد', `
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">النوع</label><select id="fClCommType" class="input"><option value="call">مكالمة</option><option value="email">بريد</option><option value="meeting">اجتماع</option><option value="message">رسالة</option></select></div>
      <div class="input-group"><label class="input-label">التاريخ</label><input type="date" id="fClCommDate" class="input" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="input-group"><label class="input-label">الملخص</label><textarea id="fClCommSummary" class="input" rows="3"></textarea></div>
  `, async () => {
    try { await A.mutate('db:addCommunication', { client_id: A.state.currentClientId, type: document.getElementById('fClCommType').value, date: document.getElementById('fClCommDate').value, summary: document.getElementById('fClCommSummary').value }); } catch (e) { A.logError('addComm', e); A.showToast('فشل إضافة الاتصال', 'error'); return; }
    A.hideModal(); A.loadWsClComms({});
  });
};

A.loadWsClPayments = async function(c) {
  const el = document.getElementById('wsClPayments');
  const cases = (await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId)) || [];
  let allPayments = [];
  for (const ca of cases) {
    const pays = await A.cachedInvoke('db:getPaiements', ca.id);
    pays.forEach(p => allPayments.push({ ...p, case_number: ca.case_number }));
  }
  const totalPaid = allPayments.reduce((s, p) => s + parseFloat(p.montant || 0), 0);
  const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
  A.safeSet(el, esc => `<div class="cl-payments-chart">
      <canvas id="clPieChart" width="80" height="80"></canvas>
      <div class="cl-payments-numbers">
        <div class="cl-pay-row"><span class="cl-pay-label">الأتعاب</span><span class="cl-pay-value">${totalFees.toFixed(0)} د.م.</span></div>
        <div class="cl-pay-row"><span class="cl-pay-label">المدفوع</span><span class="cl-pay-value" style="color:var(--success);">${totalPaid.toFixed(0)} د.م.</span></div>
        <div class="cl-pay-row"><span class="cl-pay-label">المتبقي</span><span class="cl-pay-value" style="color:var(--gold);">${(totalFees - totalPaid).toFixed(0)} د.م.</span></div>
      </div>
    </div>
    ${allPayments.length ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--gray-100);margin-top:var(--space-3);"><table class="table"><thead><tr><th>التاريخ</th><th>القضية</th><th>المبلغ</th><th>طريقة الدفع</th></tr></thead><tbody>${allPayments.map(p => `<tr><td>${esc(p.date)}</td><td>${esc(p.case_number || '')}</td><td>${esc(p.montant)}</td><td>${esc(p.mode_paiement)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد مدفوعات</p>'}`);
  A.drawClPieChart(totalFees, totalPaid);
};

A.drawClPieChart = function(total, paid) {
  const c = document.getElementById('clPieChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const remaining = Math.max(0, total - paid);
  if (!total) { ctx.fillStyle = '#B0AFA9'; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('—', 40, 40); return; }
  const items = [{ value: paid, color: '#1A8A5C' }, { value: remaining, color: '#D4D3D0' }];
  const cx = 40, cy = 40, r = 34;
  ctx.clearRect(0, 0, 80, 80);
  let start = -Math.PI / 2;
  items.forEach(item => {
    if (item.value <= 0) return;
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath(); ctx.fillStyle = item.color; ctx.fill();
    start += angle;
  });
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF'; ctx.fill();
};

A.loadWsClTimeline = async function(c) {
  const el = document.getElementById('wsClTimeline');
  const logs = await A.cachedInvoke('db:getLogs', {});
  const clLogs = (logs||[]).filter(l => l.details && l.details.includes('@' + A.state.currentClientId)).slice(0, 30);
  A.safeSet(el, esc => clLogs.length ? `<div class="dash-timeline" style="padding:0 !important;">${clLogs.map(l => `<div class="tl-item">
    <span class="tl-time">${l.created_at ? l.created_at.slice(11,16) : ''}</span>
    <div class="tl-icon" style="width:24px;height:24px;font-size:11px;background:var(--gray-50);color:var(--gray-500);"><i class="ri-history-line"></i></div>
    <div class="tl-body"><div class="tl-title" style="font-size:13px;">${esc(l.details)}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0,10) : ''}</div></div>
  </div>`).join('')}</div>` : '<p class="empty-state-sm" style="text-align:center;padding:40px;">لا توجد نشاطات مسجلة</p>');
};

A.loadWsClNotes = async function(c) {
  const el = document.getElementById('wsClNotes');
  A.safeSet(el, esc => `<div class="ws-notes-area">
    <textarea id="clNotesText" placeholder="ملاحظات داخلية، تقييم المخاطر، استراتيجية..." class="input">${esc(c.notes || '')}</textarea>
    <div style="display:flex;justify-content:space-between;margin-top:var(--space-2);">
      <span style="font-size:11px;color:var(--gray-400);" id="clNotesStatus"></span>
      <button id="clSaveNotesBtn" class="btn btn-primary btn-sm"><i class="ri-save-line"></i> حفظ</button>
    </div>
  </div>`);
  document.getElementById('clSaveNotesBtn')?.addEventListener('click', async () => {
    try { await A.mutate('db:updateClientNotes', { id: A.state.currentClientId, notes: document.getElementById('clNotesText').value }); if (A.AutoSave) A.AutoSave.clear('client_notes_' + A.state.currentClientId); } catch (e) { A.logError('saveClNotes', e); A.showToast('فشل حفظ الملاحظات', 'error'); }
    document.getElementById('clNotesStatus').textContent = 'تم الحفظ';
    setTimeout(() => document.getElementById('clNotesStatus').textContent = '', 2000);
  });
  const clNotesText = document.getElementById('clNotesText');
  if (clNotesText && A.AutoSave) {
    clNotesText.addEventListener('input', () => { if (A.AutoSave) A.AutoSave.markDirty('client_notes_' + A.state.currentClientId); });
    A.AutoSave.register('client_notes_' + A.state.currentClientId, {
      getValue: () => document.getElementById('clNotesText')?.value || '',
      setValue: (v) => { const el = document.getElementById('clNotesText'); if (el) el.value = v; },
      indicator: () => document.getElementById('clNotesStatus'),
      debounce: 2000
    });
  }
};

A.loadWsClAnalytics = async function(c) {
  const el = document.getElementById('wsClAnalytics');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  const active = cases.filter(ca => ca.status === 'active').length;
  const closed = cases.filter(ca => ca.status === 'closed').length;
  const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
  const totalPaid = cases.reduce((s, ca) => s + parseFloat(ca.paid_fees || 0), 0);
  const avgDuration = cases.length ? Math.round(cases.reduce((s, ca) => s + (ca.procedure_count || 0), 0) / cases.length) : 0;
  A.safeSet(el, esc => `<div class="ws-analytics-grid">
    <div class="ws-analytics-card"><h4>إجمالي القضايا</h4><div class="ws-analytics-number">${cases.length}</div></div>
    <div class="ws-analytics-card"><h4>نشطة / مغلقة</h4><div class="ws-analytics-number" style="font-size:22px;">${active} / ${closed}</div></div>
    <div class="ws-analytics-card"><h4>المساهمة المالية</h4><div class="ws-analytics-number">${totalPaid.toFixed(0)}</div>
      <div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${totalFees ? (totalPaid/totalFees)*100 : 0}%;background:var(--gold);"></div></div></div>
    <div class="ws-analytics-card"><h4>مؤشر النشاط</h4><div class="ws-analytics-number">${avgDuration}</div>
      <div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${Math.min(100, avgDuration * 20)}%;background:var(--success);"></div></div></div>
  </div>`);
};
