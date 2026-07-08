var A = (window.App = window.App || {});

A.initDarkMode = function () {
  const dmToggle = document.getElementById('darkModeToggle');
  const settingDarkMode = document.getElementById('settingDarkMode');
  if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
    if (settingDarkMode) settingDarkMode.checked = true;
  }
  function toggleDark(enable) {
    document.body.classList.toggle('dark-mode', enable);
    localStorage.setItem('dark-mode', enable);
    if (settingDarkMode) settingDarkMode.checked = enable;
  }
  if (dmToggle) dmToggle.addEventListener('click', () => toggleDark(!document.body.classList.contains('dark-mode')));
  if (settingDarkMode) settingDarkMode.addEventListener('change', () => toggleDark(settingDarkMode.checked));
  A.state.toggleDark = toggleDark;
};

A.initDate = function () {
  const el = document.getElementById('currentDate');
  if (el) el.textContent = new Date().toLocaleDateString(A.getLocale(), { year: 'numeric', month: 'long', day: 'numeric' });
};

A.initQuickAdd = function () {
  document.getElementById('quickAddBtn')?.addEventListener('click', () => {
    A.navigateTo('cases');
    setTimeout(() => document.getElementById('addCaseBtn')?.click(), 100);
  });
};

A.initSessionTimeout = function () {
  let sessionTimer = null;
  function resetSessionTimer() {
    if (sessionTimer) clearTimeout(sessionTimer);
    sessionTimer = setTimeout(
      () => {
        if (A.state.ipc) {
          const token = A.state.currentSessionToken;
          A.state.ipc.invoke('auth:logout', { token: token, reason: 'timeout' }).catch(function (e) {
            console.error('logout error:', e);
          });
        }
        const loginOverlay = document.getElementById('loginOverlay');
        const appEl = document.getElementById('app');
        if (loginOverlay) {
          loginOverlay.style.display = 'flex';
          if (appEl) appEl.style.display = 'none';
          const pw = document.getElementById('loginPassword');
          const err = document.getElementById('loginError');
          if (pw) pw.value = '';
          if (err) {
            err.textContent = _t('sessionExpired');
            err.style.display = 'block';
          }
        }
      },
      30 * 60 * 1000
    );
  }
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keydown', resetSessionTimer);
  document.addEventListener('input', resetSessionTimer);
};
