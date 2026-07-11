var A = (window.App = window.App || {});

A._licenseResolve = null;

A.checkLicense = function () {
  return new Promise(function (resolve) {
    if (!A.state.ipc) {
      resolve(true);
      return;
    }
    A.state.ipc
      .invoke('license:check')
      .then(function (status) {
        if (status && status.valid) {
          resolve(true);
        } else {
          A._licenseResolve = resolve;
          A.showLicenseActivation(status);
        }
      })
      .catch(function () {
        resolve(true);
      });
  });
};

A.showLicenseActivation = function (status) {
  document.getElementById('licenseDeactivationScreen').style.display = 'none';
  document.getElementById('licenseActivationScreen').style.display = 'flex';
  A.showLicenseOverlay();
  document.getElementById('licenseActivateBtn').disabled = false;
  document.getElementById('licenseActivateBtn').textContent = _t('licenseActivateBtn');
  const skipEl = document.getElementById('licenseDevSkip');
  if (skipEl) skipEl.style.display = window.electron && window.electron.isDev ? 'block' : 'none';
  A.state.ipc
    .invoke('license:getStatus')
    .then(function (local) {
      if (local && local.key) {
        document.getElementById('licenseKeyInput').value = local.key;
      }
    })
    .catch(function () {});
};

A.showLicenseDeactivation = function () {
  document.getElementById('licenseActivationScreen').style.display = 'none';
  document.getElementById('licenseDeactivationScreen').style.display = 'flex';
  A.showLicenseOverlay();
  A.state.ipc
    .invoke('license:getStatus')
    .then(function (local) {
      const infoEl = document.getElementById('licenseCurrentInfo');
      if (local && local.key) {
        let text = '<strong>' + _t('licenseValidStatus') + '</strong><br>';
        text += _t('licenseKeyLabel') + ' ' + A.escapeHtml(local.key) + '<br>';
        text += _t('licenseDeviceLabel') + ' ' + A.escapeHtml(local.machineId || '').slice(0, 16) + '...<br>';
        if (local.lastValidated) {
          const days = Math.floor((Date.now() - local.lastValidated) / (24 * 60 * 60 * 1000));
          text += _t('licenseGraceLabel') + ' ' + Math.max(0, 7 - days) + ' ' + _t('licenseDays');
        }
        A.safeSetStatic(infoEl, text);
      } else {
        A.safeSetStatic(infoEl, '<span style="color:var(--destructive);">' + _t('licenseInvalidKey') + '</span>');
      }
    })
    .catch(function () {});
};

A.hideLicense = function () {
  const overlay = document.getElementById('licenseOverlay');
  if (overlay) overlay.style.display = 'none';
  if (A.state.currentUser) {
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'flex';
  } else {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
  }
};

A.showLicenseOverlay = function () {
  document.getElementById('licenseOverlay').style.display = 'flex';
  document.getElementById('loginOverlay').style.display = 'none';
  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'none';
  const startupOverlay = document.getElementById('startupOverlay');
  if (startupOverlay) startupOverlay.style.display = 'none';
};

A.doActivateLicense = function () {
  const key = document.getElementById('licenseKeyInput') ? document.getElementById('licenseKeyInput').value.trim() : '';
  const errorEl = document.getElementById('licenseError');
  const infoEl = document.getElementById('licenseInfo');
  const btn = document.getElementById('licenseActivateBtn');
  if (errorEl) errorEl.style.display = 'none';
  if (infoEl) infoEl.style.display = 'none';
  if (!key || key.length < 10) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = _t('licenseInvalidKey');
    }
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = _t('licenseActivating');
  }
  A.state.ipc
    .invoke('license:activate', { key: key })
    .then(function (result) {
      if (result && result.ok) {
        if (errorEl) errorEl.style.display = 'none';
        if (btn) {
          btn.textContent = _t('licenseActivationSuccess');
        }
        setTimeout(function () {
          if (A._licenseResolve) {
            A._licenseResolve(true);
            A._licenseResolve = null;
          }
          A.hideLicense();
        }, 800);
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = (result && result.error) || _t('licenseActivationFailed');
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = _t('licenseActivateBtn');
        }
      }
    })
    .catch(function (e) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = _t('licenseServerError');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = _t('licenseActivateBtn');
      }
    });
};

A.doDeactivateLicense = function () {
  if (!confirm(_t('licenseDeactivateConfirm'))) return;
  const msgEl = document.getElementById('licenseDeactivationMessage');
  const btn = document.getElementById('licenseDeactivateBtn');
  if (btn) btn.disabled = true;
  A.state.ipc
    .invoke('license:deactivate')
    .then(function () {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--success)';
        msgEl.textContent = _t('licenseDeactivateSuccess');
      }
      setTimeout(function () {
        if (A._licenseResolve) {
          A._licenseResolve(false);
          A._licenseResolve = null;
        }
        A.showLicenseActivation();
      }, 800);
    })
    .catch(function () {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.textContent = _t('licenseServerError');
      }
      if (btn) btn.disabled = false;
    });
};

A.skipLicense = function (e) {
  if (e) e.preventDefault();
  if (A._licenseResolve) {
    A._licenseResolve(true);
    A._licenseResolve = null;
  }
  A.hideLicense();
};

A.initLicenseUI = function () {
  const btn = document.getElementById('licenseActivateBtn');
  const deactBtn = document.getElementById('licenseDeactivateBtn');
  const skipBtn = document.getElementById('licenseSkipBtn');
  const manageBtn = document.getElementById('licenseManageBtn');
  const backBtn = document.getElementById('licenseDeactivateBackBtn');
  const input = document.getElementById('licenseKeyInput');
  if (btn) btn.addEventListener('click', A.doActivateLicense);
  if (deactBtn) deactBtn.addEventListener('click', A.doDeactivateLicense);
  if (skipBtn) skipBtn.addEventListener('click', A.skipLicense);
  if (manageBtn)
    manageBtn.addEventListener('click', function () {
      A.showLicenseDeactivation();
    });
  if (backBtn)
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      A.hideLicense();
    });
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') A.doActivateLicense();
    });
    input.addEventListener('input', function () {
      const errorEl = document.getElementById('licenseError');
      if (errorEl) errorEl.style.display = 'none';
    });
  }

  // Listen for license invalidated push from main process
  if (A.state.ipc) {
    A.state.ipc.on('license:invalidated', function () {
      A.showLicenseActivation(null);
    });
  }
};
