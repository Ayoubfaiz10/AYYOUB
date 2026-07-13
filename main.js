const { app, BrowserWindow, ipcMain, shell, Notification, dialog, session, Menu, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const os = require('os');
const db = require('./db');
const logger = require('./logger');
let dotenvResult = require('dotenv').config({ path: __dirname + '/.env', override: true });
if (dotenvResult.error && app.isPackaged) {
  const resourceEnv = path.join(process.resourcesPath, '.env');
  if (fs.existsSync(resourceEnv)) {
    require('dotenv').config({ path: resourceEnv, override: true });
  }
}

if (!process.env.MASTER_KEY) {
  console.error('');
  console.error('═══════════════════════════════════════════════════');
  console.error('  FATAL: MASTER_KEY is not set');
  console.error('  Create a .env file in the app directory with:');
  console.error('  MASTER_KEY=your-strong-random-key-here');
  console.error('═══════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

app.setName('LexOffece');
if (process.platform === 'win32') app.setAppUserModelId('com.lexoffece.app');

/* ─── Path security: prevent directory traversal ─── */
const PATH_CACHE = new Map();

function cachedRealpath(p) {
  if (PATH_CACHE.has(p)) return PATH_CACHE.get(p);
  const r = fs.realpathSync(p);
  if (PATH_CACHE.size > 1024) PATH_CACHE.clear();
  PATH_CACHE.set(p, r);
  return r;
}

function isPathSafe(targetPath, allowedBase) {
  try {
    const resolved = cachedRealpath(path.resolve(targetPath));
    const base = cachedRealpath(path.resolve(allowedBase));
    return resolved === base || resolved.startsWith(base + path.sep);
  } catch (e) { return false; }
}

/* ─── TLS Certificate Pinning for AI providers ─── */
const PINNED_DOMAINS = ['api.groq.com', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com'];
var PINNED_CERTS_PATH = null;

function getPinnedCertsPath() {
  if (!PINNED_CERTS_PATH) PINNED_CERTS_PATH = path.join(app.getPath('userData'), 'storage', 'pinned_certs.json');
  return PINNED_CERTS_PATH;
}

function loadPinnedCerts() {
  try {
    const p = getPinnedCertsPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { /* ignore */ }
  return {};
}

function savePinnedCerts(pins) {
  try {
    const p = getPinnedCertsPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(pins, null, 2), { mode: 0o600 });
  } catch (e) { /* ignore */ }
}

function loadPendingPinApprovals() {
  try {
    const p = path.join(app.getPath('userData'), 'storage', 'pending_pins.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { /* ignore */ }
  return {};
}

function savePendingPinApprovals(pending) {
  try {
    const p = path.join(app.getPath('userData'), 'storage', 'pending_pins.json');
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(pending, null, 2), { mode: 0o600 });
  } catch (e) { /* ignore */ }
}

function setupCertPinning() {
  const pinnedCerts = loadPinnedCerts();
  const pendingPins = loadPendingPinApprovals();
  session.defaultSession.setCertificateVerifyProc(function (req, cb) {
    if (PINNED_DOMAINS.indexOf(req.hostname) === -1) { cb(0); return; }
    const fingerprint = req.certificate && req.certificate.fingerprint;
    if (!fingerprint) { cb(0); return; }
    const expected = pinnedCerts[req.hostname];
    if (!expected) {
      pinnedCerts[req.hostname] = fingerprint;
      savePinnedCerts(pinnedCerts);
      cb(0);
    } else if (expected === fingerprint) {
      cb(0);
    } else if (pendingPins[req.hostname] === fingerprint) {
      pinnedCerts[req.hostname] = fingerprint;
      savePinnedCerts(pinnedCerts);
      delete pendingPins[req.hostname];
      savePendingPinApprovals(pendingPins);
      cb(0);
    } else {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('cert:pinChanged', { hostname: req.hostname, oldFingerprint: expected, newFingerprint: fingerprint });
      }
      cb(-2);
    }
  });
}

/* ─── Upload source path validation ─── */
const SENSITIVE_DIRS = [
  path.resolve(__dirname),
  app.getPath('userData'),
  app.getPath('exe') ? path.dirname(app.getPath('exe')) : null,
].filter(Boolean);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const LICENSE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

function isAllowedUploadSource(sourcePath) {
  if (!sourcePath || typeof sourcePath !== 'string') return false;
  try {
    const resolved = fs.realpathSync(path.resolve(sourcePath));
    for (const dir of SENSITIVE_DIRS) {
      if (resolved === dir || resolved.startsWith(dir + path.sep)) return false;
    }
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return false;
    return true;
  } catch (e) { return false; }
}

// Export saveDb so we can save on quit
async function getUniqueFilePath(dir, filename) {
  let finalPath = path.join(dir, filename);
  let count = 1;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  while (true) {
    try {
      const fd = await fsp.open(finalPath, 'wx');
      await fd.close();
      return finalPath;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      finalPath = path.join(dir, `${base}_(${count})${ext}`);
      count++;
    }
  }
}

/* ─── MIME magic-byte validation ─── */
const MAGIC_MAP = {
  '.pdf':  [ [0x25, 0x50, 0x44, 0x46] ],
  '.doc':  [ [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] ],
  '.docx': [ [0x50, 0x4B, 0x03, 0x04] ],
  '.jpg':  [ [0xFF, 0xD8, 0xFF] ],
  '.jpeg': [ [0xFF, 0xD8, 0xFF] ],
  '.png':  [ [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] ],
};
function validateFileMagic(filePath, ext) {
  try {
    const sigs = MAGIC_MAP[ext];
    if (!sigs) return false;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(256);
    fs.readSync(fd, buf, 0, 256, 0);
    fs.closeSync(fd);
    return sigs.some(sig => sig.every((b, i) => buf[i] === b));
  } catch (e) {
    return false;
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

function nullGuard(obj, defaults = {}) {
  if (obj == null) return { ...defaults };
  for (const k of Object.keys(defaults)) {
    if (obj[k] === null || obj[k] === undefined) obj[k] = defaults[k];
  }
  return obj;
}

function safeStrEq(a, b) {
  try {
    const ab = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch { return false; }
}

const CONFIG_PATH = path.join(app.getPath('userData'), 'storage', 'window_config.json');

function loadWindowState() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) { console.warn('Failed to load window state:', e.message); }
  return {};
}

function saveWindowState(state) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); try { fs.chmodSync(dir, 0o700); } catch (e) {} }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(state), { mode: 0o600 });
  } catch (e) { console.warn('Failed to save window state:', e.message); }
}

async function saveDbOnQuit() {
  try {
    if (typeof db.saveDbSync === 'function') db.saveDbSync();
    else if (typeof db.saveDb === 'function') await db.saveDb();
  } catch (e) {
    console.error('Save on quit failed:', e);
  }
}

logger.setDbLog((action, details) => {
  try { db.addLog(action, details); } catch (e) { /* logger fallback silent */ }
});

let _tesseractModule = null;
function ensureTesseract() {
  if (_tesseractModule !== null) return _tesseractModule;
  try {
    _tesseractModule = require('tesseract.js');
    if (isDev) console.log('Tesseract.js loaded lazily');
    return _tesseractModule;
  } catch (e) {
    _tesseractModule = false;
    console.warn('tesseract.js not available');
    return null;
  }
}

let mainWindow = null;

/* ─── License Client ─── */

const LICENSE_PATH = path.join(app.getPath('userData'), 'storage', 'license.json');
const LICENSE_SERVER = process.env.LICENSE_SERVER || '';
const isDev = process.env.NODE_ENV !== 'production';

if (LICENSE_SERVER && LICENSE_SERVER.startsWith('http://') && !LICENSE_SERVER.includes('localhost') && !LICENSE_SERVER.includes('127.0.0.1')) {
  if (isDev) {
    console.warn('License server uses HTTP (insecure):', LICENSE_SERVER);
  } else {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('  FATAL: License server must use HTTPS in production');
    console.error('  Set LICENSE_SERVER to an HTTPS URL in your .env');
    console.error('═══════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
}

function getLicense() {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      return JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveLicense(data) {
  const dir = path.dirname(LICENSE_PATH);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); try { fs.chmodSync(dir, 0o700); } catch (e) {} }
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function getMachineId() {
  const interfaces = os.networkInterfaces();
  const macs = [];
  for (const key of Object.keys(interfaces)) {
    const ifaces = interfaces[key];
    if (ifaces) {
      for (const iface of ifaces) {
        if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
          macs.push(iface.mac);
        }
      }
    }
  }
  const cpus = os.cpus();
  const cpuInfo = cpus.length > 0 ? cpus[0].model + '-' + cpus.length : 'unknown';
  const hash = crypto.createHash('sha256').update(macs.join(':') + '-' + cpuInfo).digest('hex');
  return hash;
}

async function licenseHttpPost(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(function() { controller.abort(); }, 5000);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await resp.json().catch(function() { return null; });
    if (!resp.ok) {
      const err = new Error(data?.data?.reason || data?.message || 'HTTP ' + resp.status);
      err.status = resp.status;
      err.body = data;
      throw err;
    }
    return data;
  } catch (e) {
    clearTimeout(timeout);
    if (e.status) throw e; // re-throw enriched error
    // Network/timeout error - wrap with status 0
    const err = new Error(e.message || 'Network error');
    err.status = 0;
    throw err;
  }
}

function checkOfflineGrace(license) {
  if (!license || !license.lastValidated) return false;
  const now = Date.now();
  return (now - license.lastValidated) < LICENSE_GRACE_MS;
}

/* ─── License IPC Handlers ─── */

ipcMain.handle('license:getStatus', function() {
  const license = getLicense();
  if (!license) return { valid: false };
  return { valid: checkOfflineGrace(license), key: license.key, machineId: license.machineId, lastValidated: license.lastValidated };
});

ipcMain.handle('license:check', async function() {
  const license = getLicense();
  if (!license) return { valid: false, message: 'لا يوجد ترخيص' };

  if (checkOfflineGrace(license)) {
    return { valid: true, offline: true, key: license.key };
  }

  try {
    const result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/validate', {
      licenseKey: license.key,
      machineId: license.machineId
    });
    if (result?.data?.valid) {
      license.lastValidated = Date.now();
      if (result.data.daysRemaining != null) license.daysRemaining = result.data.daysRemaining;
      if (result.data.deviceId) license.deviceId = result.data.deviceId;
      saveLicense(license);
      return { valid: true, key: license.key };
    }
    return { valid: false, message: 'الترخيص غير صالح' };
  } catch (e) {
    if (e.status && e.status >= 400 && e.status < 500) {
      return { valid: false, message: e.message || 'الترخيص غير صالح' };
    }
    if (checkOfflineGrace(license)) {
      return { valid: true, offline: true, key: license.key, graceDaysLeft: Math.floor((LICENSE_GRACE_MS - (Date.now() - license.lastValidated)) / (24 * 60 * 60 * 1000)) };
    }
    return { valid: false, message: 'لا يمكن التحقق من الترخيص (الرجاء الاتصال بالإنترنت)' };
  }
});

ipcMain.handle('license:activate', async function(_e, data) {
  if (!data || !data.key) return { ok: false, error: 'مفتاح الترخيص مطلوب' };
  const key = data.key.trim();
  const machineId = getMachineId();
  try {
    const result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/register', {
      licenseKey: key,
      machineId: machineId
    });
    if (result?.status === "success" && result?.data?.activated) {
      saveLicense({
        key: key,
        machineId: machineId,
        activatedAt: Date.now(),
        lastValidated: Date.now(),
        deviceId: result.data.deviceId || null
      });
      return { ok: true, message: 'تم التفعيل بنجاح' };
    }
    return { ok: false, error: (result?.data?.error) || 'فشل التفعيل' };
  } catch (e) {
    return { ok: false, error: 'تعذر الاتصال بخادم الترخيص' };
  }
});

ipcMain.handle('license:deactivate', async function() {
  const license = getLicense();
  let unregistered = false;

  if (license && license.key && license.machineId) {
    try {
      const result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/unregister', {
        licenseKey: license.key,
        machineId: license.machineId
      });
      if (result?.status === "success") unregistered = true;
    } catch (e) {
      // 4xx = invalid key/device — ignore, continue with local delete
      // network error = offline — still delete locally
    }
  }

  try { fs.unlinkSync(LICENSE_PATH); } catch (e) { /* ignore */ }
  return { ok: true, unregistered: unregistered };
});

/* ─── Periodic License Re-validation ─── */

function startLicenseRevalidation() {
  setInterval(async function() {
    const license = getLicense();
    if (!license) return;
    if (checkOfflineGrace(license)) {
      try {
        const result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/validate', {
          licenseKey: license.key,
          machineId: license.machineId
        });
        if (result?.data?.valid) {
          license.lastValidated = Date.now();
          saveLicense(license);
        }
      } catch (e) {
        if (e.status && e.status >= 400 && e.status < 500) {
          try { fs.unlinkSync(LICENSE_PATH); } catch (e2) { /* ignore */ }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('license:invalidated');
          }
        }
      }
    }
  }, 6 * 60 * 60 * 1000);
}

/* ─── Notification deduplication uses DB (isSent/markSent/cleanOldSentNotifications) ─── */

function createWindow() {
  const savedState = loadWindowState();
  mainWindow = new BrowserWindow({
    width: savedState.width || 1280,
    height: savedState.height || 840,
    x: savedState.x,
    y: savedState.y,
    minWidth: 900,
    minHeight: 600,
    title: 'LexOffece',
    icon: path.join(__dirname, 'icon.png'),
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#F8F8F7',
    show: false
  });

  // Content-Security-Policy: prevent XSS
  const connectSrc = ["'self'", 'https://api.groq.com', 'https://api.openai.com', 'https://api.anthropic.com', 'https://generativelanguage.googleapis.com'];
  if (isDev) connectSrc.push('http://localhost:4000');
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-attr 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src " + connectSrc.join(' ') + "; base-uri 'none'; form-action 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; frame-ancestors 'none'; manifest-src 'self'"],
        'Strict-Transport-Security': ['max-age=31536000; includeSubDomains']
      }
    });
  });

  mainWindow.loadFile('index.html');

  // Right-click context menu: Cut / Copy / Paste / Select All
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const template = [];
    if (params.isEditable) {
      if (params.selectionText) {
        template.push({ label: 'قص', accelerator: 'CmdOrCtrl+X', role: 'cut' });
        template.push({ label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy' });
      }
      template.push({ label: 'لصق', accelerator: 'CmdOrCtrl+V', role: 'paste' });
      template.push({ type: 'separator' });
      template.push({ label: 'تحديد الكل', accelerator: 'CmdOrCtrl+A', role: 'selectAll' });
    } else {
      template.push({ label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy', enabled: params.selectionText?.length > 0 });
      template.push({ label: 'تحديد الكل', accelerator: 'CmdOrCtrl+A', role: 'selectAll' });
    }
    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({ window: mainWindow });
    }
  });

  // Ensure Ctrl+C / Ctrl+V / Ctrl+A keyboard shortcuts always work
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (!input.control && !input.meta) return;
    if (input.type !== 'keyDown') return;
    const key = input.key.toLowerCase();
    if (key === 'c') { mainWindow.webContents.copy(); }
    else if (key === 'v') { mainWindow.webContents.paste(); }
    else if (key === 'a') { mainWindow.webContents.selectAll(); }
    else if (key === 'x') { mainWindow.webContents.cut(); }
  });

  // Open target="_blank" links: confirm external URLs with the user
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      const trustedDomains = ['localhost:4000', 'api.groq.com', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com'];
      try {
        const parsed = new URL(url);
        if (trustedDomains.includes(parsed.hostname + (parsed.port ? ':' + parsed.port : ''))) {
          shell.openExternal(url);
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['فتح في المتصفح', 'إلغاء'],
            defaultId: 1,
            title: 'رابط خارجي',
            message: 'فتح الرابط التالي في المتصفح؟',
            detail: url
          }).then(({ response }) => {
            if (response === 0) shell.openExternal(url);
          });
        }
      } catch (e) {
        console.warn('Blocked malformed external URL:', url);
      }
    }
    return { action: 'deny' };
  });

  mainWindow.on('close', async (e) => {
    if (mainWindow) {
      e.preventDefault();
      await saveDbOnQuit();
      mainWindow.destroy();
    }
  });

  const debounceSaveState = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      saveWindowState({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y });
    }
  }, 500); }; })();

  mainWindow.on('resize', debounceSaveState);
  mainWindow.on('move', debounceSaveState);
  mainWindow.on('maximize', debounceSaveState);
  mainWindow.on('unmaximize', debounceSaveState);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function logToLogger(level, context, message, data) {
  try {
    logger.log(level, context, message, data);
  } catch (e) {
    console.error('logger.log failed:', e);
  }
}

process.on('uncaughtException', (err) => {
  logToLogger(3, 'uncaughtException', err.message || String(err), { stack: (err.stack || '').slice(0, 500) });
  console.error('FATAL:', err);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  logToLogger(2, 'unhandledRejection', msg, { stack: (reason?.stack || '').slice(0, 500) });
});

function wrapDbCall(name, fn) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      const msg = err.message || String(err);
      const sanitized = msg.replace(/(FROM|INTO|UPDATE|TABLE|INSERT|CREATE|ALTER|DROP)\s+\w+/gi, '$1 [REDACTED]');
      logToLogger(2, 'db:' + name, sanitized, { stack: (err.stack || '').slice(0, 300) });
      throw err;
    }
  };
}

// ─── Protected IPC: auth check + error handling at the ipcMain.handle level ───
function protectedIpc(name, handler) {
  return async (event, ...args) => {
    if (!currentUser && !name.startsWith('auth:') && !name.startsWith('app:') && !name.startsWith('notif:')) {
      return { error: 'Unauthorized: الرجاء تسجيل الدخول أولاً' };
    }
    try {
      return await handler(event, ...args);
    } catch (err) {
      const msg = err.message || String(err);
      const sanitized = msg.replace(/(FROM|INTO|UPDATE|TABLE|INSERT|CREATE|ALTER|DROP)\s+\w+/gi, '$1 [REDACTED]');
      logToLogger(2, 'ipc:' + name, sanitized, { stack: (err.stack || '').slice(0, 300) });
      return { error: 'حدث خطأ داخلي. الرجاء المحاولة مرة أخرى' };
    }
  };
}

// ─── Safe IPC helper: register handler through protectedIpc ───
function safeIpc(name, handler) {
  ipcMain.handle(name, protectedIpc(name, handler));
}

// ─── Mutate IPC helper: like safeIpc but persists DB after every mutation ───
function mutateIpc(name, handler) {
  ipcMain.handle(name, protectedIpc(name, async (event, ...args) => {
    const result = await handler(event, ...args);
    db.flushWrites().catch(e => logToLogger(2, 'flush:' + name, e.message));
    return result;
  }));
}

async function init() {
  await db.initDb();
  logToLogger(0, 'app', 'Application started');

  // Run integrity check and auto-repair at startup (non-blocking)
  try {
    const integrity = db.integrityCheck();
    if (integrity.orphans && integrity.orphans.length > 0) {
      logToLogger(1, 'app', `Found ${integrity.orphans.length} orphan records — running auto-repair`);
      const repair = db.repairOrphans();
      logToLogger(0, 'app', `Auto-repair: ${repair.repaired} orphans fixed`);
    }
    if (integrity.warnings && integrity.warnings.length > 0) {
      integrity.warnings.forEach(w => logToLogger(1, 'app', `Integrity warning: ${JSON.stringify(w)}`));
    }
  } catch (e) {
    logToLogger(2, 'app', `Startup integrity check failed: ${e.message}`);
  }

  const archived = db.autoArchive();
  if (isDev && archived > 0) console.log(`Auto-archived ${archived} closed cases`);

  // ─── DB IPC Handlers ───

  safeIpc('db:getAllCases', withPerm('view_case')(() => db.getAllCases(false, currentUser?.id, currentUser?.role)));
  mutateIpc('db:addCase', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const result = db.addCase(data);
    if (result && result.id) db.addLog('add_case', `إضافة قضية ${data.case_number || ''} - ${data.title || ''}`);
    await db.flushWrites();
    return result;
  }));
  mutateIpc('db:deleteCase', withPerm('delete_case')(async (_e, id) => {
    if (id == null) return;

    // 0. Auto-backup before deletion
    db.createBackup('before_delete_case');

    // 1. Fetch case info before deletion
    const allCases = db.getAllCases();
    const c = allCases.find(x => x.id === id);

    // 2. Delete case from database (ON DELETE CASCADE handles related records in DB)
    await db.deleteCase(id);

    // 3. Delete storage folder from disk (safety-checked)
    const caseDir = path.join(db.STORAGE_DIR, String(id));
    if (isPathSafe(caseDir, db.STORAGE_DIR)) {
      try {
        if (fs.existsSync(caseDir)) {
          fs.rmSync(caseDir, { recursive: true, force: true });
          if (isDev) console.log(`Deleted storage for case #${id}`);
        }
      } catch (err) {
        console.error(`Failed to delete storage for case #${id}:`, err);
      }
    }

    db.addLog('delete_case', `حذف قضية ${c ? c.case_number : '#' + id} مع جميع ملفاتها`);
  }));
  safeIpc('db:getCasesByClient', withPerm('view_case')((_e, clientId) => db.getCasesByClient(clientId)));
  safeIpc('db:getAllClients', withPerm('view_case')(() => db.getAllClients()));
  mutateIpc('db:addClient', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const result = db.addClient(data);
    if (result && result.id) db.addLog('add_client', `إضافة موكل ${data.name || ''}`);
    await db.flushWrites();
    return result;
  }));
  mutateIpc('db:deleteClient', withPerm('edit_case')(async (_e, id) => {
    if (id == null) return;
    db.createBackup('before_delete_client');
    const c = db.getAllClients().find(x => x.id === id);
    await db.deleteClient(id);
    db.addLog('delete_client', `حذف موكل ${c ? c.name : '#' + id}`);
    await db.flushWrites();
  }));
  mutateIpc('db:updateClient', withPerm('edit_case')(async (_e, data) => {
    if (!data || !data.id) return { error: 'معرف الموكل مطلوب' };
    db.updateClient(data);
    await db.flushWrites();
    return { ok: true };
  }));
  safeIpc('db:getAllTasks', withPerm('manage_tasks')((_e, includeArchived) => db.getAllTasks(includeArchived)));
  safeIpc('db:getTask', withPerm('manage_tasks')((_e, id) => db.getTask(id)));
  mutateIpc('db:addTask', withPerm('manage_tasks')(async (_e, data) => {
    data = nullGuard(data);
    if (data.case_id && !db.validateRef('cases', data.case_id)) return { error: 'القضية غير موجودة' };
    const id = db.addTask(data);
    await db.flushWrites();
    return { id };
  }));
  mutateIpc('db:updateTask', withPerm('manage_tasks')(async (_e, id, data) => db.updateTask(id, data)));
  mutateIpc('db:deleteTask', withPerm('manage_tasks')(async (_e, id) => db.deleteTask(id)));
  safeIpc('db:getSubtasks', withPerm('manage_tasks')((_e, taskId) => db.getSubtasks(taskId)));
  mutateIpc('db:addSubtask', withPerm('manage_tasks')(async (_e, data) => db.addSubtask(nullGuard(data))));
  mutateIpc('db:toggleSubtask', withPerm('manage_tasks')(async (_e, id) => db.toggleSubtask(id)));
  mutateIpc('db:deleteSubtask', withPerm('manage_tasks')(async (_e, id) => db.deleteSubtask(id)));
  safeIpc('db:getComments', withPerm('manage_tasks')((_e, taskId) => db.getComments(taskId)));
  mutateIpc('db:addComment', withPerm('manage_tasks')(async (_e, data) => db.addComment(nullGuard(data))));
  safeIpc('db:getAllWorkflows', withPerm('manage_tasks')(() => db.getAllWorkflows()));
  mutateIpc('db:addWorkflow', withPerm('manage_tasks')(async (_e, data) => db.addWorkflow(nullGuard(data))));
  mutateIpc('db:applyWorkflow', withPerm('manage_tasks')(async (_e, args) => {
    const { caseId, workflowId } = nullGuard(args);
    return db.applyWorkflow(caseId, workflowId);
  }));
  mutateIpc('db:deleteWorkflow', withPerm('manage_tasks')(async (_e, id) => db.deleteWorkflow(id)));
  safeIpc('db:getAllTemplates', withPerm('manage_tasks')(() => db.getAllTemplates()));
  mutateIpc('db:addTemplate', withPerm('manage_tasks')(async (_e, data) => db.addTemplate(nullGuard(data))));
  mutateIpc('db:applyTemplate', withPerm('manage_tasks')(async (_e, args) => {
    const { caseId, templateId } = nullGuard(args);
    return db.applyTemplate(caseId, templateId);
  }));
  mutateIpc('db:deleteTemplate', withPerm('manage_tasks')(async (_e, id) => {
    if (id == null) return { ok: false, error: 'معرف القالب مطلوب' };
    db.deleteTemplate(id);
    db.addLog('delete_template', `حذف قالب #${id}`);
    return { ok: true };
  }));
  safeIpc('db:getTaskAnalytics', withPerm('manage_tasks')(() => db.getTaskAnalytics()));
  safeIpc('db:getDashboardStats', withPerm('view_case')(() => db.getDashboardStats()));
  safeIpc('db:getDashboardExtendedStats', withPerm('view_case')(() => db.getDashboardExtendedStats()));
  safeIpc('db:getDocuments', withPerm('view_case')((_e, caseId) => db.getDocuments(caseId)));
  safeIpc('db:getAllDocuments', withPerm('view_case')(() => db.getAllDocuments(currentUser?.id, currentUser?.role)));
  mutateIpc('db:uploadDocument', withPerm('upload_doc')(async (_e, args) => {
    const { sourcePath, caseId, docType } = nullGuard(args);
    if (!sourcePath) return { error: 'مسار الملف مطلوب' };
    if (!isAllowedUploadSource(sourcePath)) return { error: 'مسار الملف غير مصرح به' };
    if (!db.validateRef('cases', caseId)) return { error: 'القضية غير موجودة' };
    const extCheck = path.extname(sourcePath).toLowerCase();
    if (!validateFileMagic(sourcePath, extCheck)) return { error: 'نوع الملف غير صالح (فحص التوقيع)' };
    const stats = await fsp.stat(sourcePath);
    if (stats.size > 50 * 1024 * 1024) return { error: 'الملف كبير جداً (الحد 50MB)' };
    const caseDir = path.join(db.STORAGE_DIR, String(caseId));
    try { await fsp.access(caseDir); } catch { await fsp.mkdir(caseDir, { recursive: true }); }
    const filename = path.basename(sourcePath).normalize('NFKC').replace(/[^a-zA-Z0-9_\-.\u0600-\u06FF\s()]/g, '_');
    if (!filename || filename === '.' || filename === '..') return { error: 'اسم ملف غير صالح' };
    const finalPath = await getUniqueFilePath(caseDir, filename);
    await fsp.copyFile(sourcePath, finalPath);
    const docId = db.addDocument({ case_id: caseId, filename: path.basename(finalPath), file_path: finalPath, doc_type: docType, file_size: formatFileSize(stats.size) });
    setTimeout(() => indexDocument(docId), 100);
    db.addLog('upload_document', `رفع وثيقة ${path.basename(finalPath)} للقضية #${caseId} (${docType})`);
    return docId;
  }));
  mutateIpc('db:selectAndUpload', withPerm('upload_doc')(async (_e, args) => {
    const { caseId, docType, tags } = nullGuard(args);
    if (!db.validateRef('cases', caseId)) return { error: 'القضية غير موجودة' };
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const uploaded = [];
    const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    for (const sourcePath of result.filePaths) {
      try {
        const stats = await fsp.stat(sourcePath);
        if (stats.size > MAX_FILE_SIZE) throw new Error(`${path.basename(sourcePath)} كبير جداً (الحد 50MB)`);
        const ext = path.extname(sourcePath).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`نوع غير مدعوم: ${path.basename(sourcePath)}`);
        if (!validateFileMagic(sourcePath, ext)) throw new Error(`نوع الملف غير صالح (فحص التوقيع): ${path.basename(sourcePath)}`);
        const caseDir = path.join(db.STORAGE_DIR, String(caseId));
        try { await fsp.access(caseDir); } catch { await fsp.mkdir(caseDir, { recursive: true }); }
        const sanitized = path.basename(sourcePath).normalize('NFKC').replace(/[^a-zA-Z0-9_\-.\u0600-\u06FF\s()]/g, '_');
        const finalPath = await getUniqueFilePath(caseDir, sanitized);
        await fsp.copyFile(sourcePath, finalPath);
        const docId = db.addDocument({ case_id: caseId, filename: path.basename(finalPath), file_path: finalPath, doc_type: docType, file_size: formatFileSize(stats.size), tags });
        setTimeout(() => indexDocument(docId), 100);
        db.addLog('upload_document', `رفع ${path.basename(finalPath)} للقضية #${caseId} (${docType})`);
        uploaded.push(docId);
      } catch (e) { console.error('Upload error:', sourcePath, e.message); }
    }
    return uploaded.length ? uploaded : null;
  }));
  safeIpc('db:globalSearch', withPerm('view_case')((_e, queryTerm) => db.globalSearch(typeof queryTerm === 'string' ? queryTerm : '', currentUser?.id, currentUser?.role)));
  safeIpc('db:getSearchIndex', withPerm('view_case')(() => db.getSearchIndex(currentUser?.id, currentUser?.role)));
  mutateIpc('db:rebuildSearchIndex', withPerm('manage_users')(async () => { db.rebuildSearchIndex(); db.addLog('rebuild_search', 'إعادة بناء فهرس البحث'); }));
  safeIpc('db:openDocument', withPerm('view_case')(async (_e, docId) => {
    if (docId == null) return;
    try {
      const SAFE_EXTS = new Set(['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.doc']);
      const doc = db.getDocument(docId);
      if (doc && doc.file_path && fs.existsSync(doc.file_path) && isPathSafe(doc.file_path, db.STORAGE_DIR)) {
        const ext = path.extname(doc.file_path).toLowerCase();
        if (!SAFE_EXTS.has(ext)) return { error: 'نوع ملف غير مسموح / Type de fichier non autorisé' };
        const current = fs.realpathSync(doc.file_path);
        shell.openPath(current);
      }
    } catch (e) { logToLogger(2, 'openDocument', e.message); }
  }));
  safeIpc('db:downloadDocument', withPerm('view_case')(async (_e, docId) => {
    if (docId == null) return;
    try {
      const doc = db.getDocument(docId);
      if (!doc || !doc.file_path || !fs.existsSync(doc.file_path)) return { error: 'الملف غير موجود' };
      if (!isPathSafe(doc.file_path, db.STORAGE_DIR)) return { error: 'مسار الملف غير صالح' };
      const safeFilename = path.basename(doc.filename || 'document').replace(/[^a-zA-Z0-9_\-.\u0600-\u06FF\s()]/g, '_');
      const result = await dialog.showSaveDialog(mainWindow, { defaultPath: safeFilename, filters: [{ name: 'All Files', extensions: ['*'] }] });
      if (!result.canceled && result.filePath) {
        await fsp.copyFile(doc.file_path, result.filePath);
        return { ok: true };
      }
    } catch (e) { logToLogger(2, 'downloadDocument', e.message); return { error: e.message }; }
  }));
  mutateIpc('db:deleteDocument', withPerm('delete_document')(async (_e, id) => {
    if (id == null) return { ok: false, error: 'معرف الوثيقة مطلوب' };
    const doc = db.getDocument(id);
    if (!doc) return { ok: false, error: 'الوثيقة غير موجودة' };
    if (doc.file_path && isPathSafe(doc.file_path, db.STORAGE_DIR)) {
      try { if (fs.existsSync(doc.file_path)) fs.unlinkSync(doc.file_path); } catch (e) { console.error(`Failed to delete document file #${id}:`, e.message); }
    }
    db.deleteDocument(id);
    db.addLog('delete_document', `حذف وثيقة ${doc.filename || '#' + id}`);
    return { ok: true };
  }));
  safeIpc('db:getProcedures', withPerm('view_case')((_e, affaireId) => db.getProcedures(affaireId)));
  mutateIpc('db:addProcedure', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addProcedure(data);
    db.addLog('add_procedure', `إضافة إجراء للقضية #${data.affaire_id}: ${data.type || ''} - ${data.date || ''}`);
    return { id };
  }));
  safeIpc('db:getPaiements', withPerm('view_finance')((_e, affaireId) => db.getPaiements(affaireId)));
  mutateIpc('db:addPaiement', withPerm('view_finance')(async (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addPaiement(data);
    db.addLog('add_paiement', `إضافة دفعة ${data.montant || 0} درهم للقضية #${data.affaire_id}`);
    return { id };
  }));
  mutateIpc('db:updateHonorairesTotaux', withPerm('view_finance')(async (_e, data) => {
    data = nullGuard(data);
    if (data.caseId == null || data.montant === undefined) return { error: 'caseId و montant مطلوبان' };
    if (!db.validateRef('cases', data.caseId)) return { error: 'القضية غير موجودة' };
    db.updateHonorairesTotaux(data.caseId, parseFloat(data.montant) || 0);
    db.addLog('update_honoraires', `تحديث مجموع الأتعاب للقضية #${data.caseId}: ${data.montant} درهم`);
    return { ok: true };
  }));
  safeIpc('db:getChartData', withPerm('view_finance')(() => db.getChartData()));
  mutateIpc('db:archiveCase', withPerm('edit_case')(async (_e, id) => {
    if (id == null) return;
    db.createBackup('before_archive_case');
    db.archiveCase(id);
  }));
  mutateIpc('db:unarchiveCase', withPerm('edit_case')(async (_e, id) => { if (id != null) db.unarchiveCase(id); }));
  mutateIpc('db:archiveClient', withPerm('edit_case')(async (_e, id) => {
    if (id == null) return;
    db.createBackup('before_archive_client');
    db.archiveClient(id);
  }));
  mutateIpc('db:unarchiveClient', withPerm('edit_case')(async (_e, id) => { if (id != null) db.unarchiveClient(id); }));
  mutateIpc('db:updateCaseStatus', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null && data.status) {
      db.updateCaseStatus(data.id, data.status);
      await db.flushWrites();
    }
  }));
  mutateIpc('db:updateCaseNotes', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) {
      db.updateCaseNotes(data.id, data.notes || '');
      await db.flushWrites();
    }
  }));
  safeIpc('db:getArchivedCases', withPerm('view_case')(() => db.getAllCases(true, currentUser?.id, currentUser?.role).filter(c => c.archived === 1)));
  mutateIpc('db:addCommunication', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const id = db.addCommunication(data);
    db.addLog('add_communication', `تسجيل اتصال مع الموكل #${data.client_id} - ${data.type || ''}`);
    return id;
  }));
  safeIpc('db:getClientCommunications', withPerm('view_case')((_e, clientId) => db.getClientCommunications(clientId)));
  safeIpc('db:getAllCommunications', withPerm('view_case')(() => db.getAllCommunications(currentUser?.id, currentUser?.role)));
  mutateIpc('db:updateClientNotes', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) db.updateClient(data);
  }));
  safeIpc('db:getTodayProcedures', withPerm('view_case')(() => db.getTodayProcedures()));
  safeIpc('db:getAlertSettings', withPerm('manage_users')(() => db.getAlertSettings()));
  mutateIpc('db:updateAlertSettings', withPerm('manage_users')(async (_e, data) => {
    db.updateAlertSettings(nullGuard(data));
    db.addLog('update_alert_settings', `تعديل إعدادات التنبيهات`);
  }));
  safeIpc('db:getUpcomingDeadlines', withPerm('view_case')(() => db.getUpcomingDeadlines()));
  safeIpc('db:getUpcomingHearings', withPerm('view_case')(() => db.getUpcomingHearings()));
  safeIpc('db:getBackupSettings', withPerm('manage_users')(() => db.getBackupSettings()));
  mutateIpc('db:updateBackupSettings', withPerm('manage_users')(async (_e, data) => {
    db.updateBackupSettings(nullGuard(data));
    db.addLog('update_backup_settings', `تعديل إعدادات النسخ الاحتياطي`);
  }));
  mutateIpc('db:createBackup', withPerm('manage_users')(async () => {
    const name = db.createBackup('manual');
    db.addLog('create_backup', `إنشاء نسخة احتياطية يدوية: ${name}`);
    return name;
  }));
  safeIpc('db:listBackups', withPerm('manage_users')(() => { try { return db.listBackups(); } catch (e) { logToLogger(2, 'listBackups', e.message); return []; } }));
  safeIpc('db:validateBackup', withPerm('manage_users')((_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    return db.validateBackupFile(filename);
  }));
  mutateIpc('db:restoreBackup', withPerm('manage_users')(async (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    db.createBackup('before_restore');
    const result = db.restoreFromBackup(filename);
    db.addLog('restore_backup', `استعادة نسخة احتياطية: ${filename}`);
    return result;
  }));
  mutateIpc('db:deleteBackup', withPerm('manage_users')(async (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    const result = db.deleteBackupFile(filename);
    db.addLog('delete_backup', `حذف نسخة احتياطية: ${filename}`);
    return result;
  }));
  mutateIpc('db:exportArchive', withPerm('export_data')(async () => {
    const result = db.exportFullArchive();
    db.addLog('export_archive', `تصدير أرشيف كامل: ${result.filename}`);
    return result;
  }));
  safeIpc('db:getLogs', withPerm('view_audit')((_e, filters) => db.getLogs(filters)));
  ipcMain.handle('db:addLog', (_e, action, details) => {
    logToLogger(1, 'guard', 'renderer attempted db:addLog', { action });
    return { error: 'forbidden' };
  });
  const AUDIT_ALLOWED_PREFIXES = ['error', 'renderer_'];
  safeIpc('audit:log', (_e, action, details) => {
    if (!AUDIT_ALLOWED_PREFIXES.some(function (p) { return action && action.indexOf(p) === 0; })) return { error: 'action not allowed' };
    if (action) db.addLog(action, (details || '').slice(0, 500));
    return { ok: true };
  });
  safeIpc('db:integrityCheck', withPerm('manage_users')(() => db.integrityCheck()));
  mutateIpc('db:repairOrphans', withPerm('manage_users')(() => db.repairOrphans()));
  safeIpc('db:cleanOrphanedFiles', withPerm('manage_users')(() => {
    const result = db.cleanOrphanedFiles();
    db.addLog('clean_orphans', `تنظيف ${result.deletedCount} ملفاً يتيماً (${result.freedMB} MB)`);
    return result;
  }));

  // ─── Logger IPC ───
  mutateIpc('logger:log', withPerm('manage_users')((_e, level, context, message) => {
    if (!currentUser) return;
    const lvlMap = { INFO: 0, WARN: 1, ERROR: 2, CRITICAL: 3 };
    const lvl = lvlMap[level] !== undefined ? lvlMap[level] : 1;
    logToLogger(lvl, context || 'renderer', message || '');
  }));

  safeIpc('logger:getLogs', withPerm('view_audit')((_e, filters) => logger.getLogs(filters)));
  safeIpc('logger:export', withPerm('view_audit')((_e, format) => logger.exportLogs(format || 'json')));
  safeIpc('logger:clear', withPerm('manage_users')(() => logger.clearLogs()));
  safeIpc('logger:stats', withPerm('view_audit')(() => logger.getStats()));

  ipcMain.handle('notif:getCacheStats', () => {
    if (!currentUser) return {};
    return {
    size: 0,
    maxSize: 500,
    ttlMs: LICENSE_GRACE_MS,
    memoryEstimate: 0
  };
  });

  ipcMain.handle('app:checkMasterKey', () => {
    if (!currentUser) return { hasMasterKey: false };
    return { hasMasterKey: !!process.env.MASTER_KEY };
  });

  safeIpc('app:navigateToCase', withPerm('view_case')((_e, caseId) => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    if (caseId) mainWindow?.webContents.send('app:navigateToCase', caseId);
  }));

  // ───── Cert Pinning ─────
  ipcMain.handle('cert:getPinnedStatus', () => {
    const pins = loadPinnedCerts();
    return Object.keys(pins).map(function (h) { return { hostname: h, fingerprint: pins[h] }; });
  });
  ipcMain.handle('cert:approveNewPin', (_e, hostname, newFingerprint) => {
    if (PINNED_DOMAINS.indexOf(hostname) === -1) return { ok: false, error: 'النطاق غير مدعوم' };
    if (!newFingerprint || typeof newFingerprint !== 'string') return { ok: false, error: 'بصمة غير صالحة' };
    const pending = loadPendingPinApprovals();
    pending[hostname] = newFingerprint;
    savePendingPinApprovals(pending);
    return { ok: true };
  });
  ipcMain.handle('cert:resetPins', () => {
    savePinnedCerts({});
    try {
      const p = path.join(app.getPath('userData'), 'storage', 'pending_pins.json');
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) { /* ignore */ }
    return { ok: true };
  });
}

async function runApp() {
  await init();
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  setupCertPinning();
  createWindow();

  mainWindow.webContents.once('did-finish-load', () => {
    checkAndNotify();
    checkTodayEvents();
    checkUpcomingEvents();
    setInterval(checkAndNotify, 3600000);
    setInterval(checkTodayEvents, 3600000);
    setInterval(checkUpcomingEvents, 21600000);
    setInterval(() => { try { db.cleanOldSentNotifications(); } catch (e) { /* ignore */ } }, 86400000);
    try { db.cleanExpiredRevokedTokens(); } catch (e) { /* ignore */ }
    setInterval(() => { try { db.cleanExpiredRevokedTokens(); } catch (e) { /* ignore */ } }, 3600000);

    setTimeout(() => {
      setInterval(() => {
        try {
          const s = db.getBackupSettings();
          if (s.auto_enabled) {
            const freqMs = (s.frequency_hours || 24) * 3600000;
            if (!s.last_backup_at || (Date.now() - new Date(s.last_backup_at).getTime()) >= freqMs) {
              const name = db.createBackup('scheduled');
              db.addLog('auto_backup', `نسخة احتياطية تلقائية: ${name}`);
            }
          }
        } catch (e) { console.error('Auto-backup interval error:', e); }
      }, 3600000);
    }, 5000);
  });

  startLicenseRevalidation();
}

app.whenReady().then(runApp);

function checkAndNotify() {
  try {
    const settings = db.getAlertSettings();
    if (!settings || !settings.enabled) return;

    const thresholds = [settings.days_before_1, settings.days_before_2, settings.days_before_3].filter(t => t > 0);
    if (thresholds.length === 0) return;
    const maxThreshold = Math.max(...thresholds);

    const deadlines = db.getUpcomingDeadlines();
    const hearings = db.getUpcomingHearings();

    deadlines.forEach(item => {
      if (item.days_remaining <= maxThreshold) {
        const key = 'deadline-' + item.case_id + '-' + item.days_remaining;
        if (!db.isSent(key)) {
          db.markSent(key);
          new Notification({ title: 'تنبيه أجل حسمي', body: item.case_number + ': ' + item.title + ' - باقي ' + item.days_remaining + ' يوم' }).show();
        }
      }
    });

    hearings.forEach(item => {
      if (item.days_remaining <= maxThreshold) {
        const key = 'hearing-' + item.id + '-' + item.days_remaining;
        if (!db.isSent(key)) {
          db.markSent(key);
          new Notification({ title: 'تنبيه جلسة قريبة', body: item.case_number + ': ' + item.type + ' - باقي ' + item.days_remaining + ' يوم' }).show();
        }
      }
    });
  } catch (e) { console.error('checkAndNotify error:', e); }
}

function checkUpcomingEvents() {
  try {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const events = db.getEventsByDate(tomorrow);
    const hearings = db.getTomorrowHearings();

    events.forEach(ev => {
      const key = 'upcoming_event_' + ev.id;
      if (db.isSent(key)) return;
      db.markSent(key);
      const caseInfo = ev.case_number ? `قضية ${ev.case_number}` : '';
      const body = `تذكير: عندك ${ev.type} — ${ev.title}${caseInfo ? ` فـ ${caseInfo}` : ''}${ev.court ? ` فـ ${ev.court}` : ''}`;
      const n = new Notification({ title: 'تذكير بموعد غداً', body });
      n.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        if (ev.case_id) mainWindow?.webContents.send('app:navigateToCase', ev.case_id);
      });
      n.show();
    });

    hearings.forEach(h => {
      const key = 'upcoming_hearing_' + h.id;
      if (db.isSent(key)) return;
      db.markSent(key);
      const body = `تذكير: عندك جلسة غداً فـ قضية ${h.case_number}${h.court ? ` فـ ${h.court}` : ''}`;
      const n = new Notification({ title: 'تذكير بجلسة غداً', body });
      n.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        if (h.case_id) mainWindow?.webContents.send('app:navigateToCase', h.case_id);
      });
      n.show();
    });
  } catch (e) { console.error('checkUpcomingEvents error:', e); }
}

function checkTodayEvents() {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const events = db.getEventsByDate(today);
    const hearings = db.getTodayHearings();

    events.forEach(ev => {
      const key = 'today_event_' + ev.id;
      if (db.isSent(key)) return;
      db.markSent(key);
      const caseInfo = ev.case_number ? `قضية ${ev.case_number}` : '';
      const body = `تذكير: عندك ${ev.type} — ${ev.title}${caseInfo ? ` فـ ${caseInfo}` : ''}${ev.court ? ` فـ ${ev.court}` : ''}`;
      const n = new Notification({ title: 'تذكير بموعد اليوم', body });
      n.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        if (ev.case_id) mainWindow?.webContents.send('app:navigateToCase', ev.case_id);
      });
      n.show();
    });

    hearings.forEach(h => {
      const key = 'today_hearing_' + h.id;
      if (db.isSent(key)) return;
      db.markSent(key);
      const body = `تذكير: عندك جلسة اليوم فـ قضية ${h.case_number}${h.court ? ` فـ ${h.court}` : ''}`;
      const n = new Notification({ title: 'تذكير بجلسة اليوم', body });
      n.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        if (h.case_id) mainWindow?.webContents.send('app:navigateToCase', h.case_id);
      });
      n.show();
    });
  } catch (e) { if (isDev) console.error('checkTodayEvents error:', e); }
}

async function indexDocument(docId) {
  const Tesseract = ensureTesseract();
  if (!Tesseract) return;
  let doc;
  try {
    doc = db.getDocument(docId);
    if (!doc) return;
    try { await fsp.access(doc.file_path); } catch {
      console.error('indexDocument: file not accessible for doc', docId, 'at', doc.file_path);
      notifyUser('indexError', `تعذر الوصول إلى ملف الوثيقة ${doc.filename}`);
      return;
    }
    const ext = path.extname(doc.file_path).toLowerCase();
    let text = '';
    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    if (ext === '.pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const buf = new Uint8Array(await fsp.readFile(doc.file_path));
        const pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (isDev) console.log('indexDocument: PDF loaded, pages:', pdfDoc.numPages, 'for doc', docId);
        let pdfText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const tc = await page.getTextContent();
          pdfText += tc.items.map(item => item.str).join(' ') + '\n';
          page.cleanup();
        }
        pdfDoc.cleanup();
        if (isDev) console.log('indexDocument: pdfjs text length:', pdfText.trim().length, 'for doc', docId);
        if (pdfText.trim().length > 50) {
          text = pdfText.trim();
          if (isDev) console.log('indexDocument: using extracted PDF text for doc', docId, '(' + text.length + ' chars)');
        } else {
          if (isDev) console.log('indexDocument: PDF text insufficient (' + pdfText.trim().length + ' chars), falling back to OCR for doc', docId);
          const { createCanvas } = require('canvas');
          const pdfDoc2 = await pdfjsLib.getDocument({ data: buf }).promise;
          let ocrText = '';
          for (let i = 1; i <= pdfDoc2.numPages; i++) {
            const page = await pdfDoc2.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const cvs = createCanvas(viewport.width, viewport.height);
            const ctx = cvs.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            const pngBuf = cvs.toBuffer('image/png');
            page.cleanup();
            const worker = await Tesseract.createWorker('ara+fra');
            const { data } = await worker.recognize(pngBuf);
            await worker.terminate();
            ocrText += (data.text || '') + '\n';
            if (isDev) console.log('indexDocument: OCR page', i, '/', pdfDoc2.numPages, 'got', (data.text || '').trim().length, 'chars for doc', docId);
          }
          pdfDoc2.cleanup();
          text = ocrText.trim();
        }
      } catch (pdfErr) {
        console.error('indexDocument: PDF processing error for doc', docId, ':', pdfErr.message);
        notifyUser('indexError', `تعذر معالجة ملف PDF ${doc.filename}: ${pdfErr.message}`);
      }
    } else if (imgExts.includes(ext)) {
      const worker = await Tesseract.createWorker('ara+fra');
      const { data } = await worker.recognize(doc.file_path);
      await worker.terminate();
      text = data.text || '';
      if (isDev) console.log('indexDocument: OCR for image doc', docId, 'got', text.trim().length, 'chars');
    }
    if (text.trim()) {
      db.addDocumentText(docId, text.trim());
      if (isDev) console.log('indexDocument: saved to document_text for doc', docId, '(' + text.trim().length + ' chars)');
      if (doc.case_id) db.syncSearchIndex(doc.case_id);
      notifyUser('indexSuccess', `تم فهرسة ${doc.filename} (${text.trim().length} حرف)`);
    } else {
      if (isDev) console.log('indexDocument: no text extracted for doc', docId, doc.filename);
      if (ext === '.pdf') {
        notifyUser('indexWarning', `تعذر استخراج نص من ${doc.filename}. قد يكون الملف ممسوحاً ضوئياً أو تالفاً.`);
      }
    }
  } catch (e) {
    console.error('indexDocument error for', docId, ':', e.message);
    notifyUser('indexError', `خطأ في فهرسة ${doc ? doc.filename : docId}: ${e.message}`);
  }
}

function notifyUser(type, message) {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:indexNotification', { type, message });
    }
  } catch (e) { /* ignore */ }
}

// ─── Events System ───

safeIpc('events:getAll', withPerm('view_case')(() => db.getAllEvents()));
safeIpc('events:get', withPerm('view_case')((_e, id) => db.getEvent(id)));
mutateIpc('events:add', withPerm('edit_case')(async (_e, data) => {
  if (!data) return { error: 'البيانات مطلوبة' };
  const id = db.addEvent(data);
  if (id) db.addLog('add_event', `إضافة حدث ${data.title || ''} - ${data.date || ''}`);
  return id;
}));
mutateIpc('events:update', withPerm('edit_case')(async (_e, id, data) => {
  if (id == null || !data) return;
  db.updateEvent(id, data);
  db.addLog('update_event', `تحديث حدث #${id}`);
}));
mutateIpc('events:delete', withPerm('edit_case')(async (_e, id) => {
  if (id == null) return;
  db.deleteEvent(id);
  db.addLog('delete_event', `حذف حدث #${id}`);
}));
// ─── Auth ───

const BCRYPT_SALT_ROUNDS = 12;
const AI_CONFIG_PATH = path.join(app.getPath('userData'), 'storage', 'ai_config.json');
const SAFE_KEY_BACKUP_PATH = path.join(app.getPath('userData'), 'storage', 'safe_key_backup.json');

// Login rate limiting (per userId)
const loginAttempts = new Map();
const securityAnswerAttempts = new Map();
setInterval(() => {
  const cutoff = Date.now() - LOGIN_LOCKOUT_WINDOW;
  for (const [key, data] of loginAttempts) {
    if (data.lastAttempt < cutoff) loginAttempts.delete(key);
  }
  for (const [key, data] of securityAnswerAttempts) {
    if (data.lastAttempt < cutoff) securityAnswerAttempts.delete(key);
  }
}, 60000);
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 min window before reset
const MAX_LOCKOUT_SECS = 900; // 15 minutes max lockout

async function hashBcrypt(pwd) {
  return bcrypt.hash(pwd, BCRYPT_SALT_ROUNDS);
}

function verifyPassword(pwd, passwordHash) {
  if (!passwordHash || typeof passwordHash !== 'string') return false;
  return bcrypt.compareSync(pwd, passwordHash);
}

function signToken(userId, expiryMs) {
  const jti = crypto.randomBytes(16).toString('hex');
  const payload = `${jti}:${userId}:${expiryMs}`;
  const hmac = crypto.createHmac('sha256', HMAC_KEY).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split(':');
  if (parts.length < 4) return null;
  const jti = parts[0];
  const payload = parts.slice(0, -1).join(':');
  const sig = parts[parts.length - 1];
  const expected = crypto.createHmac('sha256', HMAC_KEY).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  const userId = parseInt(parts[1], 10);
  const expiry = parseInt(parts[2], 10);
  if (isNaN(userId) || isNaN(expiry) || Date.now() > expiry) return null;
  if (db.isTokenRevoked(jti)) return null;
  return userId;
}

let currentUser = null;

function checkPermission(permission) {
  if (!currentUser) return false;
  try { return db.checkPermission(currentUser.role, permission); }
  catch (e) { return false; }
}

function withPerm(perm) {
  return function(handler) {
    return async (event, ...args) => {
      if (!checkPermission(perm)) return { error: 'ليس لديك صلاحية: ' + perm };
      return handler(event, ...args);
    };
  };
}

function handleError(name, err) {
  logToLogger(2, 'auth:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
}

ipcMain.handle('auth:boot', () => {
  try {
    const users = db.getUsers() || [];
    const hasUsers = users.length > 0;
    const allUsers = db.getAllUsers() || [];
    const hasPassword = hasUsers ? allUsers.some(u => u.password_hash && u.password_hash !== '') : false;
    return { hasPassword, corrupt: false, error: null, users, hasUsers };
  } catch (e) {
    handleError('boot', e);
    return { hasPassword: false, corrupt: false, error: null, users: [] };
  }
});

ipcMain.handle('auth:hasPassword', () => {
  try {
    const users = db.getUsers() || [];
    return users.length > 0;
  } catch (e) {
    handleError('hasPassword', e);
    return false;
  }
});

ipcMain.handle('auth:login', (_e, { email, password, remember }) => {
  const now = Date.now();
  try {
    if (!password || typeof password !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    const users = db.getUsers() || [];
    let user = null;
    if (email && typeof email === 'string' && email.trim()) {
      user = users.find(u => u.email === email.trim() && u.active);
    } else {
      user = users.find(u => u.active);
    }
    if (!user) return { ok: false, error: 'بيانات الدخول غير صحيحة' };
    const passwordHash = db.getPasswordHashForUser(user.id);
    if (!passwordHash) return { ok: false, error: 'بيانات الدخول غير صحيحة' };
    const loginKey = String(user.id);
    const prev = loginAttempts.get(loginKey);
    if (prev) {
      if (prev.lockedUntil && now < prev.lockedUntil) {
        const secs = Math.ceil((prev.lockedUntil - now) / 1000);
        return { ok: false, error: `محاولات كثيرة جداً. انتظر ${secs} ثوانٍ` };
      }
      if (now - prev.firstAttempt > LOGIN_LOCKOUT_WINDOW) {
        loginAttempts.delete(loginKey);
      }
    }
    if (!verifyPassword(password, passwordHash)) {
      const rec = loginAttempts.get(loginKey) || { count: 0, firstAttempt: now };
      rec.count = Math.min(rec.count + 1, MAX_LOGIN_ATTEMPTS + 10);
      if (!rec.firstAttempt) rec.firstAttempt = now;
      if (rec.count >= MAX_LOGIN_ATTEMPTS) {
        const lockSecs = Math.min(MAX_LOCKOUT_SECS, Math.pow(2, rec.count - MAX_LOGIN_ATTEMPTS));
        rec.lockedUntil = now + lockSecs * 1000;
      }
      loginAttempts.set(loginKey, rec);
      return { ok: false, error: 'بيانات الدخول غير صحيحة' };
    }
    loginAttempts.delete(loginKey);
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    currentUser = sessionUser;
    db.updateUser(user.id, { last_login: new Date().toISOString() });
    db.addLog('login', `تسجيل دخول: ${user.name}`, user.id, user.name);
    const sessionToken = remember ? signToken(user.id, Date.now() + SESSION_DURATION_MS) : null;
    return { ok: true, user: sessionUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('login', e);
    return { ok: false, error: 'حدث خطأ في تسجيل الدخول' };
  }
});

ipcMain.handle('auth:setup', async (_e, { officeName, adminName, password, openAtLogin, pin }) => {
  try {
    const existing = db.getAllUsers() || [];
    const hasPassword = existing.some(u => u.password_hash && u.password_hash !== '');
    if (hasPassword) return { ok: false, error: 'تم إعداد المكتب مسبقاً' };
    if (!officeName || typeof officeName !== 'string' || !officeName.trim()) return { ok: false, error: 'اسم المكتب مطلوب' };
    if (!adminName || typeof adminName !== 'string' || !adminName.trim()) return { ok: false, error: 'اسم المدير مطلوب' };
    if (!password || typeof password !== 'string' || password.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    const hash = await hashBcrypt(password);
    const cleanEmail = 'admin@' + officeName.trim().replace(/\s+/g, '') + '.ma';
    db.setOfficeSetting('office_name', officeName.trim());
    db.setOfficeSetting('setup_date', new Date().toISOString());
    const existingAdmin = existing.find(u => !u.password_hash || u.password_hash === '');
    let id;
    if (existingAdmin) {
      db.updateUser(existingAdmin.id, { name: adminName.trim(), email: cleanEmail, password_hash: hash, role: 'admin', active: 1 });
      id = existingAdmin.id;
    } else {
      id = db.addUser({ name: adminName.trim(), email: cleanEmail, password_hash: hash, role: 'admin' });
    }
    if (!id) return { ok: false, error: 'فشل إنشاء حساب المدير' };
    if (pin && typeof pin === 'string' && /^\d{4,6}$/.test(pin)) {
      const pinHash = await hashBcrypt(pin);
      db.setUserPin(id, pinHash);
    }
    const user = db.getUserById(id);
    if (!user) return { ok: false, error: 'فشل استرجاع المستخدم' };
    currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    db.addLog('setup', `إعداد المكتب: ${officeName} — المدير: ${adminName}`);
    if (openAtLogin && app.setLoginItemSettings) {
      try { app.setLoginItemSettings({ openAtLogin: true }); } catch (e) { /* best effort */ }
    }
    await db.flushWrites();
    const sessionToken = signToken(id, Date.now() + SESSION_DURATION_MS);
    return { ok: true, user: currentUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('setup', e);
    return { ok: false, error: 'حدث خطأ في إعداد المكتب' };
  }
});

ipcMain.handle('auth:getSecurityQuestion', (_e, userId) => {
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    const questions = db.getSecurityQuestions(userId);
    if (!questions || !questions.length) return { ok: false, error: 'لا توجد أسئلة أمان لهذا المستخدم' };
    const idx = Math.floor(Math.random() * questions.length);
    return { ok: true, questionIndex: questions[idx].question_index, question: questions[idx].question };
  } catch (e) {
    handleError('getSecurityQuestion', e);
    return { ok: false, error: 'حدث خطأ في استرجاع السؤال' };
  }
});

ipcMain.handle('auth:checkSecurityAnswer', (_e, { userId, questionIndex, answer }) => {
  const now = Date.now();
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!questionIndex || questionIndex < 1 || questionIndex > 3) return { ok: false, error: 'رقم السؤال غير صالح' };
    if (!answer || typeof answer !== 'string') return { ok: false, error: 'الإجابة مطلوبة' };
    const secKey = String(userId);
    const prev = securityAnswerAttempts.get(secKey);
    if (prev) {
      if (prev.lockedUntil && now < prev.lockedUntil) {
        const secs = Math.ceil((prev.lockedUntil - now) / 1000);
        return { ok: false, error: `محاولات كثيرة جداً. انتظر ${secs} ثوانٍ` };
      }
      if (now - prev.firstAttempt > LOGIN_LOCKOUT_WINDOW) {
        securityAnswerAttempts.delete(secKey);
      }
    }
    const storedHash = db.getSecurityAnswer(userId, questionIndex);
    if (!storedHash) return { ok: false, error: 'لم يتم العثور على السؤال' };
    const ok = bcrypt.compareSync(answer, storedHash);
    if (!ok) {
      const rec = securityAnswerAttempts.get(secKey) || { count: 0, firstAttempt: now };
      rec.count = Math.min(rec.count + 1, MAX_LOGIN_ATTEMPTS + 10);
      if (!rec.firstAttempt) rec.firstAttempt = now;
      rec.lastAttempt = now;
      if (rec.count >= MAX_LOGIN_ATTEMPTS) {
        const lockSecs = Math.min(MAX_LOCKOUT_SECS, Math.pow(2, rec.count - MAX_LOGIN_ATTEMPTS));
        rec.lockedUntil = now + lockSecs * 1000;
      }
      securityAnswerAttempts.set(secKey, rec);
      return { ok: false, error: 'الإجابة غير صحيحة' };
    }
    securityAnswerAttempts.delete(secKey);
    return { ok: true };
  } catch (e) {
    handleError('checkSecurityAnswer', e);
    return { ok: false, error: 'حدث خطأ في التحقق من الإجابة' };
  }
});

safeIpc('auth:resetPassword', withPerm('manage_users')(async (_e, { userId, newPassword, remember }) => {
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    const hash = await hashBcrypt(newPassword);
    db.updateUser(userId, { password_hash: hash });
    const user = db.getUserById(userId);
    if (!user || !user.active) return { ok: false, error: 'المستخدم غير موجود أو غير نشط' };
    const isSelf = currentUser && currentUser.id === userId;
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    if (isSelf) currentUser = sessionUser;
    db.addLog('reset_password', `إعادة تعيين كلمة السر للمستخدم ${user.name}`, user.id, user.name);
    await db.flushWrites();
    const sessionToken = (isSelf && remember !== false) ? signToken(userId, Date.now() + SESSION_DURATION_MS) : null;
    return { ok: true, user: sessionUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('resetPassword', e);
    return { ok: false, error: 'حدث خطأ في إعادة تعيين كلمة السر' };
  }
}));

safeIpc('auth:resetWithMasterKey', async (_e, { userId, newPassword, masterKey }) => {
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    if (!masterKey || typeof masterKey !== 'string') return { ok: false, error: 'مفتاح الاستعادة مطلوب' };
    if (!safeStrEq(process.env.MASTER_KEY, masterKey)) return { ok: false, error: 'مفتاح الاستعادة غير صحيح' };
    const hash = await hashBcrypt(newPassword);
    db.updateUser(userId, { password_hash: hash });
    const user = db.getUserById(userId);
    if (!user || !user.active) return { ok: false, error: 'المستخدم غير موجود أو غير نشط' };
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    currentUser = sessionUser;
    db.addLog('reset_password', `إعادة تعيين كلمة السر (مفتاح الاستعادة) للمستخدم ${user.name}`, user.id, user.name);
    await db.flushWrites();
    const sessionToken = signToken(userId, Date.now() + SESSION_DURATION_MS);
    return { ok: true, user: sessionUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('resetWithMasterKey', e);
    return { ok: false, error: 'حدث خطأ في إعادة تعيين كلمة السر' };
  }
});

ipcMain.handle('auth:checkRemembered', (_e, token) => {
  try {
    const userId = verifyToken(token);
    if (!userId) return null;
    const user = db.getUserById(userId);
    if (!user || !user.active) return null;
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    currentUser = sessionUser;
    return sessionUser;
  } catch (e) {
    handleError('checkRemembered', e);
    return null;
  }
});

ipcMain.handle('auth:logout', (_e, args) => {
  currentUser = null;
  const reason = typeof args === 'string' ? args : args?.reason;
  const token = args?.token;
  if (token) {
    try {
      const parts = token.split(':');
      if (parts.length >= 4) {
        const jti = parts[0];
        const expiry = parseInt(parts[2], 10);
        if (jti && expiry) db.revokeToken(jti, expiry);
      }
    } catch (e) {
      handleError('logout-revoke', e);
    }
  }
  logToLogger(0, 'auth', reason || 'User logged out');
  return { ok: true };
});

ipcMain.handle('auth:verifyPassword', (_e, pwd) => {
  try {
    if (!currentUser) return { ok: false, error: 'لا يوجد مستخدم حالي' };
    if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    const storedHash = db.getPasswordHashForUser(currentUser.id);
    if (!storedHash) return { ok: false, error: 'لم يتم العثور على كلمة السر' };
    return { ok: bcrypt.compareSync(pwd, storedHash) };
  } catch (e) {
    handleError('verifyPassword', e);
    return { ok: false, error: 'حدث خطأ في التحقق من كلمة السر' };
  }
});

ipcMain.handle('auth:getMasterKey', () => {
  try {
    const key = process.env.MASTER_KEY;
    if (!key) return { ok: false, error: 'مفتاح الاستعادة غير متوفر' };
    return { ok: true, masterKey: key };
  } catch (e) {
    handleError('getMasterKey', e);
    return { ok: false, error: 'حدث خطأ في استرجاع المفتاح' };
  }
});

ipcMain.handle('auth:checkPin', async (_e, data) => {
  try {
    if (!data || !data.userId || typeof data.userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!data.pin || typeof data.pin !== 'string') return { ok: false, error: 'الرمز السري مطلوب' };
    const storedPinHash = db.checkUserPin(data.userId);
    if (!storedPinHash) return { ok: false, error: 'الرمز السري غير مكوّن' };
    const ok = bcrypt.compareSync(data.pin, storedPinHash);
    if (!ok) return { ok: false, error: 'الرمز السري غير صحيح' };
    return { ok: true };
  } catch (e) {
    handleError('checkPin', e);
    return { ok: false, error: 'حدث خطأ في التحقق من الرمز السري' };
  }
});

ipcMain.handle('auth:getForgotMasterKey', async (_e, data) => {
  try {
    if (!data || !data.userId || typeof data.userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!data.pin || typeof data.pin !== 'string') return { ok: false, error: 'الرمز السري مطلوب' };
    const storedPinHash = db.checkUserPin(data.userId);
    if (!storedPinHash) return { ok: false, error: 'الرمز السري غير مكوّن' };
    const ok = bcrypt.compareSync(data.pin, storedPinHash);
    if (!ok) return { ok: false, error: 'الرمز السري غير صحيح' };
    const key = process.env.MASTER_KEY;
    if (!key) return { ok: false, error: 'مفتاح الاستعادة غير متوفر' };
    return { ok: true, masterKey: key };
  } catch (e) {
    handleError('getForgotMasterKey', e);
    return { ok: false, error: 'حدث خطأ في استرجاع المفتاح' };
  }
});

safeIpc('auth:hashPassword', withPerm('manage_users')(async (_e, pwd) => {
  try {
    if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    if (pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    return { ok: true, hash: await hashBcrypt(pwd) };
  } catch (e) {
    handleError('hashPassword', e);
    return { ok: false, error: 'خطأ في تشفير كلمة السر' };
  }
}));

ipcMain.handle('auth:updateProfile', async (_e, data) => {
  if (!currentUser) return { ok: false, error: 'لا يوجد مستخدم حالي' };
  try {
    const allowed = ['name','email','phone','bar_number','city','specialties','experience_years','avatar'];
    const clean = {};
    for (const k of allowed) { if (data[k] !== undefined) clean[k] = data[k]; }
    if (!Object.keys(clean).length) return { ok: false, error: 'لا توجد بيانات للتحديث' };
    if (clean.name !== undefined && (!clean.name || typeof clean.name !== 'string' || !clean.name.trim())) return { ok: false, error: 'الاسم مطلوب' };
    db.updateOwnProfile(currentUser.id, clean);
    Object.assign(currentUser, clean);
    logToLogger(0, 'profile', `تحديث الملف الشخصي للمستخدم ${currentUser.name}`);
    return { ok: true };
  } catch (e) { handleError('updateProfile', e); return { ok: false, error: 'خطأ في تحديث الملف الشخصي' }; }
});

ipcMain.handle('auth:changePassword', async (_e, data) => {
  if (!currentUser) return { ok: false, error: 'لا يوجد مستخدم حالي' };
  try {
    const { oldPassword, newPassword } = data || {};
    if (!oldPassword || typeof oldPassword !== 'string') return { ok: false, error: 'كلمة السر الحالية مطلوبة' };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return { ok: false, error: 'كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل' };
    const storedHash = db.getPasswordHashForUser(currentUser.id);
    if (!storedHash || !bcrypt.compareSync(oldPassword, storedHash)) return { ok: false, error: 'كلمة السر الحالية غير صحيحة' };
    const newHash = await hashBcrypt(newPassword);
    db.updateUser(currentUser.id, { password_hash: newHash });
    await db.flushWrites();
    logToLogger(0, 'profile', 'تغيير كلمة السر للمستخدم ' + currentUser.name);
    return { ok: true };
  } catch (e) { handleError('changePassword', e); return { ok: false, error: 'خطأ في تغيير كلمة السر' }; }
});

ipcMain.handle('auth:getCurrentUser', () => {
  if (!currentUser) return null;
  try {
    const user = db.getUserById(currentUser.id);
    if (user) return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, active: user.active, last_login: user.last_login, phone: user.phone, bar_number: user.bar_number, city: user.city, specialties: user.specialties, experience_years: user.experience_years };
    return currentUser;
  } catch (e) { return currentUser; }
});
ipcMain.handle('auth:getPermissions', () => {
  if (!currentUser) return {};
  try { return db.getPermissions(currentUser.role); } catch (e) { return {}; }
});

ipcMain.handle('auth:getUsers', () => {
  try {
    if (!currentUser) return [];
    return db.getUsers() || [];
  } catch (e) {
    handleError('getUsers', e);
    return [];
  }
});

ipcMain.handle('auth:addUser', async (_e, data) => {
  try {
    const userCount = db.getUsers().length;
    if (userCount > 0 && !checkPermission('manage_users')) return { ok: false, error: 'ليس لديك صلاحية لإضافة مستخدمين' };
    if (!data || !data.name) return { ok: false, error: 'الاسم مطلوب' };
    if (!data.password) return { ok: false, error: 'كلمة السر مطلوبة' };
    if (data.password.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    data = { ...data };
    delete data.password_hash;
    data.password_hash = await hashBcrypt(data.password);
    data._userId = currentUser?.id; data._userName = currentUser?.name;
    const id = db.addUser(data);
    return id ? { ok: true, id } : { ok: false, error: 'فشل إضافة المستخدم' };
  } catch (e) {
    handleError('addUser', e);
    return { ok: false, error: 'خطأ في إضافة المستخدم' };
  }
});

ipcMain.handle('auth:updateUser', async (_e, id, data) => {
  if (!checkPermission('manage_users')) return { ok: false, error: 'ليس لديك صلاحية لتحديث المستخدمين' };
  try {
    if (!id || typeof id !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    data = { ...data };
    delete data.password_hash;
    if (data.password) {
      data.password_hash = await hashBcrypt(data.password);
    }
    delete data.password;
    db.updateUser(id, data);
    return { ok: true };
  } catch (e) {
    handleError('updateUser', e);
    return { ok: false, error: 'خطأ في تحديث المستخدم' };
  }
});

ipcMain.handle('auth:deleteUser', async (_e, id) => {
  if (!checkPermission('manage_users')) return { ok: false, error: 'ليس لديك صلاحية لحذف المستخدمين' };
  try {
    const user = db.getUserById(id);
    if (user && user.role === 'admin') {
      const admins = db.getUsers().filter(u => u.role === 'admin' && u.active && u.id !== id);
      if (admins.length === 0) return { ok: false, error: 'لا يمكن حذف آخر مدير في النظام' };
    }
    db.deleteUser(id);
    return { ok: true };
  } catch (e) {
    handleError('deleteUser', e);
    return { ok: false, error: 'خطأ في حذف المستخدم' };
  }
});

// ─── AI ───

const AI_PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.1-8b-instant',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    keyPrefix: 'gsk_'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPrefix: 'sk-'
  },
  anthropic: {
    name: 'Anthropic / Claude',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-haiku-20240307',
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
    keyPrefix: 'sk-ant-'
  },
  gemini: {
    name: 'Google Gemini',
    apiVersion: 'v1',
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    keyPrefix: 'AIza'
  }
};

const AI_ERROR_MESSAGES = {
  timeout: 'لم يتم الرد من المساعد الذكي في الوقت المحدد. حاول مرة أخرى.',
  rate_limit: 'تم تجاوز حد الطلبات المسموح به. انتظر لحظة ثم حاول مرة أخرى.',
  quota: 'تم تجاوز حصة الاستخدام اليومية. حاول مرة أخرى غداً أو جدد اشتراكك.',
  auth: 'مفتاح API غير صالح. تحقق من المفتاح في الإعدادات.',
  network: 'تعذر الاتصال بالمساعد الذكي. تحقق من اتصال الإنترنت.',
  server: 'المساعد الذكي غير متاح حالياً. حاول مرة أخرى لاحقاً.',
  parse: 'حدث خطأ في معالجة الرد. حاول مرة أخرى.',
  no_key: 'مفتاح API غير مضبوط — الرجاء إدخال المفتاح في الإعدادات.',
  unknown: 'حدث خطأ غير متوقع. حاول مرة أخرى.'
};

const CONTEXT_MAX_CHARS = 5000;

function classifyAIError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (!msg) return 'unknown';
  if (msg.includes('timeout')) return 'timeout';
  if (msg.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429')) return 'rate_limit';
  if (msg.includes('quota') || msg.includes('insufficient_quota') || msg.includes('exceeded') || msg.includes('maximum')) return 'quota';
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('auth') || msg.includes('api key')) return 'auth';
  if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('econnreset') || msg.includes('eai_again') || msg.includes('network') || msg.includes('fetch')) return 'network';
  if (msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('500') || msg.includes('server error')) return 'server';
  if (msg.includes('parse') || msg.includes('json') || msg.includes('unexpected token')) return 'parse';
  return 'unknown';
}

const SYSTEM_PROMPTS = {
  chat: 'أنت مساعد قانوني محترف متخصص في القانون المغربي. أجب بالعربية أو الفرنسية حسب لغة السؤال. كن دقيقاً ومهنياً.',
  summarize: 'لخص النص القانوني التالي بالعربية. استخرج النقاط الرئيسية والأحكام الأساسية. كن موجزاً ودقيقاً.',
  draft: 'أنت كاتب قانوني محترف متخصص في القانون المغربي. قم بصياغة وثيقة قانونية بناءً على الطلب التالي. استخدم لغة قانونية رسمية.',
  analyze: 'قم بتحليل الحكم القانوني التالي. استخرج: الموضوع، المبادئ القانونية، النتيجة. حلل بالعربية.',
  strategy: 'أنت مستشار قانوني استراتيجي. حلل الموقف القانوني واقترح استراتيجية متكاملة. كن عملياً ودقيقاً.',
  risk: 'أنت محلل مخاطر قانوني. ركز فقط على تحديد وتقييم المخاطر القانونية في الموقف المطروح. كن موضوعياً.',
  hearing_prep: 'أنت مساعد تحضير جلسات محترف. بناءً على معلومات القضية والجلسة، قم بإعداد: ملخص القضية، الحجج الرئيسية، قائمة الوثائق المهمة، المخاطر المحتملة، قائمة التحضير الموصى بها.'
};

const https = require('https');

const ALGORITHM = 'aes-256-gcm';

function scryptAsync(password, salt, keylen) {
  return new Promise(function (res, rej) {
    crypto.scrypt(password, salt, keylen, function (e, k) { return e ? rej(e) : res(k); });
  });
}

async function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = await scryptAsync(ENCRYPTION_KEY, salt, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return JSON.stringify({ 
    salt: salt.toString('hex'),
    iv: iv.toString('hex'), 
    encrypted, 
    authTag: authTag.toString('hex') 
  });
}

async function decrypt(encryptedData) {
  const { salt, iv, encrypted, authTag } = JSON.parse(encryptedData);
  const key = await scryptAsync(ENCRYPTION_KEY, Buffer.from(salt, 'hex'), 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function callProvider(provider, apiKey, model, messages) {
  const cfg = AI_PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const lastUserContent = messages.filter(m => m.role === 'user').pop()?.content || '';

  try {
    if (provider === 'gemini') {
      if (cfg.models && cfg.models.length && !cfg.models.includes(model)) {
        throw new Error(`Invalid Gemini model: ${model}`);
      }
      const url = `${cfg.baseUrl}/${model}:generateContent`;
      const geminiBody = {
        contents: [{ parts: [{ text: systemMsg ? `${systemMsg}\n\n${lastUserContent}` : lastUserContent }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(geminiBody),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      if (!resp.ok) {
        const errMsg = data?.error?.message || `HTTP ${resp.status}`;
        const err = new Error(errMsg);
        err.statusCode = resp.status;
        throw err;
      }
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (provider === 'anthropic') {
      const antrMsg = [];
      messages.forEach(m => {
        if (m.role === 'system') return;
        antrMsg.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
      });
      const antrBody = { model, messages: antrMsg, max_tokens: 4096, temperature: 0.7 };
      if (systemMsg) antrBody.system = systemMsg;

      const resp = await fetch(cfg.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(antrBody),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      if (!resp.ok) {
        const errMsg = data?.error?.message || `HTTP ${resp.status}`;
        const err = new Error(errMsg);
        err.statusCode = resp.status;
        throw err;
      }
      return data?.content?.[0]?.text || '';
    }

    // OpenAI-compatible (Groq, OpenAI)
    const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 });
    const resp = await fetch(cfg.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body,
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await resp.json();
    if (!resp.ok) {
      const errMsg = data?.error?.message || data?.error || `HTTP ${resp.status}`;
      const err = new Error(errMsg);
      err.statusCode = resp.status;
      throw err;
    }
    return data?.choices?.[0]?.message?.content || '';
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Timeout');
    if (e.message?.includes('fetch failed') || e.message?.includes('ENOTFOUND') || e.message?.includes('ECONNREFUSED')) {
      throw new Error('NetworkError: ' + e.message);
    }
    throw e;
  }
}

async function callAI(systemPrompt, message, context) {
  const config = await getAiConfig();
  const apiKey = config.apiKey;
  if (!apiKey) return { error: AI_ERROR_MESSAGES.no_key, friendlyError: AI_ERROR_MESSAGES.no_key, provider: config.provider || 'groq' };

  if (context && context.length > CONTEXT_MAX_CHARS) {
    context = context.slice(0, CONTEXT_MAX_CHARS) + '\n... [تم اقتطاع السياق]';
  }

  const provider = config.provider || 'groq';
  const model = config.model || AI_PROVIDERS[provider]?.defaultModel || 'llama-3.1-8b-instant';
  const messages = [{ role: 'system', content: systemPrompt }];
  if (context) messages.push({ role: 'user', content: 'السياق:\n' + context });
  messages.push({ role: 'user', content: message });

  const maxRetries = 3;
  let lastError, attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts++;
    try {
      const text = await callProvider(provider, apiKey, model, messages);
      return { text, provider, model, attempts };
    } catch (e) {
      lastError = e;
      const category = classifyAIError(e);

      if (category === 'auth' || category === 'no_key') {
        return { error: e.message, friendlyError: AI_ERROR_MESSAGES[category], provider, model, attempts };
      }

      if (category === 'quota') {
        return { error: e.message, friendlyError: AI_ERROR_MESSAGES.quota, provider, model, attempts };
      }

      if (category === 'rate_limit' && attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1500 * Math.pow(2, attempt) + Math.random() * 1000, 8000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  const category = classifyAIError(lastError);
  console.error(`AI failed after ${attempts} attempts:`, lastError?.message);
  return {
    error: lastError?.message || 'فشل الطلب',
    friendlyError: AI_ERROR_MESSAGES[category] || AI_ERROR_MESSAGES.unknown,
    provider,
    model,
    attempts
  };
}

function sanitizeContext(text) {
  if (!text) return '';
  const norm = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function (d) { return String.fromCharCode(d.charCodeAt(0) & 0xF); });
  return norm
    .replace(/\+?[\d][\d\s\-().]{7,}[\d]/g, function (m) {
      const digits = m.replace(/\D/g, '');
      if (/^(0|00212|\+212)?[567]\d{8}$/.test(digits)) return '[رقم هاتف]';
      if (digits.length >= 14 && digits.length <= 19) return '[رقم بطاقة]';
      return m;
    })
    .replace(/\b\d{16,}\b/g, '[رقم بطاقة]')
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z\u0600-\u06FF]{2,}/g, '[بريد إلكتروني]');
}

function buildCaseContext(c) {
  if (!c) return '';
  return sanitizeContext(`رقم القضية: ${c.case_number || ''}
العنوان: ${c.title || ''}
الموكل: ${c.client_name || 'غير محدد'}
المحكمة: ${c.court || 'غير محددة'}
الحالة: ${c.status || ''}
النوع: ${c.case_type || ''}
الأولوية: ${c.priority || 'medium'}
تاريخ الإنشاء: ${c.created_date || ''}
آخر جلسة: ${c.next_hearing || 'لا توجد'}
الموعد النهائي: ${c.deadline_date || 'لا يوجد'}
الملاحظات: ${c.notes || ''}
الرسوم الإجمالية: ${c.total_fees || 0}
المدفوع: ${c.paid_fees || 0}
المتبقي: ${(c.total_fees || 0) - (c.paid_fees || 0)}
المصاريف: ${c.expenses || 0}`);
}

function buildClientContext(cl) {
  if (!cl) return '';
  return sanitizeContext(`الاسم: ${cl.name || ''}
الهاتف: محذوف للخصوصية
البريد: محذوف للخصوصية
العنوان: ${cl.address || ''}
الوسوم: ${cl.tags || ''}
الحالة: ${cl.status || ''}
الملاحظات: ${cl.notes || ''}`);
}

safeIpc('ai:ask', withPerm('use_ai')(async (_e, { mode, message, context }) => {
  const prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  return callAI(prompt, message, context);
}));

safeIpc('ai:askContextual', withPerm('use_ai')(async (_e, { mode, message, contextType, contextId }) => {
  let context = '';
  if (contextType === 'case') {
    const c = db.getAllCases().find(x => x.id === contextId);
    if (!c) return { text: '', error: 'القضية غير موجودة', friendlyError: 'القضية غير موجودة' };
    const allTasks = db.getAllTasks();
    const caseTasks = allTasks.filter(t => t.case_id === contextId);
    const events = db.getEventsByCase(contextId);
    const docs = db.getDocuments(contextId);

    context = `أنت مساعد قانوني لمكتب محاماة مغربي.\n
القضية الحالية: ${c.case_number || ''} — ${c.title || ''}
الموكل: ${c.client_name || 'غير محدد'}
المحكمة: ${c.court || 'غير محددة'}
الحالة: ${c.status || ''}  النوع: ${c.case_type || ''}  الأولوية: ${c.priority || 'medium'}
تاريخ الإنشاء: ${c.created_date || ''}
الموعد النهائي: ${c.deadline_date || 'لا يوجد'}`;

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const upcomingEvents = events.filter(e => e.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date));
    const nextHearing = upcomingEvents.find(e => e.type === 'hearing');
    if (nextHearing) context += `\nالجلسة القادمة: ${nextHearing.date || ''} | ${nextHearing.title || ''}${nextHearing.court ? ' | ' + nextHearing.court : ''}`;
    else if (c.next_hearing) context += `\nالجلسة القادمة: ${c.next_hearing}`;

    const today = new Date().toISOString().slice(0, 10);
    const todayEvents = events.filter(e => e.date === today && e.status !== 'cancelled');
    if (todayEvents.length) context += `\nأحداث اليوم: ${todayEvents.map(e => e.title).join(', ')}`;
    if (upcomingEvents.length) context += `\nالأحداث القادمة (${upcomingEvents.length}): ${upcomingEvents.slice(0, 5).map(e => `${e.date} ${e.type}: ${e.title}`).join(' | ')}`;

    const overdue = caseTasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
    if (caseTasks.length) {
      const done = caseTasks.filter(t => t.status === 'done').length;
      context += `\nالمهام: ${caseTasks.length} (${done} منجزة، ${caseTasks.length - done} قيد الانتظار)`;
      if (overdue.length) context += ` — ${overdue.length} مهمة متأخرة: ${overdue.slice(0, 3).map(t => t.title).join(', ')}`;
    }

    if (docs.length) context += `\nالوثائق: ${docs.length} وثيقة`;

    const remaining = (c.total_fees || 0) - (c.paid_fees || 0);
    context += `\nالرسوم: ${c.total_fees || 0} درهم | المدفوع: ${c.paid_fees || 0} درهم | المتبقي: ${remaining > 0 ? remaining + ' درهم' : 'مسدد بالكامل'}`;

    context = sanitizeContext(context);
  } else if (contextType === 'client') {
    const cl = db.getAllClients().find(x => x.id === contextId);
    context = buildClientContext(cl);
    const cases = db.getCasesByClient(contextId);
    if (cases.length) context += `\nالقضايا: ${cases.map(c => `${c.case_number} (${c.status})`).join(', ')}`;
    context = sanitizeContext(context);
  } else if (contextType === 'document') {
    const doc = db.getDocument(contextId);
    if (doc) {
      context = `الملف: ${doc.filename}\nالنوع: ${doc.doc_type}\nتاريخ الرفع: ${doc.upload_date||''}\nالوسوم: ${doc.tags||''}\nالملاحظات: ${doc.notes||''}`;
      const txt = db.getDocumentText(contextId);
      if (txt) context += `\n\nالنص المستخرج:\n${txt.extracted_text?.slice(0, 3000)}`;
      context = sanitizeContext(context);
    }
  } else if (contextType === 'hearing') {
    const ev = db.getEvent(contextId);
    if (ev) {
      context = `الجلسة: ${ev.title}\nالتاريخ: ${ev.date} ${ev.time||''}\nالمحكمة: ${ev.court||''}\nالقاضي: ${ev.judge||''}\nالغرفة: ${ev.room||''}\nالحالة: ${ev.status}\nالملاحظات: ${ev.notes||''}`;
      if (ev.case_id) {
        const c = db.getAllCases().find(x => x.id === ev.case_id);
        if (c) context += `\n\nمعلومات القضية:\n${buildCaseContext(c)}`;
      }
      context = sanitizeContext(context);
    }
  }
  const prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  return callAI(prompt, message, context);
}));

safeIpc('ai:getSmartInsights', withPerm('use_ai')(async () => {
  const cases = db.getAllCases();
  const events = db.getAllEvents();
  const tasks = db.getAllTasks();
  const today = new Date().toISOString().slice(0,10);
  const insights = [];
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  const tomorrowEvents = events.filter(e => e.date === tomorrow && e.status !== 'cancelled');
  if (tomorrowEvents.length) insights.push(`غداً لديك ${tomorrowEvents.length} حدث${tomorrowEvents.filter(e=>e.type==='hearing').length ? ' منها جلسات' : ''}`);
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
  if (overdueTasks.length) insights.push(`${overdueTasks.length} مهمة متأخرة${overdueTasks.filter(t=>t.priority==='critical').length ? ' (بعضها حرج)' : ''}`);
  const staleCases = cases.filter(c => c.status === 'active' && c.updated_at && c.updated_at.slice(0,10) < new Date(Date.now()-14*86400000).toISOString().slice(0,10));
  if (staleCases.length) insights.push(`${staleCases.length} قضية لم يتم تحديثها منذ 14 يوماً`);
  const unpaidClients = db.getAllClients().filter(c => { const cs = db.getCasesByClient(c.id); return cs.reduce((s, cx) => s + (cx.total_fees||0) - (cx.paid_fees||0), 0) > 0; });
  if (unpaidClients.length) insights.push(`${unpaidClients.length} موكل لديهم مستحقات غير مدفوعة`);
  if (!insights.length) insights.push('كل شيء على ما يرام — لا توجد أحداث حرجة اليوم');
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === 'active').length;
  const closedCases = cases.filter(c => c.status === 'closed' || c.status === 'archived').length;
  const totalClients = db.getAllClients().length;
  const completedTasksThisWeek = tasks.filter(t => t.status === 'done' && t.updated_at && t.updated_at >= new Date(Date.now()-7*86400000).toISOString()).length;
  const summary = `لديك ${activeCases} قضية نشطة (من أصل ${totalCases})، ${totalClients} موكل، ${completedTasksThisWeek} مهمة منجزة هذا الأسبوع.`;
  return { insights: insights.slice(0, 5), summary };
}));

safeIpc('ai:generateTimeline', withPerm('use_ai')(async (_e, { caseId }) => {
  const c = db.getAllCases().find(x => x.id === caseId);
  if (!c) return { text: '', error: 'لا توجد معلومات كافية لإنشاء الجدول الزمني', friendlyError: 'لا توجد معلومات كافية لإنشاء الجدول الزمني' };
  const events = db.getEventsByCase(caseId);
  const tasks = db.getAllTasks().filter(t => t.case_id === caseId);
  const docs = db.getDocuments(caseId);
  let context = `القضية: ${c.case_number} — ${c.title}\n`;
  context += `الحالة: ${c.status}\nتاريخ التسجيل: ${c.created_at||'غير محدد'}\n`;
  if (events.length) context += `\nالأحداث (${events.length}):\n${events.slice(0,10).map(e => `- ${e.date} | ${e.type} | ${e.title}${e.status ? ` (${e.status})` : ''}${e.court ? ` | ${e.court}` : ''}`).join('\n')}\n`;
  if (tasks.length) context += `\nالمهام: ${tasks.map(t => `${t.title} (${t.status})`).join(', ')}\n`;
  if (docs.length) context += `\nالوثائق (${docs.length}): ${docs.slice(0,8).map(d => d.filename).join(', ')}\n`;
  return callAI('أنت خبير في إعداد الجداول الزمنية للقضايا القانونية. قم بإنشاء جدول زمني منظم (timeline) بالعربية لهذه القضية بناءً على البيانات التالية.', 'أنشئ جدولاً زمنياً مفصلاً لهذه القضية.', sanitizeContext(context));
}));

safeIpc('ai:summarizeDocument', withPerm('use_ai')(async (_e, { docId }) => {
  const doc = db.getDocument(docId);
  if (!doc) return { text: '', error: 'الوثيقة غير موجودة', friendlyError: 'الوثيقة غير موجودة' };
  const txt = db.getDocumentText(docId);
  const text = txt ? txt.extracted_text?.slice(0, 4000) : '';
  if (!text || text.length < 50) return { text: '', error: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص', friendlyError: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص' };
  const context = `الملف: ${doc.filename}\nالنوع: ${doc.doc_type||'غير محدد'}\nتاريخ الرفع: ${doc.upload_date||''}\nالوسوم: ${doc.tags||''}\n\nالنص:\n${text}`;
  return callAI('أنت خبير في تحليل وثائق المحاماة. لخص هذه الوثيقة القانونية بالعربية في 3-5 نقاط واضحة.', 'لخص هذه الوثيقة بالعربية.', context);
}));

safeIpc('ai:detectRisks', withPerm('use_ai')(async (_e, { caseId }) => {
  const c = db.getAllCases().find(x => x.id === caseId);
  if (!c) return { text: '', error: 'القضية غير موجودة', friendlyError: 'القضية غير موجودة' };
  const events = db.getEventsByCase(caseId);
  const tasks = db.getAllTasks().filter(t => t.case_id === caseId);
  const now = new Date();
  let context = `القضية: ${c.case_number} — ${c.title}\n`;
  context += `الحالة: ${c.status}\nالأطراف: ${c.opponent||'غير محدد'} | ${c.court||'غير محدد'}\n`;
  context += `القيمة: ${c.total_fees||'0'}\nالأولوية: ${c.priority||'متوسطة'}\n`;
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now);
  if (overdue.length) context += `\nمهام متأخرة: ${overdue.map(t => `${t.title} (${t.due_date})`).join(', ')}\n`;
  const upcoming = events.filter(e => e.status !== 'cancelled' && e.date && new Date(e.date) >= now).sort((a,b) => new Date(a.date)-new Date(b.date));
  if (upcoming.length) context += `\nالأحداث القادمة: ${upcoming.slice(0,5).map(e => `${e.date} ${e.title}`).join(', ')}\n`;
  return callAI('أنت خبير في تقييم المخاطر القانونية. قم بتحليل القضية التالية وحدد المخاطر المحتملة مع اقتراحات للتخفيف منها. أجب بالعربية.', 'حلل المخاطر القانونية لهذه القضية.', context);
}));

safeIpc('ai:analyzeDocument', withPerm('use_ai')(async (_e, { docId }) => {
  const doc = db.getDocument(docId);
  if (!doc) return { error: 'الوثيقة غير موجودة' };

  const cached = db.getDocumentAnalysis(docId);
  if (cached) return { analysis: cached, cached: true, doc };

  const txt = db.getDocumentText(docId);
  const text = txt ? txt.extracted_text?.trim() : '';
  if (!text || text.length < 50) return { error: 'هذه الوثيقة لا تحتوي على نص كافٍ للتحليل' };

  const context = `اسم الملف: ${doc.filename}\nالنوع: ${doc.doc_type || 'غير محدد'}\nتاريخ الرفع: ${doc.upload_date || ''}\nالوسوم: ${doc.tags || ''}\n\nالنص المستخرج:\n${text}`;

  const result = await callAI(
    'أنت خبير قانوني مغربي محترف. قم بتحليل النص التالي المستخرج من وثيقة قانونية واستخرج منه:\n' +
    '1. **الخلاصة**: ملخص دقيق للوثيقة (3-5 أسطر)\n' +
    '2. **النقاط الرئيسية**: قائمة بأهم العناصر (تواريخ، أسماء، أرقام، مبالغ)\n' +
    '3. **التوصية القانونية**: ماذا يجب على المحامي فعله بعد قراءة هذه الوثيقة\n\n' +
    'أجب بهذا التنسيق تماماً:\n' +
    '=== الخلاصة ===\n...\n=== النقاط الرئيسية ===\n...\n=== التوصية القانونية ===\n...',
    'حلل هذه الوثيقة القانونية بالعربية.', context
  );

  if (result.text) {
    db.saveDocumentAnalysis(docId, result.text);
  }

  return { analysis: result.text || result.friendlyError || 'تعذر تحليل الوثيقة', cached: false, doc };
}));

function getMasterKeyOrThrow() {
  const key = process.env.MASTER_KEY;
  if (!key) {
    throw new Error('MASTER_KEY environment variable is required — الرجاء تعيين MASTER_KEY في ملف .env');
  }
  return key;
}

function deriveKey(info, length) {
  return crypto.hkdfSync('sha256', Buffer.from(process.env.MASTER_KEY, 'utf8'), Buffer.alloc(0), Buffer.from(info, 'utf8'), length);
}

const HMAC_KEY = deriveKey('hmac-v1', 32);
const ENCRYPTION_KEY = deriveKey('encryption-v1', 32);

async function getAiConfig() {
  // 1. محاولة قراءة الملف المشفر بـ MASTER_KEY الحالي
  try {
    if (fs.existsSync(AI_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf8'));
      
      if (data.encrypted) {
        try {
          const apiKey = await decrypt(data.encrypted);
          return { apiKey, provider: data.provider || 'groq', model: data.model || '' };
        } catch (e) {
          console.error('AI config decrypt failed (MASTER_KEY mismatch?):', e.message);
          try { fs.unlinkSync(AI_CONFIG_PATH); } catch (err) {}
        }
      } else if (data.apiKey) {
        console.warn('تم اكتشاف مفتاح API غير مشفر');
        const encrypted = await encrypt(data.apiKey);
        try {
          fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
            encrypted,
            provider: data.provider || 'groq',
            model: data.model || ''
          }, null, 2));
        } catch (e) { /* ignore */ }
        return { apiKey: data.apiKey, provider: data.provider || 'groq', model: data.model || '' };
      }
    }
  } catch (e) {
    console.error('getAiConfig read error:', e.message);
  }

  // 2. محاولة الـ Fallback عبر safeStorage
  if (safeStorage && safeStorage.isAvailable && safeStorage.isAvailable()) {
    try {
      if (fs.existsSync(SAFE_KEY_BACKUP_PATH)) {
        const hexBuf = fs.readFileSync(SAFE_KEY_BACKUP_PATH, 'utf8');
        const decrypted = safeStorage.decryptString(Buffer.from(hexBuf, 'hex'));
        const config = JSON.parse(decrypted);
        if (config && config.apiKey) {
          console.log('تم استرجاع المفتاح من safeStorage — إعادة حفظ بال MASTER_KEY الجديد');
          await saveAiConfig(config);
          return { apiKey: config.apiKey, provider: config.provider || 'groq', model: config.model || '' };
        }
      }
    } catch (e) {
      console.error('safeStorage fallback failed:', e.message);
      try { fs.unlinkSync(SAFE_KEY_BACKUP_PATH); } catch (err) {}
    }
  }

  return {};
}

async function saveAiConfig(config) {
  const dir = path.dirname(AI_CONFIG_PATH);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); try { fs.chmodSync(dir, 0o700); } catch (e) {} }
  
  const apiKey = config.apiKey;
  if (!apiKey || typeof apiKey !== 'string') throw new Error('مفتاح API غير صالح');
  
  const encrypted = await encrypt(apiKey);
  
  fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
    encrypted,
    provider: config.provider || 'groq',
    model: config.model || ''
  }, null, 2), { mode: 0o600 });

  if (!fs.existsSync(AI_CONFIG_PATH)) throw new Error('فشل حفظ ملف المفتاح');

  if (safeStorage && safeStorage.isAvailable && safeStorage.isAvailable()) {
    try {
      const backup = JSON.stringify({ apiKey: apiKey, provider: config.provider || 'groq', model: config.model || '' });
      const encBuf = safeStorage.encryptString(backup);
      fs.writeFileSync(SAFE_KEY_BACKUP_PATH, encBuf.toString('hex'), { mode: 0o600 });
      if (isDev) console.log('تم حفظ backup المفتاح في safeStorage');
    } catch (e) {
      if (isDev) console.warn('safeStorage backup failed:', e.message);
    }
  }
  
  if (isDev) console.log('تم حفظ مفتاح API مشفراً بنجاح');
}

safeIpc('ai:getConfig', withPerm('use_ai')(async () => {
  try {
    const config = await getAiConfig();
    return { provider: config.provider || 'groq', model: config.model || '', hasKey: !!config.apiKey };
  } catch (e) {
    console.warn('ai:getConfig error:', e.message);
    return { provider: 'groq', model: '', hasKey: false };
  }
}));
safeIpc('ai:saveConfig', withPerm('use_ai')(async (_e, config) => {
  try {
    await saveAiConfig(config);
    return { ok: true };
  } catch (e) {
    console.warn('ai:saveConfig error:', e.message);
    return { ok: false, error: e.message || 'فشل حفظ مفتاح API' };
  }
}));

ipcMain.handle('help:getSystemHealth', () => {
  try {
    const os = require('os');
    return {
      ok: true,
      health: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        platform: process.platform,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        cpuUsage: process.cpuUsage(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    };
  } catch (e) {
    handleError('getSystemHealth', e);
    return { ok: false, error: 'خطأ في جلب بيانات النظام' };
  }
});

app.on('window-all-closed', async () => {
  await saveDbOnQuit();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
