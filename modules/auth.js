var A = window.App = window.App || {};

A.populateUserList = function(users) {
  var userSelect = document.getElementById('userSelect');
  if (!userSelect) return;
  var html = '<option value="">' + _t('selectUser') + '</option>';
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    html += '<option value="' + u.id + '" data-name="' + A.escapeHtml(u.name) + '" data-role="' + A.escapeHtml(u.role) + '">' + A.escapeHtml(u.name) + ' (' + A.escapeHtml(u.role) + ')</option>';
  }
  userSelect.innerHTML = html;
  userSelect.style.display = 'block';
};

A.showSetupScreen = function() {
  var loginOverlay = document.getElementById('loginOverlay');
  var appEl = document.getElementById('app');
  var setupArea = document.getElementById('loginSetupArea');
  var createAdmin = document.getElementById('loginCreateAdmin');
  var setupLink = document.getElementById('loginSetupLink');
  var userSelect = document.getElementById('userSelect');
  var loginBtn = document.getElementById('loginBtn');
  var loginTitle = document.querySelector('.login-box h2');
  var loginSub = document.querySelector('.login-sub');
  var loginIcon = document.querySelector('.login-icon i');

  if (setupArea) setupArea.style.display = 'none';
  if (setupLink) setupLink.style.display = 'none';
  if (userSelect) userSelect.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';
  if (createAdmin) createAdmin.style.display = 'block';
  if (loginIcon) loginIcon.className = 'ri-user-star-line';
  if (loginTitle) loginTitle.textContent = _t('createAdminAccount');
  if (loginSub) loginSub.textContent = _t('setupAdminSubtitle');
  if (loginOverlay) loginOverlay.style.display = 'flex';
  if (appEl) appEl.style.display = 'none';
};

A.checkAuth = async function() {
  var users = await window.ipcRenderer.invoke('auth:getUsers');
  var loginOverlay = document.getElementById('loginOverlay');
  var appEl = document.getElementById('app');

  if (!users || users.length === 0) {
    A.showSetupScreen();
  } else {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (appEl) appEl.style.display = 'none';
    A.populateUserList(users);
  }
};

A.initAuth = function() {
  var loginBtn = document.getElementById('loginBtn');
  var setupBtn = document.getElementById('setupPasswordBtn');
  var setupLink = document.getElementById('loginSetupLink');
  var loginPw = document.getElementById('loginPassword');
  var newPw = document.getElementById('newPassword');
  var confirmPw = document.getElementById('confirmPassword');
  var lockBtn = document.getElementById('lockAppBtn');
  var createAdminBtn = document.getElementById('createAdminBtn');

  function doLogin() {
    var password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';
    var userSelect = document.getElementById('userSelect');
    var errorEl = document.getElementById('loginError');

    if (!password) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('enterPassword'); }
      return;
    }

    var userId = null;
    if (userSelect) {
      var selectedOption = userSelect.options[userSelect.selectedIndex];
      if (selectedOption && selectedOption.value) {
        userId = parseInt(selectedOption.value);
      }
    }

    A.state.ipc.invoke('auth:login', { userId: userId, password: password }).then(function(result) {
      if (result.ok) {
        var loginOverlay = document.getElementById('loginOverlay');
        var appEl = document.getElementById('app');
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appEl) appEl.style.display = 'flex';
        if (errorEl) errorEl.style.display = 'none';
        if (typeof A.loadDashboard === 'function') A.loadDashboard();
      } else {
        if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = result.error || _t('passwordIncorrect'); }
      }
    }).catch(function(e) {
      console.error('Login error:', e);
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('loginErrorOccurred'); }
    });
  }

  function doSetup() {
    var newPwEl = document.getElementById('newPassword');
    var confirmPwEl = document.getElementById('confirmPassword');
    var errorEl = document.getElementById('setupError');
    var pw = newPwEl ? newPwEl.value : '';
    var confirm = confirmPwEl ? confirmPwEl.value : '';

    if (!pw || pw.length < 8) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('passwordMinLength'); }
      return;
    }
    if (pw !== confirm) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('passwordsNoMatch'); }
      return;
    }

    A.state.ipc.invoke('auth:setPassword', pw).then(function(result) {
      if (result.ok) {
        if (errorEl) errorEl.style.display = 'none';
        if (newPwEl) newPwEl.value = '';
        if (confirmPwEl) confirmPwEl.value = '';
        A.checkAuth();
      } else {
        if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = result.error || _t('savePasswordFailed'); }
      }
    }).catch(function(e) {
      console.error('Setup error:', e);
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('errorSavingPassword'); }
    });
  }

  function doCreateAdmin() {
    var nameEl = document.getElementById('adminName');
    var emailEl = document.getElementById('adminEmail');
    var pwEl = document.getElementById('adminPassword');
    var confirmEl = document.getElementById('adminConfirmPassword');
    var errorEl = document.getElementById('createAdminError');
    var name = nameEl ? nameEl.value.trim() : '';
    var email = emailEl ? emailEl.value.trim() : '';
    var pw = pwEl ? pwEl.value : '';
    var confirm = confirmEl ? confirmEl.value : '';

    if (!name) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('adminNameRequired'); }
      return;
    }
    if (!pw || pw.length < 8) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('passwordMinLength'); }
      return;
    }
    if (pw !== confirm) {
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('passwordsNoMatch'); }
      return;
    }

    A.state.ipc.invoke('auth:addUser', { name: name, email: email, password: pw, role: 'admin' }).then(function(createResult) {
      if (createResult && createResult.ok) {
        A.state.ipc.invoke('auth:setPassword', pw).then(function(setPwResult) {
          if (setPwResult.ok) {
            if (errorEl) errorEl.style.display = 'none';
            if (pwEl) pwEl.value = '';
            if (confirmEl) confirmEl.value = '';
            A.checkAuth();
          } else {
            if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = setPwResult.error || _t('savePasswordFailed'); }
          }
        });
      } else {
        if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = (createResult && createResult.error) || _t('createAdminFailed'); }
      }
    }).catch(function(e) {
      console.error('Create admin error:', e);
      if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = _t('errorCreatingAdmin'); }
    });
  }

  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  if (setupBtn) setupBtn.addEventListener('click', doSetup);
  if (createAdminBtn) createAdminBtn.addEventListener('click', doCreateAdmin);
  if (setupLink) setupLink.addEventListener('click', function(e) {
    e.preventDefault();
    var setupArea = document.getElementById('loginSetupArea');
    if (setupArea) setupArea.style.display = setupArea.style.display === 'none' ? 'block' : 'none';
  });
  if (loginPw) loginPw.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  if (newPw) newPw.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSetup(); });
  if (confirmPw) confirmPw.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSetup(); });
  if (lockBtn) lockBtn.addEventListener('click', function() {
    var pw = document.getElementById('loginPassword');
    if (pw) pw.value = '';
    var errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.style.display = 'none';
    var loginOverlay = document.getElementById('loginOverlay');
    var appEl = document.getElementById('app');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (appEl) appEl.style.display = 'none';
  });

  var onbStep = 0;
  var onbData = [
    { title: _t('onbTitle'), desc: _t('onbDesc') },
    { title: _t('onbTitleStep1'), desc: _t('onbDescStep1') },
    { title: _t('onbTitleStep2'), desc: _t('onbDescStep2') },
    { title: _t('onbTitleStep3'), desc: _t('onbDescStep3') },
  ];

  function updateOnbStep() {
    var title = document.getElementById('onbTitle');
    var desc = document.getElementById('onbDesc');
    var dots = document.querySelectorAll('.onboarding-dot');
    var next = document.getElementById('onbNext');
    if (title) title.textContent = onbData[onbStep].title;
    if (desc) desc.textContent = onbData[onbStep].desc;
    dots.forEach(function(d, i) { d.classList.toggle('active', i === onbStep); });
    if (next) next.textContent = onbStep === onbData.length - 1 ? _t('getStarted') : _t('onbNext');
  }

  function showOnboarding() {
    var overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    if (localStorage.getItem('onboardingDone')) return;
    overlay.style.display = 'flex';
    updateOnbStep();
  }

  document.getElementById('onbNext')?.addEventListener('click', function() {
    onbStep++;
    if (onbStep >= onbData.length) {
      var overlay = document.getElementById('onboardingOverlay');
      if (overlay) overlay.style.display = 'none';
      localStorage.setItem('onboardingDone', 'true');
    } else {
      updateOnbStep();
    }
  });

  document.getElementById('onbSkip')?.addEventListener('click', function() {
    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';
    localStorage.setItem('onboardingDone', 'true');
  });
};
