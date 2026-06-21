const { app, BrowserWindow, ipcMain, shell, Notification, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const logger = require('./logger');

// Export saveDb so we can save on quit
async function saveDbOnQuit() {
  try {
    if (typeof db.saveDb === 'function') await db.saveDb();
  } catch (e) {
    console.error('Save on quit failed:', e);
  }
}

logger.setDbLog((action, details) => {
  try { db.addLog(action, details); } catch (e) { /* logger fallback silent */ }
});

let Tesseract = null;
try { Tesseract = require('tesseract.js'); } catch (e) { console.warn('tesseract.js not available'); }

let mainWindow = null;

/* ─── Notification Cache (bounded, auto-expiring) ─── */
const NOTIF_MAX_SIZE = 500;
const NOTIF_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NOTIF_GC_INTERVAL = 6 * 60 * 60 * 1000;  // every 6 hours
const sentNotifications = new Map(); // key → timestamp

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
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
        'Content-Security-Policy': ["default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.groq.com"]
      }
    });
  });

  mainWindow.loadFile('index.html');

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

function wrapHandler(name, fn) {
  return async (event, ...args) => {
    try {
      return await fn(event, ...args);
    } catch (err) {
      logToLogger(2, 'ipc:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 500), args: JSON.stringify(args).slice(0, 200) });
      throw err;
    }
  };
}

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

// ─── Safe IPC helper: catches errors, logs them, returns structured response ───
function safeIpc(name, fn) {
  return async (event, ...args) => {
    try {
      return await fn(event, ...args);
    } catch (err) {
      logToLogger(2, 'ipc:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
      return { error: 'حدث خطأ: ' + (err.message || 'خطأ غير معروف') };
    }
  };
}

async function init() {
  await db.initDb();
  logToLogger(0, 'app', 'Application started');

  const archived = db.autoArchive();
  if (archived > 0) console.log(`Auto-archived ${archived} closed cases`);

  function nullGuard(obj, defaults) {
    if (obj === null || obj === undefined) return defaults || {};
    return obj;
  }

  // ─── DB IPC Handlers ───

  ipcMain.handle('db:getAllCases', () => db.getAllCases());
  ipcMain.handle('db:addCase', safeIpc('addCase', (_e, data) => {
    data = nullGuard(data);
    const result = db.addCase(data);
    if (result && result.id) db.addLog('add_case', `إضافة قضية ${data.case_number || ''} - ${data.title || ''}`);
    return result;
  }));
  ipcMain.handle('db:deleteCase', safeIpc('deleteCase', (_e, id) => {
    if (id == null) return;
    const c = db.getAllCases().find(x => x.id === id);
    db.deleteCase(id);
    db.addLog('delete_case', `حذف قضية ${c ? c.case_number : '#' + id}`);
  }));
  ipcMain.handle('db:getCasesByClient', safeIpc('getCasesByClient', (_e, clientId) => db.getCasesByClient(clientId)));
  ipcMain.handle('db:getAllClients', () => db.getAllClients());
  ipcMain.handle('db:addClient', safeIpc('addClient', (_e, data) => {
    data = nullGuard(data);
    const result = db.addClient(data);
    if (result && result.id) db.addLog('add_client', `إضافة موكل ${data.name || ''}`);
    return result;
  }));
  ipcMain.handle('db:deleteClient', safeIpc('deleteClient', (_e, id) => {
    if (id == null) return;
    const c = db.getAllClients().find(x => x.id === id);
    db.deleteClient(id);
    db.addLog('delete_client', `حذف موكل ${c ? c.name : '#' + id}`);
  }));
  ipcMain.handle('db:getAllTasks', (_e, includeArchived) => db.getAllTasks(includeArchived));
  ipcMain.handle('db:getTask', (_e, id) => db.getTask(id));
  ipcMain.handle('db:addTask', safeIpc('addTask', (_e, data) => {
    data = nullGuard(data);
    if (data.case_id && !db.validateRef('cases', data.case_id)) return { error: 'القضية غير موجودة' };
    const id = db.addTask(data);
    return { id };
  }));
  ipcMain.handle('db:updateTask', safeIpc('updateTask', (_e, id, data) => db.updateTask(id, data)));
  ipcMain.handle('db:deleteTask', safeIpc('deleteTask', (_e, id) => db.deleteTask(id)));
  ipcMain.handle('db:getSubtasks', (_e, taskId) => db.getSubtasks(taskId));
  ipcMain.handle('db:addSubtask', safeIpc('addSubtask', (_e, data) => db.addSubtask(nullGuard(data))));
  ipcMain.handle('db:toggleSubtask', safeIpc('toggleSubtask', (_e, id) => db.toggleSubtask(id)));
  ipcMain.handle('db:deleteSubtask', safeIpc('deleteSubtask', (_e, id) => db.deleteSubtask(id)));
  ipcMain.handle('db:getComments', (_e, taskId) => db.getComments(taskId));
  ipcMain.handle('db:addComment', safeIpc('addComment', (_e, data) => db.addComment(nullGuard(data))));
  ipcMain.handle('db:getAllWorkflows', () => db.getAllWorkflows());
  ipcMain.handle('db:addWorkflow', safeIpc('addWorkflow', (_e, data) => db.addWorkflow(nullGuard(data))));
  ipcMain.handle('db:applyWorkflow', safeIpc('applyWorkflow', (_e, args) => {
    const { caseId, workflowId } = nullGuard(args);
    return db.applyWorkflow(caseId, workflowId);
  }));
  ipcMain.handle('db:deleteWorkflow', safeIpc('deleteWorkflow', (_e, id) => db.deleteWorkflow(id)));
  ipcMain.handle('db:getAllTemplates', () => db.getAllTemplates());
  ipcMain.handle('db:addTemplate', safeIpc('addTemplate', (_e, data) => db.addTemplate(nullGuard(data))));
  ipcMain.handle('db:applyTemplate', safeIpc('applyTemplate', (_e, args) => {
    const { caseId, templateId } = nullGuard(args);
    return db.applyTemplate(caseId, templateId);
  }));
  ipcMain.handle('db:getTaskAnalytics', () => db.getTaskAnalytics());
  ipcMain.handle('db:getDashboardStats', () => db.getDashboardStats());
  ipcMain.handle('db:getDocuments', (_e, caseId) => db.getDocuments(caseId));
  ipcMain.handle('db:uploadDocument', safeIpc('uploadDocument', async (_e, args) => {
    const { sourcePath, caseId, docType } = nullGuard(args);
    if (!sourcePath) return { error: 'مسار الملف مطلوب' };
    if (!db.validateRef('cases', caseId)) return { error: 'القضية غير موجودة' };
    const caseDir = path.join(db.STORAGE_DIR, String(caseId));
    if (!fs.existsSync(caseDir)) fs.mkdirSync(caseDir, { recursive: true });
    const filename = path.basename(sourcePath);
    const destPath = path.join(caseDir, filename);
    let finalPath = destPath;
    let count = 1;
    while (fs.existsSync(finalPath)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      finalPath = path.join(caseDir, `${base}_(${count})${ext}`);
      count++;
    }
    fs.copyFileSync(sourcePath, finalPath);
    const docId = db.addDocument({ case_id: caseId, filename: path.basename(finalPath), file_path: finalPath, doc_type: docType });
    setTimeout(() => indexDocument(docId), 100);
    db.addLog('upload_document', `رفع وثيقة ${path.basename(finalPath)} للقضية #${caseId} (${docType})`);
    return docId;
  }));
  ipcMain.handle('db:selectAndUpload', safeIpc('selectAndUpload', async (_e, args) => {
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
        const stats = fs.statSync(sourcePath);
        if (stats.size > MAX_FILE_SIZE) throw new Error(`${path.basename(sourcePath)} كبير جداً (الحد 50MB)`);
        const ext = path.extname(sourcePath).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`نوع غير مدعوم: ${path.basename(sourcePath)}`);
        const caseDir = path.join(db.STORAGE_DIR, String(caseId));
        if (!fs.existsSync(caseDir)) fs.mkdirSync(caseDir, { recursive: true });
        const filename = path.basename(sourcePath);
        const finalPath = path.join(caseDir, Date.now() + '_' + filename);
        fs.copyFileSync(sourcePath, finalPath);
        const docId = db.addDocument({ case_id: caseId, filename, file_path: finalPath, doc_type: docType });
        if (tags) db.updateDocument(docId, { tags });
        setTimeout(() => indexDocument(docId), 100);
        db.addLog('upload_document', `رفع ${filename} للقضية #${caseId} (${docType})`);
        uploaded.push(docId);
      } catch (e) { console.error('Upload error:', sourcePath, e.message); }
    }
    return uploaded.length ? uploaded : null;
  }));
  ipcMain.handle('db:globalSearch', (_e, queryTerm) => db.globalSearch(typeof queryTerm === 'string' ? queryTerm : ''));
  ipcMain.handle('db:getSearchIndex', () => db.getSearchIndex());
  ipcMain.handle('db:openDocument', async (_e, docId) => {
    if (docId == null) return;
    try {
      const doc = db.getDocument(docId);
      if (doc && doc.file_path && fs.existsSync(doc.file_path)) shell.openPath(doc.file_path);
    } catch (e) { logToLogger(2, 'openDocument', e.message); }
  });
  ipcMain.handle('db:updateDocNotes', safeIpc('updateDocNotes', (_e, args) => {
    const { id, notes } = nullGuard(args);
    if (id == null) return;
    db.updateDocument(id, { notes: notes || '' });
    db.addLog('update_doc_notes', `تحديث ملاحظات الوثيقة #${id}`);
  }));
  ipcMain.handle('db:getProcedures', (_e, affaireId) => db.getProcedures(affaireId));
  ipcMain.handle('db:addProcedure', safeIpc('addProcedure', (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addProcedure(data);
    db.addLog('add_procedure', `إضافة إجراء للقضية #${data.affaire_id}: ${data.type || ''} - ${data.date || ''}`);
    return { id };
  }));
  ipcMain.handle('db:getPaiements', (_e, affaireId) => db.getPaiements(affaireId));
  ipcMain.handle('db:addPaiement', safeIpc('addPaiement', (_e, data) => {
    data = nullGuard(data);
    if (!db.validateRef('cases', data.affaire_id)) return { error: 'القضية غير موجودة' };
    const id = db.addPaiement(data);
    db.addLog('add_paiement', `إضافة دفعة ${data.montant || 0} درهم للقضية #${data.affaire_id}`);
    return { id };
  }));
  ipcMain.handle('db:getChartData', () => db.getChartData());
  ipcMain.handle('db:archiveCase', safeIpc('archiveCase', (_e, id) => { if (id != null) db.archiveCase(id); }));
  ipcMain.handle('db:unarchiveCase', safeIpc('unarchiveCase', (_e, id) => { if (id != null) db.unarchiveCase(id); }));
  ipcMain.handle('db:updateCaseStatus', safeIpc('updateCaseStatus', (_e, data) => {
    data = nullGuard(data);
    if (data.id != null && data.status) db.updateCaseStatus(data.id, data.status);
  }));
  ipcMain.handle('db:updateCaseNotes', safeIpc('updateCaseNotes', (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) db.updateCaseNotes(data.id, data.notes || '');
  }));
  ipcMain.handle('db:getArchivedCases', () => db.getAllCases(true).filter(c => c.archived === 1));
  ipcMain.handle('db:addCommunication', safeIpc('addCommunication', (_e, data) => {
    data = nullGuard(data);
    const id = db.addCommunication(data);
    db.addLog('add_communication', `تسجيل اتصال مع الموكل #${data.client_id} - ${data.type || ''}`);
    return id;
  }));
  ipcMain.handle('db:getClientCommunications', (_e, clientId) => db.getClientCommunications(clientId));
  ipcMain.handle('db:updateClientNotes', safeIpc('updateClientNotes', (_e, data) => {
    data = nullGuard(data);
    if (data.id != null) db.updateClient(data);
  }));
  ipcMain.handle('db:getTodayProcedures', () => db.getTodayProcedures());
  ipcMain.handle('db:getAlertSettings', () => db.getAlertSettings());
  ipcMain.handle('db:updateAlertSettings', safeIpc('updateAlertSettings', (_e, data) => {
    db.updateAlertSettings(nullGuard(data));
    db.addLog('update_alert_settings', `تعديل إعدادات التنبيهات`);
  }));
  ipcMain.handle('db:getUpcomingDeadlines', () => db.getUpcomingDeadlines());
  ipcMain.handle('db:getUpcomingHearings', () => db.getUpcomingHearings());
  ipcMain.handle('db:getBackupSettings', () => db.getBackupSettings());
  ipcMain.handle('db:updateBackupSettings', safeIpc('updateBackupSettings', (_e, data) => {
    db.updateBackupSettings(nullGuard(data));
    db.addLog('update_backup_settings', `تعديل إعدادات النسخ الاحتياطي`);
  }));
  ipcMain.handle('db:createBackup', () => {
    try {
      const name = db.createBackup('manual');
      db.addLog('create_backup', `إنشاء نسخة احتياطية يدوية: ${name}`);
      return name;
    } catch (e) { logToLogger(2, 'createBackup', e.message); return { error: e.message }; }
  });
  ipcMain.handle('db:listBackups', () => { try { return db.listBackups(); } catch (e) { logToLogger(2, 'listBackups', e.message); return []; } });
  ipcMain.handle('db:validateBackup', (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    return db.validateBackupFile(filename);
  });
  ipcMain.handle('db:restoreBackup', safeIpc('restoreBackup', async (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    const result = db.restoreFromBackup(filename);
    db.addLog('restore_backup', `استعادة نسخة احتياطية: ${filename}`);
    return result;
  }));
  ipcMain.handle('db:deleteBackup', safeIpc('deleteBackup', (_e, filename) => {
    if (!filename || typeof filename !== 'string' || filename.includes('..')) return { error: 'اسم الملف غير صالح' };
    const result = db.deleteBackupFile(filename);
    db.addLog('delete_backup', `حذف نسخة احتياطية: ${filename}`);
    return result;
  }));
  ipcMain.handle('db:exportArchive', () => {
    try {
      const result = db.exportFullArchive();
      db.addLog('export_archive', `تصدير أرشيف كامل: ${result.filename}`);
      return result;
    } catch (e) { logToLogger(2, 'exportArchive', e.message); return { error: e.message }; }
  });
  ipcMain.handle('db:getLogs', (_e, filters) => db.getLogs(filters));
  ipcMain.handle('db:addLog', safeIpc('addLog', (_e, action, details) => { if (action) db.addLog(action, details || ''); }));
  ipcMain.handle('db:integrityCheck', () => db.integrityCheck());
  ipcMain.handle('db:repairOrphans', () => db.repairOrphans());

  // ─── Logger IPC ───
  ipcMain.handle('logger:log', (_e, level, context, message) => {
    const lvlMap = { INFO: 0, WARN: 1, ERROR: 2, CRITICAL: 3 };
    const lvl = lvlMap[level] !== undefined ? lvlMap[level] : 1;
    logToLogger(lvl, context || 'renderer', message || '');
  });

  ipcMain.handle('logger:getLogs', (_e, filters) => logger.getLogs(filters));
  ipcMain.handle('logger:export', (_e, format) => logger.exportLogs(format || 'json'));
  ipcMain.handle('logger:clear', () => logger.clearLogs());
  ipcMain.handle('logger:stats', () => logger.getStats());

  createWindow();

  ipcMain.handle('notif:getCacheStats', () => ({
    size: sentNotifications.size,
    maxSize: NOTIF_MAX_SIZE,
    ttlMs: NOTIF_TTL_MS,
    memoryEstimate: sentNotifications.size * 128
  }));

  mainWindow.webContents.once('did-finish-load', () => {
    checkAndNotify();
    setInterval(checkAndNotify, 3600000);
    setInterval(cleanupSentNotifications, NOTIF_GC_INTERVAL);

    try {
      const settings = db.getBackupSettings();
      if (settings.auto_enabled) {
        const freqMs = (settings.frequency_hours || 24) * 3600000;
        if (!settings.last_backup_at || (Date.now() - new Date(settings.last_backup_at).getTime()) >= freqMs) {
          const name = db.createBackup('auto');
          db.addLog('auto_backup', `نسخة احتياطية تلقائية: ${name}`);
        }
      }
    } catch (e) { console.error('Auto-backup error:', e); }

    setInterval(() => {
      try {
        const s = db.getBackupSettings();
        if (s.auto_enabled) {
          const freqMs = (s.frequency_hours || 24) * 3600000;
          if (!s.last_backup_at || (Date.now() - new Date(s.last_backup_at).getTime()) >= freqMs) {
            const name = db.createBackup('auto');
            db.addLog('auto_backup', `نسخة احتياطية تلقائية: ${name}`);
          }
        }
      } catch (e) { console.error('Auto-backup interval error:', e); }
    }, 3600000);
  });
}

function cleanupSentNotifications() {
  const now = Date.now();
  let count = 0;
  for (const [key, ts] of sentNotifications) {
    if (now - ts > NOTIF_TTL_MS) { sentNotifications.delete(key); count++; }
  }
  if (sentNotifications.size > NOTIF_MAX_SIZE) {
    const sorted = [...sentNotifications.entries()].sort((a, b) => a[1] - b[1]);
    const excess = sorted.slice(0, sentNotifications.size - NOTIF_MAX_SIZE);
    for (const [key] of excess) { sentNotifications.delete(key); count++; }
  }
  if (count > 0 && mainWindow) mainWindow.webContents.send('notif:cacheStats', { size: sentNotifications.size, cleaned: count });
}

function markNotified(key) {
  if (sentNotifications.size >= NOTIF_MAX_SIZE) {
    const oldest = [...sentNotifications.entries()].reduce((a, b) => a[1] < b[1] ? a : b);
    sentNotifications.delete(oldest[0]);
  }
  sentNotifications.set(key, Date.now());
}

function isNotified(key) {
  const ts = sentNotifications.get(key);
  if (ts === undefined) return false;
  if (Date.now() - ts > NOTIF_TTL_MS) { sentNotifications.delete(key); return false; }
  return true;
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
        if (!isNotified(key)) {
          markNotified(key);
          new Notification({ title: 'تنبيه أجل حسمي', body: item.case_number + ': ' + item.title + ' - باقي ' + item.days_remaining + ' يوم' }).show();
        }
      }
    });

    hearings.forEach(item => {
      if (item.days_remaining <= maxThreshold) {
        const key = 'hearing-' + item.id + '-' + item.days_remaining;
        if (!isNotified(key)) {
          markNotified(key);
          new Notification({ title: 'تنبيه جلسة قريبة', body: item.case_number + ': ' + item.type + ' - باقي ' + item.days_remaining + ' يوم' }).show();
        }
      }
    });
  } catch (e) { console.error('checkAndNotify error:', e); }
}

async function indexDocument(docId) {
  if (!Tesseract) return;
  try {
    const doc = db.getDocument(docId);
    if (!doc) return;
    try { await fsp.access(doc.file_path); } catch { return; }
    const ext = path.extname(doc.file_path).toLowerCase();
    let text = '';
    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    if (ext === '.pdf' || imgExts.includes(ext)) {
      const { data } = await Tesseract.recognize(doc.file_path, 'ara+fra');
      text = data.text || '';
    }
    if (text.trim()) {
      db.addDocumentText(docId, text.trim());
      console.log('Indexed document', docId, '(' + text.trim().length + ' chars)');
    }
  } catch (e) { console.error('indexDocument error for', docId, ':', e.message); }
}

// ─── Events System ───

ipcMain.handle('events:getAll', () => db.getAllEvents());
ipcMain.handle('events:get', (_e, id) => db.getEvent(id));
ipcMain.handle('events:add', safeIpc('events:add', (_e, data) => {
  if (!data) return { error: 'البيانات مطلوبة' };
  const id = db.addEvent(data);
  if (id) db.addLog('add_event', `إضافة حدث ${data.title || ''} - ${data.date || ''}`);
  return id;
}));
ipcMain.handle('events:update', safeIpc('events:update', (_e, id, data) => {
  if (id == null || !data) return;
  db.updateEvent(id, data);
  db.addLog('update_event', `تحديث حدث #${id}`);
}));
ipcMain.handle('events:delete', safeIpc('events:delete', (_e, id) => {
  if (id == null) return;
  db.deleteEvent(id);
  db.addLog('delete_event', `حذف حدث #${id}`);
}));
// ─── Auth ───

const BCRYPT_SALT_ROUNDS = 12;
const AI_CONFIG_PATH = path.join(app.getPath('userData'), 'storage', 'ai_config.json');
const PASSWORD_PATH = path.join(app.getPath('userData'), 'storage', 'password.json');

function getPasswordHash() {
  try {
    if (fs.existsSync(PASSWORD_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(PASSWORD_PATH, 'utf8'));
      if (!parsed || typeof parsed.hash !== 'string') return { error: 'ملف كلمة السر تالف' };
      return parsed.hash || '';
    }
  } catch (e) { return { error: 'ملف كلمة السر تالف: ' + e.message }; }
  return '';
}

function isPasswordHashError(val) {
  return typeof val === 'object' && val !== null && val.error;
}

function setPasswordHash(hash) {
  const dir = path.dirname(PASSWORD_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = PASSWORD_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify({ hash }, null, 2));
  fs.renameSync(tempPath, PASSWORD_PATH);
}

function isSHA256Hash(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash);
}

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[abxy]\$\d+\$/.test(hash);
}

function hashSHA256(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function hashBcrypt(pwd) {
  return bcrypt.hashSync(pwd, BCRYPT_SALT_ROUNDS);
}

function verifyPassword(pwd, storedHash) {
  if (isBcryptHash(storedHash)) return bcrypt.compareSync(pwd, storedHash);
  if (isSHA256Hash(storedHash)) return hashSHA256(pwd) === storedHash;
  return false;
}

let currentUser = null;

function handleError(name, err) {
  logToLogger(2, 'auth:' + name, err.message || String(err), { stack: (err.stack || '').slice(0, 300) });
}

ipcMain.handle('auth:boot', () => {
  try {
    const stored = getPasswordHash();
    const corrupt = isPasswordHashError(stored);
    const hasPassword = corrupt ? false : !!stored;
    let users = [];
    try { users = db.getUsers() || []; } catch (e) { /* DB not ready */ }
    return { hasPassword, corrupt, error: corrupt ? stored.error : null, users };
  } catch (e) {
    handleError('boot', e);
    return { hasPassword: false, corrupt: false, error: null, users: [] };
  }
});

ipcMain.handle('auth:hasPassword', () => {
  try {
    const stored = getPasswordHash();
    if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
    return !!stored;
  } catch (e) {
    handleError('hasPassword', e);
    return false;
  }
});

ipcMain.handle('auth:login', (_e, pwd) => {
  try {
    if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    const stored = getPasswordHash();
    if (isPasswordHashError(stored)) return { ok: false, error: stored.error, corrupt: true };
    if (!stored) return { ok: true, firstTime: true };
    if (!verifyPassword(pwd, stored)) return { ok: false, error: 'كلمة السر خطأ' };
    if (isSHA256Hash(stored)) {
      setPasswordHash(hashBcrypt(pwd));
    }
    return { ok: true };
  } catch (e) {
    handleError('login', e);
    return { ok: false, error: 'حدث خطأ في تسجيل الدخول' };
  }
});

ipcMain.handle('auth:setPassword', (_e, pwd) => {
  try {
    if (!pwd || typeof pwd !== 'string' || pwd.length < 4) return { ok: false, error: 'كلمة السر يجب أن تكون 4 أحرف على الأقل' };
    const hash = hashBcrypt(pwd);
    setPasswordHash(hash);
    const verify = getPasswordHash();
    if (isPasswordHashError(verify) || !verify) return { ok: false, error: 'فشل حفظ كلمة السر — تحقق من صلاحية الكتابة' };
    return { ok: true };
  } catch (e) {
    handleError('setPassword', e);
    return { ok: false, error: 'خطأ في حفظ كلمة السر: ' + e.message };
  }
});

ipcMain.handle('auth:hashPassword', (_e, pwd) => {
  try {
    if (!pwd || typeof pwd !== 'string') return { ok: false, error: 'كلمة السر مطلوبة' };
    if (pwd.length < 4) return { ok: false, error: 'كلمة السر يجب أن تكون 4 أحرف على الأقل' };
    return { ok: true, hash: hashBcrypt(pwd) };
  } catch (e) {
    handleError('hashPassword', e);
    return { ok: false, error: 'خطأ في تشفير كلمة السر' };
  }
});

ipcMain.handle('auth:setCurrentUser', (_e, user) => { currentUser = user; return true; });
ipcMain.handle('auth:getCurrentUser', () => currentUser);

ipcMain.handle('auth:getUsers', () => {
  try {
    return db.getUsers() || [];
  } catch (e) {
    handleError('getUsers', e);
    return [];
  }
});

ipcMain.handle('auth:addUser', (_e, data) => {
  try {
    if (!data || !data.name) return { ok: false, error: 'الاسم مطلوب' };
    const pwd = data.password || '123456';
    if (pwd.length < 4) return { ok: false, error: 'كلمة السر يجب أن تكون 4 أحرف على الأقل' };
    data.password_hash = hashBcrypt(pwd);
    data._userId = currentUser?.id; data._userName = currentUser?.name;
    const id = db.addUser(data);
    return id ? { ok: true, id } : { ok: false, error: 'فشل إضافة المستخدم' };
  } catch (e) {
    handleError('addUser', e);
    return { ok: false, error: 'خطأ في إضافة المستخدم' };
  }
});

ipcMain.handle('auth:updateUser', (_e, id, data) => {
  try {
    if (!id || typeof id !== 'number') return { ok: false, error: 'معرف المستخدم مطلوب' };
    db.updateUser(id, data);
    return { ok: true };
  } catch (e) {
    handleError('updateUser', e);
    return { ok: false, error: 'خطأ في تحديث المستخدم' };
  }
});

ipcMain.handle('auth:deleteUser', (_e, id) => {
  try {
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
    defaultModel: 'llama-3.1-8b-instant'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini'
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-haiku-20240307'
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

function encrypt(text, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return JSON.stringify({ 
    iv: iv.toString('hex'), 
    encrypted, 
    authTag: authTag.toString('hex') 
  });
}

function decrypt(encryptedData, password) {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);
  const key = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function callProvider(provider, apiKey, model, messages) {
  const cfg = AI_PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);

  const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(cfg.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body,
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error || `HTTP ${response.status}`;
      const err = new Error(errMsg);
      err.statusCode = response.status;
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

function buildCaseContext(c) {
  if (!c) return '';
  return `رقم القضية: ${c.case_number}\nالعنوان: ${c.title}\nالموكل: ${c.client_name||''}\nالمحكمة: ${c.court||''}\nالحالة: ${c.status}\nالنوع: ${c.case_type||''}\nالأولوية: ${c.priority}\nتاريخ الإنشاء: ${c.created_date||''}\nآخر جلسة: ${c.next_hearing||'لا توجد'}\nالموعد النهائي: ${c.deadline_date||'لا يوجد'}\nالملاحظات: ${c.notes||''}\nالرسوم: ${c.total_fees||0}`;
}

function buildClientContext(cl) {
  if (!cl) return '';
  return `الاسم: ${cl.name}\nالهاتف: ${cl.phone||''}\nالبريد: ${cl.email||''}\nالعنوان: ${cl.address||''}\nالوسوم: ${cl.tags||''}\nالحالة: ${cl.status}\nالملاحظات: ${cl.notes||''}`;
}

ipcMain.handle('ai:ask', wrapHandler('ai:ask', async (_e, { mode, message, context }) => {
  const prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  return callAI(prompt, message, context);
}));

ipcMain.handle('ai:askContextual', wrapHandler('ai:askContextual', async (_e, { mode, message, contextType, contextId }) => {
  let context = '';
  if (contextType === 'case') {
    const c = db.getAllCases().find(x => x.id === contextId);
    context = buildCaseContext(c);
    const events = db.getEventsByCase(contextId);
    if (events.length) context += `\nالأحداث (${events.length}): ${events.slice(0,5).map(e => `${e.date} ${e.type}: ${e.title}`).join(' | ')}`;
    const docs = db.getDocuments(contextId);
    if (docs.length) context += `\nالوثائق (${docs.length}): ${docs.slice(0,5).map(d => d.filename).join(', ')}`;
  } else if (contextType === 'client') {
    const cl = db.getAllClients().find(x => x.id === contextId);
    context = buildClientContext(cl);
    const cases = db.getCasesByClient(contextId);
    if (cases.length) context += `\nالقضايا: ${cases.map(c => `${c.case_number} (${c.status})`).join(', ')}`;
  } else if (contextType === 'document') {
    const doc = db.getDocument(contextId);
    if (doc) {
      context = `الملف: ${doc.filename}\nالنوع: ${doc.doc_type}\nتاريخ الرفع: ${doc.upload_date||''}\nالوسوم: ${doc.tags||''}\nالملاحظات: ${doc.notes||''}`;
      const txt = db.getDocumentText(contextId);
      if (txt) context += `\n\nالنص المستخرج:\n${txt.extracted_text?.slice(0, 3000)}`;
    }
  } else if (contextType === 'hearing') {
    const ev = db.getEvent(contextId);
    if (ev) {
      context = `الجلسة: ${ev.title}\nالتاريخ: ${ev.date} ${ev.time||''}\nالمحكمة: ${ev.court||''}\nالقاضي: ${ev.judge||''}\nالغرفة: ${ev.room||''}\nالحالة: ${ev.status}\nالملاحظات: ${ev.notes||''}`;
      if (ev.case_id) {
        const c = db.getAllCases().find(x => x.id === ev.case_id);
        if (c) context += `\n\nمعلومات القضية:\n${buildCaseContext(c)}`;
      }
    }
  }
  const prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  return callAI(prompt, message, context);
}));

ipcMain.handle('ai:getSmartInsights', wrapHandler('ai:getSmartInsights', async () => {
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

ipcMain.handle('ai:generateTimeline', wrapHandler('ai:generateTimeline', async (_e, { caseId }) => {
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
  return callAI('أنت خبير في إعداد الجداول الزمنية للقضايا القانونية. قم بإنشاء جدول زمني منظم (timeline) بالعربية لهذه القضية بناءً على البيانات التالية.', 'أنشئ جدولاً زمنياً مفصلاً لهذه القضية.', context);
}));

ipcMain.handle('ai:summarizeDocument', wrapHandler('ai:summarizeDocument', async (_e, { docId }) => {
  const doc = db.getDocument(docId);
  if (!doc) return { text: '', error: 'الوثيقة غير موجودة', friendlyError: 'الوثيقة غير موجودة' };
  const txt = db.getDocumentText(docId);
  const text = txt ? txt.extracted_text?.slice(0, 4000) : '';
  if (!text || text.length < 50) return { text: '', error: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص', friendlyError: 'هذه الوثيقة لا تحتوي على نص كافٍ للتلخيص' };
  let context = `الملف: ${doc.filename}\nالنوع: ${doc.doc_type||'غير محدد'}\nتاريخ الرفع: ${doc.upload_date||''}\nالوسوم: ${doc.tags||''}\n\nالنص:\n${text}`;
  return callAI('أنت خبير في تحليل وثائق المحاماة. لخص هذه الوثيقة القانونية بالعربية في 3-5 نقاط واضحة.', 'لخص هذه الوثيقة بالعربية.', context);
}));

ipcMain.handle('ai:detectRisks', wrapHandler('ai:detectRisks', async (_e, { caseId }) => {
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

function getAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf8'));
      const password = process.env.MASTER_KEY || 'default-key-change-me';
      
      if (data.encrypted) {
        try {
          const apiKey = decrypt(data.encrypted, password);
          return { apiKey, provider: data.provider || 'groq' };
        } catch (e) {
          console.warn('فشل فك تشفير مفتاح API، استخدم التنسيق القديم');
          return { provider: data.provider || 'groq' };
        }
      }
      
      if (data.apiKey) {
        console.warn('تم اكتشاف مفتاح API غير مشفر — جاري التشفير...');
        const encrypted = encrypt(data.apiKey, password);
        const provider = data.provider || 'groq';
        try {
          fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
            encrypted,
            provider
          }, null, 2));
        } catch (e) { /* ignore */ }
        return { apiKey: data.apiKey, provider };
      }
      
      return data;
    }
  } catch (e) { /* ignore */ }
  return {};
}

function saveAiConfig(config) {
  try {
    const dir = path.dirname(AI_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const password = process.env.MASTER_KEY || 'default-key-change-me';
    
    const encrypted = encrypt(config.apiKey, password);
    
    fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify({
      encrypted,
      provider: config.provider || 'groq'
    }, null, 2));
    
    console.log('تم حفظ مفتاح API مشفراً بنجاح');
  } catch (e) {
    console.error('AI config save error:', e);
  }
}

ipcMain.handle('ai:getConfig', () => getAiConfig());
ipcMain.handle('ai:saveConfig', (_e, config) => saveAiConfig(config));

app.whenReady().then(init);

app.on('window-all-closed', async () => {
  await saveDbOnQuit();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
