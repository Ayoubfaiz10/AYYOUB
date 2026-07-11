var A = (window.App = window.App || {});

A.state.hearingsFilter = 'all';
A.state._allEvents = [];

A.loadHearings = async function () {
  if (!A.state.ipc) return;
  A.showSkeleton('hearingsBody', 5, 'tableRow');
  try {
    A.state._allEvents = (await A.cachedInvoke('events:getAll')) || [];
    A.renderHearingsTable();
    if (A.renderMiniCalendar) A.renderMiniCalendar();
  } catch (e) {
    A.logError('loadHearings', e);
    const mainEl = document.getElementById('hearingsBody')?.parentElement;
    if (mainEl) A.showError(mainEl, _t('failedLoadHearings'), () => A.loadHearings());
  }
};

A._renderHearingRows = function (displayed) {
  const body = document.getElementById('hearingsBody');
  A.safeSet(body, esc =>
    displayed.length
      ? displayed
          .map(e => {
            const today = A.todayLocal();
            const statusBadge =
              e.date < today
                ? '<span class="badge badge-closed">' + _t('hearingsPast') + '</span>'
                : e.date === today
                  ? '<span class="badge badge-gold">' + _t('hearingsToday') + '</span>'
                  : '<span class="badge badge-active">' + _t('hearingsUpcoming') + '</span>';
            const typeIcons = { hearing: '<i class="ri-scales-line"></i>', deadline: '<i class="ri-alarm-warning-line"></i>', meeting: '<i class="ri-group-line"></i>', task: '<i class="ri-checkbox-circle-line"></i>', document: '<i class="ri-file-text-line"></i>', payment: '<i class="ri-coins-line"></i>' };
            return `<tr>
      <td style="font-size:11px;">${esc(A.formatDate(e.date))}</td>
      <td style="font-size:11px;">${esc(e.time || '-')}</td>
      <td>${typeIcons[e.type] || '<i class="ri-pushpin-line"></i>'} ${esc(e.type)}</td>
      <td><strong style="cursor:pointer;color:var(--foreground);" data-click="event:open:${e.id}">${esc(e.title)}</strong></td>
      <td style="font-size:11px;">${esc(e.case_number || '-')}</td>
      <td style="font-size:11px;">${esc(e.client_name || '-')}</td>
      <td>${statusBadge}</td>
      <td><button class="btn-icon" data-click="event:open:${e.id}"><i class="ri-eye-line"></i></button></td>
    </tr>`;
          })
          .join('')
      : '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted-foreground);">' + _t('noEvents') + '</td></tr>'
  );
};

A.renderHearingsTable = function () {
  try {
    let list = A.state._allEvents;
    const typeFilter = document.getElementById('hearingsFilterType')?.value || 'all';
    if (typeFilter !== 'all') list = list.filter(e => e.type === typeFilter);
    if (A.state.hearingsFilter === 'upcoming') list = list.filter(e => e.date >= A.todayLocal());
    else if (A.state.hearingsFilter === 'past') list = list.filter(e => e.date < A.todayLocal());
    const q = document.getElementById('searchHearings')?.value.toLowerCase() || '';
    if (q)
      list = list.filter(
        e => (e.title || '').toLowerCase().includes(q) || (e.case_number || '').toLowerCase().includes(q) || (e.court || '').toLowerCase().includes(q)
      );
    list.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    if (A.state._hearingScroll) A.state._hearingScroll.destroy();
    A.state._hearingScroll = A.VirtualScroll.init('hearingsBody', list, A._renderHearingRows, 30);
  } catch (e) {
    A.logError('renderHearingsTable', e);
  }
};

A.initHearings = function () {
  document.getElementById('hearingsFilterBtn')?.addEventListener('click', () => {
    const bar = document.getElementById('hearingsFilterBar');
    if (bar) bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('searchHearings')?.addEventListener('input', A.debounce(() => A.renderHearingsTable(), 250));
  document.getElementById('hearingsFilterType')?.addEventListener('change', () => A.renderHearingsTable());
  document.querySelectorAll('#hearingsFilterBar .filter-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#hearingsFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      A.state.hearingsFilter = btn.dataset.filter;
      A.renderHearingsTable();
    })
  );
  document.getElementById('addHearingBtn')?.addEventListener('click', () => {
    const typeOpts = ['hearing', 'deadline', 'meeting', 'task', 'document', 'payment']
      .map(t => `<option value="${t}">${{ hearing: _t('eventTypeHearing'), deadline: _t('eventTypeDeadline'), meeting: _t('eventTypeMeeting'), task: _t('eventTypeTask'), document: _t('eventTypeDocument'), payment: _t('eventTypePayment') }[t]}</option>`)
      .join('');
    A.showModal(_t('newHearingBtn'), `
      <div class="input-group"><label class="input-label">${_t('eventTitleLabel')}</label><input type="text" id="fHearingTitle" class="input" placeholder="${_t('eventTitlePlaceholder')}"></div>
      <div class="info-grid-2">
        <div class="input-group"><label class="input-label">${_t('hearingDateLabel')}</label><input type="date" id="fHearingDate" class="input" value="${A.todayLocal()}"></div>
        <div class="input-group"><label class="input-label">${_t('eventTypeLabel')}</label><select id="fHearingType" class="input">${typeOpts}</select></div>
      </div>
      <div class="input-group"><label class="input-label">${_t('hearingNotesLabel')}</label><textarea id="fHearingNotes" class="input" rows="3"></textarea></div>
    `, async () => {
      const title = document.getElementById('fHearingTitle').value.trim();
      if (!title) { A.showToast(_t('eventTitleRequired'), 'error'); return; }
      try {
        await A.mutate('events:add', {
          date: document.getElementById('fHearingDate').value,
          type: document.getElementById('fHearingType').value,
          title,
          notes: document.getElementById('fHearingNotes').value
        });
      } catch (e) { A.logError('addEvent', e); A.showToast(_t('hearingAddFailed'), 'error'); return; }
      A.hideModal();
      A.loadHearings();
    });
  });
};
