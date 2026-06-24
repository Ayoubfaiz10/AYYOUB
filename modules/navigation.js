var A = window.App = window.App || {};

A.state.navItems = null;
A.state.sections = null;
A.state.loadedSections = new Set();

A.navigateTo = function(sectionId) {
  if (!A.state.navItems || !A.state.sections || !sectionId) return;
  A.state.navItems.forEach(n => n.classList.remove('active'));
  A.state.sections.forEach(s => s.classList.remove('active'));
  const tn = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  const ts = document.getElementById(`section-${sectionId}`);
  if (tn) tn.classList.add('active');
  if (ts) ts.classList.add('active');
  document.querySelectorAll('.search-results').forEach(r => r.style.display = 'none');
  if (!A.state.loadedSections.has(sectionId) && A.state.ipc) {
    A.state.loadedSections.add(sectionId);
    if (sectionId === 'dashboard' && typeof A.loadDashboard === 'function') A.loadDashboard();
    else if (sectionId === 'clients' && typeof A.loadClients === 'function') A.loadClients();
    else if (sectionId === 'cases' && typeof A.loadCases === 'function') A.loadCases();
    else if (sectionId === 'hearings' && typeof A.loadHearings === 'function') A.loadHearings();
    else if (sectionId === 'tasks' && typeof A.loadTasks === 'function') A.loadTasks();
    else if (sectionId === 'documents' && typeof A.loadDocuments === 'function') A.loadDocuments();
    else if (sectionId === 'expenses' && typeof A.loadExpenses === 'function') A.loadExpenses();
    else if (sectionId === 'calendar' && typeof A.loadCalendar === 'function') A.loadCalendar();
    else if (sectionId === 'archive' && typeof A.loadArchive === 'function') A.loadArchive();
    else if (sectionId === 'ai' && typeof A.loadAI === 'function') A.loadAI();
    else if (sectionId === 'notifications' && typeof A.loadNotifications === 'function') A.loadNotifications();
    else if (sectionId === 'search' && typeof A.initAdvancedSearch === 'function') A.initAdvancedSearch();
    else if (sectionId === 'reports' && typeof A.initReports === 'function') A.initReports();
    else if (sectionId === 'settings') { if (typeof A.loadSettingsUsers === 'function') A.loadSettingsUsers(); if (typeof A.loadSettingsActivity === 'function') A.loadSettingsActivity(); }
  }
};

window.navigateTo = A.navigateTo;

A.initNavigation = function() {
  A.state.navItems = document.querySelectorAll('.nav-item[data-section]');
  A.state.sections = document.querySelectorAll('.section');
  A.state.navItems.forEach(item => item.addEventListener('click', () => A.navigateTo(item.dataset.section)));
};
