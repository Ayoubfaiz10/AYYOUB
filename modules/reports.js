var A = (window.App = window.App || {});

A.initReports = function () {
  document.querySelectorAll('.report-card').forEach(card =>
    card.addEventListener('click', async () => {
      if (!A.state.ipc) return;
      const type = card.dataset.report;
      const titleEl = card.querySelector('h3');
      const title = titleEl ? titleEl.textContent : _t('report');
      const titleContainer = document.getElementById('reportTitle');
      const contentEl = document.getElementById('reportContent');
      const outputEl = document.getElementById('reportOutput');
      if (!titleContainer || !contentEl || !outputEl) return;
      titleContainer.textContent = title;
      contentEl.innerHTML = '<div style="text-align:center;padding:40px;"><i class="ri-loader-4-line" style="font-size:24px;animation:spin 1s linear infinite;display:inline-block;"></i><p style="color:var(--muted-foreground);margin-top:8px;">' + _t('loading') + '</p></div>';
      outputEl.style.display = 'block';
      try {
        const cases = (await A.cachedInvoke('db:getAllCases')) || [];
        const chartData = (await A.cachedInvoke('db:getChartData')) || { statuses: [], fees: { total: 0, paid: 0, expenses: 0 }, monthly: [], courts: [] };
        const clients = (await A.cachedInvoke('db:getAllClients')) || [];
        const esc = A.escapeHtml;
        let html = '';
        if (type === 'cases') {
          const statuses = chartData.statuses || [];
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${statuses.find(s => s.status === 'active')?.count || 0}</span><span class="stat-label">${_t('activeF')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${statuses.find(s => s.status === 'pending')?.count || 0}</span><span class="stat-label">${_t('pendingF')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${statuses.find(s => s.status === 'closed')?.count || 0}</span><span class="stat-label">${_t('closedF')}</span></div></div>
        </div><p style="margin-top:var(--spacing-3);color:var(--muted-foreground);">${_t('totalCasesN').replace('{n}', cases.length)}</p>`;
          if (chartData.courts && chartData.courts.length) {
            html += '<div style="margin-top:var(--spacing-4);"><h4 style="margin-bottom:var(--spacing-2);">' + _t('topCourts') + '</h4>';
            chartData.courts.forEach(c => { html += `<div style="display:flex;justify-content:space-between;padding:var(--spacing-1-5) 0;border-bottom:1px solid var(--border);font-size:var(--type-caption);"><span>${esc(c.court)}</span><span style="font-weight:600;">${c.count}</span></div>`; });
            html += '</div>';
          }
        } else if (type === 'clients') {
          const withCases = clients.filter(c => c.cases_count > 0);
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${clients.length}</span><span class="stat-label">${_t('totalClientsN').replace('{n}', '')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${withCases.length}</span><span class="stat-label">${_t('withCases')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${clients.length - withCases.length}</span><span class="stat-label">${_t('withoutCases')}</span></div></div>
        </div>`;
        } else if (type === 'hearings') {
          let allEvents = (await A.cachedInvoke('events:getAll')) || [];
          const today = A.todayLocal();
          const upcoming = allEvents.filter(e => e.date >= today && e.status !== 'cancelled');
          const past = allEvents.filter(e => e.date < today && e.status !== 'cancelled');
          const hearings = upcoming.filter(e => e.type === 'hearing');
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${upcoming.length}</span><span class="stat-label">${_t('hearingsUpcoming')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${hearings.length}</span><span class="stat-label">${_t('upcomingHearings')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${past.length}</span><span class="stat-label">${_t('hearingsPast')}</span></div></div>
        </div>`;
          if (upcoming.length) {
            html += '<div style="margin-top:var(--spacing-4);"><h4 style="margin-bottom:var(--spacing-2);">' + _t('nearestHearings') + '</h4>';
            upcoming.slice(0, 5).forEach(e => {
              html += `<div style="display:flex;justify-content:space-between;padding:var(--spacing-1-5) 0;border-bottom:1px solid var(--border);font-size:var(--type-caption);"><span>${esc(e.date)} — ${esc(e.title)}</span><span style="color:var(--muted-foreground);">${esc(e.case_number || '')}</span></div>`;
            });
            html += '</div>';
          }
        } else if (type === 'financial') {
          const fees = chartData.fees || { total: 0, paid: 0, expenses: 0 };
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.total || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalHonoraires')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.paid || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalPaid')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.expenses || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalExpenses')}</span></div></div>
        </div>`;
          if (chartData.monthly && chartData.monthly.length) {
            html += '<div style="margin-top:var(--spacing-4);"><h4 style="margin-bottom:var(--spacing-2);">' + _t('casesMonthly') + '</h4>';
            chartData.monthly.forEach(m => {
              const mn = chartData.monthNames ? chartData.monthNames[parseInt(m.month, 10) - 1] || m.month : m.month;
              html += `<div style="display:flex;justify-content:space-between;padding:var(--spacing-1-5) 0;border-bottom:1px solid var(--border);font-size:var(--type-caption);"><span>${mn}</span><span style="font-weight:600;">${m.count}</span></div>`;
            });
            html += '</div>';
          }
        } else if (type === 'tasks') {
          const taskStats = (await A.cachedInvoke('db:getTaskAnalytics')) || { total: 0, completedThisWeek: 0, overdue: 0, byStatus: {} };
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${taskStats.total || 0}</span><span class="stat-label">${_t('totalTasksLabel')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number" style="color:${taskStats.overdue > 0 ? 'var(--destructive)' : 'var(--success)'};">${taskStats.overdue || 0}</span><span class="stat-label">${_t('overdueAnalyticsLabel')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${taskStats.completedThisWeek || 0}</span><span class="stat-label">${_t('completedThisWeekLabel')}</span></div></div>
        </div>`;
        } else if (type === 'monthly') {
          html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${cases.length}</span><span class="stat-label">${_t('totalCasesAnalytics')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${clients.length}</span><span class="stat-label">${_t('totalClientsLabel')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${cases.filter(c => c.status === 'active').length}</span><span class="stat-label">${_t('dashActiveCases')}</span></div></div>
        </div>`;
          if (chartData.monthly && chartData.monthly.length) {
            html += '<div style="margin-top:var(--spacing-4);"><h4 style="margin-bottom:var(--spacing-2);">' + _t('casesMonthlyDistribution') + '</h4>';
            chartData.monthly.forEach(m => {
              const mn = chartData.monthNames ? chartData.monthNames[parseInt(m.month, 10) - 1] || m.month : m.month;
              html += `<div style="display:flex;justify-content:space-between;padding:var(--spacing-1-5) 0;border-bottom:1px solid var(--border);font-size:var(--type-caption);"><span>${mn}</span><span style="font-weight:600;">${m.count}</span></div>`;
            });
            html += '</div>';
          }
        }
        A.safeSetStatic(contentEl, html);
      } catch (e) {
        A.logError('initReports', e);
        A.safeSetStatic(contentEl, '<div class="error-state"><p>' + _t('failedLoadReport') + '</p></div>');
      }
    })
  );

  document.getElementById('exportReportPdf')?.addEventListener('click', () => A.showToast(_t('pdfExportComing'), 'info'));
};
