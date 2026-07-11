var A = (window.App = window.App || {});

const HELP_ARTICLES = {
  guide: [
    { module: 'dashboard', icon: 'ri-dashboard-line', titleKey: 'guideDashboardTitle', contentKey: 'guideDashboardContent' },
    { module: 'cases', icon: 'ri-briefcase-line', titleKey: 'guideCasesTitle', contentKey: 'guideCasesContent' },
    { module: 'clients', icon: 'ri-group-line', titleKey: 'guideClientsTitle', contentKey: 'guideClientsContent' },
    { module: 'hearings', icon: 'ri-calendar-event-line', titleKey: 'guideHearingsTitle', contentKey: 'guideHearingsContent' },
    { module: 'documents', icon: 'ri-file-text-line', titleKey: 'guideDocumentsTitle', contentKey: 'guideDocumentsContent' },
    { module: 'calendar', icon: 'ri-calendar-2-line', titleKey: 'guideCalendarTitle', contentKey: 'guideCalendarContent' },
    { module: 'tasks', icon: 'ri-task-line', titleKey: 'guideTasksTitle', contentKey: 'guideTasksContent' },
    { module: 'expenses', icon: 'ri-money-dollar-circle-line', titleKey: 'guideExpensesTitle', contentKey: 'guideExpensesContent' },
    { module: 'ai', icon: 'ri-robot-3-line', titleKey: 'guideAITitle', contentKey: 'guideAIContent' },
    { module: 'reports', icon: 'ri-bar-chart-2-line', titleKey: 'guideReportsTitle', contentKey: 'guideReportsContent' },
    { module: 'archive', icon: 'ri-archive-line', titleKey: 'guideArchiveTitle', contentKey: 'guideArchiveContent' },
    { module: 'search', icon: 'ri-search-line', titleKey: 'guideSearchTitle', contentKey: 'guideSearchContent' }
  ],
  faq: [
    { module: 'general', questionKey: 'faq01Q', answerKey: 'faq01A' },
    { module: 'general', questionKey: 'faq02Q', answerKey: 'faq02A' },
    { module: 'general', questionKey: 'faq03Q', answerKey: 'faq03A' },
    { module: 'general', questionKey: 'faq04Q', answerKey: 'faq04A' },
    { module: 'ai', questionKey: 'faq05Q', answerKey: 'faq05A' },
    { module: 'ai', questionKey: 'faq06Q', answerKey: 'faq06A' },
    { module: 'cases', questionKey: 'faq07Q', answerKey: 'faq07A' },
    { module: 'cases', questionKey: 'faq08Q', answerKey: 'faq08A' },
    { module: 'hearings', questionKey: 'faq09Q', answerKey: 'faq09A' },
    { module: 'tasks', questionKey: 'faq10Q', answerKey: 'faq10A' },
    { module: 'security', questionKey: 'faq11Q', answerKey: 'faq11A' },
    { module: 'security', questionKey: 'faq12Q', answerKey: 'faq12A' }
  ],
  kb: [
    { module: 'security-permissions', icon: 'ri-shield-check-line', titleKey: 'kbSecurityPermissionsTitle', contentKey: 'kbSecurityPermissionsContent' },
    { module: 'security-keys', icon: 'ri-key-line', titleKey: 'kbSecurityKeysTitle', contentKey: 'kbSecurityKeysContent' },
    { module: 'backup', icon: 'ri-database-2-line', titleKey: 'kbBackupTitle', contentKey: 'kbBackupContent' },
    { module: 'keyboard', icon: 'ri-keyboard-line', titleKey: 'kbKeyboardTitle', contentKey: 'kbKeyboardContent' },
    { module: 'troubleshooting', icon: 'ri-tools-line', titleKey: 'kbTroubleshootingTitle', contentKey: 'kbTroubleshootingContent' }
  ]
};

A.initHelp = function () {
  const container = document.getElementById('helpContainer');
  if (!container) { console.error('helpContainer not found'); return; }
  container.addEventListener('click', e => {
    const tabBtn = e.target.closest('.help-tab');
    if (tabBtn) {
      document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
      tabBtn.classList.add('active');
      document.querySelectorAll('.help-tab-content').forEach(t => t.classList.remove('active'));
      const target = document.getElementById(tabBtn.dataset.tab);
      if (target) target.classList.add('active');
      if (tabBtn.dataset.tab === 'helpGuideTab') A.renderGuide();
      else if (tabBtn.dataset.tab === 'helpFaqTab') A.renderFaq();
      else if (tabBtn.dataset.tab === 'helpKbTab') A.renderKb();
      else if (tabBtn.dataset.tab === 'helpHealthTab') A.renderHealth();
    }
    const articleLink = e.target.closest('.help-sidebar-item');
    if (articleLink) {
      document.querySelectorAll('.help-sidebar-item').forEach(i => i.classList.remove('active'));
      articleLink.classList.add('active');
      const article = HELP_ARTICLES.guide.find(a => a.module === articleLink.dataset.module);
      const contentEl = document.getElementById('helpGuideContent');
      if (article && contentEl) {
        contentEl.innerHTML = `<h2>${_t(article.titleKey)}</h2>${_t(article.contentKey)}`;
      }
    }
    const kbLink = e.target.closest('.help-kb-item');
    if (kbLink && !e.target.closest('.help-kb-search')) {
      document.querySelectorAll('.help-kb-item').forEach(i => i.classList.remove('active'));
      kbLink.classList.add('active');
      const article = HELP_ARTICLES.kb.find(a => a.module === kbLink.dataset.module);
      const contentEl = document.getElementById('helpKbContent');
      if (article && contentEl) {
        contentEl.innerHTML = `<h2>${_t(article.titleKey)}</h2>${_t(article.contentKey)}`;
      }
    }
  });
  const kbSearch = document.getElementById('helpKbSearch');
  if (kbSearch) {
    kbSearch.addEventListener('input', A.debounce(() => A.filterKb(), 200));
  }
  A.renderGuide();
};

A.renderGuide = function () {
  const sidebar = document.getElementById('helpGuideSidebar');
  const content = document.getElementById('helpGuideContent');
  if (!sidebar || !content) return;
  sidebar.innerHTML = HELP_ARTICLES.guide.map((a, i) =>
    `<div class="help-sidebar-item${i === 0 ? ' active' : ''}" data-module="${a.module}">
      <i class="${a.icon}"></i><span>${_t(a.titleKey)}</span>
    </div>`
  ).join('');
  const first = HELP_ARTICLES.guide[0];
  if (first) content.innerHTML = `<h2>${_t(first.titleKey)}</h2>${_t(first.contentKey)}`;
};

A.renderFaq = function () {
  const container = document.getElementById('helpFaqList');
  if (!container) return;
  container.innerHTML = HELP_ARTICLES.faq.map(a =>
    `<div class="help-faq-item">
      <div class="help-faq-header">
        <i class="ri-question-line"></i>
        <span>${_t(a.questionKey)}</span>
        <i class="ri-arrow-down-s-line help-faq-arrow"></i>
      </div>
      <div class="help-faq-body">${_t(a.answerKey)}</div>
    </div>`
  ).join('');
  container.querySelectorAll('.help-faq-header').forEach(h => {
    h.addEventListener('click', function (e) {
      const item = this.closest('.help-faq-item');
      if (item) item.classList.toggle('open');
    });
  });
};

A.renderKb = function () {
  const container = document.getElementById('helpKbList');
  const content = document.getElementById('helpKbContent');
  if (!container) return;
  const articles = HELP_ARTICLES.kb;
  container.innerHTML = articles.map((a, i) =>
    `<div class="help-kb-item${i === 0 ? ' active' : ''}" data-module="${a.module}" data-idx="${i}">
      <i class="${a.icon}"></i>
      <div><strong>${_t(a.titleKey)}</strong><p>${A.escapeHtml(_t(a.contentKey).replace(/<[^>]*>/g, '').slice(0, 120))}...</p></div>
    </div>`
  ).join('');
  if (content && articles[0]) {
    content.innerHTML = `<h2>${_t(articles[0].titleKey)}</h2>${_t(articles[0].contentKey)}`;
  }
  const search = document.getElementById('helpKbSearch');
  if (search) search.value = '';
  container.querySelectorAll('.help-kb-item').forEach(el => {
    el.addEventListener('click', function (e) {
      if (e.target.closest('.help-kb-search')) return;
      document.querySelectorAll('.help-kb-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      const idx = parseInt(this.dataset.idx, 10);
      const article = HELP_ARTICLES.kb[idx];
      const contentEl = document.getElementById('helpKbContent');
      if (article && contentEl) {
        contentEl.innerHTML = `<h2>${_t(article.titleKey)}</h2>${_t(article.contentKey)}`;
      }
    });
  });
};

A.filterKb = function () {
  const q = (document.getElementById('helpKbSearch').value || '').toLowerCase();
  let visibleCount = 0;
  let firstVisible = null;
  document.querySelectorAll('.help-kb-item').forEach(el => {
    const match = el.textContent.toLowerCase().includes(q);
    el.style.display = match ? '' : 'none';
    if (match) { visibleCount++; if (!firstVisible) firstVisible = el; }
  });
  const list = document.getElementById('helpKbList');
  let empty = list.querySelector('.help-kb-empty');
  if (!visibleCount) {
    if (!empty) {
      empty = document.createElement('p');
      empty.className = 'help-kb-empty';
      empty.style.cssText = 'text-align:center;color:var(--muted-foreground);padding:20px;';
      empty.textContent = _t('helpKbNoResults');
      list.appendChild(empty);
    }
    empty.style.display = '';
  } else if (empty) {
    empty.style.display = 'none';
  }
  const active = document.querySelector('.help-kb-item.active');
  if (!active || active.style.display === 'none') {
    if (firstVisible) {
      document.querySelectorAll('.help-kb-item').forEach(i => i.classList.remove('active'));
      firstVisible.classList.add('active');
      const idx = firstVisible.dataset.idx ? parseInt(firstVisible.dataset.idx, 10) : 0;
      const article = idx != null && !isNaN(idx) ? HELP_ARTICLES.kb[idx] : null;
      const contentEl = document.getElementById('helpKbContent');
      if (article && contentEl) contentEl.innerHTML = `<h2>${_t(article.titleKey)}</h2>${_t(article.contentKey)}`;
    } else {
      const contentEl = document.getElementById('helpKbContent');
      if (contentEl) contentEl.innerHTML = '';
    }
  }
};

A.renderHealth = async function () {
  const container = document.getElementById('helpHealthContent');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center;padding:40px;"><i class="ri-loader-4-line ri-spin" style="font-size:24px;color:var(--gold);"></i></p>';
  try {
    const data = A.state.ipc ? await A.state.ipc.invoke('help:getSystemHealth') : {};
    container.innerHTML = `
      <div class="health-grid">
        <div class="health-card ${data.dbOk !== false ? 'health-ok' : 'health-warn'}">
          <i class="ri-database-2-line"></i>
          <div class="health-card-label">${_t('healthDatabase')}</div>
          <div class="health-card-value">${data.dbSize || '—'}</div>
          <div class="health-card-sub">${data.recordCounts || ''}</div>
        </div>
        <div class="health-card ${data.apiKeyOk ? 'health-ok' : 'health-warn'}">
          <i class="ri-key-2-line"></i>
          <div class="health-card-label">${_t('healthApiKey')}</div>
          <div class="health-card-value">${data.apiKeyOk ? _t('healthConnected') : _t('healthNotConfigured')}</div>
          <div class="health-card-sub">${data.apiProvider || ''}</div>
        </div>
        <div class="health-card ${data.licenseOk ? 'health-ok' : 'health-warn'}">
          <i class="ri-file-shield-line"></i>
          <div class="health-card-label">${_t('healthLicense')}</div>
          <div class="health-card-value">${data.licenseOk ? _t('healthValid') : _t('healthInvalid')}</div>
          <div class="health-card-sub">${data.licenseInfo || ''}</div>
        </div>
        <div class="health-card ${data.backupOk !== false ? 'health-ok' : 'health-warn'}">
          <i class="ri-history-line"></i>
          <div class="health-card-label">${_t('healthBackup')}</div>
          <div class="health-card-value">${data.lastBackup || _t('healthNoBackup')}</div>
          <div class="health-card-sub">${data.backupCount ? _t('healthBackupCount') + ': ' + data.backupCount : ''}</div>
        </div>
        <div class="health-card ${data.storageOk !== false ? 'health-ok' : 'health-warn'}">
          <i class="ri-hard-drive-line"></i>
          <div class="health-card-label">${_t('healthStorage')}</div>
          <div class="health-card-value">${data.freeSpace || '—'}</div>
          <div class="health-card-sub">${_t('healthFree')}</div>
        </div>
        <div class="health-card ${navigator.onLine ? 'health-ok' : 'health-warn'}">
          <i class="ri-wifi-line"></i>
          <div class="health-card-label">${_t('healthNetwork')}</div>
          <div class="health-card-value">${navigator.onLine ? _t('healthOnline') : _t('healthOffline')}</div>
          <div class="health-card-sub">${navigator.onLine ? '' : _t('healthOfflineDesc')}</div>
        </div>
      </div>
      <p style="text-align:center;margin-top:var(--spacing-4);font-size:12px;color:var(--muted-foreground);">
        <i class="ri-refresh-line"></i> ${_t('healthAutoRefresh')}
        <button class="btn btn-xs btn-secondary" style="margin-right:8px;" id="healthRefreshBtn"><i class="ri-refresh-line"></i> ${_t('healthRefresh')}</button>
      </p>`;
    document.getElementById('healthRefreshBtn')?.addEventListener('click', () => A.renderHealth());
  } catch (e) {
    A.logError('renderHealth', e);
    container.innerHTML = '<p style="text-align:center;color:var(--destructive);padding:40px;">' + _t('failedLoadReport') + '</p>';
  }
};
