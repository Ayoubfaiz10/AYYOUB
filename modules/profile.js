var A = (window.App = window.App || {});

A.loadProfile = async function () {
  if (!A.state.ipc) return;
  try {
    const user = await A.state.ipc.invoke('auth:getCurrentUser');
    if (!user) return;
    const container = document.getElementById('profileContent');
    if (!container) return;

    A.initProfileForm(user);

    const avatar = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const roleEl = document.getElementById('profileRole');
    if (avatar) {
      if (user.avatar && user.avatar.startsWith('data:image')) {
        avatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = user.avatar;
        img.alt = 'avatar';
        img.style.cssText = 'width:80px;height:80px;border-radius:50%;object-fit:cover';
        avatar.appendChild(img);
        avatar.style.background = 'none';
      } else {
        avatar.textContent = (user.name || 'م')[0];
        avatar.style.background = '';
      }
    }
    if (nameEl) nameEl.textContent = user.name || '';
    if (roleEl) roleEl.textContent = user.role || '';

    document.getElementById('profileLastLogin').textContent = user.last_login || '—';

    const apiStatus = document.getElementById('profileApiKeyStatus');
    try {
      const aiConfig = await A.state.ipc.invoke('ai:getConfig');
      if (apiStatus) {
        if (aiConfig && aiConfig.hasKey) {
          apiStatus.textContent = _t('profileApiKeySet') || 'مضبوط';
          apiStatus.className = 'badge badge-success';
        } else {
          apiStatus.textContent = _t('profileApiKeyNotSet') || 'غير مضبوط';
          apiStatus.className = 'badge badge-danger';
        }
      }
    } catch (e) {}

    const activityList = document.getElementById('profileActivityList');
    if (activityList) {
      try {
        const logs = await A.cachedInvoke('db:getLogs', { limit: 5 });
        if (logs && logs.length) {
          A.safeSet(activityList, function (esc) {
            return logs
              .map(function (l) {
                return (
                  '<div class="profile-activity-item"><span class="profile-activity-dot"></span><span class="profile-activity-text">' +
                  esc(l.details || l.action || '') +
                  '</span><span class="profile-activity-time">' +
                  (l.created_at ? l.created_at.slice(11, 16) : '') +
                  '</span></div>'
                );
              })
              .join('');
          });
        } else {
          A.safeSetStatic(activityList, '<p class="empty-state-sm">' + _t('notifNoNotifs') + '</p>');
        }
      } catch (e) {
        A.safeSetStatic(activityList, '<p class="empty-state-sm">' + _t('failedLoadNotifications') + '</p>');
      }
    }
  } catch (e) {
    A.logError('loadProfile', e);
  }
};

A.initProfileForm = function (user) {
  if (!user) return;
  const setVal = function (id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  setVal('pfName', user.name);
  setVal('pfEmail', user.email);
  setVal('pfPhone', user.phone);
  setVal('pfBarNumber', user.bar_number);
  setVal('pfCity', user.city);
  setVal('pfExperience', user.experience_years);

  const saved = (user.specialties || '')
    .split(',')
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  const checks = document.querySelectorAll('#pfSpecialties input[type="checkbox"]');
  checks.forEach(function (cb) {
    cb.checked = saved.indexOf(cb.value) !== -1;
  });
};

A.initProfile = function () {
  const avatarEl = document.getElementById('profileAvatar');
  const fileInput = document.getElementById('pfAvatarInput');

  function triggerAvatarUpload() {
    if (fileInput) fileInput.click();
  }

  if (avatarEl) avatarEl.addEventListener('click', triggerAvatarUpload);
  document.getElementById('pfChangePhotoBtn')?.addEventListener('click', triggerAvatarUpload);

  if (fileInput) {
    fileInput.addEventListener('change', async function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) {
        A.showToast('حجم الصورة يجب أن لا يتجاوز 1 ميغابايت', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async function (e) {
        const dataUrl = e.target.result;
        try {
          const result = await A.state.ipc.invoke('auth:updateProfile', { avatar: dataUrl });
          if (result && result.ok) {
            A.showToast('تم تغيير الصورة بنجاح', 'success');
            A.loadProfile();
          } else {
            A.showToast(result?.error || 'فشل حفظ الصورة', 'error');
          }
        } catch (err) {
          A.showToast('خطأ في حفظ الصورة', 'error');
        }
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  }

  document.getElementById('profileSaveBtn')?.addEventListener('click', async function () {
    const data = {};
    const name = document.getElementById('pfName')?.value?.trim();
    if (!name) {
      A.showToast('الاسم مطلوب', 'error');
      return;
    }
    data.name = name;
    const email = document.getElementById('pfEmail')?.value?.trim();
    if (email) data.email = email;
    const phone = document.getElementById('pfPhone')?.value?.trim();
    if (phone) data.phone = phone;
    const bar = document.getElementById('pfBarNumber')?.value?.trim();
    if (bar) data.bar_number = bar;
    const city = document.getElementById('pfCity')?.value?.trim();
    if (city) data.city = city;
    const exp = document.getElementById('pfExperience')?.value;
    if (exp) data.experience_years = parseInt(exp, 10);
    const specialties = [];
    document.querySelectorAll('#pfSpecialties input[type="checkbox"]:checked').forEach(function (cb) {
      specialties.push(cb.value);
    });
    data.specialties = specialties.join(',');

    try {
      const result = await A.state.ipc.invoke('auth:updateProfile', data);
      if (result && result.ok) {
        A.showToast(_t('savedSuccessfully') || 'تم الحفظ بنجاح', 'success');
        A.loadProfile();
      } else {
        A.showToast(result?.error || 'فشل الحفظ', 'error');
      }
    } catch (e) {
      A.showToast('خطأ في الحفظ', 'error');
    }
  });

  document.getElementById('pfChangePwdBtn')?.addEventListener('click', async function () {
    const oldPwd = document.getElementById('pfCurrentPwd')?.value;
    const newPwd = document.getElementById('pfNewPwd')?.value;
    const confirmPwd = document.getElementById('pfConfirmPwd')?.value;
    const msgEl = document.getElementById('pfPwdMsg');

    if (!oldPwd) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--destructive)';
        msgEl.textContent = 'كلمة السر الحالية مطلوبة';
      }
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--destructive)';
        msgEl.textContent = 'كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل';
      }
      return;
    }
    if (newPwd !== confirmPwd) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--destructive)';
        msgEl.textContent = 'كلمتا السر غير متطابقتين';
      }
      return;
    }

    try {
      const result = await A.state.ipc.invoke('auth:changePassword', { oldPassword: oldPwd, newPassword: newPwd });
      if (result && result.ok) {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = 'var(--success)';
          msgEl.textContent = 'تم تغيير كلمة السر بنجاح';
        }
        document.getElementById('pfCurrentPwd').value = '';
        document.getElementById('pfNewPwd').value = '';
        document.getElementById('pfConfirmPwd').value = '';
      } else {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.style.color = 'var(--destructive)';
          msgEl.textContent = result?.error || 'فشل تغيير كلمة السر';
        }
      }
    } catch (e) {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.color = 'var(--destructive)';
        msgEl.textContent = 'خطأ في تغيير كلمة السر';
      }
    }
  });
};
