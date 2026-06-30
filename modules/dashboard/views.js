var A = window.App = window.App || {};

A.renderDashboard = function(data) {
  const { stats, ext, cases: casesList, clients, chartData, tasks } = data;
  const safeCases = casesList || [];
  const safeClients = clients || [];
  const safeExt = ext || {};
  const hasData = safeCases.length > 0 || safeClients.length > 0;
  const emptyState = document.getElementById('dashEmptyState');
  if (emptyState) emptyState.style.display = hasData ? 'none' : 'block';
  A.renderWelcomeHeader(safeCases.length);
  A.renderKpiCards(stats, safeExt, safeCases, safeClients, chartData);
  A.renderChartRow(chartData, safeExt);
  A.renderUpcomingWidget();
  A.renderUrgentTasks(tasks);
  A.loadActivityTimeline();
  A.loadNotifications();
  A.renderRevenueLine(safeExt);
  A.renderTomorrowHearings();
  A.initQuickActions();
  A.initKpiCardClicks();
};

A.renderWelcomeHeader = function(totalCases) {
  const userEl = document.getElementById('dashUserName');
  const dateEl = document.getElementById('dashDate');
  const avatarEl = document.getElementById('dashAvatar');
  if (userEl) userEl.textContent = _t('defaultLawyer');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(A.getLocale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (avatarEl) avatarEl.textContent = (_t('defaultLawyer') || 'محامي').charAt(0);
};

A.renderKpiCards = function(stats, ext, cases, clients, chartData) {
  const activeCases = cases.filter(c => c.status === 'active').length;
  const pendingTasksCount = stats.pendingTasks || 0;
  const totalClients = clients.length;
  const totalRevenue = chartData.fees?.paid || 0;
  const totalDocs = cases.reduce((sum, c) => sum + (c.doc_count || 0), 0);
  const thisWeekHearings = stats.thisWeekAppointments || 0;

  A.setKpi('kpiNumActiveCases', activeCases, 'kpiTrendActiveCases', ext.trend?.activeCasesNow, ext.trend?.activeCasesPrev);
  A.setKpi('kpiNumClients', totalClients, 'kpiTrendClients', ext.trend?.clientsNow, ext.trend?.clientsPrev);
  A.setKpi('kpiNumHearings', thisWeekHearings, 'kpiTrendHearings', ext.trend?.hearingsNow, ext.trend?.hearingsPrev);
  A.setKpi('kpiNumRevenue', totalRevenue.toLocaleString() + _t('currencyMAD'), 'kpiTrendRevenue', ext.trend?.revenueNow, ext.trend?.revenuePrev);
  A.setKpi('kpiNumTasks', pendingTasksCount, 'kpiTrendTasks', ext.trend?.tasksNow, ext.trend?.tasksPrev, true);
  A.setKpi('kpiNumDocs', totalDocs || 0, 'kpiTrendDocs', ext.trend?.docsNow, ext.trend?.docsPrev);
};

A.setKpi = function(numId, value, trendId, now, prev, invertBad) {
  const numEl = document.getElementById(numId);
  const trendEl = document.getElementById(trendId);
  if (numEl) numEl.textContent = value;
  if (trendEl && now !== undefined && prev !== undefined && prev > 0) {
    const pct = Math.round(((now - prev) / prev) * 100);
    const abs = Math.abs(pct);
    if (pct > 0) { trendEl.textContent = '+' + abs + '%'; trendEl.className = 'dash-kpi-trend up'; }
    else if (pct < 0) { trendEl.textContent = '-' + abs + '%'; trendEl.className = 'dash-kpi-trend down'; }
    else { trendEl.textContent = '0%'; trendEl.className = 'dash-kpi-trend neutral'; }
    if (invertBad && pct > 0) trendEl.className = 'dash-kpi-trend down';
    if (invertBad && pct < 0) trendEl.className = 'dash-kpi-trend up';
  } else if (trendEl) {
    trendEl.textContent = '—'; trendEl.className = 'dash-kpi-trend neutral';
  }
};

A.renderChartRow = function(chartData, ext) {
  if (typeof Chart === 'undefined') return;
  if (A._casesBarChart) { A._casesBarChart.destroy(); A._casesBarChart = null; }
  if (A._typeDonut) { A._typeDonut.destroy(); A._typeDonut = null; }

  const gold = '#C6A15B';
  const gray400 = '#8C8A84';
  const monthNames = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];

  // Left: Cases by Month (bar)
  const barCtx = document.getElementById('casesBarChart')?.getContext('2d');
  if (barCtx) {
    const monthly = chartData.monthly || [];
    const labels = monthly.map(m => monthNames[parseInt(m.month) - 1] || m.month);
    const values = monthly.map(m => m.count);
    if (values.length) {
      A._casesBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: _t('casesCountLabel'), data: values, backgroundColor: gold, borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(140,138,132,0.15)' }, ticks: { color: gray400 } },
            x: { grid: { display: false }, ticks: { color: gray400 } }
          }
        }
      });
    } else {
      barCtx.fillStyle = gray400; barCtx.font = '12px Inter'; barCtx.textAlign = 'center'; barCtx.textBaseline = 'middle';
      barCtx.fillText('—', barCtx.canvas.width / 2, barCtx.canvas.height / 2);
    }
  }

  // Right: Cases by Type (doughnut)
  const donutCtx = document.getElementById('typeDoughnutChart')?.getContext('2d');
  if (donutCtx) {
    const tData = ext.casesByType || [];
    const typeColors = ['#4A8BC2','#C6A15B','#1A8A5C','#8B5CF6','#FF8A65','#D94A4A','#6B7280'];
    if (tData.length) {
      A._typeDonut = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: tData.map(t => t.case_type),
          datasets: [{
            data: tData.map(t => t.count),
            backgroundColor: tData.map((_, i) => typeColors[i % typeColors.length]),
            borderWidth: 2,
            borderColor: document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Inter' }, color: '#8C8A84', padding: 12 } }
          }
        }
      });
    } else {
      donutCtx.fillStyle = gray400; donutCtx.font = '12px Inter'; donutCtx.textAlign = 'center'; donutCtx.textBaseline = 'middle';
      donutCtx.fillText('—', donutCtx.canvas.width / 2, donutCtx.canvas.height / 2);
    }
  }
};

A.renderUpcomingWidget = async function() {
  const container = document.getElementById('dashUpcomingWidget');
  if (!container || !A.state.ipc) return;
  try {
    const [hearings, deadlines] = await Promise.all([
      A.cachedInvoke('db:getUpcomingHearings'),
      A.cachedInvoke('db:getUpcomingDeadlines')
    ]);
    const items = [];
    (hearings||[]).slice(0, 4).forEach(h => items.push({
      icon: 'ri-scales-3-line', color: '#C6A15B',
      title: _t('hearingColon').replace('{n}', A.escapeHtml(h.case_number || '')),
      sub: h.date ? h.date.slice(0, 10) : '', time: h.days_remaining ? _t('remainingDays').replace('{n}', h.days_remaining) : ''
    }));
    (deadlines||[]).slice(0, 3).forEach(d => items.push({
      icon: 'ri-timer-flash-line', color: '#D94A4A',
      title: _t('deadlineColon').replace('{n}', A.escapeHtml(d.case_number || '')),
      sub: '', time: d.days_remaining ? _t('remainingDays').replace('{n}', d.days_remaining) : ''
    }));
    if (!items.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noUpcomingLabel') + '</p>'); return; }
    items.sort((a, b) => parseInt(a.time) - parseInt(b.time));
    A.safeSet(container, esc => items.slice(0, 5).map(i => `<div class="tl-item">
      <span class="tl-time">${esc(i.time)}</span>
      <div class="tl-icon" style="background:${i.color}15;color:${i.color};"><i class="${i.icon}"></i></div>
      <div class="tl-body"><div class="tl-title">${esc(i.title)}</div>${i.sub ? '<div class="tl-sub">' + esc(i.sub) + '</div>' : ''}</div>
    </div>`).join(''));
  } catch (e) { A.logError('renderUpcomingWidget', e); A.showError(container, _t('failedLoad'), () => A.renderUpcomingWidget()); }
};

A.renderUrgentTasks = function(tasks) {
  const container = document.getElementById('dashUrgentTasks');
  if (!container) return;
  const urgent = (tasks || []).filter(t => t.priority === 'high' && t.status !== 'done' && t.status !== 'archived').slice(0, 6);
  A.safeSet(container, esc => urgent.length
    ? urgent.map(t => `<div class="tl-item">
        <span class="tl-time">${t.due_date ? esc(t.due_date.slice(0, 10)) : ''}</span>
        <div class="tl-icon" style="background:rgba(217,74,74,0.1);color:var(--destructive);"><i class="ri-error-warning-line"></i></div>
        <div class="tl-body"><div class="tl-title" style="color:var(--destructive);">${esc(t.title)}</div>
          <div class="tl-sub">${t.case_number ? esc(t.case_number) : ''}</div>
        </div>
      </div>`).join('')
    : '<p class="empty-state-sm">' + _t('noUrgentTasks') + '</p>');
};

A.loadActivityTimeline = async function() {
  const container = document.getElementById('dashActivityTimeline');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', {});
    const recent = (logs || []).slice(0, 5);
    if (!recent.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noActivityLabel') + '</p>'); return; }
    const iconMap = { ajout: 'ri-add-circle-line', modification: 'ri-edit-line', suppression: 'ri-delete-bin-line', default: 'ri-history-line' };
    const colorMap = { ajout: '#1A8A5C', modification: '#4A8BC2', suppression: '#D94A4A', default: '#8C8A84' };
    A.safeSet(container, esc => recent.map(l => {
      const action = l.action || 'default';
      const time = l.created_at ? l.created_at.slice(11, 16) : '--:--';
      return `<div class="tl-item">
        <span class="tl-time">${time}</span>
        <div class="tl-icon" style="background:${colorMap[action] || colorMap.default}12;color:${colorMap[action] || colorMap.default};"><i class="${iconMap[action] || iconMap.default}"></i></div>
        <div class="tl-body"><div class="tl-title">${esc(l.details || '')}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0, 10) : ''}</div></div>
      </div>`;
    }).join(''));
  } catch (e) { A.logError('loadActivityTimeline', e); A.showError(container, _t('failedLoadActivity'), () => A.loadActivityTimeline()); }
};

A.loadNotifications = async function() {
  const container = document.getElementById('dashNotifications');
  const badge = document.getElementById('dashNotifBadge');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', { limit: 6 });
    const recent = (logs || []).slice(0, 4);
    if (!recent.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>'); if (badge) badge.textContent = '0'; return; }
    A.safeSet(container, esc => recent.map(l => `<div class="tl-item">
      <div class="tl-icon" style="background:var(--muted);color:var(--muted-foreground);"><i class="ri-notification-3-line"></i></div>
      <div class="tl-body"><div class="tl-title">${esc(l.details || '')}</div></div>
      <span class="tl-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
    </div>`).join(''));
    if (badge) badge.textContent = recent.length;
  } catch (e) { A.logError('loadNotifications', e); A.showError(container, _t('failedLoadNotifications'), () => A.loadNotifications()); }
};

A.renderRevenueLine = function(ext) {
  if (typeof Chart === 'undefined') return;
  if (A._revenueLine) { A._revenueLine.destroy(); A._revenueLine = null; }
  const ctx = document.getElementById('revenueLineChart')?.getContext('2d');
  if (!ctx) return;
  const gold = '#C6A15B'; const gray400 = '#8C8A84';
  const monthNames = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
  const revData = ext.monthlyRevenue || [];
  const labels = revData.map(m => monthNames[parseInt(m.month) - 1] || m.month);
  const values = revData.map(m => parseFloat(m.total) || 0);
  if (values.length) {
    A._revenueLine = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: _t('revenueLabel'), data: values,
          borderColor: gold, backgroundColor: gold + '20',
          fill: true, tension: 0.35,
          pointBackgroundColor: gold, pointRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(140,138,132,0.15)' }, ticks: { color: gray400, callback: function(v) { return v.toLocaleString(); } } },
          x: { grid: { display: false }, ticks: { color: gray400 } }
        }
      }
    });
  } else {
    ctx.fillStyle = gray400; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('—', ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
};

A.renderTomorrowHearings = async function() {
  const container = document.getElementById('dashTomorrowList');
  if (!container || !A.state.ipc) return;
  try {
    const events = await A.cachedInvoke('events:getAll');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const hearingEvents = (events || []).filter(e => e.type === 'hearing' && e.date === dateStr && e.status !== 'cancelled');
    if (!hearingEvents.length) { A.safeSetStatic(container, '<span class="empty-state-sm" style="color:rgba(255,255,255,0.5);">' + _t('noTomorrowHearings') + '</span>'); return; }
    A.safeSet(container, esc => hearingEvents.map(e => `<div class="dash-tomorrow-item" onclick="navigateTo('hearings')">
      <span class="tt-time">${e.time ? esc(e.time.slice(0, 5)) : '--:--'}</span>
      <span class="tt-court">${esc(e.court || e.title || '')}</span>
    </div>`).join(''));
  } catch (e) { A.logError('renderTomorrowHearings', e); }
};

A.initQuickActions = function() {
  document.querySelectorAll('.dash-empty-actions .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      if (action === 'client') { A.navigateTo('clients'); }
      else if (action === 'case') { A.navigateTo('cases'); }
      else if (action === 'task') { A.navigateTo('tasks'); }
      else if (action === 'report') A.navigateTo('reports');
      else if (action === 'ai') A.navigateTo('ai');
    });
  });
};

A.initKpiCardClicks = function() {
  const navMap = {
    kpiActiveCases: 'cases', kpiClients: 'clients',
    kpiHearings: 'hearings', kpiRevenue: 'reports',
    kpiTasks: 'tasks', kpiDocs: 'documents'
  };
  Object.entries(navMap).forEach(([id, section]) => {
    const card = document.getElementById(id);
    if (card) card.addEventListener('click', () => A.navigateTo(section));
  });
};
