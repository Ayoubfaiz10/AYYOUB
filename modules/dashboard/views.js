var A = (window.App = window.App || {});

const chartGold = '#c6a15b';
const chartGoldLight = '#d9ba62';
const chartGoldDark = '#a8883e';
const chartGoldAccent = '#e5ce87';
const chartSlateGray = '#475569';

A.renderDashboard = function (data) {
  const { stats, ext, cases: casesList, clients, chartData } = data;
  const safeCases = casesList || [];
  const safeClients = clients || [];
  const safeExt = ext || {};
  const hasData = safeCases.length > 0 || safeClients.length > 0;
  const emptyState = document.getElementById('dashEmptyState');
  const welcomeRow = document.getElementById('dashWelcomeRow');
  if (emptyState) {
    emptyState.style.display = hasData ? 'none' : 'block';
    if (welcomeRow) welcomeRow.style.display = hasData ? '' : 'none';
  }
  A.renderWelcomeHeader(safeCases.length);
  A.renderKpiCards(stats, safeExt, safeCases, safeClients, chartData);
  const chartFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-primary').trim() || "'Inter', sans-serif";
  A.renderChartRow(chartData, safeExt, chartFontFamily);
  A.loadActivityTimeline();
  A.loadNotifications();
  A.renderRevenueLine(safeExt, chartFontFamily);
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
  let userName = _t('defaultLawyer');
  if (A.state.ipc) {
    A.state.ipc.invoke('auth:getCurrentUser').then(function (user) {
      if (user && user.name) userName = user.name;
      if (avatarEl) avatarEl.textContent = userName.charAt(0);
      if (userEl) {
        userEl.textContent = _t('greetingHello').replace('{name}', userName);
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
  let subEl = welcomeRow ? welcomeRow.querySelector('.dash-greeting-sub') : null;
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
      const hearings = results[0] || [];
      const deadlines = results[1] || [];
      const weekCount = hearings.filter(function (h) { return h.days_remaining <= 7; }).length;
      const todayCount = deadlines.filter(function (d) { return d.days_remaining <= 1; }).length;
      const parts = [];
      if (weekCount > 0) {
        const hText = weekCount === 1 ? _t('weekOneHearing') : _t('weekHearings').replace('{n}', weekCount);
        parts.push(hText);
      }
      if (todayCount > 0) {
        const dText = todayCount === 1 ? _t('todayOneFollowUp') : _t('todayTwoFollowUp');
        parts.push(dText);
      }
      subEl.textContent = parts.length ? parts.join(' ' + _t('and') + ' ') : _t('welcomeDashboard');
    }).catch(function () {
      subEl.textContent = _t('welcomeDashboard');
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

  const _kpiEls = {
    numActiveCases: document.getElementById('kpiNumActiveCases'),
    trendActiveCases: document.getElementById('kpiTrendActiveCases'),
    numClients: document.getElementById('kpiNumClients'),
    trendClients: document.getElementById('kpiTrendClients'),
    numHearings: document.getElementById('kpiNumHearings'),
    trendHearings: document.getElementById('kpiTrendHearings'),
    numRevenue: document.getElementById('kpiNumRevenue'),
    trendRevenue: document.getElementById('kpiTrendRevenue'),
    numTasks: document.getElementById('kpiNumTasks'),
    trendTasks: document.getElementById('kpiTrendTasks'),
    numDocs: document.getElementById('kpiNumDocs'),
    trendDocs: document.getElementById('kpiTrendDocs')
  };
  A.setKpi(_kpiEls.numActiveCases, activeCases, _kpiEls.trendActiveCases, ext.trend?.activeCasesNow, ext.trend?.activeCasesPrev);
  A.setKpi(_kpiEls.numClients, totalClients, _kpiEls.trendClients, ext.trend?.clientsNow, ext.trend?.clientsPrev);
  A.setKpi(_kpiEls.numHearings, thisWeekHearings, _kpiEls.trendHearings, ext.trend?.hearingsNow, ext.trend?.hearingsPrev);
  A.setKpi(_kpiEls.numRevenue, totalRevenue.toLocaleString() + _t('currencyMAD'), _kpiEls.trendRevenue, ext.trend?.revenueNow, ext.trend?.revenuePrev);
  A.setKpi(_kpiEls.numTasks, pendingTasksCount, _kpiEls.trendTasks, ext.trend?.tasksNow, ext.trend?.tasksPrev, true);
  A.setKpi(_kpiEls.numDocs, totalDocs || 0, _kpiEls.trendDocs, ext.trend?.docsNow, ext.trend?.docsPrev);

  A.renderSparklines(chartData, ext);
};

A.renderSparklines = function (chartData, ext) {
  if (typeof Chart === 'undefined') return;
  const darkMode = document.body.classList.contains('dark-mode');
  const lineColor = darkMode ? 'rgba(198,161,91,0.6)' : 'rgba(198,161,91,0.7)';
  const fillColor = darkMode ? 'rgba(198,161,91,0.08)' : 'rgba(198,161,91,0.06)';

  const _sparkCtx = {
    activeCases: document.getElementById('sparkActiveCases')?.getContext('2d'),
    clients: document.getElementById('sparkClients')?.getContext('2d'),
    hearings: document.getElementById('sparkHearings')?.getContext('2d'),
    revenue: document.getElementById('sparkRevenue')?.getContext('2d')
  };

  const monthly = chartData.monthly || [];
  const revData = ext.monthlyRevenue || [];

  if (A._sparkCharts) A._sparkCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
  A._sparkCharts = [];

  function drawSpark(ctx, data, color) {
    if (!ctx || !data.length) return;
    A._sparkCharts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(function (_, i) { return i; }),
        datasets: [{
          data: data,
          borderColor: color || lineColor,
          backgroundColor: fillColor,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        },
        elements: { point: { radius: 0 } }
      }
    }));
  }

  const spColor = darkMode ? 'rgba(198,161,91,0.5)' : 'rgba(198,161,91,0.6)';
  if (monthly.length) {
    drawSpark(_sparkCtx.activeCases, monthly.map(function (m) { return m.count; }), spColor);
  }
  if (ext.trend && ext.trend.clientsNow !== undefined) {
    const synthClients = [];
    for (var i = 0; i < 8; i++) {
      synthClients.push(Math.max(0, Math.round((ext.trend.clientsNow || 0) * (0.7 + Math.random() * 0.6))));
    }
    drawSpark(_sparkCtx.clients, synthClients, spColor);
  }
  if (ext.trend && ext.trend.hearingsNow !== undefined) {
    const synthHearings = [];
    for (var i = 0; i < 8; i++) {
      synthHearings.push(Math.max(0, Math.round((ext.trend.hearingsNow || 0) * (0.7 + Math.random() * 0.6))));
    }
    drawSpark(_sparkCtx.hearings, synthHearings, spColor);
  }
  if (revData.length) {
    drawSpark(_sparkCtx.revenue, revData.map(function (m) { return parseFloat(m.total) || 0; }), spColor);
  }
};

A.setKpi = function (numEl, value, trendEl, now, prev, invertBad) {
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

A.renderChartRow = function (chartData, ext, chartFontFamily) {
  if (typeof Chart === 'undefined') return;
  if (A._casesBarChart) {
    A._casesBarChart.destroy();
    A._casesBarChart = null;
  }
  if (A._typeDonut) {
    A._typeDonut.destroy();
    A._typeDonut = null;
  }

  chartFontFamily = chartFontFamily || getComputedStyle(document.documentElement).getPropertyValue('--font-primary').trim() || "'Inter', sans-serif";
  if (!A.MONTH_NAMES) {
    A.MONTH_NAMES = A.getMonthNames();
  }
  const monthNames = A.MONTH_NAMES;

  const darkMode = document.body.classList.contains('dark-mode');
  const gridColor = darkMode ? 'rgba(140,138,132,0.1)' : 'rgba(140,138,132,0.15)';
  const tooltipBg = darkMode ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#374151' : '#E8E7E5';

  // Left: Cases by Month (bar)
  const barCtx = document.getElementById('casesBarChart')?.getContext('2d');
  if (barCtx) {
    const monthly = chartData.monthly || [];
    const labels = monthly.map(function (m) { return monthNames[parseInt(m.month, 10) - 1] || m.month; });
    const values = monthly.map(function (m) { return m.count; });
    if (values.length) {
      const barGradient = barCtx.createLinearGradient(0, 0, 0, 280);
      barGradient.addColorStop(0, chartGold);
      barGradient.addColorStop(0.5, chartGoldLight);
      barGradient.addColorStop(1, chartGoldDark);
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
  const donutCtx = document.getElementById('typeDoughnutChart')?.getContext('2d');
  if (donutCtx) {
    const tData = ext.casesByType || [];
    const typeColors = { 'مدني': chartGold, 'تجاري': chartGoldLight, 'أسرة': chartGoldAccent, 'إداري': '#64748B', 'جنائي': '#94A3B8' };
    const defaultColors = [chartGold, chartGoldLight, chartGoldAccent, chartGoldDark, '#64748B', '#94A3B8', '#6B7280'];
    const colors = tData.map(function (t) { return typeColors[t.case_type] || defaultColors[tData.indexOf(t) % defaultColors.length]; });
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
                  const total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  const pct = Math.round((context.parsed / total) * 100);
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
    const colorMap = { ajout: '#C6A15B', modification: '#d9ba62', suppression: '#D94A4A', default: '#8C8A84' };
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

A.renderRevenueLine = function (ext, chartFontFamily) {
  if (typeof Chart === 'undefined') return;
  if (A._revenueLine) {
    A._revenueLine.destroy();
    A._revenueLine = null;
  }
  const ctx = document.getElementById('revenueLineChart')?.getContext('2d');
  if (!ctx) return;
  chartFontFamily = chartFontFamily || getComputedStyle(document.documentElement).getPropertyValue('--font-primary').trim() || "'Inter', sans-serif";
  const monthNames = A.MONTH_NAMES || A.getMonthNames();
  const revData = ext.monthlyRevenue || [];
  const labels = revData.map(function (m) { return monthNames[parseInt(m.month, 10) - 1] || m.month; });
  const values = revData.map(function (m) { return parseFloat(m.total) || 0; });
  const darkMode = document.body.classList.contains('dark-mode');
  const tooltipBg = darkMode ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = darkMode ? '#374151' : '#E8E7E5';
  const gridColor = darkMode ? 'rgba(140,138,132,0.1)' : 'rgba(140,138,132,0.15)';
  if (values.length) {
    A._revenueLine = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: _t('revenueLabel'),
            data: values,
            borderColor: chartGold,
            backgroundColor: function (context) {
              const chart = context.chart;
              const ctx2 = chart.ctx;
              const gradient = ctx2.createLinearGradient(0, 0, 0, chart.height);
              gradient.addColorStop(0, chartGold + '30');
              gradient.addColorStop(1, chartGold + '02');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: chartGold,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: chartGold,
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
                return context.parsed.y.toLocaleString() + _t('currencyMAD');
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
      const action = btn.dataset.action;
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
