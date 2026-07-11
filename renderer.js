window.onerror = function (message, source, lineno, colno, error) {
  const A = window.App;
  if (A && A.logError) A.logError('errorBoundary', error || message);
  else console.error('Error Boundary:', message, source, lineno);
  return true;
};

window.addEventListener('unhandledrejection', function (e) {
  const A = window.App;
  if (A && A.logError) A.logError('unhandledRejection', e.reason);
  else console.error('Unhandled Rejection:', e.reason);
  e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  A.state.ipc = window.ipcRenderer;

  if (A.Logger) A.Logger.init();

  async function runStartup() {
    const bar = document.getElementById('startupBar');
    const overlay = document.getElementById('startupOverlay');
    if (!bar || !overlay) return;
    for (let i = 0; i <= 100; i += 5) {
      bar.style.width = i + '%';
      await new Promise(r => setTimeout(r, 30));
    }
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => (overlay.style.display = 'none'), 400);
    }, 200);
  }
  runStartup();

  // Init all modules
  const safeInit = fn => {
    try {
      if (typeof fn === 'function') fn();
    } catch (e) {
      console.error('Init error:', e);
    }
  };
  safeInit(A.initI18n);
  safeInit(A.initLicenseUI);
  safeInit(A.initModal);
  safeInit(A.initNavigation);
  safeInit(A.initKeyboardShortcuts);
  safeInit(A.initDarkMode);
  safeInit(A.initDate);
  safeInit(A.initAuth);
  safeInit(A.initQuickAdd);
  safeInit(A.initGlobalSearch);
  safeInit(A.initCommandPalette);
  safeInit(A.initAdvancedSearch);
  safeInit(A.initDashboard);
  safeInit(A.initAI);
  safeInit(A.initClients);
  safeInit(A.initCases);
  safeInit(A.initHearings);
  safeInit(A.initDocuments);
  safeInit(A.initArchive);
  safeInit(A.initNotifications);
  safeInit(A.initProfile);
  safeInit(A.initSessionTimeout);
  safeInit(A.AutoSave ? A.AutoSave.init : null);

  window.navigateTo = A.navigateTo;

  // Patch loadDashboard to update user badge
  const origLoadDash = A.loadDashboard;
  async function updateTopbarUser() {
    if (!A.state.ipc) return;
    const user = await A.state.ipc.invoke('auth:getCurrentUser');
    if (user) {
      const existing = document.querySelector('.topbar-user-badge');
      if (!existing) {
        const badge = document.createElement('div');
        badge.className = 'topbar-user-badge';
        badge.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted-foreground);margin-right:var(--spacing-2);';
        A.safeSetStatic(
          badge,
          `<i class="ri-user-3-line"></i> ${A.escapeHtml(user.name)} <span style="font-size:9px;color:var(--gold);">(${A.escapeHtml(user.role)})</span>`
        );
        document.querySelector('.topbar-search')?.after(badge);
      }
    }
  }
  A.loadDashboard = function () {
    updateTopbarUser().catch(e => console.error('topbar user error:', e));
    origLoadDash();
  };
  window.loadDashboard = A.loadDashboard;

  // Replace old AI insights with smart version
  A.loadAiInsights = A.loadSmartInsights;
  window.loadAiInsights = A.loadSmartInsights;

  // Init index notification listener
  if (A._initIndexNotification) A._initIndexNotification();

  // Listen for push events from main process
  if (A.state.ipc) {
    A.state.ipc.on('app:navigateToCase', caseId => {
      A.navigateTo('cases');
      if (typeof A.openCase === 'function') setTimeout(() => A.openCase(caseId), 200);
    });
  }

  // License check in parallel with auth (don't block login)
  Promise.all([A.checkLicense(), A.checkAuth()]).finally(function () {
    // Load search index after auth completes (preloads all data for instant local search)
    if (A.loadSearchIndex) setTimeout(() => A.loadSearchIndex(), 500);
  });
});
