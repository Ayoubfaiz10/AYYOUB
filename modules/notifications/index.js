var A = (window.App = window.App || {});

var NOTIF_DISMISS_KEY = 'lexoffece_dismissed_notifs';
var NOTIF_DISMISS_TTL = 24 * 60 * 60 * 1000;

function getDismissedNotifs() {
  try {
    var raw = localStorage.getItem(NOTIF_DISMISS_KEY);
    if (!raw) return {};
    var obj = JSON.parse(raw);
    var now = Date.now();
    var cleaned = {};
    for (var k in obj) {
      if (obj[k] && now - obj[k] < NOTIF_DISMISS_TTL) cleaned[k] = obj[k];
    }
    localStorage.setItem(NOTIF_DISMISS_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch (e) { return {}; }
}

function dismissNotif(key) {
  var obj = getDismissedNotifs();
  obj[key] = Date.now();
  localStorage.setItem(NOTIF_DISMISS_KEY, JSON.stringify(obj));
}

function dismissAllCurrent() {
  var items = document.querySelectorAll('#dashNotifications .dash-notif-item, #notificationsList .dash-notif-item');
  items.forEach(function (el) {
    var key = el.getAttribute('data-notif-key');
    if (key) dismissNotif(key);
  });
}

A.loadNotifications = async function () {
  const dashContainer = document.getElementById('dashNotifications');
  const sectionContainer = document.getElementById('notificationsList');
  const badge = document.getElementById('dashNotifBadge');
  const navBadge = document.getElementById('notifBadge');
  if ((!dashContainer && !sectionContainer) || !A.state.ipc) return;
  try {
    const [deadlines, hearings] = await Promise.all([
      A.cachedInvoke('db:getUpcomingDeadlines'),
      A.cachedInvoke('db:getUpcomingHearings')
    ]);
    const esc = A.escapeHtml || (s => s);
    const dismissed = getDismissedNotifs();

    const urgentDeadlines = (deadlines || []).filter(d => (d.days_remaining || 0) <= 7).map(d => {
      const key = 'deadline-' + d.case_id;
      const dayText = d.days_remaining <= 0 ? _t('notifTodayText') : _t('notifAfterDays').replace('{n}', d.days_remaining);
      const label = _t('notifDeadlineFormat').replace('{case}', esc(d.case_number || '')).replace('{text}', esc(dayText));
      return { key, icon: 'ri-scales-line', label, time: d.deadline_date };
    });
    const urgentHearings = (hearings || []).filter(h => (h.days_remaining || 0) <= 3).map(h => {
      const key = 'hearing-' + h.id;
      const dayText = h.days_remaining <= 0 ? _t('notifTodayText') : _t('notifAfterDays').replace('{n}', h.days_remaining);
      const label = _t('notifHearingFormat').replace('{case}', esc(h.case_number || '')).replace('{text}', esc(dayText));
      return { key, icon: 'ri-calendar-event-line', label, time: h.hearing_date };
    });

    const visible = [...urgentDeadlines, ...urgentHearings].filter(function (n) { return !dismissed[n.key]; }).slice(0, 6);

    if (!visible.length) {
      if (dashContainer) A.safeSetStatic(dashContainer, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>');
      if (sectionContainer) A.safeSetStatic(sectionContainer, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>');
      if (badge) badge.textContent = '0';
      if (navBadge) { navBadge.textContent = '0'; navBadge.style.display = 'none'; }
      return;
    }

    function renderNotifItem(l) {
      return '<div class="dash-notif-item" data-notif-key="' + esc(l.key) + '"><div class="dash-notif-dot"></div><span class="dash-notif-text"><i class="' + l.icon + '"></i> ' + l.label + '</span><span class="dash-notif-time">' + (l.time ? l.time.slice(5, 10) : '') + '</span></div>';
    }

    if (dashContainer) {
      A.safeSetStatic(dashContainer, visible.slice(0, 6).map(renderNotifItem).join(''));
    }
    if (sectionContainer) {
      A.safeSetStatic(sectionContainer, visible.map(renderNotifItem).join(''));
    }

    if (badge) badge.textContent = visible.length;
    if (navBadge) { navBadge.textContent = visible.length; navBadge.style.display = 'inline-flex'; }
  } catch (e) {
    A.logError('loadNotifications', e);
    if (dashContainer) A.showError(dashContainer, _t('failedLoadNotifications'), () => A.loadNotifications());
    if (sectionContainer) A.showError(sectionContainer, _t('failedLoadNotifications'), () => A.loadNotifications());
  }
};

A.initNotifications = function () {
  document.getElementById('notifBtn')?.addEventListener('click', () => A.navigateTo('notifications'));
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    dismissAllCurrent();
    A.loadNotifications();
  });
};
