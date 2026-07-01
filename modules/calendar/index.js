var A = (window.App = window.App || {});

A.state.calView = 'month';
A.state.calDate = new Date();

A.loadCalendar = async function () {
  if (!A.state.ipc) return;
  const grid = document.getElementById('calGrid') || document.getElementById('calMonthGrid');
  if (grid) A.showSkeleton(grid, 6, 'calDay');
  try {
    A.state.allEvents = (await A.cachedInvoke('events:getAll')) || [];
    A.renderCalendar();
    A.renderMiniCalendar();
  } catch (e) {
    A.logError('loadCalendar', e);
    if (grid) A.showError(grid, _t('failedLoadCalendar'), () => A.loadCalendar());
  }
};

A.showEventForm = async function (editData) {
  const cases = (await A.cachedInvoke('db:getAllCases')) || [];
  const clients = (await A.cachedInvoke('db:getAllClients')) || [];
  const esc = A.escapeHtml;
  const caseOpts = cases
    .map(c => `<option value="${c.id}" ${editData && editData.case_id === c.id ? 'selected' : ''}>${esc(c.case_number)} - ${esc(c.title)}</option>`)
    .join('');
  const clientOpts = clients.map(c => `<option value="${c.id}" ${editData && editData.client_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const isEdit = !!editData;
  const typeOpts = ['hearing', 'deadline', 'meeting', 'task', 'document', 'payment']
    .map(
      t =>
        `<option value="${t}" ${editData && editData.type === t ? 'selected' : ''}>${{ hearing: _t('eventTypeHearing'), deadline: _t('eventTypeDeadline'), meeting: _t('eventTypeMeeting'), task: _t('eventTypeTask'), document: _t('eventTypeDocument'), payment: _t('eventTypePayment') }[t]}</option>`
    )
    .join('');
  const statusOpts = ['scheduled', 'postponed', 'completed', 'cancelled']
    .map(
      s =>
        `<option value="${s}" ${editData && editData.status === s ? 'selected' : ''}>${{ scheduled: _t('eventStatusScheduled'), postponed: _t('eventStatusPostponed'), completed: _t('eventStatusCompleted'), cancelled: _t('eventStatusCancelled') }[s]}</option>`
    )
    .join('');

  A.showModal(
    isEdit ? _t('editEventTitle') : _t('newEventTitle'),
    `
    <div class="input-group"><label class="input-label">${_t('eventTitleLabel')}</label><input type="text" id="fEventTitle" class="input" value="${esc(editData ? editData.title : '')}" placeholder="${_t('eventTitlePlaceholder')}"></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('eventCaseLabel')}</label><select id="fEventCase" class="input"><option value="">${_t('eventOptional')}</option>${caseOpts}</select></div>
      <div class="input-group"><label class="input-label">${_t('eventClientLabel')}</label><select id="fEventClient" class="input"><option value="">${_t('eventOptional')}</option>${clientOpts}</select></div>
    </div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('eventTypeLabel')}</label><select id="fEventType" class="input">${typeOpts}</select></div>
      <div class="input-group"><label class="input-label">${_t('eventStatusLabel')}</label><select id="fEventStatus" class="input">${statusOpts}</select></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">${_t('eventDateLabel')}</label><input type="date" id="fEventDate" class="input" value="${esc(editData ? editData.date : new Date().toISOString().slice(0, 10))}"></div>
      <div class="input-group"><label class="input-label">${_t('eventFromLabel')}</label><input type="time" id="fEventTime" class="input" value="${esc(editData ? editData.time || '' : '')}"></div>
      <div class="input-group"><label class="input-label">${_t('eventToLabel')}</label><input type="time" id="fEventEndTime" class="input" value="${esc(editData ? editData.end_time || '' : '')}"></div>
    </div>
    <div class="info-grid-3">
      <div class="input-group"><label class="input-label">${_t('eventCourtLabel')}</label><input type="text" id="fEventCourt" class="input" value="${esc(editData ? editData.court || '' : '')}"></div>
      <div class="input-group"><label class="input-label">${_t('eventJudgeLabel')}</label><input type="text" id="fEventJudge" class="input" value="${esc(editData ? editData.judge || '' : '')}"></div>
      <div class="input-group"><label class="input-label">${_t('eventRoomLabel')}</label><input type="text" id="fEventRoom" class="input" value="${esc(editData ? editData.room || '' : '')}"></div>
    </div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">${_t('eventPriorityLabel')}</label><select id="fEventUrgency" class="input">${['low', 'medium', 'high', 'critical'].map(u => `<option value="${u}" ${editData && editData.urgency === u ? 'selected' : ''}>${{ low: _t('eventUrgencyLow'), medium: _t('eventUrgencyMedium'), high: _t('eventUrgencyHigh'), critical: _t('eventUrgencyCritical') }[u]}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">${_t('eventRepeatLabel')}</label><select id="fEventRecurring" class="input">${['none', 'daily', 'weekly', 'monthly', 'yearly'].map(r => `<option value="${r}" ${editData && editData.recurring_type === r ? 'selected' : ''}>${{ none: _t('eventRecurNone'), daily: _t('eventRecurDaily'), weekly: _t('eventRecurWeekly'), monthly: _t('eventRecurMonthly'), yearly: _t('eventRecurYearly') }[r]}</option>`).join('')}</select></div>
    </div>
    <div class="input-group"><label class="input-label">${_t('eventNotesPlaceholder')}</label><textarea id="fEventNotes" class="input" rows="3">${esc(editData ? editData.notes || '' : '')}</textarea></div>
    <div class="input-group"><label class="input-label">${_t('eventOutcomeLabel')}</label><textarea id="fEventOutcome" class="input" rows="2">${esc(editData ? editData.outcome || '' : '')}</textarea></div>
  `,
    async () => {
      const title = document.getElementById('fEventTitle').value.trim();
      if (!title) {
        A.showToast(_t('eventTitleRequired'), 'error');
        return;
      }
      const date = document.getElementById('fEventDate').value;
      if (!date) {
        A.showToast(_t('eventDateRequired'), 'error');
        return;
      }
      const data = {
        title,
        case_id: parseInt(document.getElementById('fEventCase').value) || null,
        client_id: parseInt(document.getElementById('fEventClient').value) || null,
        type: document.getElementById('fEventType').value,
        status: document.getElementById('fEventStatus').value,
        date: date,
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
          if (!id || (typeof id === 'object' && id.error)) {
            A.showToast(_t('eventSaveFailed'), 'error');
            return;
          }
          if (data.recurring_type !== 'none') {
            const numRecur = 4;
            const interval = { daily: 1, weekly: 7, monthly: 30, yearly: 365 }[data.recurring_type] || 7;
            for (let i = 1; i <= numRecur; i++) {
              const nextDate = new Date(data.date + 'T12:00:00');
              nextDate.setDate(nextDate.getDate() + interval * i);
              await A.mutate('events:add', { ...data, date: nextDate.toISOString().slice(0, 10), recurring_type: 'none' });
            }
          }
        }
        A.hideModal();
        A.loadHearings();
        if (typeof A.loadCalendar === 'function') A.loadCalendar();
      } catch (e) {
        A.logError('saveEvent', e);
        A.showToast(_t('eventSaveFailed'), 'error');
      }
    }
  );
};

A.openEventDetail = async function (eventId) {
  if (!A.state.ipc) return;
  let e;
  try {
    e = await A.cachedInvoke('events:get', eventId);
  } catch (error) {
    A.logError('openEventDetail', error);
    A.showToast(_t('eventLoadError'), 'error');
    return;
  }
  if (!e) {
    A.showToast(_t('eventNotFound'), 'error');
    return;
  }
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
  A.safeSet(
    bodyEl,
    esc => `
    <div class="ws-info-card">
      <h4>${_t('eventInfoLabel')}</h4>
      <div class="ws-info-row"><span class="ws-info-label">${_t('eventTypeLabel')}</span><span class="ws-info-value">${esc(e.type)}</span></div>
      <div class="ws-info-row"><span class="ws-info-label">${_t('eventStatusLabel')}</span><span class="ws-info-value"><span class="badge ${statusColors[e.status] || 'badge-active'}">${esc(e.status)}</span></span></div>
      <div class="ws-info-row"><span class="ws-info-label">${_t('eventDateLabel')}</span><span class="ws-info-value">${esc(A.formatDate(e.date))} ${e.time ? esc(e.time) : ''}</span></div>
      <div class="ws-info-row"><span class="ws-info-label">${_t('priorityInfoLabel')}</span><span class="ws-info-value">${esc(e.urgency)}</span></div>
      ${e.court ? `<div class="ws-info-row"><span class="ws-info-label">${_t('eventCourtLabel')}</span><span class="ws-info-value">${esc(e.court)}</span></div>` : ''}
      ${e.judge ? `<div class="ws-info-row"><span class="ws-info-label">${_t('eventJudgeLabel')}</span><span class="ws-info-value">${esc(e.judge)}</span></div>` : ''}
      ${e.room ? `<div class="ws-info-row"><span class="ws-info-label">${_t('eventRoomLabel')}</span><span class="ws-info-value">${esc(e.room)}</span></div>` : ''}
    </div>
    <div>
      <div class="ws-info-card" style="margin-bottom:var(--spacing-3);">
        <h4>${_t('eventLinkLabel')}</h4>
        <div class="ws-info-row"><span class="ws-info-label">${_t('eventCaseLabel')}</span><span class="ws-info-value" style="cursor:pointer;color:var(--foreground);" data-click="nav:cases:open:${esc(e.case_id)}">${esc(e.case_number || '—')}</span></div>
        <div class="ws-info-row"><span class="ws-info-label">${_t('eventClientLabel')}</span><span class="ws-info-value">${esc(e.client_name || '—')}</span></div>
      </div>
      ${e.notes ? `<div class="ws-info-card" style="margin-bottom:var(--spacing-3);"><h4>${_t('eventNotesHeading')}</h4><p style="font-size:var(--type-caption);color:var(--foreground);line-height:1.6;">${esc(e.notes)}</p></div>` : ''}
      ${e.outcome ? `<div class="ws-info-card"><h4>${_t('eventOutcomeHeading')}</h4><p style="font-size:var(--type-caption);color:var(--foreground);line-height:1.6;">${esc(e.outcome)}</p></div>` : ''}
    </div>
  `
  );
  editBtn.onclick = () => {
    overlay.style.display = 'none';
    A.showEventForm(e);
  };
  deleteBtn.onclick = async () => {
    if (await A.showConfirm(_t('deleteEventConfirm'))) {
      try {
        await A.mutate('events:delete', e.id);
      } catch (er) {
        A.logError('deleteEvent', er);
        A.showToast(_t('eventDeleteFailed'), 'error');
        return;
      }
      overlay.style.display = 'none';
      A.loadHearings();
      if (typeof A.loadCalendar === 'function') A.loadCalendar();
    }
  };
  overlay.style.display = 'flex';
};

A.initCalendar = function () {
  document.getElementById('searchHearings')?.addEventListener(
    'input',
    A.debounce(() => A.renderHearingsTable(), 250)
  );
  document.getElementById('hearingsFilterType')?.addEventListener('change', () => A.renderHearingsTable());

  document.querySelectorAll('#section-hearings .filter-btn').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('#section-hearings .filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      A.state.hearingsFilter = b.dataset.filter;
      A.renderHearingsTable();
    })
  );

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

  // Edit/Delete use onclick from openEventDetail – no addEventListener needed here
};

window.switchCalView = A.switchCalView;
window.goToDate = A.goToDate;
window.openEventDetail = A.openEventDetail;
