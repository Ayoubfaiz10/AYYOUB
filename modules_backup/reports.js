window.App = window.App || {};
const A = window.App;

A.initReports = function() {
  document.querySelectorAll('.report-card').forEach(card => card.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const type = card.dataset.report;
    const titleEl = card.querySelector('h3');
    const title = titleEl ? titleEl.textContent : 'تقرير';
    const titleContainer = document.getElementById('reportTitle');
    const contentEl = document.getElementById('reportContent');
    const outputEl = document.getElementById('reportOutput');
    if (!titleContainer || !contentEl || !outputEl) return;
    titleContainer.textContent = title;
    try {
      const cases = await A.cachedInvoke('db:getAllCases') || [];
      const chartData = await A.cachedInvoke('db:getChartData') || { statuses: [], fees: { total: 0, paid: 0, expenses: 0 }, monthly: [], courts: [] };
      let html = '';
      if (type === 'cases') {
        const statuses = chartData.statuses || [];
        html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'active')?.count) || 0}</span><span class="stat-label">نشطة</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'pending')?.count) || 0}</span><span class="stat-label">معلقة</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(statuses.find(s => s.status === 'closed')?.count) || 0}</span><span class="stat-label">مغلقة</span></div></div>
        </div><p>إجمالي القضايا: ${cases.length}</p>`;
      } else if (type === 'financial') {
        const fees = chartData.fees || { total: 0, paid: 0, expenses: 0 };
        html = `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.total || 0).toFixed(2)}</span><span class="stat-label">إجمالي الأتعاب</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.paid || 0).toFixed(2)}</span><span class="stat-label">المدفوع</span></div></div>
          <div class="stat-card"><div class="stat-body"><span class="stat-number">${(fees.expenses || 0).toFixed(2)}</span><span class="stat-label">المصروفات</span></div></div>
        </div>`;
      } else {
        html = `<p>إجمالي القضايا: ${cases.length}</p><p>إجمالي الموكلين: ${(chartData.statuses || []).reduce((s, x) => s + (x.count || 0), 0)}</p>`;
      }
      A.safeSetStatic(contentEl, html);
      outputEl.style.display = 'block';
    } catch (e) {
      A.logError('initReports', e);
      A.safeSetStatic(contentEl, '<div class="error-state"><p>تعذر تحميل بيانات التقرير</p></div>');
      outputEl.style.display = 'block';
    }
  }));

  document.getElementById('exportReportPdf')?.addEventListener('click', () => A.showToast('تصدير PDF سيكون متاحاً في التحديث القادم', 'info'));
};
