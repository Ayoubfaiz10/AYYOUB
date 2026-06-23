var A = window.App = window.App || {};

A.state.quotes = [
  '"العدالة أساس الملك"', '"الحق فوق القوة"', '"القانون سلاح الضعفاء"', '"العدل أساس العمران"',
  '"من حكم بين الناس بالعدل فهو في ذمة الله"', '"القاضي العادل يُحيي الأرض"', '"العدل حياة القلوب"'
];

A.state.dashboardCache = null;
A.state.dashboardCacheTime = null;
const DASHBOARD_CACHE_DURATION = 30000;

A.loadDashboard = async function(force = false) {
  if (!A.state.ipc) return;
  const now = Date.now();
  if (!force && A.state.dashboardCache && A.state.dashboardCacheTime && (now - A.state.dashboardCacheTime) < DASHBOARD_CACHE_DURATION) {
    A.renderDashboard(A.state.dashboardCache);
    return;
  }
  A.showSkeleton('recentCases', 3, 'card');
  A.showSkeleton('dashPriorityCases', 2, 'card');
  A.showSkeleton('recentDocs', 3, 'docCard');
  A.showSkeleton('dashPendingTasks', 3, 'card');
  A.showSkeleton('todayAgenda', 3, 'calEvent');
  A.showSkeleton('dashUpcomingDeadlines', 2, 'card');
  A.showSkeleton('dashActivityTimeline', 3, 'card');
  try {
    const [stats, casesList, clients, chartData, tasks] = await Promise.all([
      A.cachedInvoke('db:getDashboardStats'),
      A.cachedInvoke('db:getAllCases'),
      A.cachedInvoke('db:getAllClients'),
      A.cachedInvoke('db:getChartData'),
      A.cachedInvoke('db:getAllTasks')
    ]);
    A.state.dashboardCache = { stats, cases: casesList, clients, chartData, tasks };
    A.state.dashboardCacheTime = now;
    A.renderDashboard(A.state.dashboardCache);
  } catch (e) {
    A.logError('loadDashboard', e);
    const mainContent = document.querySelector('.dash-main-content') || document.getElementById('section-dashboard');
    if (mainContent) A.showError(mainContent, _t('failedLoadDashboard'), () => A.loadDashboard(true));
  }
};

A.loadNotifications = async function() {
  const container = document.getElementById('dashNotifications');
  const badge = document.getElementById('dashNotifBadge');
  if (!container || !A.state.ipc) return;
  try {
    const logs = await A.cachedInvoke('db:getLogs', { limit: 6 });
    const recent = (logs || []).slice(0, 4);
    if (!recent.length) { A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>'); if (badge) badge.textContent = '0'; return; }
    A.safeSet(container, esc => recent.map(l => `<div class="dash-notif-item">
      <div class="dash-notif-dot"></div>
      <span class="dash-notif-text">${esc(l.details || '')}</span>
      <span class="dash-notif-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
    </div>`).join(''));
    if (badge) badge.textContent = recent.length;
  } catch (e) { A.logError('loadNotifications', e); A.showError(container, _t('failedLoadNotifications'), () => A.loadNotifications()); }
};

A.initDashboard = function() {
  // Dashboard event listeners are set up at render time via initQuickActions
};

window.loadDashboard = A.loadDashboard;
window.loadAiInsights = A.loadSmartInsights;
