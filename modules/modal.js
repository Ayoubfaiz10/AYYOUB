var A = window.App = window.App || {};

let modalCallback = null;
let modalDraftCleanup = null;

A.showModal = function(title, content, onConfirm) {
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const overlay = document.getElementById('modalOverlay');
  if (!titleEl || !bodyEl || !overlay) { console.warn('Modal elements missing'); return; }
  titleEl.textContent = title;
  A.safeSetStatic(bodyEl, content);
  overlay.style.display = 'flex';
  modalCallback = typeof onConfirm === 'function' ? onConfirm : null;

  // Cleanup previous draft listeners
  if (modalDraftCleanup) { modalDraftCleanup(); modalDraftCleanup = null; }

  if (A.AutoSave && content) {
    A.AutoSave._lastModalTitle = title;
    const saved = A.AutoSave.load('modal_' + title);
    if (saved) {
      setTimeout(() => {
        try {
          const data = JSON.parse(saved);
          bodyEl.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.id && data[el.id] !== undefined) {
              if (el.type === 'checkbox') el.checked = data[el.id];
              else el.value = data[el.id];
            }
          });
        } catch {}
      }, 50);
    }
    const saveModalDraft = () => {
      const data = {};
      bodyEl.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.id) data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      });
      localStorage.setItem('as_modal_' + title, JSON.stringify({ value: JSON.stringify(data), time: Date.now() }));
    };
    const modalDebounce = A.debounce(saveModalDraft, 2000);
    const inputs = bodyEl.querySelectorAll('input, textarea, select');
    inputs.forEach(el => { el.addEventListener('input', modalDebounce); el.addEventListener('change', modalDebounce); });
    modalDraftCleanup = () => inputs.forEach(el => { el.removeEventListener('input', modalDebounce); el.removeEventListener('change', modalDebounce); });
  }
};

A.hideModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'none';
  modalCallback = null;
  if (modalDraftCleanup) { modalDraftCleanup(); modalDraftCleanup = null; }
};

window.showModal = A.showModal;
window.hideModal = A.hideModal;

A.showConfirm = function(message, confirmText, type) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirmOverlay');
    const iconEl = document.getElementById('confirmIcon');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const confirmBtn = document.getElementById('confirmActionBtn');
    if (!overlay || !confirmBtn || !cancelBtn || !iconEl || !titleEl || !msgEl) { resolve(true); return; }

    const t = type || 'danger';
    const icons = { danger: 'ri-delete-bin-line', warning: 'ri-archive-line' };
    const colors = { danger: 'confirm-icon-danger', warning: 'confirm-icon-warning' };
    A.safeSetStatic(iconEl, `<i class="${icons[t] || 'ri-alert-line'}"></i>`);
    iconEl.className = 'confirm-icon ' + (colors[t] || 'confirm-icon-danger');

    titleEl.textContent = confirmText === 'أرشفة' ? _t('confirmArchive') : _t('confirmDeleteTitle');
    A.safeSet(msgEl, esc => esc(message || _t('confirmDeleteMsg')));
    confirmBtn.textContent = confirmText || _t('delete');
    confirmBtn.className = t === 'warning' ? 'btn btn-gold' : 'btn btn-danger';

    overlay.style.display = 'flex';
    setTimeout(() => confirmBtn.focus(), 100);

    const cleanup = () => {
      overlay.style.display = 'none';
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
      document.removeEventListener('keydown', onKeydown);
      overlay.removeEventListener('click', onOverlayClick);
    };
    const onCancel = () => { cleanup(); resolve(false); };
    const onConfirm = () => { cleanup(); resolve(true); };
    const onKeydown = e => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm(); };
    const onOverlayClick = e => { if (e.target === overlay) onCancel(); };

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    document.addEventListener('keydown', onKeydown);
    overlay.addEventListener('click', onOverlayClick);
  });
};

A.initModal = function() {
  document.getElementById('modalCloseBtn')?.addEventListener('click', A.hideModal);
  document.getElementById('modalCancelBtn')?.addEventListener('click', A.hideModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => { if (e.target === document.getElementById('modalOverlay')) A.hideModal(); });
  document.getElementById('modalConfirmBtn')?.addEventListener('click', () => { if (modalCallback) modalCallback(); });
};
