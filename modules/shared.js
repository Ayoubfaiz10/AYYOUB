var A = window.App = window.App || {};

A.state = {};
A.state.ipc = null;
A.state.statusLabels = { active: 'نشطة', pending: 'معلقة', closed: 'مغلقة' };

A.escapeHtml = function(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
};

A.safeSet = function(el, fn) {
  if (!el) return;
  const esc = (v) => {
    if (v == null) return '';
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  };
  el.innerHTML = fn(esc);
};

A.safeSetStatic = function(el, html) {
  if (!el) return;
  el.innerHTML = html;
};

A.logError = function(context, error) {
  const msg = error?.message || error || 'Unknown error';
  console.error(`[${context}]`, msg, error?.stack || '');
  try { A.state.ipc?.invoke('db:addLog', 'error', `[${context}] ${msg.slice(0, 200)}`); } catch (e) {}
};

A.debounce = function(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

A.showError = function(containerId, message, retryFn) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  A.safeSet(el, esc => `<div class="error-state"><i class="ri-alert-line error-state-icon"></i><p class="error-state-text">${esc(message)}</p>${retryFn ? '<button class="btn btn-secondary btn-xs error-retry-btn">إعادة المحاولة</button>' : ''}</div>`);
  if (retryFn) el.querySelector('.error-retry-btn')?.addEventListener('click', retryFn);
};

A.showEmpty = function(containerId, icon, message) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  A.safeSet(el, esc => `<div class="empty-state"><i class="${icon || 'ri-inbox-line'} empty-state-icon"></i><p class="empty-state-text">${esc(message)}</p></div>`);
};

A.showSkeleton = function(containerId, count, type) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  const t = type || 'card';
  const templates = {
    card: () => '<div class="skeleton skeleton-card"></div>',
    tableRow: () => '<div class="skeleton-table-row"><div class="col-1"></div><div class="col-2"></div><div class="col-3"></div><div class="col-4"></div><div class="col-5"></div></div>',
    kanban: () => '<div class="skeleton skeleton-kanban-card"></div>',
    calEvent: () => '<div class="skeleton skeleton-cal-event"></div>',
    calDay: () => '<div class="skeleton skeleton-cal-day"></div>',
    aiMsg: () => '<div class="skeleton skeleton-ai-msg"><div class="avatar"></div><div class="content"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>',
    docCard: () => '<div class="skeleton skeleton-doc-card"></div>',
    stat: () => '<div class="skeleton skeleton-stat"></div>',
  };
  const tmpl = templates[t] || templates.card;
  A.safeSetStatic(el, Array(count || 3).fill(0).map(() => tmpl()).join(''));
};

A.showToast = function(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  // Limit concurrent toasts to 5
  while (container.children.length >= 5) container.firstChild.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type || 'info'}`;
  const icons = { success: 'ri-checkbox-circle-line', error: 'ri-error-warning-line', info: 'ri-information-line' };
  A.safeSet(toast, esc => `<i class="${icons[type] || 'ri-information-line'}"></i> ${esc(message)}`);
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 300ms ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
};

A.safeInvoke = async function(channel, ...args) {
  if (!A.state?.ipc) return null;
  try {
    return await A.state.ipc.invoke(channel, ...args);
  } catch (err) {
    A.logError('safeInvoke:' + channel, err);
    return null;
  }
};

A.showLoading = function(elementId) {
  const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!el) return;
  el.dataset.originalHtml = el.dataset.originalHtml || el.innerHTML;
  el.innerHTML = '<div class="loading-spinner" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:var(--gray-400);font-size:14px;"><i class="ri-loader-4-line ri-spin" style="font-size:24px;"></i> جاري التحميل...</div>';
};

A.hideLoading = function(elementId) {
  const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!el) return;
  if (el.dataset.originalHtml) {
    el.innerHTML = el.dataset.originalHtml;
    delete el.dataset.originalHtml;
  }
};

A.VirtualScroll = {
  init: function(containerId, items, renderFn, pageSize) {
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
      observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting && currentPage * pageSize < totalItems) {
          renderPage();
        }
      }, { rootMargin: '200px' });
      observer.observe(sentinel);
    }

    renderPage();

    return {
      destroy: function() {
        if (observer) observer.disconnect();
        const sentinel = container.querySelector('.virtual-scroll-sentinel');
        if (sentinel) sentinel.remove();
      },
      loadMore: renderPage,
      getDisplayedCount: function() { return displayedItems.length; },
      getTotalCount: function() { return totalItems; }
    };
  }
};

A.sharedI18n = {
  locale: localStorage.getItem('locale') || 'ar',
  messages: {
    ar: {
      'dashboard': 'الرئيسية',
      'clients': 'الموكلين',
      'cases': 'القضايا',
      'tasks': 'المهام',
      'documents': 'الوثائق',
      'calendar': 'التقويم',
      'hearings': 'الجلسات',
      'expenses': 'المصاريف',
      'settings': 'الإعدادات',
      'archive': 'الأرشيف',
      'reports': 'التقارير',
      'ai': 'المساعد الذكي',
      'search': 'البحث',
      'notifications': 'الإشعارات',
      'support': 'الدعم',
      'add': 'إضافة',
      'edit': 'تعديل',
      'delete': 'حذف',
      'save': 'حفظ',
      'cancel': 'إلغاء',
      'close': 'إغلاق',
      'search_placeholder': 'بحث...',
      'loading': 'جاري التحميل...',
      'no_data': 'لا توجد بيانات',
      'error': 'حدث خطأ',
      'retry': 'إعادة المحاولة',
      'success': 'تم بنجاح',
      'status_active': 'نشط',
      'status_pending': 'معلق',
      'status_closed': 'مغلق',
      'status_done': 'منجز',
      'status_todo': 'للقيام',
      'status_in_progress': 'قيد الإنجاز',
      'priority_high': 'عالية',
      'priority_medium': 'متوسطة',
      'priority_low': 'منخفضة',
      'priority_critical': 'حرجة',
    },
    fr: {
      'dashboard': 'Tableau de bord',
      'clients': 'Clients',
      'cases': 'Dossiers',
      'tasks': 'Tâches',
      'documents': 'Documents',
      'calendar': 'Calendrier',
      'hearings': 'Audiences',
      'expenses': 'Dépenses',
      'settings': 'Paramètres',
      'archive': 'Archives',
      'reports': 'Rapports',
      'ai': 'Assistant IA',
      'search': 'Recherche',
      'notifications': 'Notifications',
      'support': 'Support',
      'add': 'Ajouter',
      'edit': 'Modifier',
      'delete': 'Supprimer',
      'save': 'Enregistrer',
      'cancel': 'Annuler',
      'close': 'Fermer',
      'search_placeholder': 'Rechercher...',
      'loading': 'Chargement...',
      'no_data': 'Aucune donnée',
      'error': 'Erreur',
      'retry': 'Réessayer',
      'success': 'Succès',
      'status_active': 'Actif',
      'status_pending': 'En attente',
      'status_closed': 'Fermé',
      'status_done': 'Terminé',
      'status_todo': 'À faire',
      'status_in_progress': 'En cours',
      'priority_high': 'Haute',
      'priority_medium': 'Moyenne',
      'priority_low': 'Basse',
      'priority_critical': 'Critique',
    }
  },
  
  t: function(key, defaultValue) {
    const value = this.messages[this.locale]?.[key];
    return value || defaultValue || key;
  },
  
  setLocale: function(locale) {
    if (this.messages[locale]) {
      this.locale = locale;
      localStorage.setItem('locale', locale);
      if (typeof A.setLanguage === 'function') {
        A.setLanguage(locale);
      } else {
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
      }
    }
  },
  
  getLocales: function() {
    return Object.keys(this.messages);
  }
};

A.formatDate = function(isoStr, options) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr + (isoStr.includes('T') ? '' : 'T12:00:00'));
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString(A.getLocale(), options || { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return isoStr; }
};

A.formatDateTime = function(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString(A.getLocale(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return isoStr; }
};

window.showToast = A.showToast;
