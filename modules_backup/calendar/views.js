window.App = window.App || {};
const A = window.App;

A.getCalEvents = function() {
  const year = A.state.calDate.getFullYear();
  const month = A.state.calDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return { events: A.state.allEvents, start, end, year, month, firstDay, lastDay };
};

A.renderCalendar = function() {
  A.renderMonthView();
  A.renderWeekView();
  A.renderDayView();
  A.renderAgendaView();
};

A.renderMonthView = function() {
  const grid = document.getElementById('calGrid');
  const { start, end, year, month, firstDay, lastDay } = A.getCalEvents();
  document.getElementById('calTitle').textContent = new Intl.DateTimeFormat(A.getLocale(), { month: 'long', year: 'numeric' }).format(A.state.calDate);
  const weekdays = A.getDayNames('long');
  const today = new Date().toISOString().slice(0,10);
  let html = weekdays.map(d => `<div class="cal-header-cell">${d}</div>`).join('');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0,10);
    const isOther = d.getMonth() !== month;
    const isToday = dateStr === today;
    const dayEvents = A.state.allEvents.filter(e => e.date === dateStr && e.status !== 'cancelled');
    const visible = dayEvents.slice(0, 3);
    const more = dayEvents.length - 3;
    html += `<div class="cal-day ${isOther ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <div class="cal-day-num">${d.getDate()}</div>
      ${visible.map(e => `<div class="cal-day-event event-${e.type}" onclick="event.stopPropagation();openEventDetail(${e.id})">${A.escapeHtml(e.title).slice(0, 20)}</div>`).join('')}
      ${more > 0 ? `<div class="cal-day-more" onclick="event.stopPropagation();switchCalView('day');goToDate('${dateStr}')">+${more} أكثر</div>` : ''}
    </div>`;
  }
  A.safeSetStatic(grid, html);
  if (!grid) return;
  grid.querySelectorAll('.cal-day').forEach(el => el.addEventListener('click', () => {
    A.state.calDate = new Date(el.dataset.date + 'T12:00:00');
    A.switchCalView('day');
  }));
};

A.renderWeekView = function() {
  const grid = document.getElementById('calWeekGrid');
  const { year, month } = A.getCalEvents();
  const today = new Date().toISOString().slice(0,10);
  const startOfWeek = new Date(A.state.calDate);
  startOfWeek.setDate(A.state.calDate.getDate() - A.state.calDate.getDay());
  const hours = Array.from({length: 12}, (_, i) => `${String(i+8).padStart(2,'0')}:00`);
  var shortDays = A.getShortDayNames();
  let html = '<div class="cal-week-header">الوقت</div>' +
    Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      return `<div class="cal-week-header">${shortDays[i]}<br><span style="font-size:13px;">${d.getDate()}</span></div>`;
    }).join('');
  hours.forEach(h => {
    html += `<div class="cal-week-time">${h}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().slice(0,10);
      const events = A.state.allEvents.filter(e => e.date === dateStr && e.time && e.time.startsWith(h.slice(0,2)) && e.status !== 'cancelled');
      html += `<div class="cal-week-cell" data-date="${dateStr}">
        ${events.map(e => `<div class="cal-week-event event-${e.type}" onclick="event.stopPropagation();openEventDetail(${e.id})">${A.escapeHtml(e.title).slice(0,15)}</div>`).join('')}
      </div>`;
    }
  });
  A.safeSetStatic(grid, html);
  if (!grid) return;
  grid.querySelectorAll('.cal-week-cell').forEach(el => el.addEventListener('click', () => {
    A.state.calDate = new Date(el.dataset.date + 'T12:00:00');
    A.switchCalView('day');
  }));
};

A.renderDayView = function() {
  const grid = document.getElementById('calDayGrid');
  const dateStr = A.state.calDate.toISOString().slice(0,10);
  const today = new Date().toISOString().slice(0,10);
  const hours = Array.from({length: 14}, (_, i) => `${String(i+7).padStart(2,'0')}:00`);
  A.safeSet(grid, esc => {
    let h = `<div class="cal-week-header" style="grid-column:span 2;text-align:right;padding:var(--space-3);font-size:var(--font-size-base);">
      ${new Intl.DateTimeFormat(A.getLocale(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(A.state.calDate)}
      ${dateStr === today ? '<span class="badge badge-gold" style="margin-right:8px;" data-i18n="statusToday">اليوم</span>' : ''}
    </div>`;
    hours.forEach(hour => {
      const evts = A.state.allEvents.filter(e => e.date === dateStr && e.time && e.time.startsWith(hour.slice(0,2)) && e.status !== 'cancelled');
      h += `<div class="cal-day-time">${hour}</div>
        <div class="cal-day-cell" data-hour="${hour}">
          ${evts.map(e => `<div class="cal-day-event-lg event-${e.type}" onclick="openEventDetail(${e.id})">${esc(e.title)}</div>`).join('')}
        </div>`;
    });
    return h;
  });
};

A.renderAgendaView = function() {
  const container = document.getElementById('calAgendaList');
  const today = new Date().toISOString().slice(0,10);
  const sorted = [...A.state.allEvents].filter(e => e.date >= today && e.status !== 'cancelled').sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));
  const grouped = {};
  sorted.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const typeColors = { hearing: 'var(--navy)', deadline: 'var(--danger)', task: 'var(--gold)', meeting: 'var(--gray-400)', document: '#7c3aed', payment: 'var(--success)' };
  const typeIcons = { hearing: '⚖️', deadline: '⏰', meeting: '📋', task: '✅', document: '📄', payment: '💰' };
  A.safeSet(container, esc => Object.keys(grouped).length ? Object.entries(grouped).map(([date, events]) => {
    const d = new Date(date + 'T12:00:00');
    const isToday = date === today;
    const dayName = new Intl.DateTimeFormat(A.getLocale(), { weekday: 'long', month: 'long', day: 'numeric' }).format(d);
    return `<div class="cal-agenda-day">
      <div class="cal-agenda-date">${isToday ? window._t('statusToday') + ' — ' : ''}${dayName}</div>
      ${events.map(e => `<div class="cal-agenda-event" onclick="openEventDetail(${e.id})">
        <div class="cal-agenda-dot" style="background:${typeColors[e.type] || 'var(--gray-300)'};"></div>
        <div class="cal-agenda-time">${esc(e.time || 'كل اليوم')}</div>
        <div class="cal-agenda-info">
          <div class="cal-agenda-title">${typeIcons[e.type] || '📌'} ${esc(e.title)}</div>
          <div class="cal-agenda-meta">${esc(e.case_number || '')} ${e.court ? '· ' + esc(e.court) : ''}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('') : '<div style="text-align:center;padding:60px 20px;"><i class="ri-calendar-check-line" style="font-size:48px;color:var(--gray-200);display:block;margin-bottom:12px;"></i><p style="color:var(--gray-300);">لا توجد أحداث قادمة</p></div>');
};

A.switchCalView = function(view) {
  document.querySelectorAll('#section-calendar .view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('#section-calendar .cal-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`cal${view.charAt(0).toUpperCase() + view.slice(1)}View`).classList.add('active');
  A.state.calView = view;
};

A.goToDate = function(dateStr) {
  A.state.calDate = new Date(dateStr + 'T12:00:00');
  A.renderCalendar();
};
