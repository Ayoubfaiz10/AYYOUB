const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024;
const MAX_LOG_FILES = 3;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LEVELS = { INFO: 0, WARN: 1, ERROR: 2, CRITICAL: 3 };
const LEVEL_NAMES = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];

function rotateLogs() {
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
      for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
        const oldPath = path.join(LOG_DIR, `app.${i}.log`);
        const newPath = path.join(LOG_DIR, `app.${i + 1}.log`);
        if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
      }
      fs.renameSync(LOG_FILE, path.join(LOG_DIR, 'app.1.log'));
    }
  } catch (e) {
    console.error('Log rotation error:', e);
  }
}

function formatEntry(level, context, message, data) {
  const ts = new Date().toISOString();
  const dataStr = data ? ' ' + JSON.stringify(data) : '';
  return `${ts} [${LEVEL_NAMES[level]}] [${context}] ${message}${dataStr}\n`;
}

function writeToFile(entry) {
  try {
    rotateLogs();
    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch (e) {
    console.error('Log write error:', e);
  }
}

let dbLogFn = null;

function setDbLog(fn) {
  dbLogFn = fn;
}

function log(level, context, message, data) {
  if (level < 0 || level > 3) level = 1;
  const entry = formatEntry(level, context, message, data);
  writeToFile(entry);
  if (dbLogFn && level >= 1) {
    try {
      const action = LEVEL_NAMES[level].toLowerCase();
      const detail = `[${context}] ${String(message).slice(0, 500)}`;
      dbLogFn(action, detail);
    } catch (e) {
      /* best effort */
    }
  }
}

const logger = {
  log: (level, ctx, msg, data) => log(level, ctx, msg, data),
  info: (ctx, msg, data) => log(0, ctx, msg, data),
  warn: (ctx, msg, data) => log(1, ctx, msg, data),
  error: (ctx, msg, data) => log(2, ctx, msg, data),
  critical: (ctx, msg, data) => log(3, ctx, msg, data),
  setDbLog,
  getLogs: (filters = {}) => {
    try {
      const lines = [];
      const files = [LOG_FILE];
      for (let i = 1; i <= MAX_LOG_FILES; i++) {
        const f = path.join(LOG_DIR, `app.${i}.log`);
        if (fs.existsSync(f)) files.push(f);
      }
      for (const f of files) {
        try {
          const content = fs.readFileSync(f, 'utf8');
          content
            .split('\n')
            .filter(Boolean)
            .forEach(line => {
              const match = line.match(/^(\S+) \[(\w+)\] \[([^\]]+)\] (.*)$/);
              if (match) {
                const entry = { timestamp: match[1], level: match[2], context: match[3], message: match[4] };
                if (filters.level && entry.level !== filters.level) return;
                if (filters.context && !entry.context.toLowerCase().includes(filters.context.toLowerCase())) return;
                if (filters.search && !entry.message.toLowerCase().includes(filters.search.toLowerCase())) return;
                lines.push(entry);
              }
            });
        } catch (e) {
          /* skip unreadable */
        }
      }
      const limit = filters.limit || 500;
      const offset = filters.offset || 0;
      lines.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return lines.slice(offset, offset + limit);
    } catch (e) {
      console.error('getLogs error:', e);
      return [];
    }
  },
  exportLogs: (format = 'json') => {
    try {
      const all = logger.getLogs({ limit: 10000 });
      if (format === 'csv') {
        const header = 'timestamp,level,context,message';
        const rows = all.map(e => {
          const msg = `"${(e.message || '').replace(/"/g, '""')}"`;
          return `${e.timestamp},${e.level},${e.context},${msg}`;
        });
        return [header, ...rows].join('\n');
      }
      return JSON.stringify(all, null, 2);
    } catch (e) {
      console.error('exportLogs error:', e);
      return '';
    }
  },
  clearLogs: () => {
    try {
      for (let i = 1; i <= MAX_LOG_FILES; i++) {
        const f = path.join(LOG_DIR, `app.${i}.log`);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
      logger.info('logger', 'Logs cleared manually');
      return true;
    } catch (e) {
      console.error('clearLogs error:', e);
      return false;
    }
  },
  getStats: () => {
    try {
      const stats = { fileSize: 0, totalEntries: 0, logDir: LOG_DIR };
      const files = [LOG_FILE];
      for (let i = 1; i <= MAX_LOG_FILES; i++) {
        const f = path.join(LOG_DIR, `app.${i}.log`);
        if (fs.existsSync(f)) files.push(f);
      }
      for (const f of files) {
        if (fs.existsSync(f)) stats.fileSize += fs.statSync(f).size;
      }
      stats.totalEntries = logger.getLogs({ limit: 10000 }).length;
      return stats;
    } catch (e) {
      return { fileSize: 0, totalEntries: 0 };
    }
  }
};

module.exports = logger;
