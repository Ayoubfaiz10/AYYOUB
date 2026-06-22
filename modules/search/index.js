var A = window.App = window.App || {};

A._searchIndex = [];
A._searchIndexLoaded = false;

A.loadSearchIndex = async function() {
  if (A._searchIndexLoaded || !A.state.ipc) return;
  try {
    const idx = await A.state.ipc.invoke('db:getSearchIndex');
    if (idx && idx.length) {
      A._searchIndex = idx.map(r => {
        const lower = r.text.toLowerCase();
        return { ...r, _lower: lower, _words: lower.split(/\s+/).filter(Boolean) };
      });
      A._searchIndexLoaded = true;
    }
  } catch (e) { A.logError('loadSearchIndex', e); }
};

function scoreResult(item, qWords) {
  const lower = item._lower;
  const exact = lower === qWords.join(' ');
  if (exact) return 1000;
  let score = 0;
  for (const w of qWords) {
    if (lower.startsWith(w)) score += 200;
    else if (lower.includes(' ' + w)) score += 100;
    else if (lower.includes(w)) score += 50;
    if (item._words.some(word => word === w)) score += 150;
  }
  return score;
}

function searchLocal(q) {
  if (!q || !A._searchIndex.length) return [];
  const qWords = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!qWords.length) return [];
  const results = [];
  for (const item of A._searchIndex) {
    if (qWords.every(w => item._lower.includes(w))) {
      results.push({ ...item, _score: scoreResult(item, qWords) });
    }
  }
  results.sort((a, b) => b._score - a._score);
  return results.slice(0, 30);
}

function renderSearchResults(results, q, container, inputEl) {
  container.innerHTML = '';
  if (!results.length) {
    A.safeSetStatic(container, '<div class="gsr-empty">لا توجد نتائج</div>');
    container.style.display = 'block';
    return;
  }
  const escQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hl = (t) => t ? A.escapeHtml(t).replace(new RegExp('(' + escQ.split(/\s+/).join('|') + ')', 'gi'), '<span class="gsr-highlight">$1</span>') : '';
  const groupLabels = { case: 'القضايا', client: 'الموكلين', hearing: 'الجلسات', document: 'الوثائق', task: 'المهام', expense: 'المصاريف' };
  const groupIcons = { case: 'ri-briefcase-line', client: 'ri-user-shared-line', hearing: 'ri-calendar-event-line', document: 'ri-file-line', task: 'ri-task-line', expense: 'ri-money-dollar-circle-line' };
  const groups = {};
  results.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
  let html = '<div class="gsr-nav-hint"><kbd>↑</kbd><kbd>↓</kbd> تنقل <kbd>↵</kbd> فتح <kbd>Esc</kbd> إغلاق</div>';
  Object.keys(groups).forEach(type => {
    const items = groups[type];
    html += `<div class="gsr-group"><i class="${groupIcons[type] || 'ri-search-line'}"></i> ${groupLabels[type] || type} (${items.length})</div>`;
    items.forEach(item => {
      html += `<div class="gsr-item" data-section="${item.nav}" data-id="${item.id}" data-type="${item.type}"><div class="gsr-title">${hl(item.label)}</div><div class="gsr-sub">${hl(item.sub)}</div></div>`;
    });
  });
  A.safeSetStatic(container, html);
  container.style.display = 'block';
  container.querySelectorAll('.gsr-item').forEach(el => {
    el.addEventListener('click', () => {
      container.style.display = 'none';
      if (inputEl) inputEl.value = '';
      if (el.dataset.type === 'expense') { A.navigateTo('expenses'); return; }
      if (el.dataset.type === 'document') { A.navigateTo('documents'); return; }
      A.navigateTo(el.dataset.section);
    });
  });
}

A.initGlobalSearch = function() {
  const gs = document.getElementById('globalSearch');
  const gsr = document.getElementById('globalSearchResults');
  if (!gs || !gsr) return;
  let gsActiveIdx = -1;

  gs.addEventListener('input', () => {
    const q = gs.value.trim();
    if (!q) { gsr.style.display = 'none'; return; }
    const results = searchLocal(q);
    renderSearchResults(results, q, gsr, gs);
  });

  gs.addEventListener('blur', () => setTimeout(() => { gsr.style.display = 'none'; gsActiveIdx = -1; }, 200));
  gs.addEventListener('focus', () => {
    const q = gs.value.trim();
    if (q) { const results = searchLocal(q); renderSearchResults(results, q, gsr, gs); }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); gs.focus(); gs.select(); }
  });

  gs.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { gsr.style.display = 'none'; gsActiveIdx = -1; gs.blur(); return; }
    const items = gsr.querySelectorAll('.gsr-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); gsActiveIdx = gsActiveIdx < items.length - 1 ? gsActiveIdx + 1 : 0; updateActive(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); gsActiveIdx = gsActiveIdx > 0 ? gsActiveIdx - 1 : items.length - 1; updateActive(items); }
    else if (e.key === 'Enter' && gsActiveIdx >= 0) { e.preventDefault(); items[gsActiveIdx].click(); }
  });

  function updateActive(items) {
    items.forEach((el, i) => el.classList.toggle('active', i === gsActiveIdx));
    if (gsActiveIdx >= 0 && items[gsActiveIdx]) items[gsActiveIdx].scrollIntoView({ block: 'nearest' });
  }
};

// ─── Recent Items ───
A._recentItems = [];

A.addRecentItem = function(type, id, label, sub, nav) {
  const key = type + '_' + id;
  A._recentItems = A._recentItems.filter(r => r.key !== key);
  A._recentItems.unshift({ key, type, id, label, sub, nav, time: Date.now() });
  if (A._recentItems.length > 8) A._recentItems.pop();
  try { localStorage.setItem('cp_recent', JSON.stringify(A._recentItems.map(r => ({ ...r, time: 0 })))); } catch {}
};

A.getRecentItems = function() {
  return A._recentItems.slice(0, 6);
};

A.loadRecentItems = function() {
  try {
    const saved = localStorage.getItem('cp_recent');
    if (saved) A._recentItems = JSON.parse(saved);
  } catch {}
};

// ─── Navigation commands ───
const CMD_NAV_ACTIONS = [
  { text: 'لوحة القيادة', sub: 'الانتقال إلى dashboard', words: 'dashboard لوحة القيادة الرئيسية الرئيسي home accueil', nav: 'dashboard', icon: 'ri-dashboard-line', kbd: '1' },
  { text: 'القضايا', sub: 'عرض جميع القضايا', words: 'cases قضايا ملفات affaires', nav: 'cases', icon: 'ri-briefcase-line', kbd: '2' },
  { text: 'الموكلين', sub: 'عرض جميع الموكلين', words: 'clients موكلين عملاء clients', nav: 'clients', icon: 'ri-user-3-line', kbd: '3' },
  { text: 'الوثائق', sub: 'إدارة الوثائق والملفات', words: 'documents وثائق ملفات مستندات documents', nav: 'documents', icon: 'ri-file-4-line', kbd: '4' },
  { text: 'التقويم', sub: 'عرض الجلسات والمواعيد', words: 'calendar تقويم جلسات مواعيد calendrier rendez-vous', nav: 'calendar', icon: 'ri-calendar-event-line', kbd: '5' },
  { text: 'المهام', sub: 'إدارة المهام', words: 'tasks مهام مهمات taches', nav: 'tasks', icon: 'ri-task-line', kbd: '6' },
  { text: 'البحث المتقدم', sub: 'بحث شامل في جميع البيانات', words: 'search بحث متقدم recherche avancée', nav: 'search', icon: 'ri-search-line', kbd: '7' },
  { text: 'الإعدادات', sub: 'تعديل الإعدادات', words: 'settings إعدادات parametres configuration', nav: 'settings', icon: 'ri-settings-4-line', kbd: '8' },
  { text: 'التقارير', sub: 'التقارير والإحصائيات', words: 'reports تقارير rapports statistiques', nav: 'reports', icon: 'ri-bar-chart-line', kbd: '9' },
  { text: 'المساعد الذكي', sub: 'AI Assistant', words: 'ai مساعد ذكي robot intelligence artificielle', nav: 'ai', icon: 'ri-robot-3-line', kbd: '0' },
  { text: 'المصاريف', sub: 'عرض المصاريف والمدفوعات', words: 'expenses مصاريف مدفوعات dépenses paiements', nav: 'expenses', icon: 'ri-money-dollar-circle-line' },
  { text: 'الأرشيف', sub: 'القضايا المؤرشفة', words: 'archive أرشيف archivées', nav: 'archive', icon: 'ri-archive-line' },
];

const CMD_CREATE_ACTIONS = [
  { icon: 'ri-add-line', iconBg: '#1E2A38', text: 'قضية جديدة', sub: 'إنشاء قضية جديدة', action: 'newcase', kbd: 'C' },
  { icon: 'ri-user-add-line', iconBg: '#1E2A38', text: 'موكل جديد', sub: 'إضافة موكل جديد', action: 'newclient', kbd: 'U' },
  { icon: 'ri-file-add-line', iconBg: '#C6A15B', text: 'رفع وثيقة', sub: 'تحميل مستند جديد', action: 'doc', kbd: 'D' },
  { icon: 'ri-task-add-line', iconBg: '#C6A15B', text: 'مهمة جديدة', sub: 'إضافة مهمة جديدة', action: 'task', kbd: 'T' },
  { icon: 'ri-scales-line', iconBg: '#C6A15B', text: 'جلسة جديدة', sub: 'تسجيل جلسة جديدة', action: 'hearing', kbd: 'H' },
];

const CMD_QUICK_ACTIONS = [
  { text: 'إنشاء نسخة احتياطية', sub: 'Backup يدوي', words: 'backup نسخة احتياطية sauvegarde', action: 'backup', icon: 'ri-save-3-line', iconBg: '#1E2A38' },
  { text: 'التحقق من سلامة البيانات', sub: 'Integrity Check', words: 'integrity سلامة بيانات تحقق vérification', action: 'integrity', icon: 'ri-check-double-line', iconBg: '#C6A15B' },
  { text: 'إصلاح البيانات', sub: 'Repair Orphans', words: 'repair إصلاح بيانات correction', action: 'repair', icon: 'ri-tools-line', iconBg: '#C6A15B' },
  { text: 'عرض لوحة المعلومات', sub: 'Dashboard', words: 'dashboard home الرئيسية', action: 'nav_dashboard', icon: 'ri-dashboard-line', iconBg: '#1E2A38' },
];

function matchNavAction(q, action) {
  if (!q) return true;
  const lower = action.text + ' ' + action.sub + ' ' + action.words;
  return lower.includes(q);
}

function execCmdItem() {
  const palette = document.getElementById('commandPalette');
  palette.style.display = 'none';
  const action = this.dataset.action;
  const id = this.dataset.id;
  const section = this.dataset.section;

  if (action === 'nav' && section) { A.navigateTo(section); }
  else if (action === 'case' && id) { A.addRecentItem('case', id, this.dataset.label, this.dataset.sub, 'cases'); A.navigateTo('cases'); setTimeout(() => A.openCaseDetail(parseInt(id)), 200); }
  else if (action === 'client' && id) { A.addRecentItem('client', id, this.dataset.label, this.dataset.sub, 'clients'); A.navigateTo('clients'); setTimeout(() => A.openClientDetail(parseInt(id)), 200); }
  else if (action === 'expense') { A.navigateTo('expenses'); }
  else if (action === 'doc') document.getElementById('uploadDocGlobalBtn')?.click();
  else if (action === 'task') A.showTaskForm();
  else if (action === 'hearing') A.showEventForm();
  else if (action === 'newcase') document.getElementById('addCaseBtn')?.click();
  else if (action === 'newclient') { A.navigateTo('clients'); setTimeout(() => document.getElementById('addClientBtn')?.click(), 100); }
  else if (action === 'backup') { A.navigateTo('settings'); setTimeout(() => document.querySelector('[data-setting="backup"]')?.click(), 200); }
  else if (action === 'integrity') { A.navigateTo('settings'); setTimeout(() => { if (A.runIntegrityCheck) A.runIntegrityCheck(); }, 200); }
  else if (action === 'repair') { A.navigateTo('settings'); setTimeout(() => { if (A.repairOrphans) A.repairOrphans(); }, 200); }
  else if (action === 'nav_dashboard') { A.navigateTo('dashboard'); }
}

A.initCommandPalette = function() {
  A.loadRecentItems();
  let cmdIndex = -1;
  let cmdAbort = false;

  const palette = document.getElementById('commandPalette');
  const input = document.getElementById('cmdInput');
  const results = document.getElementById('cmdResults');
  if (!palette || !input || !results) return;

  function buildCommands(q) {
    const query = (q || '').toLowerCase().trim();
    const hasQuery = query.length > 0;

    // Recent items (only when no query)
    const recent = !hasQuery ? A.getRecentItems() : [];

    // Navigation actions filtered by query
    const navItems = hasQuery ? CMD_NAV_ACTIONS.filter(a => matchNavAction(query, a)) : [];

    // Create actions filtered
    const createItems = CMD_CREATE_ACTIONS.filter(a => !hasQuery || a.text.includes(query) || a.sub.includes(query));

    // Quick actions filtered
    const quickItems = hasQuery ? CMD_QUICK_ACTIONS.filter(a => matchNavAction(query, a)) : [];

    // Search results from local index (only when query)
    const searchResults = hasQuery ? searchLocal(query).slice(0, 10) : [];

    // Empty state
    if (!hasQuery && !recent.length && !createItems.length) {
      return '<div style="text-align:center;padding:60px 20px;color:var(--gray-300);"><i class="ri-search-line" style="font-size:48px;display:block;margin-bottom:12px;"></i><p style="font-size:14px;">ابدأ الكتابة للبحث...</p><p style="font-size:11px;margin-top:4px;">ابحث عن قضايا، موكلين، وثائق، مهام، أو اكتب أمراً</p></div>';
    }
    if (hasQuery && !searchResults.length && !navItems.length && !createItems.length && !quickItems.length) {
      return '<div style="text-align:center;padding:60px 20px;color:var(--gray-300);"><i class="ri-inbox-line" style="font-size:48px;display:block;margin-bottom:12px;"></i><p style="font-size:14px;">لا توجد نتائج لـ "<strong style="color:var(--gray-400);">' + A.escapeHtml(query) + '</strong>"</p><p style="font-size:11px;margin-top:4px;">جرب كلمات مختلفة أو استخدم البحث المتقدم</p></div>';
    }

    const esc = A.escapeHtml;
    const groupIcons = { case: 'ri-briefcase-line', client: 'ri-user-3-line', hearing: 'ri-calendar-event-line', document: 'ri-file-4-line', task: 'ri-task-line', expense: 'ri-money-dollar-circle-line' };
    const groupLabels = { case: 'القضايا', client: 'الموكلين', hearing: 'الجلسات', document: 'الوثائق', task: 'المهام', expense: 'المصاريف' };
    const actionMap = { case: 'case', client: 'client', hearing: 'hearing', document: 'docopen', task: 'task', expense: 'expense' };

    let h = '';

    // Recent items
    if (recent.length) {
      h += '<div class="cmd-category">آخر العناصر</div>';
      recent.forEach(r => {
        const type = r.type || 'case';
        h += `<div class="cmd-item" data-action="${actionMap[type] || 'case'}" data-id="${r.id}" data-label="${esc(r.label)}" data-sub="${esc(r.sub)}" data-section="${esc(r.nav)}">
          <div class="cmd-item-icon" style="background:rgba(30,42,56,0.08);color:var(--navy);"><i class="${groupIcons[type] || 'ri-history-line'}"></i></div>
          <div class="cmd-item-text"><div class="cmd-item-title">${esc(r.label)}</div><div class="cmd-item-sub">${esc(r.sub)}</div></div>
          <span class="cmd-item-kbd" style="opacity:0.4;">⌃${r.key ? r.key.split('_')[0] : ''}</span>
        </div>`;
      });
    }

    // Navigation
    if (navItems.length) {
      h += '<div class="cmd-category">التنقل</div>';
      navItems.forEach(a => {
        h += `<div class="cmd-item" data-action="nav" data-section="${a.nav}">
          <div class="cmd-item-icon" style="background:rgba(30,42,56,0.08);color:var(--navy);"><i class="${a.icon}"></i></div>
          <div class="cmd-item-text"><div class="cmd-item-title">${esc(a.text)}</div><div class="cmd-item-sub">${esc(a.sub)}</div></div>
          ${a.kbd ? `<span class="cmd-item-kbd">${a.kbd}</span>` : ''}
        </div>`;
      });
    }

    // Search results
    if (searchResults.length) {
      const groups = {};
      searchResults.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
      Object.keys(groups).slice(0, 4).forEach(type => {
        h += '<div class="cmd-category">' + (groupLabels[type] || type) + '</div>';
        groups[type].slice(0, 4).forEach(item => {
          h += `<div class="cmd-item" data-action="${actionMap[type] || 'case'}" data-id="${item.id}" data-label="${esc(item.label)}" data-sub="${esc(item.sub)}" data-section="${esc(item.nav)}">
            <div class="cmd-item-icon" style="background:rgba(30,42,56,0.08);color:var(--navy);"><i class="${groupIcons[type] || 'ri-search-line'}"></i></div>
            <div class="cmd-item-text"><div class="cmd-item-title">${esc(item.label)}</div><div class="cmd-item-sub">${esc(item.sub)}</div></div>
          </div>`;
        });
      });
    }

    // Create actions
    if (createItems.length) {
      h += '<div class="cmd-category">إنشاء</div>';
      createItems.forEach(a => {
        h += `<div class="cmd-item" data-action="${a.action}">
          <div class="cmd-item-icon" style="background:${a.iconBg}15;color:${a.iconBg};"><i class="${a.icon}"></i></div>
          <div class="cmd-item-text"><div class="cmd-item-title">${esc(a.text)}</div><div class="cmd-item-sub">${esc(a.sub)}</div></div>
          ${a.kbd ? `<span class="cmd-item-kbd">${a.kbd}</span>` : ''}
        </div>`;
      });
    }

    // Quick actions
    if (quickItems.length) {
      h += '<div class="cmd-category">إجراءات سريعة</div>';
      quickItems.forEach(a => {
        h += `<div class="cmd-item" data-action="${a.action}">
          <div class="cmd-item-icon" style="background:${a.iconBg}15;color:${a.iconBg};"><i class="${a.icon}"></i></div>
          <div class="cmd-item-text"><div class="cmd-item-title">${esc(a.text)}</div><div class="cmd-item-sub">${esc(a.sub)}</div></div>
        </div>`;
      });
    }

    return h;
  }

  function refresh() {
    cmdIndex = -1;
    const q = input.value;
    A.safeSetStatic(results, buildCommands(q));
    results.querySelectorAll('.cmd-item').forEach(item => item.addEventListener('click', execCmdItem));
  }

  // Open/close
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const isOpen = palette.style.display !== 'none';
      palette.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) { input.value = ''; input.focus(); refresh(); }
      return;
    }
    if (e.key === 'Escape' && palette.style.display !== 'none') {
      palette.style.display = 'none';
      input.value = '';
    }
  });

  // Input — instant (no debounce)
  input.addEventListener('input', refresh);

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.cmd-item');
    if (!items.length) { if (e.key === 'Enter') { e.preventDefault(); palette.style.display = 'none'; } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdIndex = Math.min(cmdIndex + 1, items.length - 1); updateActive(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cmdIndex = Math.max(cmdIndex - 1, 0); updateActive(items); }
    else if (e.key === 'Enter') { e.preventDefault(); if (cmdIndex >= 0 && items[cmdIndex]) items[cmdIndex].click(); else items[0].click(); }
    else if (e.key === 'Tab') { e.preventDefault(); cmdIndex = cmdIndex < items.length - 1 ? cmdIndex + 1 : 0; updateActive(items); }
  });

  function updateActive(items) {
    items.forEach((el, i) => el.classList.toggle('active', i === cmdIndex));
    if (cmdIndex >= 0 && items[cmdIndex]) items[cmdIndex].scrollIntoView({ block: 'nearest' });
  }

  // Close on overlay click
  palette.addEventListener('click', (e) => { if (e.target === palette) { palette.style.display = 'none'; input.value = ''; } });
};

A.initAdvancedSearch = function() {
  const input = document.getElementById('advancedSearchInput');
  const resultsEl = document.getElementById('advancedSearchResults');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q || !A.state.ipc) { if (resultsEl) resultsEl.innerHTML = ''; return; }
    const container = resultsEl;
    // Use local index for instant results, then supplement with IPC
    const local = searchLocal(q);
    let html = '';
    const esc = A.escapeHtml;
    const items = [];
    if (local.length) {
      const groupLabels = { case: 'القضايا', client: 'الموكلين', hearing: 'الجلسات', document: 'الوثائق', task: 'المهام', expense: 'المصاريف' };
      const groups = {};
      local.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
      Object.keys(groups).forEach(type => {
        if (type === 'case' && !document.getElementById('searchInCases')?.checked) return;
        if (type === 'client' && !document.getElementById('searchInClients')?.checked) return;
        if (type === 'hearing' && !document.getElementById('searchInProcedures')?.checked) return;
        if (type === 'document' && !document.getElementById('searchInDocs')?.checked) return;
        if (type === 'task' && !document.getElementById('searchInTasks')?.checked) return;
        if (type === 'expense') return;
        items.push(...groups[type]);
      });
    }
    if (items.length) {
      const hl = (t) => t ? esc(t).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+/).join('|') + ')', 'gi'), '<span class="gsr-highlight">$1</span>') : '';
      const groupLabels = { case: 'القضايا', client: 'الموكلين', hearing: 'الجلسات', document: 'الوثائق', task: 'المهام' };
      const groups = {};
      items.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
      Object.keys(groups).forEach(type => {
        html += `<h4 style="margin:12px 0 8px;font-size:13px;color:var(--gray-500);">${groupLabels[type] || type} (${groups[type].length})</h4>`;
        groups[type].forEach(item => {
          html += `<div class="dash-item" style="cursor:pointer;" onclick="A.navigateTo('${esc(item.nav)}')"><div class="dash-item-body"><div class="dash-item-title">${hl(item.label)}</div><div class="dash-item-sub">${hl(item.sub)}</div></div></div>`;
        });
      });
    } else {
      html = '<p class="empty-state">لا توجد نتائج</p>';
    }
    A.safeSetStatic(container, html);
  });
};
