var A = (window.App = window.App || {});

A._selectedUserId = null;
A._dashboardLoaded = false;
A._forgotUserId = null;
A._forgotQuestionIndex = null;

A.SECURITY_QUESTIONS = [
  'ما اسم مدرستك الابتدائية؟',
  'ما اسم حيوانك الأليف المفضل؟',
  'ما اسم مدينتك المفضلة؟',
  'ما هو لونك المفضل؟',
  'ما اسم والدتك؟',
  'ما اسم والدك؟',
  'ما هو طبقك المفضل؟',
  'ما اسم أفضل صديق لك؟',
  'ما اسم معلمك المفضل في المدرسة؟',
  'ما هي هوايتك المفضلة؟',
  'ما اسم أول شارع عرفت تعيش فيه؟',
  'ما هو اسم فيلمك المفضل؟'
];

A.populateSecurityQuestions = function () {
  const sel = document.getElementById('sq1');
  if (!sel) return;
  sel.innerHTML = '<option value="">اختر سؤال الأمان...</option>';
  for (let j = 0; j < A.SECURITY_QUESTIONS.length; j++) {
    const opt = document.createElement('option');
    opt.value = A.SECURITY_QUESTIONS[j];
    opt.textContent = A.SECURITY_QUESTIONS[j];
    sel.appendChild(opt);
  }
};

A._currentSetupStep = 1;

A.goToSetupStep = function (n) {
  A._currentSetupStep = n;
  for (let i = 1; i <= 3; i++) {
    const content = document.getElementById('setupStep' + i + 'Content');
    if (content) content.classList.toggle('active', i === n);
    const step = document.querySelector('.setup-step[data-step="' + i + '"]');
    if (step) step.classList.toggle('active', i === n);
  }
  const pct = Math.round((n / 3) * 100);
  const fill = document.querySelector('.setup-progress-fill');
  if (fill) fill.style.width = pct + '%';
  const text = document.querySelector('.setup-progress-text');
  if (text) text.textContent = 'الخطوة ' + n + ' من 3';
  const pctEl = document.querySelector('.setup-progress-pct');
  if (pctEl) pctEl.textContent = pct + '%';
};

A.nextSetupStep = function () {
  const errorEl = document.getElementById('setupError');
  if (errorEl) errorEl.style.display = 'none';
  const step = A._currentSetupStep;
  if (step === 1) {
    const officeName = document.getElementById('setupOfficeName') ? document.getElementById('setupOfficeName').value.trim() : '';
    const adminName = document.getElementById('setupAdminName') ? document.getElementById('setupAdminName').value.trim() : '';
    if (!officeName) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('officeNameRequired');
      }
      document.getElementById('setupOfficeName').focus();
      return;
    }
    if (!adminName) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('adminNameRequired');
      }
      document.getElementById('setupAdminName').focus();
      return;
    }
    A.goToSetupStep(2);
    document.getElementById('setupPassword').focus();
  } else if (step === 2) {
    const pw = document.getElementById('setupPassword') ? document.getElementById('setupPassword').value : '';
    const confirm = document.getElementById('setupConfirmPassword') ? document.getElementById('setupConfirmPassword').value : '';
    if (!pw || pw.length < 8) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('passwordMinLength');
      }
      document.getElementById('setupPassword').focus();
      return;
    }
    if (pw !== confirm) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('passwordsNoMatch');
      }
      document.getElementById('setupConfirmPassword').focus();
      return;
    }
    A.goToSetupStep(3);
    document.getElementById('sq1').focus();
  }
};

A.prevSetupStep = function () {
  const errorEl = document.getElementById('setupError');
  if (errorEl) errorEl.style.display = 'none';
  if (A._currentSetupStep > 1) {
    A.goToSetupStep(A._currentSetupStep - 1);
  }
};

A.showSetupScreen = function () {
  document.getElementById('authSetupScreen').style.display = 'flex';
  document.getElementById('authLoginScreen').style.display = 'none';
  document.getElementById('forgotPasswordModal').style.display = 'none';
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'none';
  A.populateSecurityQuestions();
  A.goToSetupStep(1);
};

A.showLoginScreen = function (users) {
  document.getElementById('authSetupScreen').style.display = 'none';
  document.getElementById('authLoginScreen').style.display = 'flex';
  document.getElementById('forgotPasswordModal').style.display = 'none';
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'none';
  A._selectedUserId = null;
  if (users) A.renderUserCards(users);
};

A.renderUserCards = function (users) {
  const container = document.getElementById('userCardsContainer');
  if (!container) return;
  if (!users || !users.length) {
    A.safeSetStatic(container,
      '<div style="text-align:center;padding:var(--spacing-3);color:var(--muted-foreground);font-size:var(--type-body);">' + _t('noUsers') + '</div>');
    return;
  }
  let html = '';
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const initial = u.name ? u.name.charAt(0) : '?';
    const roleLabel = _t('role_' + u.role) || u.role;
    html += '<div class="user-card" data-user-id="' + A.escapeHtml(String(u.id)) + '" data-user-email="' + A.escapeHtml(u.email || '') + '">';
    html += '<div class="user-card-avatar">' + A.escapeHtml(initial) + '</div>';
    html += '<div class="user-card-info">';
    html += '<div class="user-card-name">' + A.escapeHtml(u.name) + '</div>';
    html += '<div class="user-card-role">' + A.escapeHtml(roleLabel) + '</div>';
    html += '</div></div>';
  }
  A.safeSetStatic(container, html);
  const cards = container.querySelectorAll('.user-card');
  for (let j = 0; j < cards.length; j++) {
    (function (card) {
      card.addEventListener('click', function () {
        const prev = container.querySelector('.user-card.selected');
        if (prev) prev.classList.remove('selected');
        card.classList.add('selected');
        A._selectedUserId = parseInt(card.dataset.userId, 10);
        const pw = document.getElementById('loginPassword');
        if (pw) pw.focus();
      });
    })(cards[j]);
  }
};

A.renderForgotUserCards = function (users) {
  const container = document.getElementById('forgotUserCardsContainer');
  if (!container) return;
  if (!users || !users.length) {
    A.safeSetStatic(container,
      '<div style="text-align:center;padding:var(--spacing-3);color:var(--muted-foreground);font-size:var(--type-body);">' + _t('noUsers') + '</div>');
    return;
  }
  let html = '';
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const initial = u.name ? u.name.charAt(0) : '?';
    const roleLabel = _t('role_' + u.role) || u.role;
    html += '<div class="user-card" data-user-id="' + A.escapeHtml(String(u.id)) + '">';
    html += '<div class="user-card-avatar">' + A.escapeHtml(initial) + '</div>';
    html += '<div class="user-card-info">';
    html += '<div class="user-card-name">' + A.escapeHtml(u.name) + '</div>';
    html += '<div class="user-card-role">' + A.escapeHtml(roleLabel) + '</div>';
    html += '</div></div>';
  }
  A.safeSetStatic(container, html);
  const cards = container.querySelectorAll('.user-card');
  for (let j = 0; j < cards.length; j++) {
    (function (card) {
      card.addEventListener('click', function () {
        const prev = container.querySelector('.user-card.selected');
        if (prev) prev.classList.remove('selected');
        card.classList.add('selected');
        A._forgotUserId = parseInt(card.dataset.userId, 10);
        document.getElementById('forgotError').style.display = 'none';
      });
    })(cards[j]);
  }
};

A.hideAuth = function () {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'none';
  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'flex';
};

A.checkAuth = async function () {
  if (!A.state.ipc) return;
  try {
    const token = localStorage.getItem('session_token') || A.state.currentSessionToken;
    if (token) {
      const user = await A.state.ipc.invoke('auth:checkRemembered', token);
      if (user) {
        A.state.currentUser = user;
        if (typeof A.applyRoleRestrictions === 'function') A.applyRoleRestrictions();
        A.hideAuth();
        if (typeof A.loadDashboard === 'function' && !A._dashboardLoaded) {
          A._dashboardLoaded = true;
          A.loadDashboard();
        }
        return;
      }
      A.state.currentSessionToken = null;
    }
  } catch (e) {
    /* token check failed, continue to boot */
  }
  try {
    const boot = await A.state.ipc.invoke('auth:boot');
    if (boot.hasPassword) {
      A.showLoginScreen(boot.users);
    } else {
      A.showSetupScreen();
    }
  } catch (e) {
    console.error('checkAuth boot error:', e);
  }
};

A.doSetup = function () {
  const officeName = document.getElementById('setupOfficeName') ? document.getElementById('setupOfficeName').value.trim() : '';
  const adminName = document.getElementById('setupAdminName') ? document.getElementById('setupAdminName').value.trim() : '';
  const pw = document.getElementById('setupPassword') ? document.getElementById('setupPassword').value : '';
  const confirm = document.getElementById('setupConfirmPassword') ? document.getElementById('setupConfirmPassword').value : '';
  const openAtLogin = document.getElementById('setupOpenAtLogin') ? document.getElementById('setupOpenAtLogin').checked : false;
  const errorEl = document.getElementById('setupError');

  if (!officeName) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('officeNameRequired');
    }
    return;
  }
  if (!adminName) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('adminNameRequired');
    }
    return;
  }
  if (!pw || pw.length < 8) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordMinLength');
    }
    return;
  }
  if (pw !== confirm) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordsNoMatch');
    }
    return;
  }

  const sq1 = document.getElementById('sq1') ? document.getElementById('sq1').value : '';
  const sa1 = document.getElementById('sa1') ? document.getElementById('sa1').value.trim() : '';
  const sq2 = document.getElementById('sq2') ? document.getElementById('sq2').value : '';
  const sa2 = document.getElementById('sa2') ? document.getElementById('sa2').value.trim() : '';
  const sq3 = document.getElementById('sq3') ? document.getElementById('sq3').value : '';
  const sa3 = document.getElementById('sa3') ? document.getElementById('sa3').value.trim() : '';

  if (!sq1 || !sa1) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('securityQuestionsRequired');
    }
    return;
  }

  const setupPayload = { officeName: officeName, adminName: adminName, password: pw, openAtLogin: openAtLogin, securityQ1: sq1, securityA1: sa1 };
    if (sq2 && sa2) { setupPayload.securityQ2 = sq2; setupPayload.securityA2 = sa2; }
    if (sq3 && sa3) { setupPayload.securityQ3 = sq3; setupPayload.securityA3 = sa3; }
    A.state.ipc.invoke('auth:setup', setupPayload)
    .then(function (result) {
      if (result && result.ok) {
        if (errorEl) errorEl.style.display = 'none';
        const token = result.sessionToken;
        if (token) {
          A.state.currentSessionToken = token;
          localStorage.setItem('session_token', token);
        }
        if (typeof A.applyRoleRestrictions === 'function') A.applyRoleRestrictions();
        A.hideAuth();
        if (typeof A.loadDashboard === 'function' && !A._dashboardLoaded) {
          A._dashboardLoaded = true;
          A.loadDashboard();
        }
        if (typeof A.loadSearchIndex === 'function')
          setTimeout(function () {
            A.loadSearchIndex();
          }, 300);
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('createAdminFailed');
        }
      }
    })
    .catch(function (e) {
      console.error('Setup error:', e);
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('errorCreatingAdmin');
      }
    });
};

A.doLogin = function () {
  const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';
  const errorEl = document.getElementById('loginError');
  const remember = document.getElementById('loginRemember') ? document.getElementById('loginRemember').checked : true;
  let email = '';

  if (!password) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('enterPassword');
    }
    return;
  }

  if (A._selectedUserId) {
    const card = document.querySelector('.user-card[data-user-id="' + A._selectedUserId + '"]');
    if (card) email = card.dataset.userEmail || '';
  }

  A.state.ipc
    .invoke('auth:login', { email: email || null, password: password, remember: remember })
    .then(function (result) {
      if (result && result.ok) {
        if (errorEl) errorEl.style.display = 'none';
        A.state.currentUser = result.user;
        if (result.sessionToken) {
          A.state.currentSessionToken = result.sessionToken;
          localStorage.setItem('session_token', result.sessionToken);
        } else {
          A.state.currentSessionToken = null;
          localStorage.removeItem('session_token');
        }
        if (typeof A.applyRoleRestrictions === 'function') A.applyRoleRestrictions();
        A.hideAuth();
        if (typeof A.loadDashboard === 'function' && !A._dashboardLoaded) {
          A._dashboardLoaded = true;
          A.loadDashboard();
        }
        if (typeof A.loadSearchIndex === 'function')
          setTimeout(function () {
            A.loadSearchIndex();
          }, 300);
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('passwordIncorrect');
        }
      }
    })
    .catch(function (e) {
      console.error('Login error:', e);
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('loginErrorOccurred');
      }
    });
};

A.showForgotPassword = function () {
  document.getElementById('authLoginScreen').style.display = 'none';
  document.getElementById('forgotPasswordModal').style.display = 'flex';
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotStep3').style.display = 'none';
  document.getElementById('forgotError').style.display = 'none';
  document.getElementById('forgotAnswerError').style.display = 'none';
  document.getElementById('forgotResetError').style.display = 'none';
  document.getElementById('forgotMasterKeySection').style.display = 'none';
  document.getElementById('forgotMasterError').style.display = 'none';
  document.getElementById('forgotAnswer').value = '';
  document.getElementById('forgotNewPassword').value = '';
  document.getElementById('forgotConfirmPassword').value = '';
  document.getElementById('forgotMasterKey').value = '';
  document.getElementById('forgotMasterNewPassword').value = '';
  document.getElementById('forgotMasterConfirmPassword').value = '';
  A._forgotUserId = null;
  A._forgotQuestionIndex = null;

  A.state.ipc
    .invoke('auth:boot')
    .then(function (boot) {
      if (boot && boot.users && boot.users.length) {
        A.renderForgotUserCards(boot.users);
      } else {
        const container = document.getElementById('forgotUserCardsContainer');
        if (container)
          container.innerHTML =
            '<div style="text-align:center;padding:var(--spacing-3);color:var(--muted-foreground);font-size:var(--type-body);">' + _t('noUsers') + '</div>';
      }
    })
    .catch(function () {
      const container = document.getElementById('forgotUserCardsContainer');
      if (container)
        container.innerHTML =
          '<div style="text-align:center;padding:var(--spacing-3);color:var(--destructive);font-size:var(--type-body);">' + _t('errorOccurred') + '</div>';
    });
};

A.doForgotCheckAnswer = function () {
  const answer = document.getElementById('forgotAnswer') ? document.getElementById('forgotAnswer').value.trim() : '';
  const errorEl = document.getElementById('forgotAnswerError');
  if (!A._forgotUserId) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('selectUserFirst');
    }
    return;
  }
  if (!A._forgotQuestionIndex) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('selectUserFirst');
    }
    return;
  }
  if (!answer) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('enterAnswer');
    }
    return;
  }
  A.state.ipc
    .invoke('auth:checkSecurityAnswer', { userId: A._forgotUserId, questionIndex: A._forgotQuestionIndex, answer: answer })
    .then(function (result) {
      if (result && result.ok) {
        errorEl.style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'none';
        document.getElementById('forgotStep3').style.display = 'block';
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('wrongSecurityAnswer');
        }
      }
    })
    .catch(function (e) {
      console.error('Check answer error:', e);
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('errorOccurred');
      }
    });
};

A.doForgotReset = function () {
  const newPw = document.getElementById('forgotNewPassword') ? document.getElementById('forgotNewPassword').value : '';
  const confirmPw = document.getElementById('forgotConfirmPassword') ? document.getElementById('forgotConfirmPassword').value : '';
  const errorEl = document.getElementById('forgotResetError');
  if (!newPw || newPw.length < 8) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordMinLength');
    }
    return;
  }
  if (newPw !== confirmPw) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordsNoMatch');
    }
    return;
  }
  A.state.ipc
    .invoke('auth:resetPassword', { userId: A._forgotUserId, newPassword: newPw, remember: true })
    .then(function (result) {
      if (result && result.ok) {
        errorEl.style.display = 'none';
        A.state.currentUser = result.user;
        if (result.sessionToken) {
          A.state.currentSessionToken = result.sessionToken;
          localStorage.setItem('session_token', result.sessionToken);
        }
        if (typeof A.applyRoleRestrictions === 'function') A.applyRoleRestrictions();
        document.getElementById('forgotPasswordModal').style.display = 'none';
        A.hideAuth();
        if (typeof A.loadDashboard === 'function' && !A._dashboardLoaded) {
          A._dashboardLoaded = true;
          A.loadDashboard();
        }
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('resetFailed');
        }
      }
    })
    .catch(function (e) {
      console.error('Reset error:', e);
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('errorOccurred');
      }
    });
};

A.doForgotSelectUser = function () {
  if (!A._forgotUserId) {
    document.getElementById('forgotError').style.display = 'block';
    document.getElementById('forgotError').textContent = _t('selectUserFirst');
    return;
  }
  document.getElementById('forgotError').style.display = 'none';
  A.state.ipc
    .invoke('auth:getSecurityQuestion', A._forgotUserId)
    .then(function (result) {
      if (result && result.ok) {
        A._forgotQuestionIndex = result.questionIndex;
        document.getElementById('forgotQuestionDisplay').textContent = result.question;
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
        document.getElementById('forgotStep3').style.display = 'none';
        document.getElementById('forgotAnswer').focus();
      } else {
        document.getElementById('forgotError').style.display = 'block';
        document.getElementById('forgotError').textContent = (result && result.error) || _t('noSecurityQuestions');
        document.getElementById('forgotMasterKeySection').style.display = 'block';
        document.getElementById('forgotMasterKey').focus();
      }
    })
    .catch(function (e) {
      console.error('Get question error:', e);
      document.getElementById('forgotError').style.display = 'block';
      document.getElementById('forgotError').textContent = _t('errorOccurred');
    });
};

A.doForgotMasterReset = function () {
  const masterKey = document.getElementById('forgotMasterKey') ? document.getElementById('forgotMasterKey').value.trim() : '';
  const newPw = document.getElementById('forgotMasterNewPassword') ? document.getElementById('forgotMasterNewPassword').value : '';
  const confirmPw = document.getElementById('forgotMasterConfirmPassword') ? document.getElementById('forgotMasterConfirmPassword').value : '';
  const errorEl = document.getElementById('forgotMasterError');
  if (!masterKey) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('enterMasterKey');
    }
    return;
  }
  if (!newPw || newPw.length < 8) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordMinLength');
    }
    return;
  }
  if (newPw !== confirmPw) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('passwordsNoMatch');
    }
    return;
  }
  const userId = A._forgotUserId;
  if (!userId) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('selectUserFirst');
    }
    return;
  }
  A.state.ipc
    .invoke('auth:resetWithMasterKey', { userId: userId, newPassword: newPw, masterKey: masterKey })
    .then(function (result) {
      if (result && result.ok) {
        errorEl.style.display = 'none';
        A.state.currentUser = result.user;
        if (result.sessionToken) {
          A.state.currentSessionToken = result.sessionToken;
          localStorage.setItem('session_token', result.sessionToken);
        }
        if (typeof A.applyRoleRestrictions === 'function') A.applyRoleRestrictions();
        document.getElementById('forgotPasswordModal').style.display = 'none';
        A.hideAuth();
        if (typeof A.loadDashboard === 'function' && !A._dashboardLoaded) {
          A._dashboardLoaded = true;
          A.loadDashboard();
        }
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('resetFailed');
        }
      }
    })
    .catch(function (e) {
      console.error('Master reset error:', e);
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('errorOccurred');
      }
    });
};

A.backToLogin = function () {
  document.getElementById('forgotPasswordModal').style.display = 'none';
  document.getElementById('authLoginScreen').style.display = 'flex';
};

A.initAuth = function () {
  const loginBtn = document.getElementById('loginBtn');
  const loginPw = document.getElementById('loginPassword');
  const lockBtn = document.getElementById('lockAppBtn');
  const forgotLink = document.getElementById('forgotPasswordLink');
  const forgotCheckBtn = document.getElementById('forgotCheckAnswerBtn');
  const forgotResetBtn = document.getElementById('forgotResetBtn');
  const forgotBackLink = document.getElementById('forgotBackToLogin');
  function onLoginKeydown(e) {
    if (e.key === 'Enter') A.doLogin();
  }

  if (loginBtn) loginBtn.addEventListener('click', A.doLogin);
  if (loginPw) loginPw.addEventListener('keydown', onLoginKeydown);

  // Setup step navigation
  document.getElementById('setupNext1')?.addEventListener('click', A.nextSetupStep);
  document.getElementById('setupNext2')?.addEventListener('click', A.nextSetupStep);
  document.getElementById('setupPrev2')?.addEventListener('click', A.prevSetupStep);
  document.getElementById('setupPrev3')?.addEventListener('click', A.prevSetupStep);
  document.getElementById('authSetupBtn')?.addEventListener('click', A.doSetup);

  document.getElementById('setupOfficeName')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') A.nextSetupStep();
  });
  document.getElementById('setupAdminName')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') A.nextSetupStep();
  });
  document.getElementById('setupPassword')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') A.nextSetupStep();
  });
  document.getElementById('setupConfirmPassword')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') A.nextSetupStep();
  });
  document.getElementById('sa1')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') A.doSetup();
  });

  if (lockBtn)
    lockBtn.addEventListener('click', function () {
      const pw = document.getElementById('loginPassword');
      if (pw) pw.value = '';
      const errorEl = document.getElementById('loginError');
      if (errorEl) errorEl.style.display = 'none';
      A._selectedUserId = null;
      const token = localStorage.getItem('session_token') || A.state.currentSessionToken;
      A.state.currentSessionToken = null;
      localStorage.removeItem('session_token');
      A.state.ipc.invoke('auth:logout', { token: token, reason: 'lock' }).catch(function () {});
      A.state.currentUser = null;
      A._dashboardLoaded = false;
      A.state.ipc
        .invoke('auth:boot')
        .then(function (boot) {
          if (boot && boot.users) A.showLoginScreen(boot.users);
        })
        .catch(function () {
          A.showLoginScreen();
        });
    });

  // Forgot password
  if (forgotLink) forgotLink.addEventListener('click', A.showForgotPassword);
  if (forgotBackLink) forgotBackLink.addEventListener('click', A.backToLogin);

  // When a user card is clicked in forgot step 1, auto-proceed
  document.getElementById('forgotUserCardsContainer')?.addEventListener('click', function (e) {
    const card = e.target.closest('.user-card');
    if (card) {
      A._forgotUserId = parseInt(card.dataset.userId, 10);
      document.getElementById('forgotError').style.display = 'none';
      A.doForgotSelectUser();
    }
  });

  if (forgotCheckBtn) forgotCheckBtn.addEventListener('click', A.doForgotCheckAnswer);
  if (forgotResetBtn) forgotResetBtn.addEventListener('click', A.doForgotReset);
  document.getElementById('forgotMasterResetBtn')?.addEventListener('click', A.doForgotMasterReset);

  // Enter key in forgot answer field
  const forgotAnswer = document.getElementById('forgotAnswer');
  if (forgotAnswer)
    forgotAnswer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') A.doForgotCheckAnswer();
    });

  // Enter key in forgot new password fields
  const forgotNewPw = document.getElementById('forgotNewPassword');
  const forgotConfirmPw = document.getElementById('forgotConfirmPassword');
  if (forgotConfirmPw)
    forgotConfirmPw.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') A.doForgotReset();
    });

  document.querySelector('.topbar-user')?.addEventListener('click', function () {
    A.navigateTo('profile');
  });

  /* ─── Onboarding ─── */
  let onbStep = 0;
  const onbData = [
    { title: _t('onbTitle'), desc: _t('onbDesc') },
    { title: _t('onbTitleStep1'), desc: _t('onbDescStep1') },
    { title: _t('onbTitleStep2'), desc: _t('onbDescStep2') },
    { title: _t('onbTitleStep3'), desc: _t('onbDescStep3') }
  ];

  function updateOnbStep() {
    const title = document.getElementById('onbTitle');
    const desc = document.getElementById('onbDesc');
    const dots = document.querySelectorAll('.onboarding-dot');
    const next = document.getElementById('onbNext');
    if (title) title.textContent = onbData[onbStep].title;
    if (desc) desc.textContent = onbData[onbStep].desc;
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === onbStep);
    });
    if (next) next.textContent = onbStep === onbData.length - 1 ? _t('getStarted') : _t('onbNext');
  }

  function showOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    if (localStorage.getItem('onboardingDone')) return;
    overlay.style.display = 'flex';
    updateOnbStep();
  }

  document.getElementById('onbNext')?.addEventListener('click', function () {
    onbStep++;
    if (onbStep >= onbData.length) {
      const overlay = document.getElementById('onboardingOverlay');
      if (overlay) overlay.style.display = 'none';
      localStorage.setItem('onboardingDone', 'true');
    } else {
      updateOnbStep();
    }
  });

  document.getElementById('onbSkip')?.addEventListener('click', function () {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';
    localStorage.setItem('onboardingDone', 'true');
  });
};
