var A = (window.App = window.App || {});

A.renderClientTable = function (list) {
  const body = document.getElementById('clientsBody');
  A.safeSet(body, esc =>
    list.length
      ? list
          .map(
            c => `<tr>
    <td><strong style="cursor:pointer;color:var(--foreground);" data-click="client:open:${c.id}">${esc(c.name)}</strong></td>
    <td>${esc(c.phone || '-')}</td>
    <td>${esc(c.email || '-')}</td>
    <td>${c._caseCount || 0}</td>
    <td style="font-size:11px;color:var(--muted-foreground);">${esc(c._lastActivity || '-')}</td>
    <td>${c._balance ? c._balance + ' د.م.' : '-'}</td>
    <td>
      <button class="btn-icon client-open-btn" data-id="${c.id}"><i class="ri-eye-line"></i></button>
      <button class="btn-icon client-del-btn" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
    </td>
  </tr>`
          )
          .join('')
      : `<tr><td colspan="7"><div class="empty-state-v2"><i class="ri-user-3-line"></i><h3>${_t('noResultsSearch')}</h3><p>${_t('searchClientsHint')}</p></div></td></tr>`
  );
  document.querySelectorAll('.client-open-btn').forEach(b => b.addEventListener('click', () => A.openClientDetail(parseInt(b.dataset.id, 10))));
  document.querySelectorAll('.client-del-btn').forEach(b =>
    b.addEventListener('click', async () => {
      if (await A.showConfirm(_t('deleteClientConfirm'))) {
        try {
          await A.mutate('db:deleteClient', parseInt(b.dataset.id, 10));
        } catch (e) {
          A.logError('deleteClient', e);
          A.showToast(_t('clientDeleteFailed'), 'error');
        }
        A.loadClients();
      }
    })
  );
};

A.renderClientCards = function (list) {
  const grid = document.getElementById('clientsCardGrid');
  A.safeSet(grid, esc =>
    list.length
      ? list
          .map(
            c => `<div class="client-card" data-click="client:open:${c.id}">
    <div class="client-card-top">
      <div class="client-card-avatar">${esc((c.name || '?').charAt(0))}</div>
      <div class="client-card-body">
        <div class="client-card-name">${esc(c.name)}</div>
        <div class="client-card-contact">${esc(c.phone || c.email || '')}</div>
      </div>
      <span class="badge badge-active">${_t('activeBadge')}</span>
    </div>
    <div class="client-card-stats"><span>${c._caseCount || 0} ${_t('casesPlural')}</span><span>${c._balance || 0}${_t('currencyMAD')}</span></div>
    <div class="client-card-actions">
      <button class="btn-icon" data-click="client:open:${c.id}" data-click-stop="true" title="${_t('openBtnTooltip')}"><i class="ri-eye-line"></i></button>
      <button class="btn-icon" data-click="contact:call:${esc(c.phone)}" data-click-stop="true" title="${_t('callBtn')}"><i class="ri-phone-line"></i></button>
      <button class="btn-icon" data-click="contact:mail:${esc(c.email)}" data-click-stop="true" title="${_t('emailBtn')}"><i class="ri-mail-line"></i></button>
    </div>
  </div>`
          )
          .join('')
      : `<div class="empty-state-v2"><i class="ri-user-3-line"></i><h3>${_t('noClientsLabel')}</h3><p>${_t('addFirstClient')}</p></div>`
  );
};

A.renderClientSegments = function (list) {
  const container = document.getElementById('clientsSegments');
  const segments = [
    { label: _t('segmentActive'), icon: 'ri-user-star-line', color: '#1A8A5C', filter: c => c._caseCount > 0 },
    { label: _t('segmentNew'), icon: 'ri-user-add-line', color: '#4A8BC2', filter: c => c._caseCount === 0 },
    { label: _t('segmentMultipleCases'), icon: 'ri-briefcase-4-line', color: '#C6A15B', filter: c => c._caseCount >= 3 },
    { label: _t('segmentHighValue'), icon: 'ri-vip-crown-line', color: '#8B5CF6', filter: c => c._balance > 5000 }
  ];
  A.safeSet(container, esc =>
    segments
      .map(
        s => `<div class="cl-segment">
    <h3><i class="${s.icon}" style="color:${s.color};margin-left:6px;"></i>${esc(s.label)}</h3>
    <div class="cl-segment-cards">${
      list
        .filter(s.filter)
        .slice(0, 6)
        .map(
          c => `<div class="cl-segment-card" data-click="client:open:${c.id}">
      <div class="cl-avatar-sm">${esc((c.name || '?').charAt(0))}</div>
      <div class="cl-segment-info"><div class="cl-segment-name">${esc(c.name)}</div><div class="cl-segment-meta">${c._caseCount || 0} ${_t('casesPlural')} · ${c._balance || 0}${_t('currencyMAD')}</div></div>
    </div>`
        )
        .join('') || `<div style="font-size:12px;color:var(--muted-foreground);padding:8px;">${_t('zeroLabel')}</div>`
    }</div>
  </div>`
      )
      .join('')
  );
};

A.loadWsClOverview = async function (c, _token) {
  const el = document.getElementById('wsClOverview');
  const cases = (await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId)) || [];
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const comms = (await A.cachedInvoke('db:getClientCommunications', A.state.currentClientId)) || [];
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const activeCases = cases.filter(ca => ca.status === 'active').length;
  const totalPaid = cases.reduce((s, ca) => s + parseFloat(ca.paid_fees || 0), 0);
  const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
  A.safeSet(
    el,
    esc => `<div class="ws-cl-overview-grid">
    <div>
      <div class="cl-profile-header">
        <div class="cl-profile-avatar">${esc((c.name || '?').charAt(0))}</div>
        <div><div class="cl-profile-name">${esc(c.name)}</div>
          <div class="cl-profile-contact">${esc(c.phone || '')}${c.email ? ' · ' + esc(c.email) : ''}</div>
          <div class="cl-profile-stats">
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${cases.length}</div><div class="cl-profile-stat-label">${_t('casesPlural')}</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${activeCases}</div><div class="cl-profile-stat-label">${_t('activeF')}</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${totalPaid.toFixed(0)}</div><div class="cl-profile-stat-label">${_t('paidLabel')}</div></div>
            <div class="cl-profile-stat"><div class="cl-profile-stat-num">${(totalFees - totalPaid).toFixed(0)}</div><div class="cl-profile-stat-label">${_t('remainingLabel')}</div></div>
          </div>
        </div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--spacing-3);"><h4>${_t('quickActionsLabel')}</h4>
        <div class="ws-quick-actions">
          <button class="ws-qa-btn cl-add-case"><i class="ri-briefcase-add-line"></i> ${_t('caseQuickAction')}</button>
          <button class="ws-qa-btn cl-add-comm"><i class="ri-chat-3-line"></i> ${_t('commQuickAction')}</button>
          <button class="ws-qa-btn cl-add-doc"><i class="ri-file-add-line"></i> ${_t('docQuickAction')}</button>
          <button class="ws-qa-btn" data-click="click:#clientDetailOverlay [data-ws=clnotes]"><i class="ri-edit-2-line"></i> ${_t('noteQuickAction')}</button>
        </div>
      </div>
    </div>
    <div>
      <div class="ws-info-card"><h4>${_t('contactInfoLabel')}</h4>
        <div class="ws-info-row"><span class="ws-info-label">${_t('phoneLabel')}</span><span class="ws-info-value">${esc(c.phone || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('emailLabel')}</span><span class="ws-info-value">${esc(c.email || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('addressLabel')}</span><span class="ws-info-value">${esc(c.address || '-')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('lastContactLabel')}</span><span class="ws-info-value">${comms.length ? esc(A.formatDate(comms[0].date)) : '-'}</span></div>
      </div>
      <div class="ws-info-card" style="margin-top:var(--spacing-3);"><h4>${_t('recentActivityLabel')}</h4><div id="clOverviewActivity"></div></div>
    </div>
  </div>`
  );
  const logs = await A.cachedInvoke('db:getLogs', {});
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const clLogs = (logs || []).filter(l => l.details && l.details.includes('@' + A.state.currentClientId)).slice(0, 4);
  A.safeSet(document.getElementById('clOverviewActivity'), esc =>
    clLogs.length
      ? clLogs
          .map(
            l =>
              `<div class="tl-item" style="padding:var(--spacing-px) 0;"><span class="tl-time" style="min-width:36px;">${l.created_at ? l.created_at.slice(11, 16) : ''}</span><div class="tl-body"><div class="tl-title" style="font-size:12px;">${esc(l.details)}</div></div></div>`
          )
          .join('')
      : `<p class="empty-state-sm">${_t('noActivityLabel')}</p>`
  );
  el.querySelector('.cl-add-case')?.addEventListener('click', () => {
    document.getElementById('addCaseBtn')?.click();
  });
  el.querySelector('.cl-add-comm')?.addEventListener('click', () => A.clAddComm());
  el.querySelector('.cl-add-doc')?.addEventListener('click', () => {
    document.querySelector('#clientDetailOverlay [data-ws=cldocs]')?.click();
  });
};

A.loadWsClCases = async function (c, _token) {
  const el = document.getElementById('wsClCases');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  A.safeSet(
    el,
    esc => `<div class="toolbar"><button class="btn btn-primary btn-sm" data-click="click:#addCaseBtn"><i class="ri-add-line"></i> ${_t('newCaseBtn')}</button></div>
    ${
      cases.length
        ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--border);margin-top:var(--spacing-2);"><table class="table"><thead><tr><th>${_t('caseNumberHeader')}</th><th>${_t('subjectHeader')}</th><th>${_t('courtHeader')}</th><th>${_t('statusHeader')}</th><th>${_t('priorityHeader')}</th><th></th></tr></thead><tbody>${cases
            .map(
              ca => `<tr>
      <td>${esc(ca.case_number)}</td><td>${esc(ca.title)}</td><td>${esc(ca.court || '-')}</td>
      <td><span class="badge badge-${ca.status}">${A.state.statusLabels[ca.status] || esc(ca.status)}</span></td>
      <td>${esc(ca.priority || '-')}</td>
      <td><button class="btn-icon" data-click="case:open:${ca.id}"><i class="ri-eye-line"></i></button></td>
    </tr>`
            )
            .join('')}</tbody></table></div>`
        : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noCasesForClient')}</p>`
    }`
  );
};

A.loadWsClDocs = async function (c, _token) {
  const el = document.getElementById('wsClDocs');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  let allDocs = [];
  for (const ca of cases) {
    const docs = await A.cachedInvoke('db:getDocuments', ca.id);
    docs.forEach(d => allDocs.push({ ...d, case_number: ca.case_number }));
  }
  A.safeSet(
    el,
    esc => `<div class="ws-docs-header"><span style="font-size:13px;color:var(--muted-foreground);">${_t('docCountLabel').replace('{n}', allDocs.length)}</span></div>
    <div class="ws-docs-grid">${
      allDocs.length
        ? allDocs
            .map(
              d => `<div class="ws-doc-card">
      <i class="ri-file-4-line ws-doc-icon"></i>
      <div class="ws-doc-name">${esc(d.filename)}</div>
      <div class="ws-doc-meta">${esc(d.case_number || '')} · ${d.upload_date ? d.upload_date.slice(0, 10) : ''}</div>
    </div>`
            )
            .join('')
        : `<p class="empty-state-sm" style="grid-column:1/-1;text-align:center;padding:40px;">${_t('noDocsLabel')}</p>`
    }</div>`
  );
};

A.loadWsClComms = async function (c, _token) {
  const el = document.getElementById('wsClComms');
  const comms = await A.cachedInvoke('db:getClientCommunications', A.state.currentClientId);
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const iconMap = { call: 'ri-phone-line', email: 'ri-mail-line', meeting: 'ri-group-line', message: 'ri-chat-1-line', default: 'ri-chat-3-line' };
  const colorMap = { call: '#4A8BC2', email: '#8B5CF6', meeting: '#1A8A5C', message: '#C6A15B', default: '#8C8A84' };
  A.safeSet(
    el,
    esc => `<div class="toolbar"><button id="clAddCommBtn" class="btn btn-primary btn-sm"><i class="ri-add-line"></i> ${_t('newCommLabel')}</button></div>
    <div class="cl-comms-list" style="margin-top:var(--spacing-2);">${
      comms.length
        ? comms
            .map(
              co => `<div class="cl-comms-item">
      <div class="cl-comms-icon" style="background:${colorMap[co.type] || colorMap.default}12;color:${colorMap[co.type] || colorMap.default};"><i class="${iconMap[co.type] || iconMap.default}"></i></div>
      <div class="cl-comms-body"><div class="cl-comms-title">${esc(co.type)} · ${esc(A.formatDate(co.date))}</div><div class="cl-comms-sub">${esc(co.summary || '')}</div></div>
    </div>`
            )
            .join('')
        : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noCommsLabel')}</p>`
    }</div>`
  );
  document.getElementById('clAddCommBtn')?.addEventListener('click', () => A.clAddComm());
};

A.clAddComm = function () {
  A.showModal(
    _t('newCommLabel'),
    `
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('commTypeLabel')}</label><select id="fClCommType" class="input"><option value="call">${_t('commCall')}</option><option value="email">${_t('commEmail')}</option><option value="meeting">${_t('commMeeting')}</option><option value="message">${_t('commMessage')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('commDateLabel')}</label><input type="date" id="fClCommDate" class="input" value="${new Date().toISOString().slice(0, 10)}"></div>
    </div>
    <div class="input-group"><label class="input-label">${_t('commSummaryLabel')}</label><textarea id="fClCommSummary" class="input" rows="3"></textarea></div>
  `,
    async () => {
      try {
        await A.mutate('db:addCommunication', {
          client_id: A.state.currentClientId,
          type: document.getElementById('fClCommType').value,
          date: document.getElementById('fClCommDate').value,
          summary: document.getElementById('fClCommSummary').value
        });
      } catch (e) {
        A.logError('addComm', e);
        A.showToast(_t('commAddFailed'), 'error');
        return;
      }
      A.hideModal();
      A.loadWsClComms({});
    }
  );
};

A.loadWsClPayments = async function (c, _token) {
  const el = document.getElementById('wsClPayments');
  if (!A.state.ipc) return;
  try {
    const cases = (await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId)) || [];
    if (_token !== undefined && _token !== A.state._clientDetailToken) return;
    const results = await Promise.allSettled(cases.map(ca => A.cachedInvoke('db:getPaiements', ca.id)));
    let allPayments = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        r.value.forEach(p => allPayments.push({ ...p, case_number: cases[i].case_number }));
      } else if (r.status === 'rejected') {
        A.logError('loadWsClPayments:getPaiements', r.reason);
      }
    });
    const totalPaid = allPayments.reduce((s, p) => s + parseFloat(p.montant || 0), 0);
    const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
    A.safeSet(
      el,
      esc => `<div class="cl-payments-chart">
      <canvas id="clPieChart" width="80" height="80"></canvas>
      <div class="cl-payments-numbers">
        <div class="cl-pay-row"><span class="cl-pay-label">${_t('feesLabel')}</span><span class="cl-pay-value">${totalFees.toFixed(0)} د.م.</span></div>
        <div class="cl-pay-row"><span class="cl-pay-label">${_t('paidLabel')}</span><span class="cl-pay-value" style="color:var(--success);">${totalPaid.toFixed(0)} د.م.</span></div>
        <div class="cl-pay-row"><span class="cl-pay-label">${_t('remainingLabel')}</span><span class="cl-pay-value" style="color:var(--gold);">${(totalFees - totalPaid).toFixed(0)} د.م.</span></div>
      </div>
    </div>
    ${allPayments.length ? `<div class="table-wrap" style="box-shadow:none;border:1px solid var(--border);margin-top:var(--spacing-2);"><table class="table"><thead><tr><th>${_t('paymentDateHeader')}</th><th>${_t('paymentCaseHeader')}</th><th>${_t('paymentAmountHeader')}</th><th>${_t('paymentMethodHeader')}</th></tr></thead><tbody>${allPayments.map(p => `<tr><td>${esc(A.formatDate(p.date))}</td><td>${esc(p.case_number || '')}</td><td>${esc(p.montant)}</td><td>${esc(p.mode_paiement)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noPaymentsLabel')}</p>`}`
    );
    A.drawClPieChart(totalFees, totalPaid);
  } catch (e) {
    A.logError('loadWsClPayments', e);
    A.showToast(_t('failedLoadPayments'), 'error');
  }
};

A.drawClPieChart = function (total, paid) {
  const c = document.getElementById('clPieChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const remaining = Math.max(0, total - paid);
  if (!total) {
    ctx.fillStyle = '#B0AFA9';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('—', 40, 40);
    return;
  }
  const items = [
    { value: paid, color: '#1A8A5C' },
    { value: remaining, color: '#D4D3D0' }
  ];
  const cx = 40,
    cy = 40,
    r = 34;
  ctx.clearRect(0, 0, 80, 80);
  let start = -Math.PI / 2;
  items.forEach(item => {
    if (item.value <= 0) return;
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    start += angle;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF';
  ctx.fill();
};

A.loadWsClTimeline = async function (c, _token) {
  const el = document.getElementById('wsClTimeline');
  const logs = await A.cachedInvoke('db:getLogs', {});
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const clLogs = (logs || []).filter(l => l.details && l.details.includes('@' + A.state.currentClientId)).slice(0, 30);
  A.safeSet(el, esc =>
    clLogs.length
      ? `<div class="dash-timeline" style="padding:0 !important;">${clLogs
          .map(
            l => `<div class="tl-item">
    <span class="tl-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
    <div class="tl-icon" style="width:24px;height:24px;font-size:11px;background:var(--muted);color:var(--muted-foreground);"><i class="ri-history-line"></i></div>
    <div class="tl-body"><div class="tl-title" style="font-size:13px;">${esc(l.details)}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0, 10) : ''}</div></div>
  </div>`
          )
          .join('')}</div>`
      : `<p class="empty-state-sm" style="text-align:center;padding:40px;">${_t('noActivitiesLabel')}</p>`
  );
};

A.loadWsClNotes = async function (c) {
  const el = document.getElementById('wsClNotes');
  A.safeSet(
    el,
    esc => `<div class="ws-notes-area">
    <textarea id="clNotesText" placeholder="${_t('notesPlaceholderLong')}" class="input">${esc(c.notes || '')}</textarea>
    <div style="display:flex;justify-content:space-between;margin-top:var(--spacing-1-5);">
      <span style="font-size:11px;color:var(--muted-foreground);" id="clNotesStatus"></span>
      <button id="clSaveNotesBtn" class="btn btn-primary btn-sm"><i class="ri-save-line"></i> ${_t('saveBtnLabel')}</button>
    </div>
  </div>`
  );
  document.getElementById('clSaveNotesBtn')?.addEventListener('click', async () => {
    try {
      await A.mutate('db:updateClientNotes', { id: A.state.currentClientId, notes: document.getElementById('clNotesText').value });
      if (A.AutoSave) A.AutoSave.clear('client_notes_' + A.state.currentClientId);
    } catch (e) {
      A.logError('saveClNotes', e);
      A.showToast(_t('notesSaveFailed'), 'error');
    }
    document.getElementById('clNotesStatus').textContent = _t('savedStatus');
    setTimeout(() => (document.getElementById('clNotesStatus').textContent = ''), 2000);
  });
  const clNotesText = document.getElementById('clNotesText');
  if (clNotesText && A.AutoSave) {
    clNotesText.addEventListener('input', () => {
      if (A.AutoSave) A.AutoSave.markDirty('client_notes_' + A.state.currentClientId);
    });
    A.AutoSave.register('client_notes_' + A.state.currentClientId, {
      getValue: () => document.getElementById('clNotesText')?.value || '',
      setValue: v => {
        const el = document.getElementById('clNotesText');
        if (el) el.value = v;
      },
      indicator: () => document.getElementById('clNotesStatus'),
      debounce: 2000
    });
  }
};

A.loadWsClAnalytics = async function (c, _token) {
  const el = document.getElementById('wsClAnalytics');
  const cases = await A.cachedInvoke('db:getCasesByClient', A.state.currentClientId);
  if (_token !== undefined && _token !== A.state._clientDetailToken) return;
  const active = cases.filter(ca => ca.status === 'active').length;
  const closed = cases.filter(ca => ca.status === 'closed').length;
  const totalFees = cases.reduce((s, ca) => s + parseFloat(ca.total_fees || 0), 0);
  const totalPaid = cases.reduce((s, ca) => s + parseFloat(ca.paid_fees || 0), 0);
  const avgDuration = cases.length ? Math.round(cases.reduce((s, ca) => s + (ca.procedure_count || 0), 0) / cases.length) : 0;
  A.safeSet(
    el,
    esc => `<div class="ws-analytics-grid">
    <div class="ws-analytics-card"><h4>${_t('totalCasesAnalytics')}</h4><div class="ws-analytics-number">${cases.length}</div></div>
    <div class="ws-analytics-card"><h4>${_t('activeClosedLabel')}</h4><div class="ws-analytics-number" style="font-size:22px;">${active} / ${closed}</div></div>
    <div class="ws-analytics-card"><h4>${_t('financialContribution')}</h4><div class="ws-analytics-number">${totalPaid.toFixed(0)}</div>
      <div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${totalFees ? (totalPaid / totalFees) * 100 : 0}%;background:var(--gold);"></div></div></div>
    <div class="ws-analytics-card"><h4>${_t('activityIndicator')}</h4><div class="ws-analytics-number">${avgDuration}</div>
      <div class="ws-analytics-progress"><div class="ws-analytics-progress-bar" style="width:${Math.min(100, avgDuration * 20)}%;background:var(--success);"></div></div></div>
  </div>`
  );
};
