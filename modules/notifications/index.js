var A = window.App = window.App || {};

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

A.initNotifications = function() {
  document.getElementById('notifBtn')?.addEventListener('click', () => A.navigateTo('notifications'));
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    const container = document.getElementById('notificationsList');
    if (container) A.safeSetStatic(container, '<p class="empty-state">' + _t('notifNoNotifs') + '</p>');
  });
};
