var A = window.App = window.App || {};

A.i18n = {
  // ─── App ───
  appName: { ar: 'مدير مكتب المحامي', fr: 'Cabinet Manager' },
  appSub: { ar: 'Cabinet Manager v2.0', fr: 'Cabinet Manager v2.0' },
  startupName: { ar: 'مدير المكتب', fr: 'Cabinet Manager' },
  startupSub: { ar: 'Cabinet Manager — منصة إدارة المكاتب القانونية', fr: 'Cabinet Manager — Plateforme de gestion juridique' },

  // ─── Onboarding ───
  onbTitle: { ar: 'مرحباً بك في مدير المكتب', fr: 'Bienvenue dans Cabinet Manager' },
  onbDesc: { ar: 'منصة إدارة المكاتب القانونية — نظّم قضاياك، موكليك، وثائقك، وجلساتك في مكان واحد.', fr: 'Plateforme de gestion juridique — organisez vos dossiers, clients, documents et audiences en un seul endroit.' },
  onbSkip: { ar: 'تخطي', fr: 'Passer' },
  onbNext: { ar: 'التالي', fr: 'Suivant' },

  // ─── Login ───
  selectUser: { ar: 'اختر المستخدم...', fr: 'Choisir un utilisateur...' },
  passwordPlaceholder: { ar: 'كلمة السر', fr: 'Mot de passe' },
  loginBtn: { ar: 'دخول', fr: 'Connexion' },
  loginError: { ar: 'كلمة السر خطأ أو صلاحية منتهية', fr: 'Mot de passe incorrect ou autorisation expirée' },
  setupPwdLink: { ar: 'إعداد كلمة سر المدير', fr: 'Configurer le mot de passe' },
  newPwdPlaceholder: { ar: 'كلمة سر جديدة', fr: 'Nouveau mot de passe' },
  confirmPwdPlaceholder: { ar: 'تأكيد كلمة السر', fr: 'Confirmer le mot de passe' },
  saveBtn: { ar: 'حفظ', fr: 'Enregistrer' },
  adminNameLabel: { ar: 'اسم المدير', fr: 'Nom de l\'administrateur' },
  adminEmailLabel: { ar: 'البريد الإلكتروني', fr: 'Email' },
  createAdminBtn: { ar: 'إنشاء حساب المدير', fr: 'Créer le compte administrateur' },

  // ─── Navigation ───
  navMain: { ar: 'الرئيسية', fr: 'Principal' },
  navDashboard: { ar: 'الرئيسية', fr: 'Tableau de bord' },
  navAdvancedSearch: { ar: 'بحث متقدم', fr: 'Recherche avancée' },
  navNotifications: { ar: 'الإشعارات', fr: 'Notifications' },
  navFiles: { ar: 'الملفات', fr: 'Dossiers' },
  navClients: { ar: 'الموكلين', fr: 'Clients' },
  navCases: { ar: 'القضايا', fr: 'Affaires' },
  navHearings: { ar: 'الجلسات', fr: 'Audiences' },
  navDocuments: { ar: 'الوثائق', fr: 'Documents' },
  navOrganization: { ar: 'التنظيم', fr: 'Organisation' },
  navCalendar: { ar: 'التقويم', fr: 'Calendrier' },
  navTasks: { ar: 'المهام', fr: 'Tâches' },
  navExpenses: { ar: 'المصاريف', fr: 'Dépenses' },
  navOther: { ar: 'أخرى', fr: 'Autres' },
  navReports: { ar: 'التقارير', fr: 'Rapports' },
  navAI: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  navArchive: { ar: 'الأرشيف', fr: 'Archive' },
  navSupport: { ar: 'الدعم', fr: 'Support' },
  navSettings: { ar: 'الإعدادات', fr: 'Paramètres' },
  navLock: { ar: 'قفل', fr: 'Verrouiller' },

  // ─── Topbar ───
  searchPlaceholder: { ar: 'بحث في القضايا، الموكلين، الوثائق...', fr: 'Rechercher affaires, clients, documents...' },
  quickAdd: { ar: 'إضافة سريعة', fr: 'Ajout rapide' },
  notifTitle: { ar: 'الإشعارات', fr: 'Notifications' },
  autoSaveStatus: { ar: 'تم الحفظ', fr: 'Enregistré' },

  // ─── Dashboard ───
  dashEmptyTitle: { ar: 'مرحباً بك في مدير المكتب', fr: 'Bienvenue dans Cabinet Manager' },
  dashEmptyDesc: { ar: 'ابدأ بإضافة موكل أو قضية جديدة للبدء', fr: 'Commencez par ajouter un client ou une nouvelle affaire' },
  dashAddClient: { ar: 'إضافة موكل', fr: 'Ajouter un client' },
  dashAddCase: { ar: 'إضافة قضية', fr: 'Ajouter une affaire' },
  dashNewClient: { ar: 'موكل جديد', fr: 'Nouveau client' },
  dashNewCase: { ar: 'قضية جديدة', fr: 'Nouvelle affaire' },
  dashNewHearing: { ar: 'جلسة جديدة', fr: 'Nouvelle audience' },
  dashNewDoc: { ar: 'وثيقة جديدة', fr: 'Nouveau document' },
  dashNewTask: { ar: 'مهمة جديدة', fr: 'Nouvelle tâche' },
  dashReport: { ar: 'تقرير', fr: 'Rapport' },
  dashAIBtn: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  dashActiveCases: { ar: 'قضايا نشطة', fr: 'Affaires actives' },
  dashTodayHearings: { ar: 'جلسات اليوم', fr: 'Audiences du jour' },
  dashPendingTasks: { ar: 'مهام معلقة', fr: 'Tâches en attente' },
  dashClients: { ar: 'الموكلين', fr: 'Clients' },
  dashRevenue: { ar: 'الإيرادات', fr: 'Revenus' },
  dashDocs: { ar: 'الوثائق', fr: 'Documents' },
  dashCaseStatus: { ar: 'توزيع القضايا حسب الحالة', fr: 'Répartition des affaires par statut' },
  dashFinancial: { ar: 'الأداء المالي', fr: 'Performance financière' },
  dashTasksPriority: { ar: 'المهام حسب الأولوية', fr: 'Tâches par priorité' },
  dashTodayAgenda: { ar: 'جدول اليوم', fr: 'Agenda du jour' },
  dashViewAll: { ar: 'عرض الكل', fr: 'Voir tout' },
  dashNoEvents: { ar: 'لا توجد أحداث اليوم', fr: 'Aucun événement aujourd\'hui' },

  // ─── Clients ───
  clientsTitle: { ar: 'الموكلين', fr: 'Clients' },
  clientsSub: { ar: 'إدارة الموكلين والجهات المتعاقدة', fr: 'Gérer les clients et les parties contractantes' },
  addClientBtn: { ar: 'إضافة موكل', fr: 'Ajouter un client' },
  clientName: { ar: 'الاسم', fr: 'Nom' },
  clientPhone: { ar: 'الهاتف', fr: 'Téléphone' },
  clientEmail: { ar: 'البريد', fr: 'Email' },
  clientActions: { ar: 'الإجراءات', fr: 'Actions' },

  // ─── Cases ───
  casesTitle: { ar: 'القضايا', fr: 'Affaires' },
  casesSub: { ar: 'إدارة القضايا و الملفات', fr: 'Gérer les affaires et dossiers' },
  addCaseBtn: { ar: 'إضافة قضية', fr: 'Ajouter une affaire' },
  caseNumber: { ar: 'رقم القضية', fr: 'N° d\'affaire' },
  caseClient: { ar: 'الموكل', fr: 'Client' },
  caseStatus: { ar: 'الحالة', fr: 'Statut' },
  caseDate: { ar: 'التاريخ', fr: 'Date' },
  caseActive: { ar: 'نشطة', fr: 'Active' },
  caseClosed: { ar: 'مغلقة', fr: 'Clôturée' },
  caseArchived: { ar: 'مؤرشفة', fr: 'Archivée' },
  casePending: { ar: 'معلقة', fr: 'En attente' },
  caseWon: { ar: 'مكسبة', fr: 'Gagnée' },
  caseLost: { ar: 'خاسرة', fr: 'Perdue' },

  // ─── Case Workspace ───
  caseOverview: { ar: 'نظرة عامة', fr: 'Aperçu' },
  caseTimeline: { ar: 'النشاطات', fr: 'Activités' },
  caseDocs: { ar: 'الوثائق', fr: 'Documents' },
  caseHearingsTab: { ar: 'الجلسات', fr: 'Audiences' },
  caseTasksTab: { ar: 'المهام', fr: 'Tâches' },
  caseNotes: { ar: 'الملاحظات', fr: 'Notes' },
  caseExpensesTab: { ar: 'المصاريف', fr: 'Dépenses' },
  caseContacts: { ar: 'جهات الاتصال', fr: 'Contacts' },
  caseAnalytics: { ar: 'تحليلات', fr: 'Analyses' },
  caseAITab: { ar: 'AI', fr: 'IA' },
  archiveBtn: { ar: 'أرشفة', fr: 'Archiver' },
  editBtn: { ar: 'تعديل', fr: 'Modifier' },
  aiBtn: { ar: 'AI', fr: 'IA' },

  // ─── Buttons & Actions ───
  add: { ar: 'إضافة', fr: 'Ajouter' },
  edit: { ar: 'تعديل', fr: 'Modifier' },
  delete: { ar: 'حذف', fr: 'Supprimer' },
  save: { ar: 'حفظ', fr: 'Enregistrer' },
  cancel: { ar: 'إلغاء', fr: 'Annuler' },
  close: { ar: 'إغلاق', fr: 'Fermer' },
  search: { ar: 'بحث', fr: 'Rechercher' },
  open: { ar: 'فتح', fr: 'Ouvrir' },
  download: { ar: 'تحميل', fr: 'Télécharger' },
  upload: { ar: 'رفع', fr: 'Téléverser' },
  view: { ar: 'عرض', fr: 'Voir' },
  filter: { ar: 'تصفية', fr: 'Filtrer' },
  refresh: { ar: 'تحديث', fr: 'Actualiser' },
  export: { ar: 'تصدير', fr: 'Exporter' },
  print: { ar: 'طباعة', fr: 'Imprimer' },
  confirm: { ar: 'تأكيد', fr: 'Confirmer' },
  yes: { ar: 'نعم', fr: 'Oui' },
  no: { ar: 'لا', fr: 'Non' },

  // ─── Settings ───
  settingsTitle: { ar: 'الإعدادات', fr: 'Paramètres' },
  settingsSub: { ar: 'إعدادات البرنامج والنسخ الاحتياطي', fr: 'Configuration et sauvegardes' },
  settingsGeneral: { ar: 'عام', fr: 'Général' },
  settingsSecurity: { ar: 'الأمان', fr: 'Sécurité' },
  settingsActivity: { ar: 'النشاط', fr: 'Activité' },
  settingsUsers: { ar: 'المستخدمين', fr: 'Utilisateurs' },
  settingsBackup: { ar: 'النسخ الاحتياطي', fr: 'Sauvegarde' },
  settingsAlerts: { ar: 'التنبيهات', fr: 'Alertes' },
  settingsLogs: { ar: 'السجلات', fr: 'Journaux' },
  settingsMaintenance: { ar: 'الصيانة', fr: 'Maintenance' },
  settingsLanguage: { ar: 'اللغة', fr: 'Langue' },
  settingsArabic: { ar: 'العربية', fr: 'Arabe' },
  settingsFrench: { ar: 'الفرنسية', fr: 'Français' },
  settingsAppearance: { ar: 'المظهر', fr: 'Apparence' },
  changePwd: { ar: 'تغيير كلمة السر', fr: 'Changer le mot de passe' },
  currentPwd: { ar: 'كلمة السر الحالية', fr: 'Mot de passe actuel' },
  newPwd: { ar: 'كلمة السر الجديدة', fr: 'Nouveau mot de passe' },
  confirmPwd: { ar: 'تأكيد كلمة السر', fr: 'Confirmer le mot de passe' },
  cleanOrphans: { ar: 'تنظيف الملفات الزائدة', fr: 'Nettoyer les fichiers orphelins' },
  cleanRunning: { ar: 'جاري التنظيف...', fr: 'Nettoyage en cours...' },
  createBackup: { ar: 'إنشاء نسخة احتياطية', fr: 'Créer une sauvegarde' },
  noBackups: { ar: 'لا توجد نسخ احتياطية', fr: 'Aucune sauvegarde' },
  loadMore: { ar: 'تحميل المزيد', fr: 'Charger plus' },

  // ─── Documents ───
  docsTitle: { ar: 'الوثائق', fr: 'Documents' },
  docsSub: { ar: 'إدارة ورفع الوثائق والمستندات', fr: 'Gérer et téléverser les documents' },
  uploadDoc: { ar: 'رفع وثيقة', fr: 'Téléverser un document' },
  docAnalyze: { ar: 'تحليل بالذكاء الاصطناعي', fr: 'Analyser avec IA' },
  docNoDocs: { ar: 'لا توجد وثائق', fr: 'Aucun document' },

  // ─── Calendar ───
  calendarTitle: { ar: 'التقويم', fr: 'Calendrier' },
  calendarSub: { ar: 'عرض الجلسات والمواعيد', fr: 'Voir les audiences et rendez-vous' },

  // ─── Tasks ───
  tasksTitle: { ar: 'المهام', fr: 'Tâches' },
  tasksSub: { ar: 'إدارة المهام ومتابعتها', fr: 'Gérer et suivre les tâches' },
  addTask: { ar: 'إضافة مهمة', fr: 'Ajouter une tâche' },

  // ─── Expenses ───
  expensesTitle: { ar: 'المصاريف', fr: 'Dépenses' },
  expensesSub: { ar: 'عرض المصاريف والمدفوعات', fr: 'Voir les dépenses et paiements' },
  addExpense: { ar: 'إضافة مصروف', fr: 'Ajouter une dépense' },

  // ─── Search ───
  searchTitle: { ar: 'بحث متقدم', fr: 'Recherche avancée' },
  searchSub: { ar: 'بحث شامل في جميع البيانات', fr: 'Recherche complète dans toutes les données' },

  // ─── Reports ───
  reportsTitle: { ar: 'التقارير', fr: 'Rapports' },
  reportsSub: { ar: 'التقارير والإحصائيات', fr: 'Rapports et statistiques' },

  // ─── AI ───
  aiTitle: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  aiSub: { ar: 'الذكاء الاصطناعي القانوني', fr: 'Intelligence artificielle juridique' },
  aiPlaceholder: { ar: 'اكتب سؤالك القانوني...', fr: 'Posez votre question juridique...' },
  aiSend: { ar: 'إرسال', fr: 'Envoyer' },

  // ─── Archive ───
  archiveTitle: { ar: 'الأرشيف', fr: 'Archive' },
  archiveSub: { ar: 'القضايا المؤرشفة', fr: 'Affaires archivées' },

  // ─── Hearings ───
  hearingsTitle: { ar: 'الجلسات', fr: 'Audiences' },
  hearingsSub: { ar: 'تسجيل ومتابعة الجلسات', fr: 'Enregistrer et suivre les audiences' },

  // ─── Notifications ───
  notifPanel: { ar: 'الإشعارات', fr: 'Notifications' },
  notifNoNotifs: { ar: 'لا توجد إشعارات', fr: 'Aucune notification' },

  // ─── Status ───
  statusActive: { ar: 'نشط', fr: 'Actif' },
  statusInactive: { ar: 'غير نشط', fr: 'Inactif' },
  statusAll: { ar: 'الكل', fr: 'Tous' },
  statusToday: { ar: 'اليوم', fr: 'Aujourd\'hui' },
  statusWeek: { ar: 'هذا الأسبوع', fr: 'Cette semaine' },
  statusMonth: { ar: 'هذا الشهر', fr: 'Ce mois' },
  statusCompleted: { ar: 'مكتمل', fr: 'Terminé' },
  statusPending: { ar: 'معلق', fr: 'En attente' },
  statusInProgress: { ar: 'قيد الإنجاز', fr: 'En cours' },
  statusCancelled: { ar: 'ملغى', fr: 'Annulé' },

  // ─── Confirm Dialog ───
  confirmDeleteTitle: { ar: 'تأكيد الحذف', fr: 'Confirmer la suppression' },
  confirmDeleteMsg: { ar: 'هل أنت متأكد؟', fr: 'Êtes-vous sûr ?' },
  confirmCancel: { ar: 'إلغاء', fr: 'Annuler' },
  confirmDelete: { ar: 'حذف', fr: 'Supprimer' },

  // ─── Toast Common ───
  success: { ar: 'نجاح', fr: 'Succès' },
  error: { ar: 'خطأ', fr: 'Erreur' },
  warning: { ar: 'تحذير', fr: 'Avertissement' },
  info: { ar: 'معلومات', fr: 'Information' },

  // ─── Labels ───
  labelNotes: { ar: 'ملاحظات', fr: 'Notes' },
  labelTags: { ar: 'الوسوم', fr: 'Tags' },
  labelVersions: { ar: 'الإصدارات', fr: 'Versions' },
  labelInfo: { ar: 'معلومات', fr: 'Informations' },
  labelFiles: { ar: 'الملفات', fr: 'Fichiers' },
  labelActions: { ar: 'الإجراءات', fr: 'Actions' },

  // ─── Common ───
  noData: { ar: 'لا توجد بيانات', fr: 'Aucune donnée' },
  loading: { ar: 'جاري التحميل...', fr: 'Chargement...' },
  saving: { ar: 'جاري الحفظ...', fr: 'Enregistrement...' },
  deleting: { ar: 'جاري الحذف...', fr: 'Suppression...' },
  processing: { ar: 'جاري المعالجة...', fr: 'Traitement...' },
};

function _t(key) {
  var lang = A._currentLang || 'ar';
  var entry = A.i18n[key];
  return entry ? (entry[lang] || entry.ar || key) : key;
}

A.setLanguage = function(lang) {
  A._currentLang = lang;
  if (lang === 'fr') {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'fr';
    document.body.classList.add('lang-fr');
  } else {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.body.classList.remove('lang-fr');
  }
  try { localStorage.setItem('app_lang', lang); } catch(e) {}
  const sel = document.getElementById('settingLang');
  if (sel) sel.value = lang;
  A.updateUI();
  if (A.AutoSave) A.AutoSave.markDirty('i18n');
};

A.getLanguage = function() {
  return A._currentLang || 'ar';
};

A.updateUI = function() {
  var lang = A._currentLang || 'ar';
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var entry = A.i18n[key];
    if (!entry) return;
    var text = entry[lang] || entry.ar || key;
    var attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, text);
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.setAttribute('placeholder', text);
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-html');
    var entry = A.i18n[key];
    if (!entry) return;
    el.innerHTML = entry[lang] || entry.ar || key;
  });
};

A.initI18n = function() {
  var saved = 'ar';
  try { saved = localStorage.getItem('app_lang') || 'ar'; } catch(e) {}
  A.setLanguage(saved);
};

window._t = _t;
window.setLanguage = A.setLanguage;
window.getLanguage = A.getLanguage;
