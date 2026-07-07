var A = (window.App = window.App || {});

const chartCorporateBlue = '#1E40AF';
const chartAccentBlue = '#2563EB';
const chartSlateGray = '#475569';

A.renderDashboard = function (data) {
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
  A.initQuickActionsBar();
  A.initKpiCardClicks();
};

A.renderWelcomeHeader = function (totalCases) {
  const userEl = document.getElementById('dashUserName');
  const dateEl = document.getElementById('dashDate');
  const avatarEl = document.getElementById('dashAvatar');
  const welcomeRow = document.getElementById('dashWelcomeRow');

  // Get actual user name from auth
  var userName = _t('defaultLawyer');
  if (A.state.ipc) {
    A.state.ipc.invoke('auth:getCurrentUser').then(function (user) {
      if (user && user.name) userName = user.name;
      if (avatarEl) avatarEl.textContent = userName.charAt(0);
      if (userEl) {
        var greeting = 'السلام عليكم، ' + userName;
        userEl.textContent = greeting;
      }
    }).catch(function () {
      if (avatarEl) avatarEl.textContent = (_t('defaultLawyer') || 'محامي').charAt(0);
      if (userEl) userEl.textContent = _t('defaultLawyer');
    });
  } else {
    if (avatarEl) avatarEl.textContent = (_t('defaultLawyer') || 'محامي').charAt(0);
    if (userEl) userEl.textContent = _t('defaultLawyer');
  }

  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(A.getLocale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Add greeting subtitle with contextual info
  var subEl = welcomeRow ? welcomeRow.querySelector('.dash-greeting-sub') : null;
  if (!subEl && welcomeRow) {
    subEl = document.createElement('div');
    subEl.className = 'dash-greeting-sub';
    welcomeRow.querySelector('.dash-welcome-text').appendChild(subEl);
  }
  if (subEl && A.state.ipc) {
    Promise.all([
      A.cachedInvoke('db:getUpcomingHearings'),
      A.cachedInvoke('db:getUpcomingDeadlines')
    ]).then(function (results) {
      var hearings = results[0] || [];
      var deadlines = results[1] || [];
      var weekCount = hearings.filter(function (h) { return h.days_remaining <= 7; }).length;
      var todayCount = deadlines.filter(function (d) { return d.days_remaining <= 1; }).length;
      var parts = [];
      if (weekCount > 0) {
        var hText = weekCount === 1 ? 'لديك جلسة واحدة هذا الأسبوع' : 'لديك ' + weekCount + ' جلسات هذا الأسبوع';
        parts.push(hText);
      }
      if (todayCount > 0) {
        var dText = todayCount === 1 ? 'وقضية تحتاج متابعة اليوم' : 'وقضيتان تحتاجان متابعة اليوم';
        parts.push(dText);
      }
      subEl.textContent = parts.length ? parts.join(' و') : 'مرحباً بك في لوحة التحكم';
    }).catch(function () {
      subEl.textContent = 'مرحباً بك في لوحة التحكم';
    });
  }
};

A.renderKpiCards = function (stats, ext, cases, clients, chartData) {
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

A.setKpi = function (numId, value, trendId, now, prev, invertBad) {
  const numEl = document.getElementById(numId);
  const trendEl = document.getElementById(trendId);
  if (numEl) {
    numEl.textContent = value;
    numEl.classList.toggle('is-zero', value === 0 || value === '0' || value === '0MAD' || value === '0.00MAD');
  }
  if (trendEl && now !== undefined && prev !== undefined && prev > 0) {
    const pct = Math.round(((now - prev) / prev) * 100);
    const abs = Math.abs(pct);
    if (pct === 0 || pct === -100) {
      trendEl.textContent = '';
      trendEl.className = 'dash-kpi-trend';
    } else if (pct > 0) {
      trendEl.textContent = '+' + abs + '%';
      trendEl.className = 'dash-kpi-trend up';
    } else {
      trendEl.textContent = '-' + abs + '%';
      trendEl.className = 'dash-kpi-trend down';
    }
    if (invertBad && pct > 0) trendEl.className = 'dash-kpi-trend down';
    if (invertBad && pct < 0) trendEl.className = 'dash-kpi-trend up';
  } else if (trendEl) {
    trendEl.textContent = '—';
    trendEl.className = 'dash-kpi-trend neutral';
  }
};

A.renderChartRow = function (chartData, ext) {
  if (typeof Chart === 'undefined') return;
  if (A._casesBarChart) {
    A._casesBarChart.destroy();
    A._casesBarChart = null;
  }
  if (A._typeDonut) {
    A._typeDonut.destroy();
    A._typeDonut = null;
  }

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];

  var chartFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-primary').trim() || "'Inter', sans-serif";
  var darkMode = document.body.classList.contains('dark-mode');
  var gridColor = darkMode ? 'rgba(140,138,132,0.1)' : 'rgba(140,138,132,0.15)';
  var tooltipBg = darkMode ? '#1F2937' : '#FFFFFF';
  var tooltipBorder = darkMode ? '#374151' : '#E8E7E5';

  // Left: Cases by Month (bar)
  var barCtx = document.getElementById('casesBarChart')?.getContext('2d');
  if (barCtx) {
    var monthly = chartData.monthly || [];
    var labels = monthly.map(function (m) { return monthNames[parseInt(m.month, 10) - 1] || m.month; });
    var values = monthly.map(function (m) { return m.count; });
    if (values.length) {
      var barGradient = barCtx.createLinearGradient(0, 0, 0, 280);
      barGradient.addColorStop(0, chartCorporateBlue);
      barGradient.addColorStop(0.5, chartAccentBlue);
      barGradient.addColorStop(1, '#1D4ED8');
      A._casesBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: _t('casesCountLabel'), data: values, backgroundColor: barGradient, borderRadius: 6, barPercentage: 0.6 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: darkMode ? '#F9FAFB' : '#1F2937',
              bodyColor: chartSlateGray,
              borderColor: tooltipBorder,
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true,
              titleFont: { family: chartFontFamily, size: 12, weight: '600' },
              bodyFont: { family: chartFontFamily, size: 11 }
            }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: chartSlateGray, font: { family: chartFontFamily, size: 10 } } },
            x: { grid: { display: false }, ticks: { color: chartSlateGray, font: { family: chartFontFamily, size: 10 } } }
          }
        }
      });
    } else {
      barCtx.fillStyle = chartSlateGray;
      barCtx.font = '12px Inter';
      barCtx.textAlign = 'center';
      barCtx.textBaseline = 'middle';
      barCtx.fillText('—', barCtx.canvas.width / 2, barCtx.canvas.height / 2);
    }
  }

  // Right: Cases by Type (doughnut)
  var donutCtx = document.getElementById('typeDoughnutChart')?.getContext('2d');
  if (donutCtx) {
    var tData = ext.casesByType || [];
    var typeColors = { 'مدني': chartCorporateBlue, 'تجاري': chartAccentBlue, 'أسرة': '#0EA5E9', 'إداري': '#64748B', 'جنائي': '#94A3B8' };
    var defaultColors = [chartCorporateBlue, chartAccentBlue, '#0EA5E9', '#64748B', '#94A3B8', '#475569', '#6B7280'];
    var colors = tData.map(function (t) { return typeColors[t.case_type] || defaultColors[tData.indexOf(t) % defaultColors.length]; });
    if (tData.length) {
      A._typeDonut = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: tData.map(function (t) { return t.case_type; }),
          datasets: [
            {
              data: tData.map(function (t) { return t.count; }),
              backgroundColor: colors,
              borderWidth: 3,
              borderColor: darkMode ? '#1F2937' : '#FFFFFF',
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: chartFontFamily, size: 11, weight: '500' },
                color: chartSlateGray,
                padding: 14,
                usePointStyle: true,
                pointStyle: 'circle',
                rtl: true,
                textAlign: 'right'
              }
            },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: darkMode ? '#F9FAFB' : '#1F2937',
              bodyColor: darkMode ? '#E5E7EB' : '#1F2937',
              borderColor: tooltipBorder,
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              boxPadding: 6,
              usePointStyle: true,
              titleFont: { family: chartFontFamily, size: 12, weight: '600' },
              bodyFont: { family: chartFontFamily, size: 11 },
              callbacks: {
                label: function (context) {
                  var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  var pct = Math.round((context.parsed / total) * 100);
                  return context.label + ': ' + context.parsed + ' (' + pct + '%)';
                }
              }
            }
          }
        }
      });
    } else {
      donutCtx.fillStyle = chartSlateGray;
      donutCtx.font = '12px Inter';
      donutCtx.textAlign = 'center';
      donutCtx.textBaseline = 'middle';
      donutCtx.fillText('—', donutCtx.canvas.width / 2, donutCtx.canvas.height / 2);
    }
  }
};

A.renderUpcomingWidget = async function () {
  const container = document.getElementById('dashUpcomingWidget');
  if (!container || !A.state.ipc) return;
  try {
    const [hearings, deadlines] = await Promise.all([A.cachedInvoke('db:getUpcomingHearings'), A.cachedInvoke('db:getUpcomingDeadlines')]);
    const items = [];
    (hearings || []).slice(0, 4).forEach(h =>
      items.push({
        icon: 'ri-scales-3-line',
        color: '#C6A15B',
        title: _t('hearingColon').replace('{n}', A.escapeHtml(h.case_number || '')),
        sub: h.date ? h.date.slice(0, 10) : '',
        time: h.days_remaining ? _t('remainingDays').replace('{n}', h.days_remaining) : ''
      })
    );
    (deadlines || []).slice(0, 3).forEach(d =>
      items.push({
        icon: 'ri-timer-flash-line',
        color: '#D94A4A',
        title: _t('deadlineColon').replace('{n}', A.escapeHtml(d.case_number || '')),
        sub: '',
        time: d.days_remaining ? _t('remainingDays').replace('{n}', d.days_remaining) : ''
      })
    );
    if (!items.length) {
      A.safeSetStatic(container, '<div class="dash-empty-modern"><div class="dash-empty-icon"><i class="ri-calendar-todo-line"></i></div><div class="dash-empty-label">' + _t('noUpcomingLabel') + '</div><button class="dash-empty-btn" data-click="nav:hearings"><i class="ri-add-line"></i> ' + _t('dashNewHearing') + '</button></div>');
      return;
    }
    items.sort((a, b) => parseInt(a.time, 10) - parseInt(b.time));
    A.safeSet(container, esc =>
      items
        .slice(0, 5)
        .map(
          i => `<div class="tl-item">
      <span class="tl-time">${esc(i.time)}</span>
      <div class="tl-icon" style="background:${i.color}15;color:${i.color};"><i class="${i.icon}"></i></div>
      <div class="tl-body"><div class="tl-title">${esc(i.title)}</div>${i.sub ? '<div class="tl-sub">' + esc(i.sub) + '</div>' : ''}</div>
    </div>`
        )
        .join('')
    );
  } catch (e) {
    A.logError('renderUpcomingWidget', e);
    A.showError(container, _t('failedLoad'), () => A.renderUpcomingWidget());
  }
};

A.renderUrgentTasks = function (tasks) {
  const container = document.getElementById('dashUrgentTasks');
  if (!container) return;
  const urgent = (tasks || []).filter(t => t.priority === 'high' && t.status !== 'done' && t.status !== 'archived').slice(0, 6);
  A.safeSet(container, esc =>
    urgent.length
      ? urgent
          .map(
            t => `<div class="tl-item">
        <span class="tl-time">${t.due_date ? esc(t.due_date.slice(0, 10)) : ''}</span>
        <div class="tl-icon" style="background:rgba(217,74,74,0.1);color:var(--destructive);"><i class="ri-error-warning-line"></i></div>
        <div class="tl-body"><div class="tl-title" style="color:var(--destructive);">${esc(t.title)}</div>
          <div class="tl-sub">${t.case_number ? esc(t.case_number) : ''}</div>
        </div>
      </div>`
          )
          .join('')
      : '<div class="dash-empty-modern"><div class="dash-empty-icon"><i class="ri-error-warning-line"></i></div><div class="dash-empty-label">' + _t('noUrgentTasks') + '</div><button class="dash-empty-btn" data-click="nav:tasks"><i class="ri-add-line"></i> ' + _t('addTask') + '</button></div>'
  );
};

A.loadActivityTimeline = async function () {
  const container = document.getElementById('dashActivityTimeline');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', {});
    const recent = (logs || []).slice(0, 5);
    if (!recent.length) {
      A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('noActivityLabel') + '</p>');
      return;
    }
    const iconMap = { ajout: 'ri-add-circle-line', modification: 'ri-edit-line', suppression: 'ri-delete-bin-line', default: 'ri-history-line' };
    const colorMap = { ajout: '#1A8A5C', modification: '#4A8BC2', suppression: '#D94A4A', default: '#8C8A84' };
    A.safeSet(container, esc =>
      recent
        .map(l => {
          const action = l.action || 'default';
          const time = l.created_at ? l.created_at.slice(11, 16) : '--:--';
          return `<div class="tl-item">
        <span class="tl-time">${time}</span>
        <div class="tl-icon" style="background:${colorMap[action] || colorMap.default}12;color:${colorMap[action] || colorMap.default};"><i class="${iconMap[action] || iconMap.default}"></i></div>
        <div class="tl-body"><div class="tl-title">${esc(l.details || '')}</div><div class="tl-sub">${l.created_at ? l.created_at.slice(0, 10) : ''}</div></div>
      </div>`;
        })
        .join('')
    );
  } catch (e) {
    A.logError('loadActivityTimeline', e);
    A.showError(container, _t('failedLoadActivity'), () => A.loadActivityTimeline());
  }
};

A.loadNotifications = async function () {
  const container = document.getElementById('dashNotifications');
  const badge = document.getElementById('dashNotifBadge');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', { limit: 6 });
    const recent = (logs || []).slice(0, 4);
    if (!recent.length) {
      A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>');
      if (badge) badge.textContent = '0';
      return;
    }
    A.safeSet(container, esc =>
      recent
        .map(
          l => `<div class="tl-item">
      <div class="tl-icon" style="background:var(--muted);color:var(--muted-foreground);"><i class="ri-notification-3-line"></i></div>
      <div class="tl-body"><div class="tl-title">${esc(l.details || '')}</div></div>
      <span class="tl-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
    </div>`
        )
        .join('')
    );
    if (badge) badge.textContent = recent.length;
  } catch (e) {
    A.logError('loadNotifications', e);
    A.showError(container, _t('failedLoadNotifications'), () => A.loadNotifications());
  }
};

A.renderRevenueLine = function (ext) {
  if (typeof Chart === 'undefined') return;
  if (A._revenueLine) {
    A._revenueLine.destroy();
    A._revenueLine = null;
  }
  var ctx = document.getElementById('revenueLineChart')?.getContext('2d');
  if (!ctx) return;
  var monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  var revData = ext.monthlyRevenue || [];
  var labels = revData.map(function (m) { return monthNames[parseInt(m.month, 10) - 1] || m.month; });
  var values = revData.map(function (m) { return parseFloat(m.total) || 0; });
  var darkMode = document.body.classList.contains('dark-mode');
  var tooltipBg = darkMode ? '#1F2937' : '#FFFFFF';
  var tooltipBorder = darkMode ? '#374151' : '#E8E7E5';
  var gridColor = darkMode ? 'rgba(140,138,132,0.1)' : 'rgba(140,138,132,0.15)';
  var chartFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-primary').trim() || "'Inter', sans-serif";
  if (values.length) {
    A._revenueLine = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: _t('revenueLabel'),
            data: values,
            borderColor: chartCorporateBlue,
            backgroundColor: function (context) {
              var chart = context.chart;
              var ctx2 = chart.ctx;
              var gradient = ctx2.createLinearGradient(0, 0, 0, chart.height);
              gradient.addColorStop(0, chartCorporateBlue + '30');
              gradient.addColorStop(1, chartCorporateBlue + '02');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: chartCorporateBlue,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: chartCorporateBlue,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: darkMode ? '#F9FAFB' : '#1F2937',
            bodyColor: darkMode ? '#E5E7EB' : '#1F2937',
            borderColor: tooltipBorder,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: { family: chartFontFamily, size: 12, weight: '600' },
            bodyFont: { family: chartFontFamily, size: 11 },
            callbacks: {
              label: function (context) {
                return context.parsed.y.toLocaleString() + ' درهم';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: chartSlateGray,
              font: { family: chartFontFamily, size: 10 },
              callback: function (v) {
                return v.toLocaleString();
              }
            }
          },
          x: { grid: { display: false }, ticks: { color: chartSlateGray, font: { family: chartFontFamily, size: 10 } } }
        }
      }
    });
  } else {
    ctx.fillStyle = chartSlateGray;
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('—', ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
};

A.renderTomorrowHearings = async function () {
  const container = document.getElementById('dashTomorrowList');
  if (!container || !A.state.ipc) return;
  try {
    const events = await A.cachedInvoke('events:getAll');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const hearingEvents = (events || []).filter(e => e.type === 'hearing' && e.date === dateStr && e.status !== 'cancelled');
    if (!hearingEvents.length) {
      A.safeSetStatic(container, '<span class="empty-state-sm" style="color:rgba(255,255,255,0.5);">' + _t('noTomorrowHearings') + '</span>');
      return;
    }
    A.safeSet(container, esc =>
      hearingEvents
        .map(
          e => `<div class="dash-tomorrow-item" data-click="nav:hearings">
      <span class="tt-time">${e.time ? esc(e.time.slice(0, 5)) : '--:--'}</span>
      <span class="tt-court">${esc(e.court || e.title || '')}</span>
    </div>`
        )
        .join('')
    );
  } catch (e) {
    A.logError('renderTomorrowHearings', e);
  }
};

A.initQuickActions = function () {
  document.querySelectorAll('.dash-empty-actions .btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const action = btn.dataset.action;
      if (action === 'client') {
        A.navigateTo('clients');
      } else if (action === 'case') {
        A.navigateTo('cases');
      } else if (action === 'task') {
        A.navigateTo('tasks');
      } else if (action === 'report') A.navigateTo('reports');
      else if (action === 'ai') A.navigateTo('ai');
    });
  });
};

A.initQuickActionsBar = function () {
  document.querySelectorAll('.qa-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var action = btn.dataset.action;
      if (action === 'client') {
        A.navigateTo('clients');
        var addBtn = document.getElementById('addClientBtn');
        if (addBtn) addBtn.click();
      } else if (action === 'case') {
        A.navigateTo('cases');
        var addBtn = document.getElementById('addCaseBtn');
        if (addBtn) addBtn.click();
      } else if (action === 'hearing') {
        A.navigateTo('hearings');
        var addBtn = document.getElementById('addHearingBtn');
        if (addBtn) addBtn.click();
      } else if (action === 'document') {
        A.navigateTo('documents');
      }
    });
  });
};

A.initKpiCardClicks = function () {
  const navMap = {
    kpiActiveCases: 'cases',
    kpiClients: 'clients',
    kpiHearings: 'hearings',
    kpiRevenue: 'reports',
    kpiTasks: 'tasks',
    kpiDocs: 'documents'
  };
  Object.entries(navMap).forEach(([id, section]) => {
    const card = document.getElementById(id);
    if (card) card.addEventListener('click', () => A.navigateTo(section));
  });
};
