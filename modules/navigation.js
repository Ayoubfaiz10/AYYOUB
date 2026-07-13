var A = (window.App = window.App || {});

A.state.navItems = null;
A.state.sections = null;
A.state.loadedSections = new Set();

var ROLE_ACCESS = {
  admin: [
    'dashboard',
    'search',
    'notifications',
    'clients',
    'cases',
    'hearings',
    'documents',
    'calendar',
    'tasks',
    'expenses',
    'reports',
    'ai',
    'archive',
    'help',
    'settings',
    'profile'
  ],
  senior_lawyer: [
    'dashboard',
    'search',
    'notifications',
    'clients',
    'cases',
    'hearings',
    'documents',
    'calendar',
    'tasks',
    'expenses',
    'reports',
    'ai',
    'archive',
    'profile'
  ],
  junior_lawyer: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'ai', 'help', 'profile'],
  assistant: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'help', 'profile'],
  intern: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'tasks', 'help', 'profile'],
  external: ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'help', 'profile']
};
A.ROLE_ACCESS = ROLE_ACCESS;
A.SECTIONS = ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'expenses', 'reports', 'ai', 'archive', 'help', 'settings', 'profile'];

A.canAccess = function (sectionId) {
  const role = (A.state.currentUser && A.state.currentUser.role) || 'admin';
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.admin;
  return allowed.indexOf(sectionId) !== -1;
};

A.applyRoleRestrictions = function () {
  if (!A.state.navItems) return;
  const role = (A.state.currentUser && A.state.currentUser.role) || 'admin';
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.admin;
  A.state.navItems.forEach(function (item) {
    const section = item.dataset.section;
    if (section && allowed.indexOf(section) === -1) {
      item.style.display = 'none';
    } else {
      item.style.display = '';
    }
  });
};

A.navigateTo = function (sectionId) {
  if (!A.state.navItems || !A.state.sections || !sectionId) return;
  if (!A.canAccess(sectionId)) {
    A.navigateTo('dashboard');
    return;
  }
  A.state.navItems.forEach(function (n) {
    n.classList.remove('active');
  });
  A.state.sections.forEach(function (s) {
    s.classList.remove('active');
  });
  const tn = document.querySelector('.nav-item[data-section="' + sectionId + '"]');
  const ts = document.getElementById('section-' + sectionId);
  if (tn) tn.classList.add('active');
  if (ts) ts.classList.add('active');
  A.updateBreadcrumbs(sectionId);
  document.querySelectorAll('.search-results').forEach(function (r) {
    r.style.display = 'none';
  });
  if (A.state.ipc) {
    if (!A.state.loadedSections.has(sectionId)) {
      A.state.loadedSections.add(sectionId);
    }
    if (!A.state.initedSections) A.state.initedSections = new Set();
    function lazyInit(name) {
      if (!A.state.initedSections.has(name)) {
        A.state.initedSections.add(name);
        var fn = A['init' + name.charAt(0).toUpperCase() + name.slice(1)];
        if (typeof fn === 'function') fn();
      }
    }
    if (sectionId === 'dashboard' && typeof A.loadDashboard === 'function') A.loadDashboard();
    else if (sectionId === 'clients' && typeof A.loadClients === 'function') A.loadClients();
    else if (sectionId === 'cases' && typeof A.loadCases === 'function') A.loadCases();
    else if (sectionId === 'hearings' && typeof A.loadHearings === 'function') A.loadHearings();
    else if (sectionId === 'tasks') { lazyInit('tasks'); if (typeof A.loadTasks === 'function') A.loadTasks(); }
    else if (sectionId === 'documents' && typeof A.loadDocuments === 'function') A.loadDocuments();
    else if (sectionId === 'expenses' && typeof A.loadExpenses === 'function') A.loadExpenses();
    else if (sectionId === 'calendar') { lazyInit('calendar'); if (typeof A.loadCalendar === 'function') A.loadCalendar(); }
    else if (sectionId === 'archive' && typeof A.loadArchive === 'function') A.loadArchive();
    else if (sectionId === 'ai') { lazyInit('ai'); if (typeof A.loadAI === 'function') A.loadAI(); }
    else if (sectionId === 'help') { lazyInit('help'); if (typeof A.renderGuide === 'function') A.renderGuide(); }
    else if (sectionId === 'notifications' && typeof A.loadNotifications === 'function') A.loadNotifications();
    else if (sectionId === 'search' && typeof A.initAdvancedSearch === 'function') A.initAdvancedSearch();
    else if (sectionId === 'reports') { lazyInit('reports'); if (typeof A.initReports === 'function') A.initReports(); }
    else if (sectionId === 'profile' && typeof A.loadProfile === 'function') A.loadProfile();
    else if (sectionId === 'settings') {
      lazyInit('settings');
      if (typeof A.initSettingsData === 'function') A.initSettingsData();
      if (typeof A.loadSettingsUsers === 'function') A.loadSettingsUsers();
      if (typeof A.loadSettingsActivity === 'function') A.loadSettingsActivity();
    }
  }
};

A.updateBreadcrumbs = function (sectionId) {
  const container = document.getElementById('topbarBreadcrumbs');
  if (!container) return;
  const labelKeys = {
    dashboard: 'navDashboard',
    clients: 'navClients',
    cases: 'navCases',
    hearings: 'navHearings',
    documents: 'navDocuments',
    calendar: 'navCalendar',
    tasks: 'navTasks',
    expenses: 'navExpenses',
    reports: 'navReports',
    ai: 'navAI',
    archive: 'navArchive',
    search: 'navAdvancedSearch',
    notifications: 'navNotifications',
    settings: 'navSettings',
    help: 'navHelp',
    support: 'navSupport',
    profile: 'navProfile'
  };
  const key = labelKeys[sectionId] || null;
  const leaf = key ? _t(key) : sectionId;
  container.innerHTML = '<span class="breadcrumb-item" data-section="dashboard">' + _t('navDashboard') + '</span><span class="breadcrumb-item">' + leaf + '</span>';
};

window.navigateTo = A.navigateTo;

A.initNavigation = function () {
  A.state.navItems = document.querySelectorAll('.nav-item[data-section]');
  A.state.sections = document.querySelectorAll('.section');
  if (A.state.currentUser) A.applyRoleRestrictions();
  A.state.navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      A.navigateTo(item.dataset.section);
    });
  });
};

A.initKeyboardShortcuts = function () {
  var sectionKeys = ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'settings'];
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key >= '0' && e.key <= '9') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        e.preventDefault();
        var idx = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        if (sectionKeys[idx]) A.navigateTo(sectionKeys[idx]);
      }
    }
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      A.showShortcutsHelp();
    }
  });

  document.getElementById('shortcutsHelpBtn')?.addEventListener('click', A.showShortcutsHelp);
  document.getElementById('shortcutsHelpClose')?.addEventListener('click', A.hideShortcutsHelp);
  document.getElementById('shortcutsHelpOverlay')?.addEventListener('click', function (e) {
    if (e.target === this) A.hideShortcutsHelp();
  });
};

A.showShortcutsHelp = function () {
  var el = document.getElementById('shortcutsHelpOverlay');
  if (el) el.style.display = 'flex';
};

A.hideShortcutsHelp = function () {
  var el = document.getElementById('shortcutsHelpOverlay');
  if (el) el.style.display = 'none';
};

