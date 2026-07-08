var A = (window.App = window.App || {});

A.state.hearingsFilter = 'all';

A.loadHearings = async function () {
  if (!A.state.ipc) return;
  A.showSkeleton('hearingsBody', 5, 'tableRow');
  try {
    A.state.allEvents = (await A.cachedInvoke('events:getAll')) || [];
    if (A.state._hearingScroll) A.state._hearingScroll.destroy();
    A.state._hearingScroll = A.VirtualScroll.init(
      'hearingsBody',
      A.state.allEvents,
      function (displayed) {
        A._renderHearingRows(displayed);
      },
      30
    );
    A.renderMiniCalendar();
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
            const today = new Date().toISOString().slice(0, 10);
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
  let list = A.state.allEvents.filter(e => ['hearing', 'deadline'].includes(e.type));
  if (A.state.hearingsFilter === 'upcoming') list = list.filter(e => e.date >= new Date().toISOString().slice(0, 10));
  else if (A.state.hearingsFilter === 'past') list = list.filter(e => e.date < new Date().toISOString().slice(0, 10));
  const typeFilter = document.getElementById('hearingsFilterType')?.value || 'all';
  if (typeFilter !== 'all') list = list.filter(e => e.type === typeFilter);
  const q = document.getElementById('searchHearings').value.toLowerCase();
  if (q)
    list = list.filter(
      e => (e.title || '').toLowerCase().includes(q) || (e.case_number || '').toLowerCase().includes(q) || (e.court || '').toLowerCase().includes(q)
    );
  list.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  if (A.state._hearingScroll) A.state._hearingScroll.destroy();
  A.state._hearingScroll = A.VirtualScroll.init('hearingsBody', list, A._renderHearingRows, 30);
};

A.initHearings = function () {
  document.getElementById('hearingsFilterBtn')?.addEventListener('click', () => {
    const bar = document.getElementById('hearingsFilterBar');
    if (bar) bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });
};
