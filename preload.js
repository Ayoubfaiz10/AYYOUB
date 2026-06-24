const { contextBridge, ipcRenderer, webUtils } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

const MAX_ARGS_SIZE = 100 * 1024; // 100KB max per invocation

const PUSH_CHANNELS = ['app:navigateToCase', 'app:notification', 'app:updateAvailable'];

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

const VALID_CHANNELS = [
  'auth:boot', 'auth:hasPassword', 'auth:login', 'auth:setPassword', 'auth:hashPassword',
  'auth:getCurrentUser', 'auth:getPermissions', 'auth:getUsers', 'auth:addUser',
  'auth:updateUser', 'auth:deleteUser',
  'db:getAllCases', 'db:addCase', 'db:deleteCase', 'db:getCasesByClient',
  'db:getAllClients', 'db:addClient', 'db:deleteClient', 'db:updateClientNotes',
  'db:getAllTasks', 'db:getTask', 'db:addTask', 'db:updateTask', 'db:deleteTask',
  'db:getSubtasks', 'db:addSubtask', 'db:toggleSubtask', 'db:deleteSubtask',
  'db:getComments', 'db:addComment',
  'db:getAllWorkflows', 'db:addWorkflow', 'db:deleteWorkflow',
  'db:applyWorkflow', 'db:getAllTemplates', 'db:addTemplate', 'db:deleteTemplate',
  'db:applyTemplate', 'db:getTaskAnalytics',
  'db:getDashboardStats', 'db:getDocuments', 'db:getAllDocuments', 'db:uploadDocument',
  'db:globalSearch', 'db:getSearchIndex',
  'db:openDocument', 'db:downloadDocument', 'db:updateDocNotes', 'db:deleteDocument',
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

/* ─── Schema helpers ─── */
function s_string(opts)     { return { type: 'string', ...opts }; }
function s_number(opts)     { return { type: 'number', ...opts }; }
function s_integer(opts)    { return { type: 'number', integer: true, ...opts }; }
function s_boolean(opts)    { return { type: 'boolean', ...opts }; }
function s_array(opts)      { return { type: 'array', ...opts }; }
function s_object(props)    { return { type: 'object', props, strict: true }; }
function s_lax(props)       { return { type: 'object', props, strict: false }; }
function s_opt(spec)        { return { ...spec, optional: true }; }

/* ─── IPC Argument Validation Schemas ───
     strict=true  → rejects unexpected object properties
     strict=false → allows extra properties (for flexibility)  */
const IPC_SCHEMAS = {
  // ───── Auth ─────
  'auth:boot':              { args: [], strict: true },
  'auth:hasPassword':       { args: [], strict: true },
  'auth:login':              { args: [s_object({
    userId:   s_opt(s_number({ nullable: true })),
    password: s_string({ minLength: 1 })
  })], strict: true },
  'auth:setPassword':        { args: [s_string({ minLength: 8, maxLength: 256 })], strict: true },
  'auth:hashPassword':       { args: [s_string({ minLength: 8, maxLength: 256 })], strict: true },
  'auth:logout':             { args: [], strict: true },
  'auth:getCurrentUser':     { args: [], strict: true },
  'auth:getPermissions':     { args: [], strict: true },
  'auth:getUsers':           { args: [], strict: true },
  'auth:addUser':            { args: [s_object({
    name:     s_string({ minLength: 1 }),
    email:    s_opt(s_string()),
    password: s_string({ minLength: 8 }),
    role:     s_opt(s_string())
  })], strict: true },
  'auth:updateUser':         { args: [s_integer({ positive: true }), s_object({
    name:     s_opt(s_string()),
    email:    s_opt(s_string()),
    role:     s_opt(s_string()),
    active:   s_opt(s_number()),
    password: s_opt(s_string({ minLength: 8 }))
  })], strict: true },
  'auth:deleteUser':         { args: [s_integer({ positive: true })], strict: true },

  // ───── DB Cases ─────
  'db:getAllCases':          { args: [], strict: true },
  'db:addCase':              { args: [s_object({
    case_number:  s_string({ minLength: 1 }),
    title:        s_string({ minLength: 1 }),
    client_id:    s_opt(s_integer({ nullable: true })),
    client_name:  s_opt(s_string()),
    court:        s_opt(s_string()),
    status:       s_opt(s_string()),
    description:  s_opt(s_string()),
    next_hearing: s_opt(s_string()),
    total_fees:   s_opt(s_number()),
    paid_fees:    s_opt(s_number()),
    expenses:     s_opt(s_number()),
    deadline_date:s_opt(s_string()),
    priority:     s_opt(s_string()),
    case_type:    s_opt(s_string()),
    created_date: s_opt(s_string())
  })], strict: true },
  'db:deleteCase':           { args: [s_integer({ positive: true })], strict: true },
  'db:getCasesByClient':     { args: [s_integer()], strict: true },

  // ───── DB Clients ─────
  'db:getAllClients':        { args: [], strict: true },
  'db:addClient':            { args: [s_object({
    name:        s_string({ minLength: 1 }),
    phone:       s_opt(s_string()),
    email:       s_opt(s_string()),
    address:     s_opt(s_string()),
    notes:       s_opt(s_string()),
    national_id: s_opt(s_string()),
    tags:        s_opt(s_string())
  })], strict: true },
  'db:deleteClient':         { args: [s_integer({ positive: true })], strict: true },
  'db:updateClientNotes':    { args: [s_object({
    id:          s_integer({ positive: true }),
    name:        s_opt(s_string()),
    phone:       s_opt(s_string()),
    email:       s_opt(s_string()),
    address:     s_opt(s_string()),
    notes:       s_opt(s_string()),
    national_id: s_opt(s_string()),
    tags:        s_opt(s_string()),
    status:      s_opt(s_string())
  })], strict: true },

  // ───── DB Tasks ─────
  'db:getAllTasks':          { args: [s_opt(s_boolean())], strict: true },
  'db:getTask':              { args: [s_opt(s_integer({ nullable: true }))], strict: true },
  'db:addTask':              { args: [s_object({
    title:        s_string({ minLength: 1 }),
    description:  s_opt(s_string()),
    priority:     s_opt(s_string()),
    status:       s_opt(s_string()),
    due_date:     s_opt(s_string({ nullable: true })),
    notes:        s_opt(s_string()),
    case_id:      s_opt(s_integer({ nullable: true })),
    client_id:    s_opt(s_integer({ nullable: true })),
    tags:         s_opt(s_string()),
    assigned_to:  s_opt(s_string()),
    attachments:  s_opt(s_string()),
    parent_id:    s_opt(s_integer({ nullable: true })),
    depends_on:   s_opt(s_string()),
    progress:     s_opt(s_number()),
    time_tracked: s_opt(s_number()),
    workflow_id:  s_opt(s_integer({ nullable: true })),
    template_id:  s_opt(s_integer({ nullable: true }))
  })], strict: true },
  'db:updateTask':           { args: [s_integer(), s_object({
    title:        s_opt(s_string()),
    description:  s_opt(s_string()),
    priority:     s_opt(s_string()),
    status:       s_opt(s_string()),
    due_date:     s_opt(s_string({ nullable: true })),
    notes:        s_opt(s_string()),
    case_id:      s_opt(s_integer({ nullable: true })),
    client_id:    s_opt(s_integer({ nullable: true })),
    tags:         s_opt(s_string()),
    assigned_to:  s_opt(s_string()),
    attachments:  s_opt(s_string()),
    parent_id:    s_opt(s_integer({ nullable: true })),
    depends_on:   s_opt(s_string()),
    progress:     s_opt(s_number()),
    time_tracked: s_opt(s_number()),
    workflow_id:  s_opt(s_integer({ nullable: true })),
    template_id:  s_opt(s_integer({ nullable: true })),
    archived:     s_opt(s_number())
  })], strict: true },
  'db:deleteTask':           { args: [s_integer({ positive: true })], strict: true },

  // ───── DB Subtasks ─────
  'db:getSubtasks':          { args: [s_integer()], strict: true },
  'db:addSubtask':           { args: [s_object({
    task_id: s_integer({ positive: true }),
    title:   s_string({ minLength: 1 })
  })], strict: true },
  'db:toggleSubtask':        { args: [s_integer({ positive: true })], strict: true },
  'db:deleteSubtask':        { args: [s_integer({ positive: true })], strict: true },

  // ───── DB Comments ─────
  'db:getComments':          { args: [s_integer()], strict: true },
  'db:addComment':           { args: [s_object({
    task_id: s_integer({ positive: true }),
    text:    s_string({ minLength: 1 }),
    author:  s_opt(s_string())
  })], strict: true },

  // ───── DB Workflows ─────
  'db:getAllWorkflows':      { args: [], strict: true },
  'db:addWorkflow':          { args: [s_object({
    name:        s_string({ minLength: 1 }),
    description: s_opt(s_string()),
    case_type:   s_opt(s_string()),
    steps:       s_opt(s_array())
  })], strict: true },
  'db:deleteWorkflow':       { args: [s_integer({ positive: true })], strict: true },
  'db:applyWorkflow':        { args: [s_object({
    caseId:     s_integer({ positive: true }),
    workflowId: s_integer({ positive: true })
  })], strict: true },

  // ───── DB Templates ─────
  'db:getAllTemplates':      { args: [], strict: true },
  'db:addTemplate':          { args: [s_object({
    name:        s_string({ minLength: 1 }),
    description: s_opt(s_string()),
    tasks_json:  s_opt(s_string())
  })], strict: true },
  'db:deleteTemplate':       { args: [s_integer({ positive: true })], strict: true },
  'db:applyTemplate':        { args: [s_object({
    caseId:     s_integer({ positive: true }),
    templateId: s_integer({ positive: true })
  })], strict: true },

  // ───── DB Analytics / Dashboard ─────
  'db:getTaskAnalytics':     { args: [], strict: true },
  'db:getDashboardStats':    { args: [], strict: true },

  // ───── DB Documents ─────
  'db:getDocuments':         { args: [s_integer()], strict: true },
  'db:getAllDocuments':      { args: [], strict: true },
  'db:uploadDocument':       { args: [s_object({
    sourcePath: s_string({ minLength: 1 }),
    caseId:    s_integer({ positive: true }),
    docType:   s_opt(s_string())
  })], strict: true },
  'db:selectAndUpload':     { args: [s_object({
    caseId:  s_integer({ positive: true }),
    docType: s_string({ minLength: 1 }),
    tags:    s_opt(s_string())
  })], strict: true },
  'db:globalSearch':         { args: [s_string()], strict: true },
  'db:getSearchIndex':       { args: [], strict: true },
  'db:rebuildSearchIndex':   { args: [], strict: true },
  'db:openDocument':         { args: [s_integer({ positive: true })], strict: true },
  'db:downloadDocument':     { args: [s_integer({ positive: true })], strict: true },
  'db:updateDocNotes':       { args: [s_object({
    id:    s_integer({ positive: true }),
    notes: s_string()
  })], strict: true },
  'db:deleteDocument':       { args: [s_integer({ positive: true })], strict: true },

  // ───── DB Procedures ─────
  'db:getProcedures':        { args: [s_integer()], strict: true },
  'db:addProcedure':         { args: [s_object({
    affaire_id:  s_integer({ positive: true }),
    date:        s_string({ minLength: 1 }),
    type:        s_string({ minLength: 1 }),
    description: s_opt(s_string())
  })], strict: true },

  // ───── DB Paiements ─────
  'db:getPaiements':         { args: [s_integer()], strict: true },
  'db:addPaiement':          { args: [s_object({
    affaire_id:    s_integer({ positive: true }),
    date:          s_string({ minLength: 1 }),
    montant:       s_number(),
    mode_paiement: s_string({ minLength: 1 }),
    remarque:      s_opt(s_string())
  })], strict: true },
  'db:updateHonorairesTotaux': { args: [s_object({
    caseId:  s_integer({ positive: true }),
    montant: s_number()
  })], strict: true },

  // ───── DB Charts / Status ─────
  'db:getChartData':         { args: [], strict: true },
  'db:archiveCase':          { args: [s_integer({ positive: true })], strict: true },
  'db:unarchiveCase':        { args: [s_integer({ positive: true })], strict: true },
  'db:updateCaseStatus':     { args: [s_object({
    id:     s_integer({ positive: true }),
    status: s_string({ enum: ['active', 'pending', 'closed'] })
  })], strict: true },
  'db:updateCaseNotes':      { args: [s_object({
    id:    s_integer({ positive: true }),
    notes: s_string()
  })], strict: true },
  'db:getArchivedCases':     { args: [], strict: true },

  // ───── DB Communications ─────
  'db:addCommunication':     { args: [s_object({
    client_id: s_opt(s_integer({ nullable: true })),
    case_id:   s_opt(s_integer({ nullable: true })),
    type:      s_string({ minLength: 1 }),
    date:      s_string({ minLength: 1 }),
    summary:   s_opt(s_string({ nullable: true }))
  })], strict: true },
  'db:getClientCommunications': { args: [s_integer()], strict: true },

  // ───── DB Misc ─────
  'db:getTodayProcedures':    { args: [], strict: true },
  'db:getAlertSettings':      { args: [], strict: true },
  'db:updateAlertSettings':   { args: [s_object({
    days_before_1: s_number(),
    days_before_2: s_number(),
    days_before_3: s_number(),
    enabled:       s_number()
  })], strict: true },
  'db:getUpcomingDeadlines':  { args: [], strict: true },
  'db:getUpcomingHearings':   { args: [], strict: true },
  'db:getBackupSettings':     { args: [], strict: true },
  'db:updateBackupSettings':  { args: [s_object({
    auto_enabled:    s_number(),
    frequency_hours: s_number(),
    keep_count:      s_number()
  })], strict: true },
  'db:createBackup':          { args: [], strict: true },
  'db:listBackups':           { args: [], strict: true },
  'db:validateBackup':        { args: [s_string({ minLength: 1, pattern: /^[^\\\/]+$/ })], strict: true },
  'db:restoreBackup':         { args: [s_string({ minLength: 1, pattern: /^[^\\\/]+$/ })], strict: true },
  'db:deleteBackup':          { args: [s_string({ minLength: 1, pattern: /^[^\\\/]+$/ })], strict: true },
  'db:exportArchive':         { args: [], strict: true },
  'db:getLogs':               { args: [s_opt(s_lax({
    search:   s_opt(s_string()),
    action:   s_opt(s_string()),
    dateFrom: s_opt(s_string()),
    dateTo:   s_opt(s_string()),
    limit:    s_opt(s_number()),
    offset:   s_opt(s_number())
  }))], strict: true },
  'db:addLog':                { args: [s_string({ minLength: 1 }), s_string()], strict: true },
  'db:integrityCheck':        { args: [], strict: true },
  'db:repairOrphans':         { args: [], strict: true },
  'db:cleanOrphanedFiles':   { args: [], strict: true },

  // ───── Events ─────
  'events:getAll':            { args: [], strict: true },
  'events:get':               { args: [s_integer()], strict: true },
  'events:add':               { args: [s_object({
    case_id:    s_opt(s_integer({ nullable: true })),
    client_id:  s_opt(s_integer({ nullable: true })),
    title:      s_string({ minLength: 1 }),
    type:       s_opt(s_string()),
    status:     s_opt(s_string()),
    date:       s_string({ minLength: 1 }),
    time:       s_opt(s_string({ nullable: true })),
    end_time:   s_opt(s_string({ nullable: true })),
    court:      s_opt(s_string({ nullable: true })),
    judge:      s_opt(s_string({ nullable: true })),
    room:       s_opt(s_string({ nullable: true })),
    notes:      s_opt(s_string({ nullable: true })),
    outcome:    s_opt(s_string({ nullable: true })),
    urgency:    s_opt(s_string()),
    recurring_type: s_opt(s_string()),
    recurring_end_date: s_opt(s_string({ nullable: true })),
    all_day:    s_opt(s_number())
  })], strict: true },
  'events:update':            { args: [s_integer(), s_object({
    case_id:    s_opt(s_integer({ nullable: true })),
    client_id:  s_opt(s_integer({ nullable: true })),
    title:      s_opt(s_string()),
    type:       s_opt(s_string()),
    status:     s_opt(s_string()),
    date:       s_opt(s_string()),
    time:       s_opt(s_string({ nullable: true })),
    end_time:   s_opt(s_string({ nullable: true })),
    court:      s_opt(s_string({ nullable: true })),
    judge:      s_opt(s_string({ nullable: true })),
    room:       s_opt(s_string({ nullable: true })),
    notes:      s_opt(s_string({ nullable: true })),
    outcome:    s_opt(s_string({ nullable: true })),
    urgency:    s_opt(s_string()),
    recurring_type: s_opt(s_string()),
    recurring_end_date: s_opt(s_string({ nullable: true })),
    all_day:    s_opt(s_number()),
    alert_sent_7d: s_opt(s_number()),
    alert_sent_3d: s_opt(s_number()),
    alert_sent_1d: s_opt(s_number())
  })], strict: true },
  'events:delete':            { args: [s_integer({ positive: true })], strict: true },

  // ───── Notifications ─────
  'notif:getCacheStats':      { args: [], strict: true },

  // ───── Logger ─────
  'logger:log':               { args: [
    s_string({ enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] }),
    s_string({ maxLength: 500 }),
    s_string({ maxLength: 5000 })
  ], strict: true },
  'logger:getLogs':           { args: [s_opt(s_lax({
    level:   s_opt(s_string()),
    context: s_opt(s_string()),
    search:  s_opt(s_string()),
    limit:   s_opt(s_number()),
    offset:  s_opt(s_number())
  }))], strict: true },
  'logger:export':            { args: [s_opt(s_string({ enum: ['json', 'csv'] }))], strict: true },
  'logger:clear':             { args: [], strict: true },
  'logger:stats':             { args: [], strict: true },

  // ───── AI ─────
  'ai:ask':                   { args: [s_object({
    mode:    s_string({ minLength: 1 }),
    message: s_string({ minLength: 1 }),
    context: s_opt(s_string())
  })], strict: true },
  'ai:askContextual':         { args: [s_object({
    mode:        s_string({ minLength: 1 }),
    message:     s_string({ minLength: 1 }),
    contextType: s_string({ minLength: 1 }),
    contextId:   s_number()
  })], strict: true },
  'ai:getSmartInsights':      { args: [], strict: true },
  'ai:generateTimeline':      { args: [s_object({
    caseId: s_integer({ positive: true })
  })], strict: true },
  'ai:summarizeDocument':     { args: [s_object({
    docId: s_integer({ positive: true })
  })], strict: true },
  'ai:detectRisks':           { args: [s_object({
    caseId: s_integer({ positive: true })
  })], strict: true },
  'ai:getConfig':             { args: [], strict: true },
  'ai:saveConfig':            { args: [s_object({
    apiKey:   s_string({ minLength: 1 }),
    provider: s_string({ minLength: 1 }),
    model:    s_string()
  })], strict: true },
  'ai:analyzeDocument':       { args: [s_object({
    docId: s_integer({ positive: true })
  })], strict: true },

  // ───── App ─────
  'app:navigateToCase':       { args: [s_opt(s_integer({ nullable: true }))], strict: true },
  'app:checkMasterKey':       { args: [], strict: true }
};

/* ─── Schema validator ─── */
function validateValue(value, spec, path) {
  if (value === null || value === undefined) {
    if (value === null && spec.nullable) return { valid: true };
    if (spec.optional) return { valid: true };
    return { valid: false, error: path + ' مطلوب' };
  }
  switch (spec.type) {
    case 'string':
      if (typeof value !== 'string') return { valid: false, error: path + ' يجب أن يكون نصاً' };
      if (spec.minLength !== undefined && value.length < spec.minLength) return { valid: false, error: path + ' قصير جداً' };
      if (spec.maxLength !== undefined && value.length > spec.maxLength) return { valid: false, error: path + ' طويل جداً' };
      if (spec.pattern && !spec.pattern.test(value)) return { valid: false, error: path + ' تنسيق غير صالح' };
      if (spec.enum && !spec.enum.includes(value)) return { valid: false, error: path + ' قيمة غير صالحة' };
      return { valid: true };
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return { valid: false, error: path + ' يجب أن يكون رقماً' };
      if (spec.integer && !Number.isInteger(value)) return { valid: false, error: path + ' يجب أن يكون عدداً صحيحاً' };
      if (spec.positive && value <= 0) return { valid: false, error: path + ' يجب أن يكون موجباً' };
      return { valid: true };
    case 'boolean':
      if (typeof value !== 'boolean') return { valid: false, error: path + ' يجب أن يكون منطقياً' };
      return { valid: true };
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return { valid: false, error: path + ' يجب أن يكون كائناً' };
      if (spec.props) {
        if (spec.strict !== false) {
          const allowed = new Set(Object.keys(spec.props));
          for (const key of Object.keys(value)) {
            if (!allowed.has(key)) return { valid: false, error: path + ' يحتوي على خاصية غير متوقعة: ' + key };
          }
        }
        for (const [key, propSpec] of Object.entries(spec.props)) {
          if (key in value) {
            const result = validateValue(value[key], propSpec, path + '.' + key);
            if (!result.valid) return result;
          } else if (!propSpec.optional && !propSpec.nullable) {
            return { valid: false, error: path + '.' + key + ' مطلوب' };
          }
        }
      }
      return { valid: true };
    case 'array':
      if (!Array.isArray(value)) return { valid: false, error: path + ' يجب أن يكون مصفوفة' };
      return { valid: true };
    default:
      return { valid: true };
  }
}

function validateArgs(channel, args) {
  const schema = IPC_SCHEMAS[channel];
  if (!schema) return { valid: true }; // let main process handle unknown channels

  const expected = schema.args || [];
  const minLen = expected.filter(s => !s.optional).length;

  if (args.length < minLen) return { valid: false, error: 'عدد الوسائط غير كافٍ لـ ' + channel };
  if (schema.strict && args.length > expected.length) return { valid: false, error: 'عدد وسائط زائد لـ ' + channel };

  for (let i = 0; i < expected.length; i++) {
    if (i < args.length) {
      const result = validateValue(args[i], expected[i], 'arg[' + i + ']');
      if (!result.valid) return result;
    }
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
