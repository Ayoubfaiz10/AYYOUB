const { app, BrowserWindow, ipcMain, shell, Notification, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const os = require('os');
const db = require('./db');
const logger = require('./logger');
require('dotenv').config({ path: __dirname + '/.env' });

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

/* â”€â”€â”€ Path security: prevent directory traversal â”€â”€â”€ */
function isPathSafe(targetPath, allowedBase) {
  try {
    var resolved = fs.realpathSync(path.resolve(targetPath));
    var base = fs.realpathSync(path.resolve(allowedBase));
    return resolved === base || resolved.startsWith(base + path.sep);
  } catch (e) { return false; }
}

// Export saveDb so we can save on quit
async function getUniqueFilePath(dir, filename) {
  let finalPath = path.join(dir, filename);
  let count = 1;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  while (true) {
    try { await fsp.access(finalPath); } catch { break; }
    finalPath = path.join(dir, `${base}_(${count})${ext}`);
    count++;
  }
  return finalPath;
}

/* â”€â”€â”€ MIME magic-byte validation â”€â”€â”€ */
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
    if (!sigs) return true;
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(state));
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
    console.log(process.env.NODE_ENV !== 'production' ? 'Tesseract.js loaded lazily' : '');
    return _tesseractModule;
  } catch (e) {
    _tesseractModule = false;
    console.warn('tesseract.js not available');
    return null;
  }
}

let mainWindow = null;

/* â”€â”€â”€ License Client â”€â”€â”€ */

const LICENSE_PATH = path.join(app.getPath('userData'), 'storage', 'license.json');
const LICENSE_SERVER = process.env.LICENSE_SERVER || 'http://localhost:4000';

if (LICENSE_SERVER.startsWith('http://') && !LICENSE_SERVER.includes('localhost') && !LICENSE_SERVER.includes('127.0.0.1')) {
  console.warn('License server uses HTTP (insecure):', LICENSE_SERVER);
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(data, null, 2));
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
  return (now - license.lastValidated) < 7 * 24 * 60 * 60 * 1000;
}

/* â”€â”€â”€ License IPC Handlers â”€â”€â”€ */

ipcMain.handle('license:getStatus', function() {
  var license = getLicense();
  if (!license) return { valid: false };
  return { valid: checkOfflineGrace(license), key: license.key, machineId: license.machineId, lastValidated: license.lastValidated };
});

ipcMain.handle('license:check', async function() {
  var license = getLicense();
  if (!license) return { valid: false, message: 'لا يوجد ترخيص' };

  if (checkOfflineGrace(license)) {
    return { valid: true, offline: true, key: license.key };
  }

  try {
    var result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/validate', {
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
      return { valid: true, offline: true, key: license.key, graceDaysLeft: Math.floor((7 * 24 * 60 * 60 * 1000 - (Date.now() - license.lastValidated)) / (24 * 60 * 60 * 1000)) };
    }
    return { valid: false, message: 'لا يمكن التحقق من الترخيص (الرجاء الاتصال بالإنترنت)' };
  }
});

ipcMain.handle('license:activate', async function(_e, data) {
  if (!data || !data.key) return { ok: false, error: 'مفتاح الترخيص مطلوب' };
  var key = data.key.trim();
  var machineId = getMachineId();
  try {
    var result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/register', {
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
  var license = getLicense();
  var unregistered = false;

  if (license && license.key && license.machineId) {
    try {
      var result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/unregister', {
        licenseKey: license.key,
        machineId: license.machineId
      });
      if (result?.status === "success") unregistered = true;
    } catch (e) {
      // 4xx = invalid key/device â€” ignore, continue with local delete
      // network error = offline â€” still delete locally
    }
  }

  try { fs.unlinkSync(LICENSE_PATH); } catch (e) { /* ignore */ }
  return { ok: true, unregistered: unregistered };
});

/* â”€â”€â”€ Periodic License Re-validation â”€â”€â”€ */

function startLicenseRevalidation() {
  setInterval(async function() {
    var license = getLicense();
    if (!license) return;
    if (checkOfflineGrace(license)) {
      try {
        var result = await licenseHttpPost(LICENSE_SERVER + '/api/v1/devices/validate', {
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

/* â”€â”€â”€ Notification deduplication uses DB (isSent/markSent/cleanOldSentNotifications) â”€â”€â”€ */

function createWindow() {
  const savedState = loadWindowState();
  mainWindow = new BrowserWindow({
    width: savedState.width || 1280,
    height: savedState.height || 840,
    x: savedState.x,
    y: savedState.y,
    minWidth: 900,
    minHeight: 600,
    title: 'مدير مكتب المحامي',
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
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; script-src 'self'; connect-src 'self' http://localhost:4000 https://api.groq.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; base-uri 'none'; form-action 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'"]
      }
    });
  });

  mainWindow.loadFile('index.html');

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
        shell.openExternal(url);
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
      logToLogger(2, 'db:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
      throw err;
    }
  };
}

// â”€â”€â”€ Safe IPC helper: catches errors, logs them, returns structured response â”€â”€â”€
function safeIpc(name, fn) {
  return async (event, ...args) => {
    if (!name.startsWith('auth:') && !name.startsWith('app:') && !name.startsWith('notif:') && !currentUser) {
      return { error: 'Unauthorized: الرجاء تسجيل الدخول أولاً' };
    }
    try {
      return await fn(event, ...args);
    } catch (err) {
      logToLogger(2, 'ipc:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
      return { error: 'حدث خطأ داخلي. الرجاء المحاولة مرة أخرى' };
    }
  };
}

// â”€â”€â”€ Mutate IPC helper: same as safeIpc but also persists DB after every mutation â”€â”€â”€
function mutateIpc(name, fn) {
  return async (event, ...args) => {
    if (!name.startsWith('auth:') && !currentUser) {
      return { error: 'Unauthorized: الرجاء تسجيل الدخول أولاً' };
    }
    try {
      const result = await fn(event, ...args);
      return result;
    } catch (err) {
      logToLogger(2, 'ipc:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
      return { error: 'حدث خطأ داخلي. الرجاء المحاولة مرة أخرى' };
    }
  };
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
  if (archived > 0) console.log(`Auto-archived ${archived} closed cases`);

  function nullGuard(obj, defaults) {
    if (obj === null || obj === undefined) return defaults || {};
    return obj;
  }

  // â”€â”€â”€ MASTER_KEY check at startup â”€â”€â”€
  if (!process.env.MASTER_KEY) {
    logToLogger(2, 'app', 'MASTER_KEY environment variable is not set — AI API keys cannot be saved');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'تحذير أمني',
          message: 'MASTER_KEY غير مضبوط',
          detail: 'لحماية مفاتيح API، الرجاء إنشاء ملف .env في مجلد البرنامج وإضافة:\n\nMASTER_KEY=your-strong-random-key-here\n\nبدون هذا المفتاح، لا يمكن حفظ مفتاح AI API بشكل آمن.',
          buttons: ['فهمت']
        });
      } else {
        dialog.showMessageBox({
          type: 'warning',
          title: 'تحذير أمني',
          message: 'MASTER_KEY غير مضبوط',
          detail: 'لحماية مفاتيح API، الرجاء إنشاء ملف .env في مجلد البرنامج وإضافة:\n\nMASTER_KEY=your-strong-random-key-here\n\nبدون هذا المفتاح، لا يمكن حفظ مفتاح AI API بشكل آمن.',
          buttons: ['فهمت']
        });
      }
    }, 3000);
  }

  // â”€â”€â”€ DB IPC Handlers â”€â”€â”€

  ipcMain.handle('db:getAllCases', safeIpc('getAllCases', withPerm('view_case')(() => db.getAllCases())));
  ipcMain.handle('db:addCase', mutateIpc('addCase', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const result = db.addCase(data);
    if (result && result.id) db.addLog('add_case', `إضافة قضية ${data.case_number || ''} - ${data.title || ''}`);
    return result;
  })));
  ipcMain.handle('db:deleteCase', mutateIpc('deleteCase', withPerm('delete_case')(async (_e, id) => {
    if (id == null) return;

    // 0. Auto-backup before deletion
    db.createBackup('before_delete_case');

    // 1. Fetch case info before deletion
    const allCases = db.getAllCases();
    const c = allCases.find(x => x.id === id);

    // 2. Delete case from database (ON DELETE CASCADE handles related records in DB)
    db.deleteCase(id);

    // 3. Delete storage folder from disk (safety-checked)
    const caseDir = path.join(db.STORAGE_DIR, String(id));
    if (isPathSafe(caseDir, db.STORAGE_DIR)) {
      try {
        if (fs.existsSync(caseDir)) {
          fs.rmSync(caseDir, { recursive: true, force: true });
          console.log(`Deleted storage for case #${id}`);
        }
      } catch (err) {
        console.error(`Failed to delete storage for case #${id}:`, err);
      }
    }

    db.addLog('delete_case', `حذف قضية ${c ? c.case_number : '#' + id} مع جميع ملفاتها`);
  })));
  ipcMain.handle('db:getCasesByClient', safeIpc('getCasesByClient', withPerm('view_case')((_e, clientId) => db.getCasesByClient(clientId))));
  ipcMain.handle('db:getAllClients', safeIpc('getAllClients', withPerm('view_case')(() => db.getAllClients())));
  ipcMain.handle('db:addClient', mutateIpc('addClient', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const result = db.addClient(data);
    if (result && result.id) db.addLog('add_client', `إضافة موكل ${data.name || ''}`);
    return result;
  })));
  ipcMain.handle('db:deleteClient', mutateIpc('deleteClient', withPerm('edit_case')(async (_e, id) => {
    if (id == null) return;
    db.createBackup('before_delete_client');
    const c = db.getAllClients().find(x => x.id === id);
    db.deleteClient(id);
    db.addLog('delete_client', `حذف موكل ${c ? c.name : '#' + id}`);
  })));
  ipcMain.handle('db:getAllTasks', safeIpc('getAllTasks', withPerm('manage_tasks')((_e, includeArchived) => db.getAllTasks(includeArchived))));
  ipcMain.handle('db:getTask', safeIpc('getTask', withPerm('manage_tasks')((_e, id) => db.getTask(id))));
  ipcMain.handle('db:addTask', mutateIpc('addTask', withPerm('manage_tasks')(async (_e, data) => {
    data = nullGuard(data);
    if (data.case_id && !db.validateRef('cases', data.case_id)) return { error: 'القضية غير موجودة' };
    const id = db.addTask(data);
    return { id };
  })));
  ipcMain.handle('db:updateTask', mutateIpc('updateTask', withPerm('manage_tasks')(async (_e, id, data) => db.updateTask(id, data))));
  ipcMain.handle('db:deleteTask', mutateIpc('deleteTask', withPerm('manage_tasks')(async (_e, id) => db.deleteTask(id))));
  ipcMain.handle('db:getSubtasks', safeIpc('getSubtasks', withPerm('manage_tasks')((_e, taskId) => db.getSubtasks(taskId))));
  ipcMain.handle('db:addSubtask', mutateIpc('addSubtask', withPerm('manage_tasks')(async (_e, data) => db.addSubtask(nullGuard(data)))));
  ipcMain.handle('db:toggleSubtask', mutateIpc('toggleSubtask', withPerm('manage_tasks')(async (_e, id) => db.toggleSubtask(id))));
  ipcMain.handle('db:deleteSubtask', mutateIpc('deleteSubtask', withPerm('manage_tasks')(async (_e, id) => db.deleteSubtask(id))));
  ipcMain.handle('db:getComments', safeIpc('getComments', withPerm('manage_tasks')((_e, taskId) => db.getComments(taskId))));
  ipcMain.handle('db:addComment', mutateIpc('addComment', withPerm('manage_tasks')(async (_e, data) => db.addComment(nullGuard(data)))));
  ipcMain.handle('db:getAllWorkflows', safeIpc('getAllWorkflows', withPerm('manage_tasks')(() => db.getAllWorkflows())));
  ipcMain.handle('db:addWorkflow', mutateIpc('addWorkflow', withPerm('manage_tasks')(async (_e, data) => db.addWorkflow(nullGuard(data)))));
  ipcMain.handle('db:applyWorkflow', mutateIpc('applyWorkflow', withPerm('manage_tasks')(async (_e, args) => {
    const { caseId, workflowId } = nullGuard(args);
    return db.applyWorkflow(caseId, workflowId);
  })));
  ipcMain.handle('db:deleteWorkflow', mutateIpc('deleteWorkflow', withPerm('manage_tasks')(async (_e, id) => db.deleteWorkflow(id))));
  ipcMain.handle('db:getAllTemplates', safeIpc('getAllTemplates', withPerm('manage_tasks')(() => db.getAllTemplates())));
  ipcMain.handle('db:addTemplate', mutateIpc('addTemplate', withPerm('manage_tasks')(async (_e, data) => db.addTemplate(nullGuard(data)))));
  ipcMain.handle('db:applyTemplate', mutateIpc('applyTemplate', withPerm('manage_tasks')(async (_e, args) => {
    const { caseId, templateId } = nullGuard(args);
    return db.applyTemplate(caseId, templateId);
  })));
  ipcMain.handle('db:deleteTemplate', mutateIpc('deleteTemplate', withPerm('manage_tasks')(async (_e, id) => {
    if (id == null) return { ok: false, error: 'معرف القالب مطلوب' };
    db.deleteTemplate(id);
    db.addLog('delete_template', `حذف قالب #${id}`);
    return { ok: true };
  })));
  ipcMain.handle('db:getTaskAnalytics', safeIpc('getTaskAnalytics', withPerm('manage_tasks')(() => db.getTaskAnalytics())));
  ipcMain.handle('db:getDashboardStats', safeIpc('getDashboardStats', withPerm('view_case')(() => db.getDashboardStats())));
  ipcMain.handle('db:getDashboardExtendedStats', safeIpc('getDashboardExtendedStats', withPerm('view_case')(() => db.getDashboardExtendedStats())));
  ipcMain.handle('db:getDocuments', safeIpc('getDocuments', withPerm('view_case')((_e, caseId) => db.getDocuments(caseId))));
  ipcMain.handle('db:getAllDocuments', safeIpc('getAllDocuments', withPerm('view_case')(() => db.getAllDocuments())));
  ipcMain.handle('db:uploadDocument', mutateIpc('uploadDocument', withPerm('upload_doc')(async (_e, args) => {
    const { sourcePath, caseId, docType } = nullGuard(args);
    if (!sourcePath) return { error: 'مسار الملف مطلوب' };
    if (!db.validateRef('cases', caseId)) return { error: 'القضية غير موجودة' };
    const extCheck = path.extname(sourcePath).toLowerCase();
    if (!validateFileMagic(sourcePath, extCheck)) return { error: 'نوع الملف غير صالح (فحص التوقيع)' };
    const stats = await fsp.stat(sourcePath);
    if (stats.size > 50 * 1024 * 1024) return { error: 'الملف كبير جداً (الحد 50MB)' };
    const caseDir = path.join(db.STORAGE_DIR, String(caseId));
    try { await fsp.access(caseDir); } catch { await fsp.mkdir(caseDir, { recursive: true }); }
    const filename = path.basename(sourcePath).normalize('NFKC').replace(/[^a-zA-Z0-9_\-.\u0600-\u06FF\s()]/g, '_');
    const finalPath = await getUniqueFilePath(caseDir, filename);
    await fsp.copyFile(sourcePath, finalPath);
    const docId = db.addDocument({ case_id: caseId, filename: path.basename(finalPath), file_path: finalPath, doc_type: docType, file_size: formatFileSize(stats.size) });
    setTimeout(() => indexDocument(docId), 100);
    db.addLog('upload_document', `رفع وثيقة ${path.basename(finalPath)} للقضية #${caseId} (${docType})`);
    return docId;
  })));
  ipcMain.handle('db:selectAndUpload', mutateIpc('selectAndUpload', withPerm('upload_doc')(async (_e, args) => {
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
  })));
  ipcMain.handle('db:globalSearch', safeIpc('globalSearch', withPerm('view_case')((_e, queryTerm) => db.globalSearch(typeof queryTerm === 'string' ? queryTerm : ''))));
  ipcMain.handle('db:getSearchIndex', safeIpc('getSearchIndex', withPerm('view_case')(() => db.getSearchIndex())));
  ipcMain.handle('db:rebuildSearchIndex', mutateIpc('rebuildSearchIndex', withPerm('manage_users')(async () => { db.rebuildSearchIndex(); db.addLog('rebuild_search', 'إعادة بناء فهرس البحث'); })));
  ipcMain.handle('db:openDocument', safeIpc('openDocument', withPerm('view_case')(async (_e, docId) => {
    if (docId == null) return;
    try {
      const doc = db.getDocument(docId);
      if (doc && doc.file_path && fs.existsSync(doc.file_path) && isPathSafe(doc.file_path, db.STORAGE_DIR)) shell.openPath(doc.file_path);
    } catch (e) { logToLogger(2, 'openDocument', e.message); }
  })));
  ipcMain.handle('db:downloadDocument', safeIpc('downloadDocument', withPerm('view_case')(async (_e, docId) => {
    if (docId == null) return;
    try {
      const doc = db.getDocument(docId);
      if (!doc || !doc.file_path || !fs.existsSync(doc.file_path)) return { error: 'الملف غير موجود' };
      if (!isPathSafe(doc.file_path, db.STORAGE_DIR)) return { error: 'مسار الملف غير صال�' };
      const result = await dialog.showSaveDialog(mainWindow, { defaultPath: doc.filename, filters: [{ name: 'All Files', extensions: ['*'] }] });
      if (!result.canceled && result.filePath) {
        await fsp.copyFile(doc.file_path, result.filePath);
        return { ok: true };
      }
    } catch (e) { logToLogger(2, 'downloadDocument', e.message); return { error: e.message }; }
  })));
  ipcMain.handle('db:updateDocNotes', mutateIpc('updateDocNotes', withPerm('upload_doc')(async (_e, args) => {
    const { id, notes } = nullGuard(args);
    if (id == null) return;
    db.updateDocument(id, { notes: notes || '' });
    db.addLog('update_doc_notes', `تحديث ملاحظات الوثيقة #${id}`);
  })));
  ipcMain.handle('db:deleteDocument', mutateIpc('deleteDocument', withPerm('delete_document')(async (_e, id) => {
    if (id == null) return { ok: false, error: 'معرف الوثيقة مطلوب' };
    const doc = db.getDocument(id);
    if (!doc) return { ok: false, error: 'الوثيقة غير موجودة' };
    if (doc.file_path && isPathSafe(doc.file_path, db.STORAGE_DIR)) {
      try { if (fs.existsSync(doc.file_path)) fs.unlinkSync(doc.file_path); } catch (e) { console.error(`Failed to delete document file #${id}:`, e.message); }
    }
    db.deleteDocument(id);
    db.addLog('delete_document', `حذف وثيقة ${doc.filename || '#' + id}`);
    return { ok: true };
  })));
  ipcMain.handle('db:getProcedures', safeIpc('getProcedures', withPerm('view_case')((_e, affaireId) => db.getProcedures(affaireId))));
  ipcMain.handle('db:addProcedure', mutateIpc('addProcedure', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addProcedure(data);
    db.addLog('add_procedure', `إضافة إجراء للقضية #${data.affaire_id}: ${data.type || ''} - ${data.date || ''}`);
    return { id };
  })));
  ipcMain.handle('db:getPaiements', safeIpc('getPaiements', withPerm('view_finance')((_e, affaireId) => db.getPaiements(affaireId))));
  ipcMain.handle('db:addPaiement', mutateIpc('addPaiement', withPerm('view_finance')(async (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addPaiement(data);
    db.addLog('add_paiement', `إضافة دفعة ${data.montant || 0} درهم للقضية #${data.affaire_id}`);
    return { id };
  })));
  ipcMain.handle('db:updateHonorairesTotaux', mutateIpc('updateHonorairesTotaux', withPerm('view_finance')(async (_e, data) => {
    data = nullGuard(data);
    if (data.caseId == null || data.montant === undefined) return { error: 'caseId و montant مطلوبان' };
    if (!db.validateRef('cases', data.caseId)) return { error: 'القضية غير موجودة' };
    db.updateHonorairesTotaux(data.caseId, parseFloat(data.montant) || 0);
    db.addLog('update_honoraires', `تحديث مجموع الأتعاب للقضية #${data.caseId}: ${data.montant} درهم`);
    return { ok: true };
  })));
  ipcMain.handle('db:getChartData', safeIpc('getChartData', withPerm('view_finance')(() => db.getChartData())));
  ipcMain.handle('db:archiveCase', mutateIpc('archiveCase', withPerm('edit_case')(async (_e, id) => {
    if (id == null) return;
    db.createBackup('before_archive_case');
    db.archiveCase(id);
  })));
  ipcMain.handle('db:unarchiveCase', mutateIpc('unarchiveCase', withPerm('edit_case')(async (_e, id) => { if (id != null) db.unarchiveCase(id); })));
  ipcMain.handle('db:updateCaseStatus', mutateIpc('updateCaseStatus', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null && data.status) db.updateCaseStatus(data.id, data.status);
  })));
  ipcMain.handle('db:updateCaseNotes', mutateIpc('updateCaseNotes', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) db.updateCaseNotes(data.id, data.notes || '');
  })));
  ipcMain.handle('db:getArchivedCases', safeIpc('getArchivedCases', withPerm('view_case')(() => db.getAllCases(true).filter(c => c.archived === 1))));
  ipcMain.handle('db:addCommunication', mutateIpc('addCommunication', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    const id = db.addCommunication(data);
    db.addLog('add_communication', `تسجيل اتصال مع الموكل #${data.client_id} - ${data.type || ''}`);
    return id;
  })));
  ipcMain.handle('db:getClientCommunications', safeIpc('getClientCommunications', withPerm('view_case')((_e, clientId) => db.getClientCommunications(clientId))));
  ipcMain.handle('db:getAllCommunications', safeIpc('getAllCommunications', withPerm('view_case')(() => db.getAllCommunications())));
  ipcMain.handle('db:updateClientNotes', mutateIpc('updateClientNotes', withPerm('edit_case')(async (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) db.updateClient(data);
  })));
  ipcMain.handle('db:getTodayProcedures', safeIpc('getTodayProcedures', withPerm('view_case')(() => db.getTodayProcedures())));
  ipcMain.handle('db:getAlertSettings', safeIpc('getAlertSettings', withPerm('manage_users')(() => db.getAlertSettings())));
  ipcMain.handle('db:updateAlertSettings', mutateIpc('updateAlertSettings', withPerm('manage_users')(async (_e, data) => {
    db.updateAlertSettings(nullGuard(data));
    db.addLog('update_alert_settings', `تعديل إعدادات التنبيهات`);
  })));
  ipcMain.handle('db:getUpcomingDeadlines', safeIpc('getUpcomingDeadlines', withPerm('view_case')(() => db.getUpcomingDeadlines())));
  ipcMain.handle('db:getUpcomingHearings', safeIpc('getUpcomingHearings', withPerm('view_case')(() => db.getUpcomingHearings())));
  ipcMain.handle('db:getBackupSettings', safeIpc('getBackupSettings', withPerm('manage_users')(() => db.getBackupSettings())));
  ipcMain.handle('db:updateBackupSettings', mutateIpc('updateBackupSettings', withPerm('manage_users')(async (_e, data) => {
    db.updateBackupSettings(nullGuard(data));
    db.addLog('update_backup_settings', `تعديل إعدادات النسخ الاحتياطي`);
  })));
  ipcMain.handle('db:createBackup', mutateIpc('createBackup', withPerm('manage_users')(async () => {
    const name = db.createBackup('manual');
    db.addLog('create_backup', `إنشاء نسخة احتياطية يدوية: ${name}`);
    return name;
  })));
  ipcMain.handle('db:listBackups', safeIpc('listBackups', withPerm('manage_users')(() => { try { return db.listBackups(); } catch (e) { logToLogger(2, 'listBackups', e.message); return []; } })));
  ipcMain.handle('db:validateBackup', safeIpc('validateBackup', withPerm('manage_users')((_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    return db.validateBackupFile(filename);
  })));
  ipcMain.handle('db:restoreBackup', mutateIpc('restoreBackup', withPerm('manage_users')(async (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    db.createBackup('before_restore');
    const result = db.restoreFromBackup(filename);
    db.addLog('restore_backup', `استعادة نسخة احتياطية: ${filename}`);
    return result;
  })));
  ipcMain.handle('db:deleteBackup', mutateIpc('deleteBackup', withPerm('manage_users')(async (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    const result = db.deleteBackupFile(filename);
    db.addLog('delete_backup', `حذف نسخة احتياطية: ${filename}`);
    return result;
  })));
  ipcMain.handle('db:exportArchive', mutateIpc('exportArchive', withPerm('export_data')(async () => {
    const result = db.exportFullArchive();
    db.addLog('export_archive', `تصدير أرشيف كامل: ${result.filename}`);
    return result;
  })));
  ipcMain.handle('db:getLogs', safeIpc('getLogs', withPerm('view_audit')((_e, filters) => db.getLogs(filters))));
  ipcMain.handle('db:addLog', mutateIpc('addLog', withPerm('manage_users')((_e, action, details) => { if (action) db.addLog(action, details || ''); })));
  ipcMain.handle('db:integrityCheck', safeIpc('integrityCheck', withPerm('manage_users')(() => db.integrityCheck())));
  ipcMain.handle('db:repairOrphans', mutateIpc('repairOrphans', withPerm('manage_users')(() => db.repairOrphans())));
  ipcMain.handle('db:cleanOrphanedFiles', safeIpc('cleanOrphanedFiles', withPerm('manage_users')(() => {
    const result = db.cleanOrphanedFiles();
    db.addLog('clean_orphans', `تنظيف ${result.deletedCount} ملفاً يتيماً (${result.freedMB} MB)`);
    return result;
  })));

  // â”€â”€â”€ Logger IPC â”€â”€â”€
  ipcMain.handle('logger:log', mutateIpc('logger:log', withPerm('manage_users')((_e, level, context, message) => {
    if (!currentUser) return;
    const lvlMap = { INFO: 0, WARN: 1, ERROR: 2, CRITICAL: 3 };
    const lvl = lvlMap[level] !== undefined ? lvlMap[level] : 1;
    logToLogger(lvl, context || 'renderer', message || '');
  })));

  ipcMain.handle('logger:getLogs', safeIpc('logger:getLogs', withPerm('view_audit')((_e, filters) => logger.getLogs(filters))));
  ipcMain.handle('logger:export', safeIpc('logger:export', withPerm('view_audit')((_e, format) => logger.exportLogs(format || 'json'))));
  ipcMain.handle('logger:clear', safeIpc('logger:clear', withPerm('manage_users')(() => logger.clearLogs())));
  ipcMain.handle('logger:stats', safeIpc('logger:stats', withPerm('view_audit')(() => logger.getStats())));

  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  createWindow();

  ipcMain.handle('notif:getCacheStats', () => {
    if (!currentUser) return {};
    return {
    size: 0,
    maxSize: 500,
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    memoryEstimate: 0
  };
  });

  ipcMain.handle('app:checkMasterKey', () => {
    if (!currentUser) return { hasMasterKey: false };
    return { hasMasterKey: !!process.env.MASTER_KEY };
  });

  ipcMain.handle('app:navigateToCase', (_e, caseId) => {
    if (!currentUser) return;
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    if (caseId) mainWindow?.webContents.send('app:navigateToCase', caseId);
  });

  mainWindow.webContents.once('did-finish-load', () => {
    checkAndNotify();
    checkUpcomingEvents();
    setInterval(checkAndNotify, 3600000);
    setInterval(checkUpcomingEvents, 21600000);
    setInterval(() => { try { db.cleanOldSentNotifications(); } catch (e) { /* ignore */ } }, 86400000);

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

async function indexDocument(docId) {
  const Tesseract = ensureTesseract();
  if (!Tesseract) return;
  try {
    const doc = db.getDocument(docId);
    if (!doc) return;
    try { await fsp.access(doc.file_path); } catch { return; }
    const ext = path.extname(doc.file_path).toLowerCase();
    let text = '';
    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    if (ext === '.pdf' || imgExts.includes(ext)) {
      const worker = await Tesseract.createWorker('ara+fra');
      const { data } = await worker.recognize(doc.file_path);
      await worker.terminate();
      text = data.text || '';
    }
    if (text.trim()) {
      db.addDocumentText(docId, text.trim());
      console.log('Indexed document', docId, '(' + text.trim().length + ' chars)');
      if (doc.case_id) db.syncSearchIndex(doc.case_id);
    }
  } catch (e) { console.error('indexDocument error for', docId, ':', e.message); }
}

// â”€â”€â”€ Events System â”€â”€â”€

ipcMain.handle('events:getAll', safeIpc('events:getAll', withPerm('view_case')(() => db.getAllEvents())));
ipcMain.handle('events:get', safeIpc('events:get', withPerm('view_case')((_e, id) => db.getEvent(id))));
ipcMain.handle('events:add', mutateIpc('events:add', withPerm('edit_case')(async (_e, data) => {
  if (!data) return { error: 'البيانات مطلوبة' };
  const id = db.addEvent(data);
  if (id) db.addLog('add_event', `إضافة حدث ${data.title || ''} - ${data.date || ''}`);
  return id;
})));
ipcMain.handle('events:update', mutateIpc('events:update', withPerm('edit_case')(async (_e, id, data) => {
  if (id == null || !data) return;
  db.updateEvent(id, data);
  db.addLog('update_event', `تحديث حدث #${id}`);
})));
ipcMain.handle('events:delete', mutateIpc('events:delete', withPerm('edit_case')(async (_e, id) => {
  if (id == null) return;
  db.deleteEvent(id);
  db.addLog('delete_event', `حذف حدث #${id}`);
})));
// â”€â”€â”€ Auth â”€â”€â”€

const BCRYPT_SALT_ROUNDS = 12;
const AI_CONFIG_PATH = path.join(app.getPath('userData'), 'storage', 'ai_config.json');

// Login rate limiting (per userId)
const loginAttempts = new Map();
setInterval(() => {
  const cutoff = Date.now() - LOGIN_LOCKOUT_WINDOW;
  for (const [key, data] of loginAttempts) {
    if (data.lastAttempt < cutoff) loginAttempts.delete(key);
  }
}, 60000);
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 min window before reset
const MAX_LOCKOUT_SECS = 900; // 15 minutes max lockout

function hashBcrypt(pwd) {
  return bcrypt.hashSync(pwd, BCRYPT_SALT_ROUNDS);
}

function verifyPassword(pwd, passwordHash) {
  if (!passwordHash || typeof passwordHash !== 'string') return false;
  return bcrypt.compareSync(pwd, passwordHash);
}

function signToken(userId, expiryMs) {
  const payload = `${userId}:${expiryMs}`;
  const hmac = crypto.createHmac('sha256', HMAC_KEY).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split(':');
  if (parts.length < 3) return null;
  const payload = parts.slice(0, -1).join(':');
  const sig = parts[parts.length - 1];
  const expected = crypto.createHmac('sha256', HMAC_KEY).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  const userId = parseInt(parts[0], 10);
  const expiry = parseInt(parts[1], 10);
  if (isNaN(userId) || isNaN(expiry) || Date.now() > expiry) return null;
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
      rec.count = Math.min(rec.count + 1, MAX_LOGIN_ATTEMPTS + 100);
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
    var sessionToken = remember ? signToken(user.id, Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
    return { ok: true, user: sessionUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('login', e);
    return { ok: false, error: 'حدث خطأ في تسجيل الدخول' };
  }
});

ipcMain.handle('auth:setup', (_e, { officeName, adminName, password, openAtLogin, securityQ1, securityA1 }) => {
  try {
    const existing = db.getAllUsers() || [];
    const hasPassword = existing.some(u => u.password_hash && u.password_hash !== '');
    if (hasPassword) return { ok: false, error: 'تم إعداد المكتب مسبقاً' };
    if (!officeName || typeof officeName !== 'string' || !officeName.trim()) return { ok: false, error: 'اسم المكتب مطلوب' };
    if (!adminName || typeof adminName !== 'string' || !adminName.trim()) return { ok: false, error: 'اسم المدير مطلوب' };
    if (!password || typeof password !== 'string' || password.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    const hash = hashBcrypt(password);
    const cleanEmail = 'admin@' + officeName.trim().replace(/\s+/g, '') + '.ma';
    db.setOfficeSetting('office_name', officeName.trim());
    db.setOfficeSetting('setup_date', new Date().toISOString());
    var existingAdmin = existing.find(u => !u.password_hash || u.password_hash === '');
    var id;
    if (existingAdmin) {
      db.updateUser(existingAdmin.id, { name: adminName.trim(), email: cleanEmail, password_hash: hash, role: 'admin', active: 1 });
      id = existingAdmin.id;
    } else {
      id = db.addUser({ name: adminName.trim(), email: cleanEmail, password_hash: hash, role: 'admin' });
    }
    if (!id) return { ok: false, error: 'فشل إنشاء حساب المدير' };
    const user = db.getUserById(id);
    if (!user) return { ok: false, error: 'فشل استرجاع المستخدم' };
    if (securityQ1 && securityA1) {
      db.setSecurityQuestions(id, [{ question: securityQ1, answerHash: hashBcrypt(securityA1) }]);
    }
    currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    db.addLog('setup', `إعداد المكتب: ${officeName} — المدير: ${adminName}`);
    if (openAtLogin && app.setLoginItemSettings) {
      try { app.setLoginItemSettings({ openAtLogin: true }); } catch (e) { /* best effort */ }
    }
    var sessionToken = signToken(id, Date.now() + 30 * 24 * 60 * 60 * 1000);
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
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!questionIndex || questionIndex < 1 || questionIndex > 3) return { ok: false, error: 'رقم السؤال غير صالح' };
    if (!answer || typeof answer !== 'string') return { ok: false, error: 'الإجابة مطلوبة' };
    const storedHash = db.getSecurityAnswer(userId, questionIndex);
    if (!storedHash) return { ok: false, error: 'لم يتم العثور على السؤال' };
    const ok = bcrypt.compareSync(answer, storedHash);
    if (!ok) return { ok: false, error: 'الإجابة غير صحيحة' };
    return { ok: true };
  } catch (e) {
    handleError('checkSecurityAnswer', e);
    return { ok: false, error: 'حدث خطأ في التحقق من الإجابة' };
  }
});

ipcMain.handle('auth:resetPassword', (_e, { userId, newPassword, remember }) => {
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    const hash = hashBcrypt(newPassword);
    db.updateUser(userId, { password_hash: hash });
    const user = db.getUserById(userId);
    if (!user || !user.active) return { ok: false, error: 'المستخدم غير موجود أو غير نشط' };
    currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    db.addLog('reset_password', `إعادة تعيين كلمة السر للمستخدم ${user.name}`, user.id, user.name);
    var sessionToken = (remember !== false) ? signToken(userId, Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
    return { ok: true, user: currentUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('resetPassword', e);
    return { ok: false, error: 'حدث خطأ في إعادة تعيين كلمة السر' };
  }
});

ipcMain.handle('auth:resetWithMasterKey', (_e, { userId, newPassword, masterKey }) => {
  try {
    if (!userId || typeof userId !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    if (!masterKey || typeof masterKey !== 'string') return { ok: false, error: 'مفتاح الاستعادة مطلوب' };
    const mkBuf = Buffer.from(process.env.MASTER_KEY);
const inBuf = Buffer.from(masterKey);
if (mkBuf.length !== inBuf.length || !crypto.timingSafeEqual(mkBuf, inBuf)) return { ok: false, error: 'مفتاح الاستعادة غير صحيح' };
    const hash = hashBcrypt(newPassword);
    db.updateUser(userId, { password_hash: hash });
    const user = db.getUserById(userId);
    if (!user || !user.active) return { ok: false, error: 'المستخدم غير موجود أو غير نشط' };
    currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    db.addLog('reset_password', `إعادة تعيين كلمة السر (مفتاح الاستعادة) للمستخدم ${user.name}`, user.id, user.name);
    var sessionToken = signToken(userId, Date.now() + 30 * 24 * 60 * 60 * 1000);
    return { ok: true, user: currentUser, sessionToken: sessionToken };
  } catch (e) {
    handleError('resetWithMasterKey', e);
    return { ok: false, error: 'حدث خطأ في إعادة تعيين كلمة السر' };
  }
});

ipcMain.handle('auth:checkSession', (_e, userId) => {
  try {
    if (!userId || typeof userId !== 'number') return null;
    const user = db.getUserById(userId);
    if (!user || !user.active) return null;
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    currentUser = sessionUser;
    return sessionUser;
  } catch (e) {
    handleError('checkSession', e);
    return null;
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

ipcMain.handle('auth:logout', (_e, reason) => {
  currentUser = null;
  logToLogger(0, 'auth', reason || 'User logged out');
  return { ok: true };
});

ipcMain.handle('auth:hashPassword', (_e, pwd) => {
  try {
    if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    if (pwd.length < 8) return { ok: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل' };
    return { ok: true, hash: hashBcrypt(pwd) };
  } catch (e) {
    handleError('hashPassword', e);
    return { ok: false, error: 'خطأ في تشفير كلمة السر' };
  }
});

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
    const newHash = hashBcrypt(newPassword);
    db.updateUser(currentUser.id, { password_hash: newHash });
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
    data.password_hash = hashBcrypt(data.password);
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
      data.password_hash = hashBcrypt(data.password);
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

// â”€â”€â”€ AI â”€â”€â”€

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

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
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

function decrypt(encryptedData) {
  const { salt, iv, encrypted, authTag } = JSON.parse(encryptedData);
  const key = crypto.scryptSync(ENCRYPTION_KEY, Buffer.from(salt, 'hex'), 32);
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
  const config = getAiConfig();
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
  return text
    .replace(/0[567]\d{8}/g, '[رقم هاتف]')
    .replace(/00212[567]\d{8}/g, '[رقم هاتف]')
    .replace(/\+212[567]\d{8}/g, '[رقم هاتف]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[بريد إلكتروني]')
    .replace(/\b\d{16,}\b/g, '[رقم بطاقة]');
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

ipcMain.handle('ai:ask', safeIpc('ai:ask', withPerm('use_ai')(async (_e, { mode, message, context }) => {
  const prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  return callAI(prompt, message, context);
})));

ipcMain.handle('ai:askContextual', safeIpc('ai:askContextual', withPerm('use_ai')(async (_e, { mode, message, contextType, contextId }) => {
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
})));

ipcMain.handle('ai:getSmartInsights', safeIpc('ai:getSmartInsights', withPerm('use_ai')(async () => {
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
})));

ipcMain.handle('ai:generateTimeline', safeIpc('ai:generateTimeline', withPerm('use_ai')(async (_e, { caseId }) => {
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
})));

ipcMain.handle('ai:summarizeDocument', safeIpc('ai:summarizeDocument', withPerm('use_ai')(async (_e, { docId }) => {
  const doc = db.getDocument(docId);
  if (!doc) return { text: '', error: 'الوثيقة غير موجودة', friendlyError: 'الوثيقة غير موجودة' };
  const txt = db.getDocumentText(docId);
  const text = txt ? txt.extracted_text?.slice(0, 4000) : '';
  if (!text || text.length < 50) return { text: '', error: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص', friendlyError: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص' };
  let context = `الملف: ${doc.filename}\nالنوع: ${doc.doc_type||'غير محدد'}\nتاريخ الرفع: ${doc.upload_date||''}\nالوسوم: ${doc.tags||''}\n\nالنص:\n${text}`;
  return callAI('أنت خبير في تحليل وثائق المحاماة. لخص هذه الوثيقة القانونية بالعربية في 3-5 نقاط واضحة.', 'لخص هذه الوثيقة بالعربية.', context);
})));

ipcMain.handle('ai:detectRisks', safeIpc('ai:detectRisks', withPerm('use_ai')(async (_e, { caseId }) => {
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
})));

ipcMain.handle('ai:analyzeDocument', safeIpc('ai:analyzeDocument', withPerm('use_ai')(async (_e, { docId }) => {
  const doc = db.getDocument(docId);
  if (!doc) {
    const err = { error: 'الوثيقة غير موجودة' };
    console.log('[ai:analyzeDocument] return P1 (doc not found) err.error=', err.error, 'chars:', err.error.split('').map(c=>c.charCodeAt(0).toString(16)));
    return err;
  }

  const cached = db.getDocumentAnalysis(docId);
  if (cached) {
    const r = { analysis: cached, cached: true, doc };
    console.log('[ai:analyzeDocument] return P2 (cached) analysis.length=', cached.length, 'analysis first 50 chars:', cached.slice(0,50));
    return r;
  }

  const txt = db.getDocumentText(docId);
  const text = txt ? txt.extracted_text?.trim() : '';
  if (!text || text.length < 50) {
    const err = { error: 'هذه الوثيقة لا تحتوي على نص كافٍ للتحليل' };
    console.log('[ai:analyzeDocument] return P3 (text too short) text.length=', (text||'').length, 'err.error=', err.error, 'chars:', err.error.split('').map(c=>c.charCodeAt(0).toString(16)));
    return err;
  }

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

  const ret = { analysis: result.text || result.friendlyError || 'تعذر تحليل الوثيقة', cached: false, doc };
  console.log('[ai:analyzeDocument] return P4 (final) result.text=', result.text ? 'present' : 'null', 'result.friendlyError=', result.friendlyError ? result.friendlyError.slice(0,60) : 'null', 'ret.analysis first 60:', ret.analysis.slice(0,60));
  return ret;
})));

function getMasterKeyOrThrow() {
  const key = process.env.MASTER_KEY;
  if (!key) {
    throw new Error('MASTER_KEY environment variable is required — الرجاء تعيين MASTER_KEY في ملف .env');
  }
  return key;
}

function deriveKey(info) {
  return crypto.createHmac('sha256', process.env.MASTER_KEY).update(info).digest('hex').slice(0, 32);
}

const HMAC_KEY = deriveKey('opencode:hmac');
const ENCRYPTION_KEY = deriveKey('opencode:encryption');

function getAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf8'));
      
      if (data.encrypted) {
        try {
          const apiKey = decrypt(data.encrypted);
          return { apiKey, provider: data.provider || 'groq', model: data.model || '' };
        } catch (e) {
          console.warn('فشل فك تشفير مفتاح API');
          return { provider: data.provider || 'groq', model: data.model || '' };
        }
      }
      
      if (data.apiKey) {
        console.warn('تم اكتشاف مفتاح API غير مشفر');
        const encrypted = encrypt(data.apiKey);
        try {
          fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
            encrypted,
            provider: data.provider || 'groq',
            model: data.model || ''
          }, null, 2));
        } catch (e) { /* ignore */ }
        return { apiKey: data.apiKey, provider: data.provider || 'groq', model: data.model || '' };
      }
      
      return data;
    }
  } catch (e) { /* ignore */ }
  return {};
}

function saveAiConfig(config) {
  const dir = path.dirname(AI_CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const apiKey = config.apiKey;
  
  const encrypted = encrypt(apiKey);
  
  fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
    encrypted,
    provider: config.provider || 'groq',
    model: config.model || ''
  }, null, 2));
  
  console.log('تم حفظ مفتاح API مشفراً بنجاح');
}

ipcMain.handle('ai:getConfig', safeIpc('ai:getConfig', withPerm('use_ai')(() => {
  try {
    const config = getAiConfig();
    return { provider: config.provider || 'groq', model: config.model || '', hasKey: !!config.apiKey };
  } catch (e) {
    console.warn('ai:getConfig error:', e.message);
    return { provider: 'groq', model: '', hasKey: false };
  }
})));
ipcMain.handle('ai:saveConfig', safeIpc('ai:saveConfig', withPerm('use_ai')(async (_e, config) => {
  try {
    saveAiConfig(config);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || 'فشل حفظ مفتاح API' };
  }
})));

app.whenReady().then(init);

app.on('window-all-closed', async () => {
  await saveDbOnQuit();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
