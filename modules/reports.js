var A = window.App = window.App || {};

A.initReports = function() {
  document.querySelectorAll('.report-card').forEach(card => card.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const type = card.dataset.report;
    const titleEl = card.querySelector('h3');
    const title = titleEl ? titleEl.textContent : _t('report');
    const titleContainer = document.getElementById('reportTitle');
    const contentEl = document.getElementById('reportContent');
    const outputEl = document.getElementById('reportOutput');
    if (!titleContainer || !contentEl || !outputEl) return;
    titleContainer.textContent = title;
    try {
      const cases = await A.cachedInvoke('db:getAllCases') || [];
      const chartData = await A.cachedInvoke('db:getChartData') || { statuses: [], fees: { total: 0, paid: 0, expenses: 0 }, monthly: [], courts: [] };
      const clients = await A.cachedInvoke('db:getAllClients') || [];
      let html = '';
      if (type === 'cases') {
        const statuses = chartData.statuses || [];
        html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'active')?.count) || 0}</span><span class="stat-label">${_t('activeF')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'pending')?.count) || 0}</span><span class="stat-label">${_t('pendingF')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'closed')?.count) || 0}</span><span class="stat-label">${_t('closedF')}</span></div></div>
        </div><p>${_t('totalCasesN').replace('{n}', cases.length)}</p>`;
      } else if (type === 'financial') {
        const fees = chartData.fees || { total: 0, paid: 0, expenses: 0 };
        html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.total || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalHonoraires')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.paid || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalPaid')}</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.expenses || 0).toFixed(2)}</span><span class="stat-label">${_t('expTotalExpenses')}</span></div></div>
        </div>`;
      } else {
        html = `<p>${_t('totalCasesN').replace('{n}', cases.length)}</p><p>${_t('totalClientsN').replace('{n}', clients.length)}</p>`;
      }
      A.safeSetStatic(contentEl, html);
      outputEl.style.display = 'block';
    } catch (e) {
      A.logError('initReports', e);
      A.safeSetStatic(contentEl, '<div class="error-state"><p>' + _t('failedLoadReport') + '</p></div>');
      outputEl.style.display = 'block';
    }
  }));

  document.getElementById('exportReportPdf')?.addEventListener('click', () => A.showToast(_t('pdfExportComing'), 'info'));
};
