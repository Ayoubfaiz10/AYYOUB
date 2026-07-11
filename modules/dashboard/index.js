var A = (window.App = window.App || {});

A.state.quotes = [
  _t('quote1'),
  _t('quote2'),
  _t('quote3'),
  _t('quote4'),
  _t('quote5'),
  _t('quote6'),
  _t('quote7')
];

A.state.dashboardCache = null;
A.state.dashboardCacheTime = null;
const DASHBOARD_CACHE_DURATION = 30000;

A.loadDashboard = async function (force = false) {
  if (!A.state.ipc) return;
  const now = Date.now();
  if (!force && A.state.dashboardCache && A.state.dashboardCacheTime && now - A.state.dashboardCacheTime < DASHBOARD_CACHE_DURATION) {
    A.renderDashboard(A.state.dashboardCache);
    return;
  }
  A.showSkeleton('dashUpcomingWidget', 3, 'calEvent');
  A.showSkeleton('dashUrgentTasks', 3, 'card');
  A.showSkeleton('dashActivityTimeline', 3, 'card');
  try {
    const [stats, extStats, casesList, clients, chartData, tasks] = await Promise.all([
      A.cachedInvoke('db:getDashboardStats'),
      A.cachedInvoke('db:getDashboardExtendedStats'),
      A.cachedInvoke('db:getAllCases'),
      A.cachedInvoke('db:getAllClients'),
      A.cachedInvoke('db:getChartData'),
      A.cachedInvoke('db:getAllTasks')
    ]);
    A.state.dashboardCache = { stats, ext: extStats, cases: casesList, clients, chartData, tasks };
    A.state.dashboardCacheTime = now;
    A.renderDashboard(A.state.dashboardCache);
  } catch (e) {
    A.logError('loadDashboard', e);
    const mainContent = document.querySelector('.dash-main-content') || document.getElementById('section-dashboard');
    if (mainContent) A.showError(mainContent, _t('failedLoadDashboard'), () => A.loadDashboard(true));
  }
};

A.initDashboard = function () {
  // Dashboard event listeners are set up at render time via initQuickActions
};

window.loadDashboard = A.loadDashboard;
window.loadAiInsights = A.loadSmartInsights;
