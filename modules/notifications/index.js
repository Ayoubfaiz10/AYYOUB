var A = (window.App = window.App || {});

A.loadNotifications = async function () {
  const container = document.getElementById('dashNotifications');
  const badge = document.getElementById('dashNotifBadge');
  if (!container || !A.state.ipc) return;
  try {
    const [deadlines, hearings] = await Promise.all([
      A.cachedInvoke('db:getUpcomingDeadlines'),
      A.cachedInvoke('db:getUpcomingHearings')
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const urgentDeadlines = (deadlines || []).filter(d => (d.days_remaining || 0) <= 7).map(d => ({
      text: `⚖️ أجل قضية ${d.case_number} — ${d.days_remaining === 0 ? 'اليوم' : `بعد ${d.days_remaining} يوم`}`,
      time: d.deadline_date
    }));
    const urgentHearings = (hearings || []).filter(h => (h.days_remaining || 0) <= 3).map(h => ({
      text: `🗓️ جلسة ${h.case_number} — ${h.days_remaining === 0 ? 'اليوم' : `بعد ${h.days_remaining} يوم`}`,
      time: h.hearing_date
    }));
    const recent = [...urgentDeadlines, ...urgentHearings].slice(0, 6);
    if (!recent.length) {
      A.safeSetStatic(container, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>');
      if (badge) badge.textContent = '0';
      return;
    }
    A.safeSet(container, esc =>
      recent
        .map(
          l => `<div class="dash-notif-item">
      <div class="dash-notif-dot"></div>
      <span class="dash-notif-text">${esc(l.details || '')}</span>
      <span class="dash-notif-time">${l.created_at ? l.created_at.slice(11, 16) : ''}</span>
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

A.initNotifications = function () {
  document.getElementById('notifBtn')?.addEventListener('click', () => A.navigateTo('notifications'));
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    const container = document.getElementById('notificationsList');
    if (container) A.safeSetStatic(container, '<p class="empty-state">' + _t('notifNoNotifs') + '</p>');
  });
};
