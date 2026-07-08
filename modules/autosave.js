var A = (window.App = window.App || {});

A.AutoSave = {
  _prefix: 'as_',
  _reg: {},
  _timers: {},
  _dirty: new Set(),

  register(key, opts) {
    this._reg[key] = opts;
    const saved = this.load(key);
    if (saved !== null && opts.setValue) {
      A.debounce(() => A.AutoSave.showRestoreNotification(), 1000)();
    }
  },

  markDirty(key) {
    this._dirty.add(key);
    this._schedule(key);
    this._indicator(key, 'unsaved');
  },

  markSaved(key) {
    this._dirty.delete(key);
    this._indicator(key, 'saved');
  },

  save(key) {
    clearTimeout(this._timers[key]);
    this._doSave(key);
  },

  saveAll() {
    for (const key of this._dirty) this._doSave(key);
  },

  _schedule(key) {
    const opts = this._reg[key];
    if (!opts) return;
    clearTimeout(this._timers[key]);
    this._timers[key] = setTimeout(() => this._doSave(key), opts.debounce || 1500);
  },

  _doSave(key) {
    const opts = this._reg[key];
    if (!opts) return;
    this._indicator(key, 'saving');
    const value = opts.getValue();
    try {
      try {
        const raw = JSON.stringify({ value, time: Date.now() });
        localStorage.setItem(this._prefix + key, btoa(encodeURIComponent(raw)));
      } catch (_) {}
      this._dirty.delete(key);
      this._indicator(key, 'saved');
      if (opts.onSave) opts.onSave(value);
    } catch (e) {
      this._indicator(key, 'error');
      A.logError('autosave', e);
    }
  },

  load(key) {
    try {
      let raw = localStorage.getItem(this._prefix + key);
      if (!raw) return null;
      if (raw) { try { raw = decodeURIComponent(atob(raw)); } catch (_) { raw = raw; } }
      return JSON.parse(raw).value;
    } catch {
      return null;
    }
  },

  clear(key) {
    localStorage.removeItem(this._prefix + key);
    this._dirty.delete(key);
  },

  clearAll() {
    const keys = Object.keys(this._reg);
    keys.forEach(k => this.clear(k));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this._prefix)) localStorage.removeItem(k);
    }
  },

  getAllDrafts() {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this._prefix)) {
        try {
          let _raw = localStorage.getItem(k);
          if (_raw) { try { _raw = decodeURIComponent(atob(_raw)); } catch (_) {} }
          const parsed = JSON.parse(_raw);
          drafts.push({ key: k.slice(this._prefix.length), value: parsed.value, time: parsed.time });
        } catch {}
      }
    }
    return drafts;
  },

  _indicator(key, status) {
    const opts = this._reg[key];
    if (!opts) return;
    const el =
      typeof opts.indicator === 'function' ? opts.indicator() : typeof opts.indicator === 'string' ? document.getElementById(opts.indicator) : opts.indicator;
    if (!el) return;
    const states = {
      unsaved: { text: _t('autosaveUnsaved'), color: 'var(--gold)' },
      saving: { text: _t('saving'), color: 'var(--info)' },
      saved: { text: _t('autoSaveStatus'), color: 'var(--success)' },
      error: { text: _t('autosaveError'), color: 'var(--destructive)' }
    };
    const s = states[status] || states.saved;
    el.textContent = s.text;
    el.style.color = s.color;
  },

  showRestoreNotification() {
    const drafts = this.getAllDrafts();
    if (!drafts.length || document.getElementById('asBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'asBanner';
    Object.assign(banner.style, {
      position: 'fixed',
      bottom: '80px',
      right: '50%',
      transform: 'translateX(50%)',
      background: 'var(--primary)',
      color: '#fff',
      padding: '14px 24px',
      borderRadius: 'var(--rounded-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      fontSize: '13px',
      direction: 'rtl',
      maxWidth: '620px'
    });
    const esc = A.escapeHtml;
    banner.innerHTML = `
      <i class="ri-history-line" style="font-size:var(--icon-md);"></i>
      <span style="flex:1;">${_t('autosaveFoundDrafts').replace('{count}', `<strong>${esc(drafts.length)}</strong>`)}</span>
      <button id="asRestoreBtn" class="btn btn-gold btn-xs" style="white-space:nowrap;">${_t('autosaveRestoreAll')}</button>
      <button id="asDismissBtn" class="btn btn-xs" style="background:rgba(255,255,255,0.15);color:#fff;border:none;white-space:nowrap;">${_t('autosaveDismiss')}</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('asRestoreBtn').onclick = () => {
      for (const d of drafts) {
        const opts = this._reg[d.key];
        if (opts && opts.setValue) opts.setValue(d.value);
        this.clear(d.key);
      }
      banner.remove();
      A.showToast(_t('autosaveRestored'), 'success');
    };
    document.getElementById('asDismissBtn').onclick = () => {
      this.clearAll();
      banner.remove();
    };
    setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 20000);
  },

  init() {
    setInterval(() => A.AutoSave.saveAll(), 30000);
    window.addEventListener('beforeunload', () => A.AutoSave.saveAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) A.AutoSave.saveAll();
    });
    A.AutoSave._updateGlobalIndicator();
    setInterval(() => A.AutoSave._updateGlobalIndicator(), 5000);
    setTimeout(() => A.AutoSave.showRestoreNotification(), 2000);
    document.getElementById('topbar')?.addEventListener('click', e => {
      if (e.target.closest('#asGlobalStatus')) {
        A.AutoSave.saveAll();
        A.showToast('تم حفظ جميع التعديلات', 'success');
      }
    });
  },

  _updateGlobalIndicator() {
    const el = document.getElementById('asGlobalStatus');
    if (!el) return;
    if (this._dirty.size > 0) {
      el.style.display = 'inline-flex';
      el.innerHTML = '<i class="ri-edit-line" style="font-size:var(--icon-xs);"></i> <span>' + _t('autosaveUnsaved') + '</span>';
      el.style.color = 'var(--gold)';
    } else {
      const drafts = this.getAllDrafts();
      if (drafts.length > 0) {
        el.style.display = 'inline-flex';
        el.innerHTML = '<i class="ri-save-3-line" style="font-size:var(--icon-xs);"></i> <span>' + _t('autosaveLocalDrafts') + '</span>';
        el.style.color = 'var(--info)';
      } else {
        el.style.display = 'none';
      }
    }
  }
};
