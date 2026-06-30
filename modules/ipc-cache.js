var A = window.App = window.App || {};

const CACHE_TTL = 30000;
const MAX_CACHE_SIZE = 200;
const readCache = new Map();
const cacheDeps = {
  'db:getAllCases': ['db:addCase', 'db:deleteCase', 'db:updateCaseStatus', 'db:updateCaseNotes', 'db:archiveCase', 'db:unarchiveCase', 'db:addPaiement', 'db:updateHonorairesTotaux'],
  'db:getAllClients': ['db:addClient', 'db:deleteClient', 'db:updateClientNotes'],
  'db:getAllTasks': ['db:addTask', 'db:deleteTask', 'db:updateTask', 'db:toggleSubtask', 'db:deleteSubtask', 'db:addSubtask'],
  'db:getDashboardStats': ['db:addCase', 'db:deleteCase', 'db:addClient', 'db:deleteClient', 'db:addTask', 'db:addPaiement'],
  'db:getDashboardExtendedStats': ['db:addCase', 'db:deleteCase', 'db:addClient', 'db:deleteClient', 'db:addTask', 'db:addPaiement', 'db:updateTask', 'events:add', 'events:update', 'events:delete', 'db:addProcedure', 'db:uploadDocument', 'db:deleteDocument'],
  'db:getChartData': ['db:addPaiement', 'db:addCase', 'db:deleteCase'],
  'db:getUpcomingDeadlines': ['db:addCase', 'db:addTask', 'db:updateTask'],
  'db:getUpcomingHearings': ['events:add', 'events:update', 'events:delete'],
  'db:getLogs': ['db:addLog'],
  'logger:getLogs': ['logger:log', 'logger:clear'],
  'db:getTodayProcedures': ['db:addProcedure'],
  'db:getAllCommunications': ['db:addCommunication'],
  'db:getDocuments': ['db:uploadDocument', 'db:deleteDocument', 'db:updateDocNotes'],
  'db:getAllDocuments': ['db:uploadDocument', 'db:deleteDocument', 'db:updateDocNotes', 'db:selectAndUpload', 'db:addDocument', 'db:getDocuments'],
  'db:getProcedures': ['db:addProcedure'],
  'db:getPaiements': ['db:addPaiement'],
  'db:getBackupSettings': ['db:updateBackupSettings'],
  'db:getAlertSettings': ['db:updateAlertSettings'],
  'events:getAll': ['events:add', 'events:update', 'events:delete'],
  'auth:getUsers': ['auth:addUser', 'auth:updateUser', 'auth:deleteUser', 'auth:updateProfile'],
};

function invalidateCache(mutationChannel) {
  for (const [key, deps] of Object.entries(cacheDeps)) {
    if (deps.includes(mutationChannel)) { readCache.delete(key); }
  }
}
A.invalidateCache = invalidateCache;

// Evict oldest entry when cache exceeds MAX_CACHE_SIZE
function trimCache() {
  if (readCache.size <= MAX_CACHE_SIZE) return;
  const entries = [...readCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
  const toDelete = entries.slice(0, readCache.size - MAX_CACHE_SIZE);
  toDelete.forEach(([k]) => readCache.delete(k));
}

A.cachedInvoke = async function(channel, ...args) {
  if (!A.state?.ipc) return null;
  const key = channel + '-' + JSON.stringify(args);
  const cached = readCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  try {
    const data = await A.state.ipc.invoke(channel, ...args);
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      readCache.set(key, { data: [], ts: Date.now() });
      return [];
    }
    readCache.set(key, { data, ts: Date.now() });
    trimCache();
    return data;
  } catch (err) {
    A.logError('cachedInvoke:' + channel, err);
    return null;
  }
};

A.mutate = async function(channel, ...args) {
  if (!A.state?.ipc) return null;
  invalidateCache(channel);
  try {
    const result = await A.state.ipc.invoke(channel, ...args);
    if (result && typeof result === 'object' && result.error) return result;
    return result;
  } catch (err) {
    A.logError('mutate:' + channel, err);
    return { ok: false, error: 'حدث خطأ في الاتصال: ' + (err.message || '') };
  }
};

window.cachedInvoke = A.cachedInvoke;
window.mutate = A.mutate;
