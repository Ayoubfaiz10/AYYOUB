const { contextBridge, ipcRenderer, webUtils } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

const MAX_ARGS_SIZE = 100 * 1024; // 100KB max per invocation

const PUSH_CHANNELS = ['app:navigateToCase', 'app:notification', 'app:updateAvailable'];

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

const VALID_CHANNELS = [
  'auth:boot', 'auth:hasPassword', 'auth:login', 'auth:setPassword', 'auth:hashPassword',
  'auth:setCurrentUser', 'auth:getCurrentUser', 'auth:getPermissions', 'auth:getUsers', 'auth:addUser',
  'auth:updateUser', 'auth:deleteUser',
  'db:getAllCases', 'db:addCase', 'db:deleteCase', 'db:getCasesByClient',
  'db:getAllClients', 'db:addClient', 'db:deleteClient', 'db:updateClientNotes',
  'db:getAllTasks', 'db:getTask', 'db:addTask', 'db:updateTask', 'db:deleteTask',
  'db:getSubtasks', 'db:addSubtask', 'db:toggleSubtask', 'db:deleteSubtask',
  'db:getComments', 'db:addComment',
  'db:getAllWorkflows', 'db:addWorkflow', 'db:deleteWorkflow',
  'db:applyWorkflow', 'db:getAllTemplates', 'db:addTemplate', 'db:deleteTemplate',
  'db:applyTemplate', 'db:getTaskAnalytics',
  'db:getDashboardStats',   'db:getDocuments', 'db:uploadDocument',
  'db:globalSearch', 'db:getSearchIndex',
  'db:openDocument', 'db:updateDocNotes', 'db:deleteDocument',
  'db:getProcedures', 'db:addProcedure',
  'db:getPaiements', 'db:addPaiement', 'db:updateHonorairesTotaux',
  'db:getChartData', 'db:archiveCase', 'db:unarchiveCase', 'db:updateCaseStatus',
  'db:updateCaseNotes', 'db:getArchivedCases',
  'db:addCommunication', 'db:getClientCommunications',
  'db:selectAndUpload',
  'db:getTodayProcedures',
  'db:getAlertSettings', 'db:updateAlertSettings',
  'db:getUpcomingDeadlines', 'db:getUpcomingHearings',
  'db:getBackupSettings', 'db:updateBackupSettings',
  'db:createBackup', 'db:listBackups', 'db:validateBackup', 'db:restoreBackup', 'db:deleteBackup', 'db:exportArchive',
  'db:getLogs', 'db:addLog', 'db:integrityCheck', 'db:repairOrphans',
  'db:cleanOrphanedFiles', 'db:rebuildSearchIndex',
  'events:getAll', 'events:get', 'events:add', 'events:update', 'events:delete',
  'notif:getCacheStats',
  'logger:log', 'logger:getLogs', 'logger:export', 'logger:clear', 'logger:stats',
  'ai:ask', 'ai:askContextual', 'ai:getSmartInsights',
  'ai:generateTimeline', 'ai:summarizeDocument', 'ai:detectRisks',
  'ai:getConfig', 'ai:saveConfig', 'ai:analyzeDocument',
  'app:navigateToCase',
  'app:checkMasterKey'
];

function validateArgs(channel, args) {
  const rules = {
    'db:addCase': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (!data.case_number || !data.title) return { valid: false, error: 'case_number and title are required' };
      return { valid: true };
    },
    'db:addClient': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (!data.name) return { valid: false, error: 'name is required' };
      return { valid: true };
    },
    'db:addTask': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (!data.title) return { valid: false, error: 'title is required' };
      return { valid: true };
    },
    'auth:addUser': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (!data.name || !data.email) return { valid: false, error: 'name and email are required' };
      return { valid: true };
    },
    'db:deleteCase': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteClient': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:archiveCase': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:unarchiveCase': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:updateCaseStatus': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (typeof data.id !== 'number') return { valid: false, error: 'id must be a number' };
      if (!['active', 'pending', 'closed'].includes(data.status)) return { valid: false, error: 'Invalid status' };
      return { valid: true };
    },
    'db:getTask': (args) => {
      if (typeof args[0] !== 'number' && typeof args[0] !== 'undefined') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteTask': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:getDocuments': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'caseId must be a number' };
      return { valid: true };
    },
    'auth:deleteUser': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteDocument': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteWorkflow': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteTemplate': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:deleteSubtask': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'events:delete': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'id must be a number' };
      return { valid: true };
    },
    'db:uploadDocument': (args) => {
      if (!args[0] || typeof args[0] !== 'object') return { valid: false, error: 'Data must be an object' };
      if (typeof args[0].caseId !== 'number') return { valid: false, error: 'caseId must be a number' };
      if (!args[0].filename || typeof args[0].filename !== 'string') return { valid: false, error: 'filename is required' };
      return { valid: true };
    },
    'db:validateBackup': (args) => {
      if (typeof args[0] !== 'string') return { valid: false, error: 'filename must be a string' };
      if (args[0].includes('..')) return { valid: false, error: 'invalid filename' };
      return { valid: true };
    },
    'db:restoreBackup': (args) => {
      if (typeof args[0] !== 'string') return { valid: false, error: 'filename must be a string' };
      if (args[0].includes('..')) return { valid: false, error: 'invalid filename' };
      return { valid: true };
    },
    'db:deleteBackup': (args) => {
      if (typeof args[0] !== 'string') return { valid: false, error: 'filename must be a string' };
      if (args[0].includes('..')) return { valid: false, error: 'invalid filename' };
      return { valid: true };
    },
    'db:openDocument': (args) => {
      if (typeof args[0] !== 'number') return { valid: false, error: 'docId must be a number' };
      return { valid: true };
    },
    'ai:analyzeDocument': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (typeof data.docId !== 'number') return { valid: false, error: 'docId must be a number' };
      return { valid: true };
    },
    'db:cleanOrphanedFiles': (args) => {
      if (args.length > 0) return { valid: false, error: 'No arguments expected' };
      return { valid: true };
    },
    'db:rebuildSearchIndex': (args) => {
      if (args.length > 0) return { valid: false, error: 'No arguments expected' };
      return { valid: true };
    },
    'db:updateHonorairesTotaux': (args) => {
      const data = args[0];
      if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
      if (typeof data.caseId !== 'number') return { valid: false, error: 'caseId must be a number' };
      if (typeof data.montant !== 'number') return { valid: false, error: 'montant must be a number' };
      return { valid: true };
    }
  };

  if (rules[channel]) {
    return rules[channel](args);
  }
  return { valid: true };
}

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, ...args) => {
    if (!VALID_CHANNELS.includes(channel)) {
      if (isDev) {
        const matching = VALID_CHANNELS.filter(c => channel.startsWith(c.split(':')[0] + ':'));
        console.warn('Invalid IPC channel blocked:', channel, matching.length ? '- similar: ' + matching.slice(0, 3).join(', ') : '');
      }
      return Promise.reject(new Error(isDev ? 'Invalid channel: ' + channel : 'Invalid channel'));
    }

    const argsSize = JSON.stringify(args).length;
    if (argsSize > MAX_ARGS_SIZE) {
      if (isDev) console.warn('Arguments too large for channel:', channel, argsSize);
      return Promise.reject(new Error('Arguments too large'));
    }

    const now = Date.now();
    const windowKey = Math.floor(now / RATE_LIMIT_WINDOW);
    const key = channel + '-' + windowKey;
    if (!rateLimits.has(key)) {
      rateLimits.set(key, 0);
      setTimeout(() => rateLimits.delete(key), RATE_LIMIT_WINDOW);
    }
    const count = rateLimits.get(key) + 1;
    rateLimits.set(key, count);
    if (count > MAX_REQUESTS_PER_WINDOW) {
      if (isDev) console.warn('Rate limit exceeded for channel:', channel);
      return Promise.reject(new Error('Too many requests'));
    }

    const validation = validateArgs(channel, args);
    if (!validation.valid) {
      if (isDev) console.warn('Invalid arguments for channel:', channel, validation.error);
      return Promise.reject(new Error(isDev ? 'Invalid arguments: ' + validation.error : 'Invalid arguments'));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, callback) => {
    if (!PUSH_CHANNELS.includes(channel)) return () => {};
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  send: () => {}
});

contextBridge.exposeInMainWorld('electron', {
  webUtils: {
    getPathForFile: (file) => {
      if (!file || typeof file !== 'object' || !file.name || !file.size) {
        throw new Error('Invalid file object');
      }
      try {
        return webUtils.getPathForFile(file);
      } catch (e) {
        console.error('Error getting file path:', e);
        throw new Error('Unable to get file path');
      }
    }
  }
});
