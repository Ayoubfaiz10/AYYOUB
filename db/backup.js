const fs = require('fs');
const path = require('path');
const { getDb, getSQL, setDb, BACKUP_DIR, saveDb } = require('./connection');
const { query, mutate } = require('./utils');

function getBackupSettings() {
  const rows = query('SELECT * FROM backup_settings WHERE id = 1');
  return rows.length ? rows[0] : { auto_enabled: 1, frequency_hours: 24, keep_count: 30, last_backup_at: null };
}

function updateBackupSettings(data) {
  mutate('UPDATE backup_settings SET auto_enabled = ?, frequency_hours = ?, keep_count = ? WHERE id = 1',
    [data.auto_enabled ? 1 : 0, data.frequency_hours, data.keep_count]);
}

function createBackup(reason) {
  const db = getDb();
  const data = db.export();
  const buffer = Buffer.from(data);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) +
    '_' + pad(now.getHours()) + '-' + pad(now.getMinutes()) + '-' + pad(now.getSeconds());
  const filename = 'backup_' + ts + '_' + reason + '.db';
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  mutate("UPDATE backup_settings SET last_backup_at = ? WHERE id = 1", [now.toISOString()]);

  const settings = getBackupSettings();
  const maxKeep = settings.keep_count || 30;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length > maxKeep) {
    files.slice(maxKeep).forEach(f => {
      try { fs.unlinkSync(path.join(BACKUP_DIR, f.name)); } catch (e) {}
    });
  }

  return filename;
}

function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, mtime: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
  return files;
}

function restoreFromBuffer(buffer) {
  const SQL = getSQL();
  if (buffer.length > 100 * 1024 * 1024) {
    throw new Error('الملف كبير جداً (أقصى 100MB) / Fichier trop volumineux (max 100MB)');
  }
  const newDb = new SQL.Database(buffer);
  const tables = newDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.length > 0 ? tables[0].values.map(v => v[0]) : [];
  if (!tableNames.includes('cases') || !tableNames.includes('clients')) {
    throw new Error('ملف غير صالح - الجداول الأساسية مفقودة / Fichier invalide');
  }
  setDb(newDb);
  newDb.run('PRAGMA foreign_keys = ON;');
  saveDb();
}

function validateBackupFile(filename) {
  const SQL = getSQL();
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  const stat = fs.statSync(filepath);
  if (stat.size === 0) throw new Error('الملف فارغ / Fichier vide');
  if (stat.size > 100 * 1024 * 1024) throw new Error('الملف كبير جداً / Fichier trop volumineux');
  const buffer = fs.readFileSync(filepath);
  try {
    const testDb = new SQL.Database(buffer);
    const tables = testDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.length > 0 ? tables[0].values.map(v => v[0]) : [];
    if (!tableNames.includes('cases') || !tableNames.includes('clients')) throw new Error('الجداول الأساسية مفقودة');
    const integ = testDb.exec("PRAGMA integrity_check");
    const ok = integ.length > 0 && integ[0].values[0][0] === 'ok';
    testDb.close();
    return { valid: ok, tables: tableNames, tableCount: tableNames.length, size: stat.size, mtime: stat.mtime.toISOString(), filename };
  } catch (e) {
    if (e.message === 'الجداول الأساسية مفقودة') throw e;
    throw new Error('ملف تالف / Fichier corrompu: ' + e.message);
  }
}

function deleteBackupFile(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  fs.unlinkSync(filepath);
  return { ok: true };
}

function restoreFromBackup(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) throw new Error('اسم ملف غير صالح / Nom de fichier invalide');
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) throw new Error('الملف غير موجود / Fichier introuvable');
  const buffer = fs.readFileSync(filepath);
  restoreFromBuffer(buffer);
  return { ok: true, time: new Date().toISOString() };
}

function exportFullArchive() {
  const db = getDb();
  const data = db.export();
  const buffer = Buffer.from(data);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) + '_' + pad(now.getHours()) + '-' + pad(now.getMinutes());
  const filename = 'archive_' + ts + '.db';
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const meta = {
    timestamp: now.toISOString(), version: '2.0',
    stats: { cases: [], clients: [], tasks: [], events: [] }
  };
  return { filename, size: buffer.length, meta };
}

module.exports = {
  getBackupSettings, updateBackupSettings,
  createBackup, listBackups, validateBackupFile, deleteBackupFile,
  restoreFromBackup, restoreFromBuffer, exportFullArchive
};
