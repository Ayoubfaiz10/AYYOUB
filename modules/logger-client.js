var A = window.App = window.App || {};

A.Logger = {
  _ipc: null,

  init: function() {
    this._ipc = A.state.ipc;

    const origError = console.error;
    console.error = (...args) => {
      origError.apply(console, args);
      this._send('ERROR', 'console', args.map(a => typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a)).join(' '));
    };

    const origWarn = console.warn;
    console.warn = (...args) => {
      origWarn.apply(console, args);
      this._send('WARN', 'console', args.map(a => String(a)).join(' '));
    };

    window.onerror = (msg, url, line, col, error) => {
      const stack = error?.stack ? (' | stack: ' + error.stack.slice(0, 300)) : '';
      this._send('ERROR', 'window.onerror', `${msg} (${url}:${line}:${col})${stack}`);
      return false;
    };

    window.onunhandledrejection = (e) => {
      const reason = e.reason;
      const msg = reason?.message || String(reason);
      const stack = reason?.stack ? (' | stack: ' + reason.stack.slice(0, 300)) : '';
      this._send('ERROR', 'unhandledRejection', `${msg}${stack}`);
    };
  },

  _send: function(level, context, message) {
    if (!this._ipc) return;
    try {
      this._ipc.invoke('logger:log', level, context, String(message).slice(0, 1000));
    } catch (e) { /* silent */ }
  },

  info: function(ctx, msg) { this._send('INFO', ctx, msg); },
  warn: function(ctx, msg) { this._send('WARN', ctx, msg); },
  error: function(ctx, msg) { this._send('ERROR', ctx, msg); },
  critical: function(ctx, msg) { this._send('CRITICAL', ctx, msg); },

  getLogs: function(filters) {
    return this._ipc ? this._ipc.invoke('logger:getLogs', filters) : Promise.resolve([]);
  },

  exportLogs: function(format) {
    return this._ipc ? this._ipc.invoke('logger:export', format) : Promise.resolve('');
  },

  clearLogs: function() {
    return this._ipc ? this._ipc.invoke('logger:clear') : Promise.resolve(false);
  },

  getStats: function() {
    return this._ipc ? this._ipc.invoke('logger:stats') : Promise.resolve({});
  }
};
