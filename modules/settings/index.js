window.App = window.App || {};
const A = window.App;

A.loadSettingsUsers = async function() {
  if (!A.state.ipc) return;
  const users = await A.cachedInvoke('auth:getUsers');
  const body = document.getElementById('settingsUsersBody');
  if (!body) return;
  A.safeSet(body, esc => users.map(u => `<tr>
    <td><strong>${esc(u.name)}</strong></td>
    <td>${esc(u.email||'-')}</td>
    <td><span class="badge ${u.role === 'admin' ? 'badge-active' : 'badge-gold'}">${esc(u.role)}</span></td>
    <td>${u.active ? '<span class="badge badge-active" style="background:var(--success);">نشط</span>' : '<span class="badge badge-closed">غير نشط</span>'}</td>
    <td style="font-size:11px;color:var(--gray-400);">${u.last_login ? u.last_login.slice(0,16) : '—'}</td>
    <td><button class="btn-icon" onclick="editSettingsUser(${u.id})"><i class="ri-pencil-line"></i></button>${u.id !== 1 ? `<button class="btn-icon" onclick="deleteSettingsUser(${u.id})"><i class="ri-delete-bin-line"></i></button>` : ''}</td>
  </tr>`).join(''));
};

window.editSettingsUser = async function(id) {
  if (!A.state.ipc) return;
  const users = await A.cachedInvoke('auth:getUsers');
  const u = users.find(x => x.id === id);
  if (!u) return;
  const esc = A.escapeHtml;
  A.showModal('تعديل المستخدم', `
    <div class="input-group"><label class="input-label">الاسم</label><input type="text" id="fUserName" class="input" value="${esc(u.name)}"></div>
    <div class="input-group"><label class="input-label">البريد</label><input type="email" id="fUserEmail" class="input" value="${esc(u.email||'')}"></div>
    <div class="info-grid-2">
      <div class="input-group"><label class="input-label">الدور</label><select id="fUserRole" class="input">${['admin','senior_lawyer','junior_lawyer','assistant','intern','external'].map(r => `<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></div>
      <div class="input-group"><label class="input-label">نشط</label><select id="fUserActive" class="input"><option value="1" ${u.active?'selected':''}>نعم</option><option value="0" ${!u.active?'selected':''}>لا</option></select></div>
    </div>
    <div class="input-group"><label class="input-label">كلمة سر جديدة (اترك فارغاً للإبقاء)</label><input type="password" id="fUserPwd" class="input"></div>
  `, async () => {
    const data = { name: document.getElementById('fUserName').value, email: document.getElementById('fUserEmail').value, role: document.getElementById('fUserRole').value, active: parseInt(document.getElementById('fUserActive').value) };
    const pwd = document.getElementById('fUserPwd').value;
    if (pwd) { const r = await A.mutate('auth:hashPassword', pwd); if (r && r.ok) data.password_hash = r.hash; else { A.showToast(r?.error || 'فشل تشفير كلمة السر', 'error'); return; } }
    const r2 = await A.mutate('auth:updateUser', id, data);
    if (r2 && !r2.ok) { A.showToast(r2.error || 'فشل تحديث المستخدم', 'error'); return; }
    A.hideModal(); A.showToast('تم تحديث المستخدم بنجاح', 'success'); A.loadSettingsUsers();
  });
};

window.deleteSettingsUser = async function(id) {
  if (await A.showConfirm('حذف هذا المستخدم؟')) { await A.mutate('auth:deleteUser', id); A.loadSettingsUsers(); }
};

A.initSettings = function() {
  document.getElementById('settingAddUserBtn')?.addEventListener('click', () => {
    A.showModal('مستخدم جديد', `
      <div class="input-group"><label class="input-label">الاسم</label><input type="text" id="fUserName" class="input"></div>
      <div class="input-group"><label class="input-label">البريد</label><input type="email" id="fUserEmail" class="input"></div>
      <div class="info-grid-2">
        <div class="input-group"><label class="input-label">الدور</label><select id="fUserRole" class="input">${['admin','senior_lawyer','junior_lawyer','assistant','intern','external'].map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
        <div class="input-group"><label class="input-label">كلمة السر</label><input type="password" id="fUserPwd" class="input" value="123456"></div>
      </div>
    `, async () => {
      await A.mutate('auth:addUser', { name: document.getElementById('fUserName').value, email: document.getElementById('fUserEmail').value, role: document.getElementById('fUserRole').value, password: document.getElementById('fUserPwd').value });
      A.hideModal(); A.loadSettingsUsers();
    });
  });

  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.setting-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('setting-' + item.dataset.setting);
      if (panel) panel.classList.add('active');
      if (item.dataset.setting === 'backup' && typeof A.loadBackupsList === 'function') {
        setTimeout(() => A.loadBackupsList(), 100);
      }
    });
  });

  document.getElementById('settingsChangePwdBtn')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const currentPwd = document.getElementById('settingsCurrentPwd').value;
    const newPwd = document.getElementById('settingsNewPwd').value;
    const confirmPwd = document.getElementById('settingsConfirmPwd').value;
    const msgEl = document.getElementById('settingsPwdMsg');
    if (!currentPwd) { msgEl.textContent = 'الرجاء إدخال كلمة السر الحالية'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
    const loginResult = await A.state.ipc.invoke('auth:login', currentPwd);
    if (loginResult.corrupt) { msgEl.textContent = loginResult.error; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
    if (!loginResult.ok) { msgEl.textContent = loginResult.error || 'كلمة السر الحالية خطأ'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
    if (!newPwd || newPwd.length < 4) { msgEl.textContent = 'كلمة السر الجديدة يجب أن تكون 4 أحرف على الأقل'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
    if (newPwd !== confirmPwd) { msgEl.textContent = 'كلمة السر غير متطابقة'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
    const result = await A.mutate('auth:setPassword', newPwd);
    if (!result || !result.ok) {
      msgEl.textContent = result?.error || 'فشل حفظ كلمة السر'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block';
      return;
    }
    msgEl.textContent = 'تم حفظ كلمة السر بنجاح'; msgEl.style.color = 'var(--success)'; msgEl.style.display = 'block';
    A.showToast('تم تغيير كلمة السر بنجاح', 'success');
    document.getElementById('settingsCurrentPwd').value = '';
    document.getElementById('settingsNewPwd').value = ''; document.getElementById('settingsConfirmPwd').value = '';
  });

  document.getElementById('settingSaveBackup')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    try { await A.mutate('db:updateBackupSettings', {
      auto_enabled: document.getElementById('settingAutoBackup').checked ? 1 : 0,
      frequency_hours: parseInt(document.getElementById('settingBackupFreq').value) || 24,
      keep_count: parseInt(document.getElementById('settingBackupKeep').value) || 30
    }); A.showToast('تم حفظ الإعدادات', 'success'); } catch (e) { A.logError('saveBackupSettings', e); A.showToast('فشل حفظ الإعدادات', 'error'); }
  });

  document.getElementById('settingCreateBackup')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    try { const name = await A.mutate('db:createBackup'); document.getElementById('backupStatus').textContent = `تم إنشاء: ${name}`; A.loadBackupsList(); } catch (e) { A.logError('createBackup', e); A.showToast('فشل إنشاء النسخة الاحتياطية', 'error'); }
  });

  document.getElementById('settingExportArchive')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    try {
      const result = await A.mutate('db:exportArchive');
      document.getElementById('backupStatus').textContent = `تم التصدير: ${result.filename}`;
      A.showToast('تم تصدير الأرشيف بنجاح', 'success');
      A.loadBackupsList();
    } catch (e) { A.logError('exportArchive', e); A.showToast('فشل تصدير الأرشيف', 'error'); }
  });

  // ─── Backup list management ───
  A.loadBackupsList = async function() {
    if (!A.state.ipc) return;
    const listEl = document.getElementById('backupList');
    const statusEl = document.getElementById('backupListStatus');
    const badgeEl = document.getElementById('backupCountBadge');
    if (!listEl) return;
    try {
      const backups = await A.state.ipc.invoke('db:listBackups');
      if (!backups || !backups.length) {
        if (statusEl) statusEl.textContent = 'لا توجد نسخ احتياطية';
        if (badgeEl) badgeEl.textContent = '';
        A.safeSetStatic(listEl, '');
        return;
      }
      if (badgeEl) badgeEl.textContent = `(${backups.length})`;
      if (statusEl) statusEl.textContent = '';
      const formatSize = (bytes) => { if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; };
      const formatDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('ar-MA') + ' ' + d.toLocaleTimeString('ar-MA', {hour:'2-digit',minute:'2-digit'}); };
      const getType = (name) => name.includes('manual') ? 'يدوي' : name.includes('auto') ? 'تلقائي' : name.includes('archive') ? 'أرشيف' : '—';
      const getValidationStatus = (name) => { const v = A.state._backupValidations || {}; return v[name]; };
      A.safeSet(listEl, esc => `<table class="table" style="font-size:12px;"><thead><tr><th>الملف</th><th>التاريخ</th><th>الحجم</th><th>النوع</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>${backups.map(b => {
        const v = getValidationStatus(b.name);
        const statusIcon = v ? (v.valid ? '<span style="color:var(--success);">✔ صالح</span>' : '<span style="color:var(--danger);">✖ تالف</span>') : '<span style="color:var(--gray-300);">—</span>';
        return `<tr>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(b.name)}">${esc(b.name)}</td>
          <td style="white-space:nowrap;">${esc(formatDate(b.mtime))}</td>
          <td>${formatSize(b.size)}</td>
          <td>${getType(b.name)}</td>
          <td id="bs_${b.name.replace(/[^a-zA-Z0-9]/g,'_')}">${statusIcon}</td>
          <td style="white-space:nowrap;">
            <button class="btn-icon backup-validate-btn" data-file="${esc(b.name)}" title="التحقق"><i class="ri-check-double-line"></i></button>
            <button class="btn-icon backup-restore-btn" data-file="${esc(b.name)}" title="استعادة" style="color:var(--gold);"><i class="ri-history-line"></i></button>
            <button class="btn-icon backup-delete-btn" data-file="${esc(b.name)}" title="حذف" style="color:var(--danger);"><i class="ri-delete-bin-line"></i></button>
          </td>
        </tr>`;
      }).join('')}</tbody></table>`);
      listEl.querySelectorAll('.backup-validate-btn').forEach(b => b.addEventListener('click', async () => {
        const file = b.dataset.file;
        try {
          const result = await A.state.ipc.invoke('db:validateBackup', file);
          if (!A.state._backupValidations) A.state._backupValidations = {};
          A.state._backupValidations[file] = result;
          A.loadBackupsList();
          A.showToast(result.valid ? 'النسخة سليمة' : 'النسخة تالفة', result.valid ? 'success' : 'error');
        } catch (e) { A.logError('validateBackup', e); A.showToast('فشل التحقق', 'error'); }
      }));
      listEl.querySelectorAll('.backup-restore-btn').forEach(b => b.addEventListener('click', () => {
        const file = b.dataset.file;
        document.getElementById('restoreConfirmInfo').textContent = 'الملف: ' + file + '\nسيتم استبدال جميع البيانات الحالية بنسخة الاحتياطي.';
        document.getElementById('restoreConfirmOverlay').style.display = 'flex';
        document.getElementById('restoreConfirmProceed').onclick = async () => {
          document.getElementById('restoreConfirmOverlay').style.display = 'none';
          try {
            document.getElementById('backupStatus').textContent = 'جاري الاستعادة...';
            await A.state.ipc.invoke('db:restoreBackup', file);
            A.showToast('تمت استعادة النسخة الاحتياطية بنجاح. تحديث الصفحة...', 'success');
            setTimeout(() => location.reload(), 1500);
          } catch (e) { A.logError('restoreBackup', e); A.showToast('فشل الاستعادة: ' + e.message, 'error'); document.getElementById('backupStatus').textContent = ''; }
        };
      }));
      listEl.querySelectorAll('.backup-delete-btn').forEach(b => b.addEventListener('click', async () => {
        const file = b.dataset.file;
        if (await A.showConfirm('حذف النسخة: ' + file + '؟', 'حذف', 'danger')) {
          try { await A.state.ipc.invoke('db:deleteBackup', file); A.showToast('تم حذف النسخة', 'success'); A.loadBackupsList(); }
          catch (e) { A.logError('deleteBackup', e); A.showToast('فشل حذف النسخة', 'error'); }
        }
      }));
    } catch (e) { A.logError('listBackups', e); if (statusEl) statusEl.textContent = 'فشل تحميل القائمة'; }
  };

  // Close restore confirm overlay
  document.getElementById('restoreConfirmCancel')?.addEventListener('click', () => { document.getElementById('restoreConfirmOverlay').style.display = 'none'; });

  document.getElementById('settingSaveAlerts')?.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    try { await A.mutate('db:updateAlertSettings', {
      days_before_1: parseInt(document.getElementById('settingDays1').value) || 7,
      days_before_2: parseInt(document.getElementById('settingDays2').value) || 3,
      days_before_3: parseInt(document.getElementById('settingDays3').value) || 1,
      enabled: document.getElementById('settingAlertEnabled').checked ? 1 : 0
    }); A.showToast('تم حفظ إعدادات التنبيهات', 'success'); } catch (e) { A.logError('saveAlertSettings', e); A.showToast('فشل حفظ الإعدادات', 'error'); }
  });

  // ─── Log viewer events ───
  const logLevelSel = document.getElementById('logLevelFilter');
  const logSearch = document.getElementById('logSearchFilter');
  const logRefresh = document.getElementById('logRefreshBtn');
  const logExport = document.getElementById('logExportBtn');
  const logClear = document.getElementById('logClearBtn');

  if (logLevelSel) logLevelSel.addEventListener('change', () => {
    logFilters2 = { level: logLevelSel.value || undefined, search: logSearch?.value || undefined };
    A.loadSettingsLogs();
  });

  if (logSearch) logSearch.addEventListener('input', A.debounce(() => {
    logFilters2 = { level: logLevelSel?.value || undefined, search: logSearch.value || undefined };
    A.loadSettingsLogs();
  }, 300));

  if (logRefresh) logRefresh.addEventListener('click', () => {
    logFilters2 = { level: logLevelSel?.value || undefined, search: logSearch?.value || undefined };
    A.loadSettingsLogs();
    if (A.Logger) A.Logger.getStats().then(s => {
      const badge = document.getElementById('logStatsBadge');
      if (badge) badge.textContent = `${s.totalEntries} مدخلة | ${(s.fileSize / 1024).toFixed(0)}KB`;
    });
  });

  if (logExport) logExport.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    try {
      const json = await A.Logger.exportLogs('json');
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `logs_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      A.showToast('تم تصدير السجلات بنجاح', 'success');
    } catch (e) {
      A.showToast('فشل تصدير السجلات', 'error');
    }
  });

  if (logClear) logClear.addEventListener('click', async () => {
    if (await A.showConfirm('مسح جميع سجلات الأخطاء؟')) {
      const ok = await A.Logger.clearLogs();
      if (ok) { A.showToast('تم مسح السجلات', 'success'); A.loadSettingsLogs(); }
      else A.showToast('فشل مسح السجلات', 'error');
    }
  });

  const logNavItem = document.querySelector('.settings-nav-item[data-setting="logs"]');
  if (logNavItem) {
    logNavItem.addEventListener('click', () => {
      setTimeout(() => {
        logFilters2 = {};
        if (logLevelSel) logLevelSel.value = '';
        if (logSearch) logSearch.value = '';
        A.loadSettingsLogs();
        if (A.Logger) A.Logger.getStats().then(s => {
          const badge = document.getElementById('logStatsBadge');
          if (badge) badge.textContent = `${s.totalEntries} مدخلة | ${(s.fileSize / 1024).toFixed(0)}KB`;
        });
      }, 200);
    });
  }

  // ─── Auto-save settings drafts ───
  if (A.AutoSave) {
    ['settingAutoBackup','settingBackupFreq','settingBackupKeep','settingAlertEnabled','settingDays1','settingDays2','settingDays3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => A.AutoSave.markDirty('settings'));
    });
    A.AutoSave.register('settings', {
      getValue: () => JSON.stringify({
        autoBackup: document.getElementById('settingAutoBackup')?.checked ? 1 : 0,
        backupFreq: document.getElementById('settingBackupFreq')?.value || 24,
        backupKeep: document.getElementById('settingBackupKeep')?.value || 30,
        alertEnabled: document.getElementById('settingAlertEnabled')?.checked ? 1 : 0,
        days1: document.getElementById('settingDays1')?.value || 7,
        days2: document.getElementById('settingDays2')?.value || 3,
        days3: document.getElementById('settingDays3')?.value || 1
      }),
      setValue: (v) => {
        try {
          const s = JSON.parse(v);
          const setVal = (id, val) => { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = val === 1 || val === true; else el.value = val; } };
          setVal('settingAutoBackup', s.autoBackup);
          setVal('settingBackupFreq', s.backupFreq);
          setVal('settingBackupKeep', s.backupKeep);
          setVal('settingAlertEnabled', s.alertEnabled);
          setVal('settingDays1', s.days1);
          setVal('settingDays2', s.days2);
          setVal('settingDays3', s.days3);
        } catch {}
      },
      debounce: 3000
    });
  }
};

let logPage = 0;
const LOG_LIMIT = 100;

A.loadSettingsActivity = async function(loadMore = false) {
  if (!A.state.ipc) return;
  if (!loadMore) logPage = 0;
  const logs = await A.cachedInvoke('db:getLogs', { limit: LOG_LIMIT, offset: logPage * LOG_LIMIT });
  const body = document.getElementById('settingsActivityBody');
  if (!body) return;

  const logHtml = logs.map(l => `<tr>
    <td style="font-size:10px;color:var(--gray-400);">${A.escapeHtml(l.created_at||'')}</td>
    <td style="font-size:11px;">${A.escapeHtml(l.user_name||'-')}</td>
    <td><span class="badge badge-gold" style="font-size:9px;">${A.escapeHtml(l.action||'')}</span></td>
    <td style="font-size:11px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${A.escapeHtml(l.details||'')}</td>
  </tr>`).join('');

  if (!loadMore) {
    A.safeSet(body, esc => logHtml);
  } else {
    const currentHtml = body.innerHTML;
    A.safeSet(body, esc => currentHtml + logHtml);
  }

  let loadMoreBtn = document.getElementById('settingsLogLoadMore');
  const container = document.getElementById('settingsLogLoadMoreContainer');
  if (logs.length === LOG_LIMIT) {
    if (!loadMoreBtn && container) {
      const btn = document.createElement('button');
      btn.id = 'settingsLogLoadMore'; btn.className = 'btn btn-outline btn-sm';
      btn.textContent = 'تحميل المزيد'; btn.style.margin = '12px auto'; btn.style.display = 'block';
      btn.onclick = () => { logPage++; A.loadSettingsActivity(true); };
      container.textContent = ''; container.appendChild(btn);
    } else if (loadMoreBtn) { loadMoreBtn.style.display = 'block'; }
  } else if (loadMoreBtn) { loadMoreBtn.style.display = 'none'; }
};

let logPage2 = 0;
const LOG_LIMIT2 = 200;
let logFilters2 = {};

A.loadSettingsLogs = async function(loadMore) {
  if (!A.state.ipc) return;
  if (!loadMore) logPage2 = 0;
  logFilters2.limit = LOG_LIMIT2;
  logFilters2.offset = logPage2 * LOG_LIMIT2;
  const logs = await A.state.ipc.invoke('logger:getLogs', logFilters2);
  const body = document.getElementById('settingsLogsBody');
  if (!body) return;

  const levelColors = { INFO: 'badge-active', WARN: 'badge-gold', ERROR: 'badge-closed', CRITICAL: 'badge-closed' };
  const logHtml = logs.map(l => {
    const lvlBadge = levelColors[l.level] || 'badge-gold';
    const extraClass = l.level === 'CRITICAL' ? ' style="background:var(--danger) !important;"' : '';
    return `<tr>
      <td style="font-size:10px;color:var(--gray-400);white-space:nowrap;">${A.escapeHtml(l.timestamp||'')}</td>
      <td><span class="badge ${lvlBadge}"${extraClass} style="font-size:9px;">${A.escapeHtml(l.level||'')}</span></td>
      <td style="font-size:11px;">${A.escapeHtml(l.context||'')}</td>
      <td style="font-size:11px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${A.escapeHtml(l.message||'')}">${A.escapeHtml(l.message||'')}</td>
    </tr>`;
  }).join('');

  if (!loadMore) {
    A.safeSet(body, esc => logHtml);
  } else {
    const currentHtml = body.innerHTML;
    A.safeSet(body, esc => currentHtml + logHtml);
  }

  let loadMoreBtn = document.getElementById('settingsLogsLoadMore');
  const container = document.getElementById('settingsLogsLoadMoreContainer');
  if (logs.length === LOG_LIMIT2) {
    if (!loadMoreBtn && container) {
      const btn = document.createElement('button');
      btn.id = 'settingsLogsLoadMore'; btn.className = 'btn btn-outline btn-sm';
      btn.textContent = 'تحميل المزيد'; btn.style.margin = '12px auto'; btn.style.display = 'block';
      btn.onclick = () => { logPage2++; A.loadSettingsLogs(true); };
      container.textContent = ''; container.appendChild(btn);
    } else if (loadMoreBtn) { loadMoreBtn.style.display = 'block'; }
  } else if (loadMoreBtn) { loadMoreBtn.style.display = 'none'; }
};

A.initSettingsData = async function() {
  if (!A.state.ipc) return;
  try {
    const s = await A.cachedInvoke('db:getBackupSettings');
    document.getElementById('settingAutoBackup').checked = s.auto_enabled === 1;
    if (s.frequency_hours) document.getElementById('settingBackupFreq').value = s.frequency_hours;
    if (s.keep_count) document.getElementById('settingBackupKeep').value = s.keep_count;
  } catch(e) {}
  try {
    const a = await A.cachedInvoke('db:getAlertSettings');
    document.getElementById('settingAlertEnabled').checked = a.enabled === 1;
    if (a.days_before_1) document.getElementById('settingDays1').value = a.days_before_1;
    if (a.days_before_2) document.getElementById('settingDays2').value = a.days_before_2;
    if (a.days_before_3) document.getElementById('settingDays3').value = a.days_before_3;
  } catch(e) {}
  if (typeof A.loadBackupsList === 'function') A.loadBackupsList();
};
