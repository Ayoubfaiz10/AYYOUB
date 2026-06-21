const { initDb, saveDb, STORAGE_DIR } = require('./connection');
const utils = require('./utils');
const clients = require('./clients');
const tasks = require('./tasks');
const events = require('./events');
const documents = require('./documents');
const users = require('./users');
const backup = require('./backup');
const payments = require('./payments');
const procedures = require('./procedures');

module.exports = {
  // connection
  initDb, saveDb, STORAGE_DIR,

  // utils
  addCase: utils.addCase,
  getAllCases: utils.getAllCases,
  deleteCase: utils.deleteCase,
  validateRef: utils.validateRef,
  transaction: utils.transaction,
  addLog: utils.addLog,
  archiveCase: utils.archiveCase,
  unarchiveCase: utils.unarchiveCase,
  autoArchive: utils.autoArchive,
  updateCaseStatus: utils.updateCaseStatus,
  updateCaseNotes: utils.updateCaseNotes,
  getChartData: utils.getChartData,
  getDashboardStats: utils.getDashboardStats,
  integrityCheck: utils.integrityCheck,
  repairOrphans: utils.repairOrphans,
  globalSearch: utils.globalSearch,
  getSearchIndex: utils.getSearchIndex,
  getLogs: utils.getLogs,
  getAlertSettings: utils.getAlertSettings,
  updateAlertSettings: utils.updateAlertSettings,
  addCommunication: utils.addCommunication,
  getClientCommunications: utils.getClientCommunications,

  // clients
  getAllClients: clients.getAllClients,
  addClient: clients.addClient,
  deleteClient: clients.deleteClient,
  updateClient: clients.updateClient,
  getCasesByClient: clients.getCasesByClient,

  // tasks
  getAllTasks: tasks.getAllTasks,
  getTask: tasks.getTask,
  addTask: tasks.addTask,
  updateTask: tasks.updateTask,
  deleteTask: tasks.deleteTask,
  getSubtasks: tasks.getSubtasks,
  addSubtask: tasks.addSubtask,
  toggleSubtask: tasks.toggleSubtask,
  deleteSubtask: tasks.deleteSubtask,
  getComments: tasks.getComments,
  addComment: tasks.addComment,
  getAllWorkflows: tasks.getAllWorkflows,
  getWorkflow: tasks.getWorkflow,
  addWorkflow: tasks.addWorkflow,
  deleteWorkflow: tasks.deleteWorkflow,
  applyWorkflow: tasks.applyWorkflow,
  getAllTemplates: tasks.getAllTemplates,
  addTemplate: tasks.addTemplate,
  applyTemplate: tasks.applyTemplate,
  getTaskAnalytics: tasks.getTaskAnalytics,

  // events
  getAllEvents: events.getAllEvents,
  getEvent: events.getEvent,
  addEvent: events.addEvent,
  updateEvent: events.updateEvent,
  deleteEvent: events.deleteEvent,
  getEventsByCase: events.getEventsByCase,
  getUpcomingDeadlines: events.getUpcomingDeadlines,
  getUpcomingHearings: events.getUpcomingHearings,
  getTodayProcedures: events.getTodayProcedures,

  // documents
  getDocuments: documents.getDocuments,
  addDocument: documents.addDocument,
  getDocument: documents.getDocument,
  updateDocument: documents.updateDocument,
  addDocumentText: documents.addDocumentText,
  getDocumentText: documents.getDocumentText,

  // users
  getUsers: users.getUsers,
  addUser: users.addUser,
  updateUser: users.updateUser,
  deleteUser: users.deleteUser,

  // backup
  getBackupSettings: backup.getBackupSettings,
  updateBackupSettings: backup.updateBackupSettings,
  createBackup: backup.createBackup,
  listBackups: backup.listBackups,
  validateBackupFile: backup.validateBackupFile,
  deleteBackupFile: backup.deleteBackupFile,
  restoreFromBackup: backup.restoreFromBackup,
  exportFullArchive: backup.exportFullArchive,

  // payments
  getPaiements: payments.getPaiements,
  addPaiement: payments.addPaiement,

  // procedures
  getProcedures: procedures.getProcedures,
  addProcedure: procedures.addProcedure
};
