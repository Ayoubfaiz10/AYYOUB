var A = window.App = window.App || {};

  A.renderDashboard = function(data) {
  const { stats, cases: casesList, clients, chartData, tasks } = data;
  const safeCases = casesList || [];
  const safeClients = clients || [];
  const hasData = safeCases.length > 0 || safeClients.length > 0;
  const emptyState = document.getElementById('dashEmptyState');
  if (emptyState) emptyState.style.display = hasData ? 'none' : 'block';
  A.loadWelcomeSection(safeCases.length);
  A.loadQuickStats(stats, safeCases, safeClients, chartData);
  A.initCharts(stats, chartData);
  A.loadRecentCases(safeCases);
  A.loadPriorityCases(safeCases);
  A.loadRecentDocs(safeCases);
  A.loadPendingTasks();
  A.loadTodayAgenda();
  A.loadDeadlines();
  A.loadActivityTimeline();
  A.loadFinancialSummary(chartData);
  A.loadNotifications();
  A.renderMiniCalendar();
  A.loadUpcomingEvents();
  A.loadAiInsights(stats, safeCases);
  A.initQuickActions();
  A.loadCaseHealthScore(safeCases, tasks);
  A.loadDeadlineCenter(safeCases);
};

A.loadWelcomeSection = function(totalCases) {
  const h = new Date().getHours();
  const greeting = h < 12 ? _t('morningGreeting') : h < 18 ? _t('eveningGreeting') : _t('eveningGreeting');
  const greetEl = document.getElementById('dashGreeting');
  const userEl = document.getElementById('dashUserName');
  const dateEl = document.getElementById('dashDate');
  const quoteEl = document.getElementById('dashQuote');
  if (greetEl) greetEl.textContent = greeting;
  if (userEl) userEl.textContent = _t('defaultLawyer');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(A.getLocale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (quoteEl) quoteEl.textContent = A.state.quotes[totalCases % A.state.quotes.length];
};

A.loadQuickStats = function(stats, cases, clients, chartData) {
  const activeCases = cases.filter(c => c.status === 'active').length;
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayHearings = chartData.statuses?.reduce((s, x) => s + x.count, 0) || 0;
  const pendingTasksCount = stats.pendingTasks || 0;
  const totalClients = clients.length;
  const totalDocs = chartData.statuses?.length || 0;
  const totalRevenue = chartData.fees?.paid || 0;

  A.setStat('dashStatActiveCases', activeCases, 'trendCases');
  A.setStat('dashStatHearings', stats.thisWeekAppointments || 0, 'trendHearings');
  A.setStat('dashStatTasks', pendingTasksCount, 'trendTasks', pendingTasksCount > 0 ? 'down' : 'up');
  A.setStat('dashStatClients', totalClients, 'trendClients');
  A.setStat('dashStatRevenue', totalRevenue.toLocaleString() + _t('currencyMAD'), 'trendRevenue');
  A.setStat('dashStatDocs', (cases.reduce((sum, c) => sum + (c.doc_count || 0), 0)) || '—', 'trendDocs');
};

A.setStat = function(id, value, trendId, trendDir) {
  const el = document.getElementById(id);
  if (!el) return;
  const num = el.querySelector('.dash-stat-number');
  if (num) num.textContent = value;
  const trend = document.getElementById(trendId);
  if (trend) {
    if (trendDir) {
      trend.textContent = trendDir === 'up' ? '↑' : '↓';
      trend.className = 'dash-stat-trend ' + trendDir;
    } else {
      trend.textContent = '↑';
      trend.className = 'dash-stat-trend up';
    }
  }
};

A.loadTodayAgenda = async function() {
  const container = document.getElementById('todayAgenda');
  if (!container || !A.state.ipc) return;
  try {
    const procs = await A.cachedInvoke('db:getTodayProcedures');
    if (!procs || !procs.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noEventsToday') + '</p>'); return; }
    A.safeSet(container, esc => procs.map(p => `<div class="tl-item">
      <span class="tl-time">${p.created_at ? p.created_at.slice(11, 16) : '--:--'}</span>
      <div class="tl-icon" style="background:rgba(198,161,91,0.12);color:var(--gold);"><i class="ri-scales-3-line"></i></div>
      <div class="tl-body"><div class="tl-title">${p.type || _t('hearingLabel')} - ${p.case_number || ''}</div><div class="tl-sub">${p.description || ''}</div></div>
      <i class="ri-arrow-left-s-line tl-action" onclick="navigateTo('hearings')"></i>
    </div>`).join(''));
  } catch (e) { A.logError('loadTodayAgenda', e); A.showError(container, _t('failedLoadUpcomingEvents'), () => A.loadTodayAgenda()); }
};

A.loadDeadlines = async function() {
  const container = document.getElementById('dashUpcomingDeadlines');
  if (!container || !A.state.ipc) return;
  try {
    const [deadlines, hearings] = await Promise.all([
      A.cachedInvoke('db:getUpcomingDeadlines'),
      A.cachedInvoke('db:getUpcomingHearings')
    ]);
    const items = [];
    (deadlines||[]).slice(0, 4).forEach(d => items.push({ text: _t('deadlineColon').replace('{n}', A.escapeHtml(d.case_number)), sub: _t('remainingDays').replace('{n}', A.escapeHtml(d.days_remaining)), icon: 'ri-timer-flash-line', color: '#d97706', time: _t('daysAbbr').replace('{n}', A.escapeHtml(d.days_remaining)) }));
    (hearings||[]).slice(0, 4).forEach(h => items.push({ text: _t('hearingColon').replace('{n}', A.escapeHtml(h.case_number)), sub: _t('remainingDays').replace('{n}', A.escapeHtml(h.days_remaining)), icon: 'ri-scales-3-line', color: '#3b82f6', time: _t('daysAbbr').replace('{n}', A.escapeHtml(h.days_remaining)) }));
    if (!items.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noDeadlinesLabel') + '</p>'); return; }
    A.safeSet(container, esc => items.map(i => `<div class="tl-item">
      <span class="tl-time">${i.time}</span>
      <div class="tl-icon" style="background:${i.color}15;color:${i.color};"><i class="${i.icon}"></i></div>
      <div class="tl-body"><div class="tl-title">${esc(i.text)}</div><div class="tl-sub">${esc(i.sub)}</div></div>
    </div>`).join(''));
  } catch (e) { A.logError('loadDeadlines', e); A.showError(container, _t('failedLoadDeadlines'), () => A.loadDeadlines()); }
};

A.loadActivityTimeline = async function() {
  const container = document.getElementById('dashActivityTimeline');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', {});
    const recent = (logs || []).slice(0, 6);
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

A.loadRecentCases = function(cases) {
  const container = document.getElementById('recentCases');
  const recent = cases.slice(-5).reverse();
  A.safeSet(container, esc => recent.length
    ? recent.map(c => `<div class="dash-case-item" onclick="navigateTo('cases')">
        <div class="dash-case-priority" style="background:${c.status === 'active' ? 'var(--success)' : c.status === 'pending' ? 'var(--gold)' : 'var(--gray-200)'};"></div>
        <div class="dash-case-body"><div class="dash-case-number">${c.case_number || ''}</div><div class="dash-case-client">${c.client_name || ''}</div></div>
        <div class="dash-case-meta">${c.court || ''}</div>
        <span class="dash-case-status badge badge-${c.status}">${A.state.statusLabels[c.status] || c.status}</span>
      </div>`).join('')
    : '<p class="empty-state-sm">' + _t('noCasesLabel') + '</p>');
};

A.loadPriorityCases = function(cases) {
  const container = document.getElementById('dashPriorityCases');
  const urgent = cases.filter(c => c.priority === 'high' || c.status === 'pending').slice(0, 4);
  A.safeSet(container, esc => urgent.length
    ? urgent.map(c => `<div class="dash-case-item" onclick="navigateTo('cases')">
        <div class="dash-case-priority" style="background:var(--danger);"></div>
        <div class="dash-case-body"><div class="dash-case-number">${c.case_number || ''}</div><div class="dash-case-client">${c.client_name || ''}</div></div>
        <i class="ri-arrow-left-s-line" style="color:var(--gray-300);font-size:16px;"></i>
      </div>`).join('')
    : '<p class="empty-state-sm">' + _t('noUrgentCasesLabel') + '</p>');
};

A.loadRecentDocs = async function(cases) {
  const container = document.getElementById('recentDocs');
  if (!container || !A.state.ipc) return;
  try {
    const allDocs = [];
    const recentCases = (cases || []).slice(-10);
    for (const c of recentCases) {
      if (!c || !c.id) continue;
      const d = await A.cachedInvoke('db:getDocuments', c.id);
      if (d && d.length) d.forEach(doc => allDocs.push(doc));
    }
    const recent = allDocs.slice(-5).reverse();
    A.safeSet(container, esc => recent.length
      ? recent.map(d => `<div class="dash-doc-item">
          <div class="dash-doc-icon" style="background:rgba(198,161,91,0.1);color:var(--gold);"><i class="ri-file-4-line"></i></div>
          <div class="dash-doc-body"><div class="dash-doc-name">${esc(d.filename)}</div><div class="dash-doc-case">${esc(d.case_number || '')}</div></div>
          <div class="dash-doc-date">${esc(d.upload_date ? d.upload_date.slice(0, 10) : '')}</div>
        </div>`).join('')
      : '<p class="empty-state-sm">' + _t('noDocsLabel') + '</p>');
  } catch (e) { A.logError('loadRecentDocs', e); A.showError(container, _t('failedLoadRecentDocs'), () => A.loadRecentDocs(cases)); }
};

A.loadPendingTasks = async function() {
  const container = document.getElementById('dashPendingTasks');
  if (!container || !A.state.ipc) return;
  try {
    const tasks = await A.cachedInvoke('db:getAllTasks');
    const todo = tasks.filter(t => t.status === 'todo').slice(0, 4);
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').slice(0, 4);
    const done = tasks.filter(t => t.status === 'done').slice(0, 3);
    A.safeSet(container, esc => `
      <div style="margin-bottom:var(--space-2);">
        <div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--gray-400);"></div><span class="dash-mk-label">${_t('taskTodoLabel')}</span><span class="dash-mk-count">${todo.length}</span></div>
        ${todo.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:${t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--gold)' : 'var(--gray-300)'};"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:4px 0;">' + _t('taskNoneLabel') + '</div>'}
      </div>
      <div style="margin-bottom:var(--space-2);">
        <div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--gold);"></div><span class="dash-mk-label">${_t('taskInProgressLabel')}</span><span class="dash-mk-count">${inProgress.length}</span></div>
        ${inProgress.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:${t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--gold)' : 'var(--gray-300)'};"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:4px 0;">' + _t('taskNoneLabel') + '</div>'}
      </div>
      <div>
        <div class="dash-mk-col-header"><div class="dash-mk-dot" style="background:var(--success);"></div><span class="dash-mk-label">${_t('taskCompletedLabel')}</span><span class="dash-mk-count">${done.length}</span></div>
        ${done.map(t => `<div class="dash-mk-item"><div class="dash-mk-priority" style="background:var(--success);"></div>${esc(t.title)}</div>`).join('') || '<div style="font-size:12px;color:var(--gray-300);padding:4px 0;">' + _t('taskNoneLabel') + '</div>'}
      </div>`);
  } catch (e) { A.logError('loadPendingTasks', e); A.showError(container, _t('failedLoadTasksLabel'), () => A.loadPendingTasks()); }
};

A.renderMiniCalendar = function() {
  const container = document.getElementById('dashMiniCalendar');
  if (!container) return;
  const events = A.state.allEvents || [];
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const monthName = new Intl.DateTimeFormat(A.getLocale(), { month: 'long' }).format(now);
  var shortDays = A.getShortDayNames();
  let html = `<div style="text-align:center;font-weight:var(--font-weight-semibold);color:var(--navy);margin-bottom:var(--space-2);">${monthName} ${year}</div>`;
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:10px;text-align:center;">';
  shortDays.forEach(d => { html += `<div style="color:var(--gray-400);padding:4px 0;">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasEvent = events.some(e => e.date === dateStr && e.status !== 'cancelled');
    const isToday = d === today;
    html += `<div style="padding:4px 0;border-radius:4px;${isToday ? 'background:var(--gold);color:#fff;font-weight:bold;' : hasEvent ? 'background:var(--gray-50);' : ''}">${d}</div>`;
  }
  html += '</div>';
  A.safeSetStatic(container, html);
};

A.loadUpcomingEvents = async function() {
  const container = document.getElementById('dashUpcomingEvents');
  if (!container || !A.state.ipc) return;
  try {
    const [hearings, deadlines] = await Promise.all([
      A.cachedInvoke('db:getUpcomingHearings'),
      A.cachedInvoke('db:getUpcomingDeadlines')
    ]);
    const events = [];
    (hearings||[]).slice(0, 3).forEach(h => events.push({ text: _t('hearingColon').replace('{n}', h.case_number || ''), time: _t('remainingDays').replace('{n}', h.days_remaining || '?'), color: 'var(--gold)' }));
    (deadlines||[]).slice(0, 2).forEach(d => events.push({ text: _t('deadlineColon').replace('{n}', d.case_number || ''), time: _t('remainingDays').replace('{n}', d.days_remaining || '?'), color: 'var(--danger)' }));
    events.sort((a, b) => parseInt(a.time) - parseInt(b.time));
    if (!events.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noUpcomingEventsLabel') + '</p>'); return; }
    A.safeSet(container, esc => events.slice(0, 4).map(e => `<div class="dash-ue-item">
      <div class="dash-ue-dot" style="background:${e.color};"></div>
      <span class="dash-ue-text">${esc(e.text)}</span>
      <span class="dash-ue-time">${esc(e.time)}</span>
    </div>`).join(''));
  } catch (e) { A.logError('loadUpcomingEvents', e); A.showError(container, _t('failedLoadUpcomingEvents'), () => A.loadUpcomingEvents()); }
};

A.loadFinancialSummary = function(chartData) {
  const { total = 0, paid = 0, expenses = 0 } = chartData.fees || {};
  const outstanding = Math.max(0, total - paid);
  const revEl = document.getElementById('dashRevenue');
  const expEl = document.getElementById('dashExpenses');
  const outEl = document.getElementById('dashOutstanding');
  if (revEl) revEl.textContent = paid.toLocaleString() + _t('currencyMAD');
  if (expEl) expEl.textContent = expenses.toLocaleString() + _t('currencyMAD');
  if (outEl) outEl.textContent = outstanding.toLocaleString() + _t('currencyMAD');
  A.drawPieChart(chartData);
};

A.drawPieChart = function(chartData) {
  const c = document.getElementById('dashPieChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  const { paid = 0, expenses = 0 } = chartData.fees || {};
  const remaining = Math.max(0, (chartData.fees?.total || 0) - paid);
  const total = paid + expenses + remaining;
  if (!total) { ctx.fillStyle = '#B0AFA9'; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('—', 50, 50); return; }
  const items = [
    { value: paid, color: '#1A8A5C' }, { value: expenses, color: '#D94A4A' }, { value: remaining, color: '#D4D3D0' }
  ];
  const cx = 50, cy = 50, r = 44;
  ctx.clearRect(0, 0, 100, 100);
  let start = -Math.PI / 2;
  items.forEach(item => {
    if (item.value <= 0) return;
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath(); ctx.fillStyle = item.color; ctx.fill();
    start += angle;
  });
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF'; ctx.fill();
};

A.initCharts = function(stats, chartData) {
  if (typeof Chart === 'undefined') return;
  const navy = '#1E2A38';
  const gold = '#C6A15B';
  const success = '#1A8A5C';
  const danger = '#D94A4A';
  const gray200 = '#D4D3D0';
  const gray400 = '#8C8A84';

  // Destroy existing charts to prevent memory leaks
  if (A._casesChart) { A._casesChart.destroy(); A._casesChart = null; }
  if (A._financialChart) { A._financialChart.destroy(); A._financialChart = null; }
  if (A._tasksChart) { A._tasksChart.destroy(); A._tasksChart = null; }

  // Cases by Status (Doughnut)
  const casesCtx = document.getElementById('casesChart')?.getContext('2d');
  if (casesCtx && stats.casesByStatus) {
    const statusLabels = { active: _t('activeF'), pending: _t('pendingF'), closed: _t('closedF') };
    const statusColors = { active: success, pending: gold, closed: gray200 };
    A._casesChart = new Chart(casesCtx, {
      type: 'doughnut',
      data: {
        labels: stats.casesByStatus.map(s => statusLabels[s.status] || s.status),
        datasets: [{
          data: stats.casesByStatus.map(s => s.count),
          backgroundColor: stats.casesByStatus.map(s => statusColors[s.status] || gray400),
          borderWidth: 2,
          borderColor: document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter' }, color: '#8C8A84', padding: 12 } }
        }
      }
    });
  }

  // Financial Performance (Bar)
  const finCtx = document.getElementById('financialChart')?.getContext('2d');
  if (finCtx && chartData.monthly) {
    const monthNames = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
    const months = chartData.monthly.map(m => monthNames[parseInt(m.month) - 1] || m.month);
    A._financialChart = new Chart(finCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: _t('casesRegisteredLabel'),
          data: chartData.monthly.map(m => m.count),
          backgroundColor: gold,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(140,138,132,0.15)' }, ticks: { color: gray400 } },
          x: { grid: { display: false }, ticks: { color: gray400 } }
        }
      }
    });
  }

  // Tasks by Priority (Doughnut)
  const tasksCtx = document.getElementById('tasksChart')?.getContext('2d');
  if (tasksCtx && stats.tasksByPriority) {
    const priorityLabels = { critical: _t('criticalLabel'), high: _t('highLabel'), medium: _t('mediumLabel'), low: _t('lowLabel') };
    const priorityColors = { critical: danger, high: '#FF8A65', medium: gold, low: success };
    A._tasksChart = new Chart(tasksCtx, {
      type: 'doughnut',
      data: {
        labels: stats.tasksByPriority.map(p => priorityLabels[p.priority] || p.priority),
        datasets: [{
          data: stats.tasksByPriority.map(p => p.count),
          backgroundColor: stats.tasksByPriority.map(p => priorityColors[p.priority] || gray400),
          borderWidth: 2,
          borderColor: document.body.classList.contains('dark-mode') ? '#1F2937' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter' }, color: '#8C8A84', padding: 12 } }
        }
      }
    });
  }
};

A.initQuickActions = function() {
  document.querySelectorAll('.qa-btn, .dash-empty-actions .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      if (action === 'client') { A.navigateTo('clients'); setTimeout(() => document.getElementById('addClientBtn')?.click(), 100); }
      else if (action === 'case') { A.navigateTo('cases'); setTimeout(() => document.getElementById('addCaseBtn')?.click(), 100); }
      else if (action === 'hearing') { A.navigateTo('hearings'); setTimeout(() => document.getElementById('addHearingBtn')?.click(), 100); }
      else if (action === 'document') { A.navigateTo('documents'); setTimeout(() => document.getElementById('uploadDocGlobalBtn')?.click(), 100); }
      else if (action === 'task') { A.navigateTo('tasks'); setTimeout(() => document.getElementById('addTaskBtn')?.click(), 100); }
      else if (action === 'report') A.navigateTo('reports');
      else if (action === 'ai') A.navigateTo('ai');
    });
  });
};

A.loadCaseHealthScore = function(cases, tasks) {
  const el = document.getElementById('dashHealthScore');
  if (!el) return;
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'pending');
  if (!activeCases.length) { A.safeSetStatic(el, '<p class="empty-state-sm">' + _t('noActiveCasesHealth') + '</p>'); return; }
  let totalScore = 0;
  const count = activeCases.length;
  activeCases.forEach(c => {
    let score = 50;
    const assigned = c.assigned_to || '';
    if (assigned) score += 15;
    const fees = parseFloat(c.fees) || 0;
    if (fees > 0) score += 10;
    const caseTasks = (tasks || []).filter(t => t.case_id === c.id);
    const completed = caseTasks.filter(t => t.status === 'done').length;
    const total = caseTasks.length;
    if (total > 0) score += Math.round((completed / total) * 15);
    const priority = (c.priority || '').toLowerCase();
    if (priority === 'high') score -= 5; else if (priority === 'low') score += 5;
    totalScore += Math.min(100, Math.max(0, score));
  });
  const avg = Math.round(totalScore / count);
  let grade, color;
  if (avg >= 80) { grade = _t('gradeExcellent'); color = 'var(--success)'; }
  else if (avg >= 60) { grade = _t('gradeGood'); color = 'var(--gold)'; }
  else if (avg >= 40) { grade = _t('gradeAverage'); color = 'var(--warning)'; }
  else { grade = _t('gradePoor'); color = 'var(--danger)'; }
  A.safeSetStatic(el, `<div class="health-score-card"><div class="health-score-circle" style="border-color:${color};color:${color};">${avg}<span style="font-size:11px;">%</span></div><div style="font-size:13px;font-weight:600;">${grade}</div><div style="font-size:11px;color:var(--gray-400);">${_t('acrossActiveCases').replace('{n}', count)}</div></div>`);
};

A.loadDeadlineCenter = function(cases) {
  const el = document.getElementById('dashDeadlineCenter');
  const countEl = document.getElementById('dashCriticalCount');
  if (!el) return;
  const now = new Date();
  const deadlines = [];
  cases.forEach(c => {
    if (!c.next_hearing && !c.deadline) return;
    const d = c.next_hearing || c.deadline;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return;
    const diff = Math.ceil((dt - now) / 86400000);
    deadlines.push({ case: c.case_number || c.title || _t('caseLabel'), date: d, diff, id: c.id });
  });
  deadlines.sort((a, b) => a.diff - b.diff);
  const critical = deadlines.filter(d => d.diff >= 0 && d.diff <= 3);
  const warning = deadlines.filter(d => d.diff > 3 && d.diff <= 7);
  if (countEl) countEl.textContent = critical.length;
  if (!deadlines.length) { A.safeSetStatic(el, '<p class="empty-state-sm">' + _t('noUpcomingDates') + '</p>'); return; }
  const show = deadlines.slice(0, 4);
  A.safeSet(el, esc => {
    let html = '';
    show.forEach(d => {
      let cls = 'deadline-ok';
      if (d.diff <= 3) cls = 'deadline-critical';
      else if (d.diff <= 7) cls = 'deadline-warning';
      const label = d.diff <= 0 ? _t('overdueLabel') : d.diff === 0 ? _t('todayLabel') : _t('withinDays').replace('{n}', d.diff);
      html += `<div class="deadline-item ${cls}"><span class="deadline-title">${esc(d.case)}</span><span class="deadline-label">${label}</span></div>`;
    });
    if (deadlines.length > 4) html += `<div class="deadline-item" style="justify-content:center;color:var(--gray-400);font-size:12px;">${_t('moreAppointments').replace('{n}', deadlines.length - 4)}</div>`;
    return html;
  });
};
