var A = (window.App = window.App || {});

A.state = {};
A.state.ipc = null;
A.state.statusLabels = { active: 'نشطة', pending: 'معلقة', closed: 'مغلقة' };
A._trustedClicks = [
  '#clientDetailOverlay [data-ws=clnotes]',
  '#addCaseBtn',
  '.cal-day[data-date='
];

A.escapeHtml = function (str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

A.safeSet = function (el, fn) {
  if (!el) return;
  const esc = v => {
    if (v == null) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };
  el.innerHTML = fn(esc);
};

// WARNING: Only pass hardcoded/trusted HTML (skeletons, templates). Never pass user data.
A.safeSetStatic = function (el, html) {
  if (!el) return;
  el.innerHTML = html;
};

A.logError = function (context, error) {
  const msg = error?.message || error || 'Unknown error';
  console.error(`[${context}]`, msg, error?.stack || '');
  try {
    A.state.ipc?.invoke('audit:log', 'error', `[${context}] ${msg.slice(0, 200)}`);
  } catch (e) {}
};

A.debounce = function (fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

A.showError = function (containerId, message, retryFn) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  A.safeSet(
    el,
    esc =>
      `<div class="error-state"><i class="ri-alert-line error-state-icon"></i><p class="error-state-text">${esc(message)}</p>${retryFn ? '<button class="btn btn-secondary btn-xs error-retry-btn">إعادة المحاولة</button>' : ''}</div>`
  );
  if (retryFn) el.querySelector('.error-retry-btn')?.addEventListener('click', retryFn);
};

A.showEmpty = function (containerId, icon, message) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  A.safeSet(
    el,
    esc => `<div class="empty-state"><i class="${icon || 'ri-inbox-line'}"></i><p>${esc(message)}</p></div>`
  );
};

A.on = function (id, event, handler) {
  const el = document.getElementById(id);
  if (!el) { A.logError('A.on', 'Missing element: ' + id); return; }
  el.addEventListener(event, handler);
};

function wrapExecCommand(command) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const node = sel.getRangeAt(0).commonAncestorContainer;
  if (!node.ownerDocument?.getSelection) return;
  document.execCommand(command);
}

A.showSkeleton = function (containerId, count, type) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  const t = type || 'card';
  const templates = {
    card: () => '<div class="skeleton skeleton-card"></div>',
    tableRow: () =>
      '<div class="skeleton-table-row"><div class="col-1"></div><div class="col-2"></div><div class="col-3"></div><div class="col-4"></div><div class="col-5"></div></div>',
    kanban: () => '<div class="skeleton skeleton-kanban-card"></div>',
    calEvent: () => '<div class="skeleton skeleton-cal-event"></div>',
    calDay: () => '<div class="skeleton skeleton-cal-day"></div>',
    aiMsg: () =>
      '<div class="skeleton skeleton-ai-msg"><div class="avatar"></div><div class="content"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>',
    docCard: () => '<div class="skeleton skeleton-doc-card"></div>',
    stat: () => '<div class="skeleton skeleton-stat"></div>'
  };
  const tmpl = templates[t] || templates.card;
  A.safeSetStatic(
    el,
    Array(count || 3)
      .fill(0)
      .map(() => tmpl())
      .join('')
  );
};

A.showToast = function (message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  // Limit concurrent toasts to 5
  while (container.children.length >= 5) container.firstChild.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type || 'info'}`;
  const icons = { success: 'ri-checkbox-circle-line', error: 'ri-error-warning-line', info: 'ri-information-line' };
  A.safeSet(toast, esc => `<i class="${icons[type] || 'ri-information-line'}"></i> ${esc(message)}`);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 300ms ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

A.safeInvoke = async function (channel, ...args) {
  if (!A.state?.ipc) return null;
  try {
    return await A.state.ipc.invoke(channel, ...args);
  } catch (err) {
    A.logError('safeInvoke:' + channel, err);
    return null;
  }
};

A.showLoading = function (elementId) {
  const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!el) return;
  el.dataset._ldOrigHtml = el.innerHTML;
  el.innerHTML =
    '<div class="loading-spinner" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:var(--muted-foreground);font-size:14px;"><i class="ri-loader-4-line ri-spin" style="font-size:var(--icon-lg);"></i> جاري التحميل...</div>';
};

A.hideLoading = function (elementId) {
  const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!el) return;
  if (el.dataset._ldOrigHtml) {
    el.innerHTML = '';
    delete el.dataset._ldOrigHtml;
  }
};

A.VirtualScroll = {
  init: function (containerId, items, renderFn, pageSize) {
    if (pageSize == null) pageSize = 50;
    const container = document.getElementById(containerId);
    if (!container) return null;

    let currentPage = 0;
    const totalItems = items.length;
    let displayedItems = [];
    let isLoading = false;
    let observer = null;

    function renderPage() {
      if (isLoading) return;
      if (currentPage * pageSize >= totalItems) {
        if (observer) observer.disconnect();
        return;
      }

      isLoading = true;
      const start = currentPage * pageSize;
      const end = Math.min(start + pageSize, totalItems);
      const newItems = items.slice(start, end);
      displayedItems = displayedItems.concat(newItems);

      renderFn(displayedItems, container);
      currentPage++;
      isLoading = false;

      addSentinel();
    }

    function addSentinel() {
      if (observer) observer.disconnect();
      const oldSentinel = container.querySelector('.virtual-scroll-sentinel');
      if (oldSentinel) oldSentinel.remove();
      const sentinel = document.createElement('div');
      sentinel.className = 'virtual-scroll-sentinel';
      sentinel.style.height = '2px';
      sentinel.style.width = '100%';
      container.appendChild(sentinel);
      observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting && currentPage * pageSize < totalItems) {
            renderPage();
          }
        },
        { rootMargin: '200px' }
      );
      observer.observe(sentinel);
    }

    renderPage();

    return {
      destroy: function () {
        if (observer) observer.disconnect();
        const sentinel = container.querySelector('.virtual-scroll-sentinel');
        if (sentinel) sentinel.remove();
      },
      loadMore: renderPage,
      getDisplayedCount: function () {
        return displayedItems.length;
      },
      getTotalCount: function () {
        return totalItems;
      }
    };
  }
};

A.formatDate = function (isoStr, options) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr + (isoStr.includes('T') ? '' : 'T12:00:00'));
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString(A.getLocale(), options || { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return isoStr;
  }
};

A.formatDateTime = function (isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString(A.getLocale(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoStr;
  }
};

window.showToast = A.showToast;

function parseClickAttr(el) {
  const ns = el.getAttribute('data-ns');
  const cmd = el.getAttribute('data-cmd');
  const arg = el.getAttribute('data-arg');
  if (ns && cmd) return { ns: ns, cmd: cmd, arg: arg || '' };
  const click = el.getAttribute('data-click');
  if (!click) return { ns: '', cmd: '', arg: '' };
  const i1 = click.indexOf(':');
  if (i1 === -1) return { ns: click, cmd: '', arg: '' };
  const i2 = click.indexOf(':', i1 + 1);
  if (i2 === -1) return { ns: click.slice(0, i1), cmd: click.slice(i1 + 1), arg: '' };
  return { ns: click.slice(0, i1), cmd: click.slice(i1 + 1, i2), arg: click.slice(i2 + 1) };
}

// Global delegated click handler for data-click / data-ns attributes (CSP-compliant)
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-click],[data-ns]');
  if (!el) return;
  if (el.getAttribute('data-click-stop') === 'true') e.stopPropagation();
  const attr = parseClickAttr(el);
  if (!attr.ns) return;
  const ns = attr.ns;
  const cmd = attr.cmd;
  const arg = attr.arg;
  if (ns === 'nav') {
    if (cmd === 'cases' && parts[2] && parts[2] === 'open') {
      window.navigateTo('cases');
      setTimeout(function(){ window.openCaseDetail && window.openCaseDetail(parseInt(parts.slice(3).join(':'), 10)); }, 200);
    } else {
      window.navigateTo(cmd);
    }
  } else if (ns === 'close') {
    const overlay = document.getElementById(cmd);
    if (overlay) overlay.style.display = 'none';
  } else if (ns === 'ai') {
    if (cmd === 'clearContext') window.clearAiContext && window.clearAiContext();
    else if (cmd === 'selectProvider') window.selectAiProvider && window.selectAiProvider(arg);
    else if (cmd === 'timeline') window.wsAiTimeline && window.wsAiTimeline();
    else if (cmd === 'risk') window.wsAiRisk && window.wsAiRisk();
    else if (cmd === 'chat') { const tab = document.querySelector('[data-ws=ai]'); if (tab) tab.click(); }
    else if (cmd === 'summarize') { const sid = el.getAttribute('data-id'); const sname = el.getAttribute('data-name') || ''; window.wsAiSummarizeDoc && window.wsAiSummarizeDoc(parseInt(sid, 10), sname); }
  } else if (ns === 'support') {
    if (cmd === 'mail') window.open('mailto:support@cabinetmanager.ma');
  } else if (ns === 'case') {
    if (cmd === 'open') window.openCaseDetail && window.openCaseDetail(parseInt(arg, 10));
  } else if (ns === 'client') {
    if (cmd === 'open') window.openClientDetail && window.openClientDetail(parseInt(arg, 10));
  } else if (ns === 'doc') {
    if (cmd === 'open') window.openDocViewer && window.openDocViewer(parseInt(arg, 10));
    else if (cmd === 'analyze') window.analyzeDoc && window.analyzeDoc(parseInt(arg, 10));
    else if (cmd === 'openFile') (async()=>{ try { await A.state.ipc.invoke('db:openDocument', parseInt(arg, 10)); } catch(e) { A.logError('openDoc', e); A.showToast(_t('failedOpenFile'), 'error'); } })();
    else if (cmd === 'filter') { document.getElementById('searchDocs').value = arg; A.renderDocGrid && A.renderDocGrid(); A.renderDocTable && A.renderDocTable(); }
  } else if (ns === 'event') {
    if (cmd === 'open') window.openEventDetail && window.openEventDetail(parseInt(arg, 10));
  } else if (ns === 'task') {
    if (cmd === 'open') window.openTaskDetail && window.openTaskDetail(parseInt(arg, 10));
    else if (cmd === 'toggle') { e.stopPropagation(); window.toggleTaskStatus && window.toggleTaskStatus(parseInt(arg, 10)); }
    else if (cmd === 'addSubtask') window.addSubtaskTo && window.addSubtaskTo(parseInt(arg, 10));
    else if (cmd === 'addComment') window.addCommentTo && window.addCommentTo(parseInt(arg, 10));
  } else if (ns === 'subtask') {
    if (cmd === 'toggle') window.toggleSubtask && window.toggleSubtask(parseInt(arg, 10));
    else if (cmd === 'delete') window.deleteSubtaskItem && window.deleteSubtaskItem(parseInt(arg, 10));
  } else if (ns === 'editor') {
    if (cmd === 'bold') wrapExecCommand('bold');
    else if (cmd === 'italic') wrapExecCommand('italic');
    else if (cmd === 'list') wrapExecCommand('insertUnorderedList');
  } else if (ns === 'contact') {
    if (cmd === 'call') { e.stopPropagation(); window.open('tel:' + arg, '_self'); }
    else if (cmd === 'mail') { e.stopPropagation(); window.open('mailto:' + arg, '_self'); }
  } else if (ns === 'settings') {
    if (cmd === 'editUser') window.editSettingsUser && window.editSettingsUser(parseInt(arg, 10));
    else if (cmd === 'deleteUser') window.deleteSettingsUser && window.deleteSettingsUser(parseInt(arg, 10));
  } else if (ns === 'workflow') {
    if (cmd === 'apply') window.applyWorkflow && window.applyWorkflow();
    else if (cmd === 'new') window.showNewWorkflowForm && window.showNewWorkflowForm();
    else if (cmd === 'delete') window.deleteWorkflowItem && window.deleteWorkflowItem(parseInt(arg, 10));
  } else if (ns === 'template') {
    if (cmd === 'apply') window.applyTemplate && window.applyTemplate();
    else if (cmd === 'new') window.showNewTemplateForm && window.showNewTemplateForm();
    else if (cmd === 'delete') window.deleteTemplateItem && window.deleteTemplateItem(parseInt(arg, 10));
  } else if (ns === '_click') {
    if (A._trustedClicks && A._trustedClicks.some(function (p) { return cmd.indexOf(p) === 0; })) {
      const t2 = document.querySelector(cmd);
      if (t2) t2.click();
    }
  }
});

A.state.ipc.on('app:indexNotification', function (data) {
  const typeMap = { indexSuccess: 'success', indexWarning: 'warning', indexError: 'error' };
  const toastType = typeMap[data.type] || 'info';
  A.showToast(data.message, toastType);
});
