var A = (window.App = window.App || {});

A.i18n = {
  // ─── App ───
  appName: { ar: 'LexOffece', fr: 'LexOffece' },
  appSub: { ar: 'LexOffece v2.0', fr: 'LexOffece v2.0' },
  startupName: { ar: 'LexOffece', fr: 'LexOffece' },
  startupSub: { ar: 'منصة إدارة المكاتب القانونية', fr: 'Plateforme de gestion juridique' },

  // ─── Onboarding ───
  onbTitle: { ar: 'مرحباً بك في LexOffece', fr: 'Bienvenue dans LexOffece' },
  onbDesc: {
    ar: 'منصة إدارة المكاتب القانونية — نظّم قضاياك، موكليك، وثائقك، وجلساتك في مكان واحد.',
    fr: 'Plateforme de gestion juridique — organisez vos dossiers, clients, documents et audiences en un seul endroit.'
  },
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
  adminNameLabel: { ar: 'اسم المدير', fr: "Nom de l'administrateur" },
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
  navHelp: { ar: 'المساعدة', fr: 'Aide' },
  navSupport: { ar: 'الدعم', fr: 'Support' },
  navSettings: { ar: 'الإعدادات', fr: 'Paramètres' },
  navLock: { ar: 'قفل', fr: 'Verrouiller' },
  navProfile: { ar: 'الملف الشخصي', fr: 'Profil' },

  // ─── Topbar ───
  searchPlaceholder: { ar: 'بحث في القضايا، الموكلين، الوثائق...', fr: 'Rechercher affaires, clients, documents...' },
  quickAdd: { ar: 'إضافة سريعة', fr: 'Ajout rapide' },
  notifTitle: { ar: 'الإشعارات', fr: 'Notifications' },
  autoSaveStatus: { ar: 'تم الحفظ', fr: 'Enregistré' },

  // ─── Dashboard ───
  dashEmptyTitle: { ar: 'مرحباً بك في LexOffece', fr: 'Bienvenue dans LexOffece' },
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
  dashNoEvents: { ar: 'لا توجد أحداث اليوم', fr: "Aucun événement aujourd'hui" },

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
  caseNumber: { ar: 'رقم القضية', fr: "N° d'affaire" },
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

  // ─── Help / Support ───
  helpTitle: { ar: 'المساعدة والدعم', fr: 'Aide et support' },
  helpDesc: { ar: 'دليل الاستخدام، الأسئلة الشائعة، قاعدة المعرفة، فحص النظام', fr: 'Guide, FAQ, base de connaissances, diagnostic' },
  helpGuideTab: { ar: 'دليل الاستخدام', fr: "Guide d'utilisation" },
  helpFaqTab: { ar: 'الأسئلة الشائعة', fr: 'FAQ' },
  helpKbTab: { ar: 'قاعدة المعرفة', fr: 'Base de connaissances' },
  helpHealthTab: { ar: 'فحص النظام', fr: 'Diagnostic système' },
  helpKbSearch: { ar: 'بحث في قاعدة المعرفة...', fr: 'Rechercher dans la base...' },
  healthDatabase: { ar: 'قاعدة البيانات', fr: 'Base de données' },
  healthApiKey: { ar: 'مفتاح API', fr: 'Clé API' },
  healthLicense: { ar: 'الترخيص', fr: 'Licence' },
  healthBackup: { ar: 'النسخ الاحتياطي', fr: 'Sauvegarde' },
  healthStorage: { ar: 'التخزين', fr: 'Stockage' },
  healthNetwork: { ar: 'الشبكة', fr: 'Réseau' },
  healthConnected: { ar: 'متصل', fr: 'Connecté' },
  healthNotConfigured: { ar: 'غير مضبوط', fr: 'Non configuré' },
  healthValid: { ar: 'صالح', fr: 'Valide' },
  healthInvalid: { ar: 'غير صالح', fr: 'Invalide' },
  healthOnline: { ar: 'متصل بالإنترنت', fr: 'En ligne' },
  healthOffline: { ar: 'غير متصل', fr: 'Hors ligne' },
  healthOfflineDesc: { ar: 'بعض الميزات لن تعمل', fr: 'Certaines fonctionnalités ne fonctionneront pas' },
  healthNoBackup: { ar: 'لا توجد نسخة', fr: 'Aucune sauvegarde' },
  healthBackupCount: { ar: 'عدد النسخ', fr: 'Nombre de sauvegardes' },
  healthFree: { ar: 'مساحة حرة', fr: 'Espace libre' },
  healthAutoRefresh: { ar: 'يتم التحديث تلقائياً عند فتح الصفحة', fr: 'Mise à jour automatique' },
  healthRefresh: { ar: 'تحديث', fr: 'Actualiser' },

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
  statusToday: { ar: 'اليوم', fr: "Aujourd'hui" },
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

  // ─── Dashboard Cards & Empty States ───
  dashUpcomingDeadlines: { ar: 'الآجال القريبة', fr: 'Échéances' },
  dashRecentActivity: { ar: 'آخر النشاطات', fr: 'Activités récentes' },
  dashRecentCases: { ar: 'آخر القضايا', fr: 'Dernières affaires' },
  dashUrgentCases: { ar: 'القضايا العاجلة', fr: 'Affaires urgentes' },
  dashInProgressTasks: { ar: 'المهام قيد الإنجاز', fr: 'Tâches en cours' },
  dashRecentDocs: { ar: 'آخر الوثائق', fr: 'Derniers documents' },
  dashCalendar: { ar: 'التقويم', fr: 'Calendrier' },
  dashNotifications: { ar: 'الإشعارات', fr: 'Notifications' },
  dashFinancialSummary: { ar: 'الملخص المالي', fr: 'Résumé financier' },
  dashCaseHealth: { ar: 'صحة القضايا', fr: 'Santé des dossiers' },
  dashCriticalDeadlines: { ar: 'مركز المواعيد الحرجة', fr: 'Échéances critiques' },
  dashFinRevenue: { ar: 'الإيرادات', fr: 'Revenus' },
  dashFinExpenses: { ar: 'المصروفات', fr: 'Dépenses' },
  dashFinOutstanding: { ar: 'المستحق', fr: 'Impayé' },
  dashAiInsightLabel: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  dashNoEvents: { ar: 'لا توجد أحداث اليوم', fr: "Aucun événement aujourd'hui" },
  dashNoDeadlines: { ar: 'لا توجد آجال', fr: 'Aucune échéance' },
  dashNoActivity: { ar: 'لا توجد نشاطات', fr: 'Aucune activité' },
  dashNoCases: { ar: 'لا توجد قضايا', fr: 'Aucune affaire' },
  dashNoUrgentCases: { ar: 'لا توجد قضايا عاجلة', fr: 'Aucune affaire urgente' },
  dashNoTasks: { ar: 'لا توجد مهام', fr: 'Aucune tâche' },
  dashNoDocs: { ar: 'لا توجد وثائق', fr: 'Aucun document' },
  dashNoUpcomingEvents: { ar: 'لا توجد أحداث قادمة', fr: 'Aucun événement à venir' },
  dashNoNotifications: { ar: 'لا توجد إشعارات', fr: 'Aucune notification' },
  dashLoadingIndicators: { ar: 'يتم تحميل المؤشرات...', fr: 'Chargement des indicateurs...' },
  dashLoadingDeadlines: { ar: 'يتم تحميل المواعيد...', fr: 'Chargement des échéances...' },

  // ─── Common Actions ───
  filterBtn: { ar: 'فلاتر', fr: 'Filtres' },
  applyBtn: { ar: 'تطبيق', fr: 'Appliquer' },
  resetBtn: { ar: 'إعادة', fr: 'Réinitialiser' },
  todayBtn: { ar: 'اليوم', fr: "Aujourd'hui" },
  allLabel: { ar: 'الكل', fr: 'Tous' },
  upcomingLabel: { ar: 'القادمة', fr: 'À venir' },
  pastLabel: { ar: 'السابقة', fr: 'Passées' },
  allTypes: { ar: 'جميع الأنواع', fr: 'Tous les types' },
  viewAll: { ar: 'عرض الكل', fr: 'Voir tout' },

  // ─── Section Descriptions ───
  clientsDesc: { ar: 'CRM متكامل — إدارة العلاقات القانونية', fr: 'CRM intégré — Gestion des relations juridiques' },
  casesDesc: { ar: 'مساحة عمل القضايا — إدارة ومتابعة الملفات القانونية', fr: 'Espace de travail — Gestion des dossiers juridiques' },
  hearingsDesc: { ar: 'جدولة ومتابعة جميع جلسات المحكمة والمواعيد القانونية', fr: 'Calendrier et suivi des audiences' },
  calendarDesc: { ar: 'نظام تقويم قانوني متكامل — جلسات، مواعيد، مهام', fr: 'Calendrier juridique intégré' },
  tasksDesc: { ar: 'نظام تنفيذ قانوني — مهام، مهام فرعية، تبعيات، سير عمل، تتبع زمني', fr: "Système d'exécution juridique" },
  documentsDesc: { ar: 'نظام إدارة الوثائق القانونية — بحث، تصنيف، إصدارات', fr: 'Gestion documentaire juridique' },
  expensesDesc: { ar: 'تتبع المصاريف والمدفوعات والفواتير', fr: 'Suivi des dépenses et paiements' },
  notificationsDesc: { ar: 'مركز الإشعارات والتنبيهات', fr: 'Centre de notifications' },
  searchDesc: { ar: 'بحث شامل في جميع بيانات التطبيق', fr: 'Recherche complète' },
  reportsDesc: { ar: 'إنشاء وتصدير التقارير والإحصائيات', fr: 'Générer des rapports' },
  aiDesc: { ar: 'محرك الذكاء القانوني — تحليل، صياغة، استراتيجية، مخاطر', fr: "Moteur d'IA juridique" },
  archiveDesc: { ar: 'القضايا المؤرشفة والملفات المنتهية', fr: 'Affaires archivées' },
  settingsDesc: { ar: 'تخصيص إعدادات التطبيق', fr: 'Personnaliser les paramètres' },

  // ─── Kanban (Cases) ───
  kanbanNew: { ar: 'جديد', fr: 'Nouveau' },
  kanbanActive: { ar: 'قيد المعالجة', fr: 'En cours' },
  kanbanPending: { ar: 'معلق', fr: 'En attente' },
  kanbanAppeal: { ar: 'استئناف', fr: 'Appel' },
  kanbanClosed: { ar: 'مغلقة', fr: 'Fermée' },

  // ─── Task Status ───
  taskBacklog: { ar: 'متراكم', fr: 'En suspens' },
  taskTodo: { ar: 'قيد الانتظار', fr: 'À faire' },
  taskInProgress: { ar: 'قيد التنفيذ', fr: 'En cours' },
  taskWaiting: { ar: 'معلق', fr: 'En attente' },
  taskReview: { ar: 'مراجعة', fr: 'Révision' },
  taskDone: { ar: 'منجز', fr: 'Terminé' },

  // ─── Task Priority (short form for selects) ───
  priorityCritical: { ar: 'حرج', fr: 'Critique' },
  priorityHigh: { ar: 'عالي', fr: 'Haute' },
  priorityMedium: { ar: 'متوسط', fr: 'Moyenne' },
  priorityLow: { ar: 'منخفض', fr: 'Basse' },

  // ─── Task Detail Labels ───
  responsibleLabel: { ar: 'مسؤول', fr: 'Responsable' },
  progressLabel: { ar: 'التقدم', fr: 'Progrès' },
  timeTrackedLabel: { ar: 'الوقت المسجل', fr: 'Temps enregistré' },
  subtasksLabel: { ar: 'المهام الفرعية', fr: 'Sous-tâches' },
  commentsLabel: { ar: 'التعليقات', fr: 'Commentaires' },
  noCommentsLabel: { ar: 'لا توجد تعليقات', fr: 'Aucun commentaire' },
  subtaskPlaceholder: { ar: 'مهمة فرعية...', fr: 'Sous-tâche...' },
  addCommentPlaceholder: { ar: 'أضف تعليقاً...', fr: 'Ajouter un commentaire...' },
  sendBtn: { ar: 'إرسال', fr: 'Envoyer' },
  defaultAuthorValue: { ar: 'المحامي', fr: 'Avocat' },

  // ─── Task Toast / Confirm ───
  taskSaveFailed: { ar: 'فشل حفظ المهمة', fr: "Échec de l'enregistrement de la tâche" },
  taskLoadDetailFailed: { ar: 'فشل تحميل تفاصيل المهمة', fr: 'Échec du chargement des détails' },
  taskUpdateFailed: { ar: 'فشل تحديث المهمة', fr: "Échec de la mise à jour de la tâche" },
  taskDeleteFailed: { ar: 'فشل حذف المهمة', fr: 'Échec de la suppression de la tâche' },
  taskStatusChangeFailed: { ar: 'فشل تغيير حالة المهمة', fr: 'Échec du changement de statut' },
  deleteTaskConfirm: { ar: 'حذف هذه المهمة؟', fr: 'Supprimer cette tâche ?' },
  subtaskToggleFailed: { ar: 'فشل تحديث المهمة الفرعية', fr: 'Échec de la mise à jour de la sous-tâche' },
  subtaskDeleteFailed: { ar: 'فشل حذف المهمة الفرعية', fr: 'Échec de la suppression de la sous-tâche' },
  subtaskAddFailed: { ar: 'فشل إضافة المهمة الفرعية', fr: "Échec de l'ajout de la sous-tâche" },
  commentAddFailed: { ar: 'فشل إضافة التعليق', fr: "Échec de l'ajout du commentaire" },

  // ─── Workflow / Template ───
  nameLabel: { ar: 'الاسم', fr: 'Nom' },
  nameRequired: { ar: 'الاسم مطلوب', fr: 'Nom requis' },
  caseTypeLabel: { ar: 'نوع القضية', fr: "Type d'affaire" },
  caseTypePlaceholder: { ar: 'مدني، أسرة، تجاري...', fr: 'Civil, Famille, Commercial...' },
  workflowStepsLabel: { ar: 'الخطوات (اسم لكل سطر)', fr: 'Étapes (un nom par ligne)' },
  workflowStepsPlaceholder: { ar: 'جمع معلومات الموكل\nإنشاء ملف القضية\nرفع الوثائق الأولية', fr: 'Collecte des infos client\nCréation du dossier\nDépôt des documents initiaux' },
  tasksJsonLabel: { ar: 'المهام (JSON)', fr: 'Tâches (JSON)' },
  tasksJsonPlaceholder: { ar: '[{"title":"مهمة 1","priority":"high"},{"title":"مهمة 2","priority":"medium","due_days":7}]', fr: '[{"title":"Tâche 1","priority":"high"},{"title":"Tâche 2","priority":"medium","due_days":7}]' },
  newWorkflowTitle: { ar: 'سير عمل جديد', fr: 'Nouveau workflow' },
  newTemplateTitle: { ar: 'قالب مهام جديد', fr: 'Nouveau modèle de tâches' },
  workflowAddFailed: { ar: 'فشل إضافة سير العمل', fr: "Échec de l'ajout du workflow" },
  templateAddFailed: { ar: 'فشل إضافة القالب', fr: "Échec de l'ajout du modèle" },
  selectCaseAndWorkflow: { ar: 'اختر القضية وسير العمل', fr: "Choisissez l'affaire et le workflow" },
  workflowApplyFailed: { ar: 'فشل تطبيق سير العمل', fr: "Échec de l'application du workflow" },
  selectCaseAndTemplate: { ar: 'اختر القضية والقالب', fr: "Choisissez l'affaire et le modèle" },
  templateApplyFailed: { ar: 'فشل تطبيق القالب', fr: "Échec de l'application du modèle" },
  deleteWorkflowConfirm: { ar: 'حذف سير العمل؟', fr: 'Supprimer le workflow ?' },
  workflowDeleteFailed: { ar: 'فشل حذف سير العمل', fr: "Échec de la suppression du workflow" },
  deleteTemplateConfirm: { ar: 'حذف هذا القالب؟', fr: 'Supprimer ce modèle ?' },
  templateDeleteFailed: { ar: 'فشل حذف القالب', fr: "Échec de la suppression du modèle" },
  workflowsAndTemplatesTitle: { ar: 'سير العمل والقالب', fr: 'Workflows et modèles' },
  applyWorkflowToCase: { ar: 'تطبيق سير عمل على قضية', fr: 'Appliquer un workflow à une affaire' },
  selectWorkflowPlaceholder: { ar: 'اختر سير عمل...', fr: 'Choisir un workflow...' },
  applyTemplateToCase: { ar: 'تطبيق قالب على قضية', fr: 'Appliquer un modèle à une affaire' },
  selectTemplatePlaceholder: { ar: 'اختر قالب...', fr: 'Choisir un modèle...' },
  newWorkflowBtn: { ar: 'سير عمل جديد', fr: 'Nouveau workflow' },
  newTemplateBtn: { ar: 'قالب جديد', fr: 'Nouveau modèle' },
  currentWorkflowsLabel: { ar: 'سير العمل الحالية', fr: 'Workflows existants' },
  noWorkflowsLabel: { ar: 'لا توجد سير عمل', fr: 'Aucun workflow' },
  currentTemplatesLabel: { ar: 'القوالب الحالية', fr: 'Modèles existants' },
  noTemplatesLabel: { ar: 'لا توجد قوالب', fr: 'Aucun modèle' },
  stepsCountLabel: { ar: 'خطوات', fr: 'étapes' },

  // ─── Task Analytics ───
  totalTasksLabel: { ar: 'إجمالي المهام', fr: 'Total des tâches' },
  completedThisWeekLabel: { ar: 'منجز هذا الأسبوع', fr: 'Terminé cette semaine' },
  overdueAnalyticsLabel: { ar: 'متأخرة', fr: 'En retard' },
  backlogAnalyticsLabel: { ar: 'متروكة', fr: 'En suspens' },
  completionRateLabel: { ar: 'معدل الإنجاز', fr: "Taux d'achèvement" },
  failedLoadTaskAnalytics: { ar: 'تعذر تحميل تحليلات المهام', fr: 'Échec du chargement des analyses' },
  dayLabel: { ar: 'يوم', fr: 'jour' },

  // ─── Task List ───
  noTasksLabel: { ar: 'لا توجد مهام', fr: 'Aucune tâche' },
  allTasksDoneLabel: { ar: 'جميع المهام منجزة', fr: 'Toutes les tâches sont terminées' },
  overdueSuffix: { ar: ' (متأخرة)', fr: ' (en retard)' },

  // ─── Expenses Stats ───
  expTotalHonoraires: { ar: 'إجمالي الأتعاب', fr: 'Total honoraires' },
  expTotalPaid: { ar: 'المدفوع', fr: 'Payé' },
  expTotalRemaining: { ar: 'الباقي', fr: 'Restant' },
  expTotalExpenses: { ar: 'المصروفات', fr: 'Dépenses' },
  expRecentPayments: { ar: 'المدفوعات الأخيرة', fr: 'Paiements récents' },

  // ─── Search Checkboxes ───
  searchInCases: { ar: 'القضايا', fr: 'Affaires' },
  searchInClients: { ar: 'الموكلين', fr: 'Clients' },
  searchInDocs: { ar: 'الوثائق', fr: 'Documents' },
  searchInProcedures: { ar: 'الجلسات', fr: 'Audiences' },
  searchInTasks: { ar: 'المهام', fr: 'Tâches' },

  // ─── Reports ───
  reportCases: { ar: 'تقرير القضايا', fr: 'Rapport des affaires' },
  reportCasesDesc: { ar: 'إحصائيات القضايا حسب الحالة والمحكمة', fr: 'Statistiques des affaires' },
  reportClients: { ar: 'تقرير الموكلين', fr: 'Rapport des clients' },
  reportClientsDesc: { ar: 'إحصائيات الموكلين والنشاطات', fr: 'Statistiques des clients' },
  reportHearings: { ar: 'تقرير الجلسات', fr: 'Rapport des audiences' },
  reportHearingsDesc: { ar: 'إحصائيات الجلسات القادمة والماضية', fr: 'Statistiques des audiences' },
  reportFinancial: { ar: 'التقرير المالي', fr: 'Rapport financier' },
  reportFinancialDesc: { ar: 'الأتعاب والمدفوعات والمصروفات', fr: 'Honoraires et dépenses' },
  reportTasks: { ar: 'تقرير المهام', fr: 'Rapport des tâches' },
  reportTasksDesc: { ar: 'إنجاز المهام والأولويات', fr: 'Tâches et priorités' },
  reportMonthly: { ar: 'تقرير شهري', fr: 'Rapport mensuel' },
  reportMonthlyDesc: { ar: 'ملخص شامل للنشاط الشهري', fr: 'Résumé mensuel' },

  // ─── AI Setup ───
  aiSetupTitle: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  aiSetupDesc: { ar: 'اختر مزود الذكاء الاصطناعي المفضل لديك', fr: "Choisissez votre fournisseur d'IA" },
  aiApiKeyLabel: { ar: 'مفتاح API (Groq)', fr: 'Clé API (Groq)' },
  aiModelLabel: { ar: 'النموذج', fr: 'Modèle' },
  aiSaveKey: { ar: 'حفظ المفتاح وبدء المحادثة', fr: 'Sauvegarder la clé' },
  aiSetupHint: { ar: 'احصل على مفتاح مجاني من', fr: 'Obtenez une clé gratuite sur' },
  aiChatMode: { ar: 'محادثة', fr: 'Chat' },
  aiSummarizeMode: { ar: 'تلخيص', fr: 'Résumé' },
  aiDraftMode: { ar: 'صياغة', fr: 'Rédaction' },
  aiAnalyzeMode: { ar: 'تحليل', fr: 'Analyse' },
  aiStrategyMode: { ar: 'استراتيجية', fr: 'Stratégie' },
  aiRiskMode: { ar: 'مخاطر', fr: 'Risques' },
  aiHearingPrepMode: { ar: 'تحضير جلسة', fr: 'Préparation audience' },
  aiChangeKeyTitle: { ar: 'تغيير المفتاح', fr: 'Changer la clé' },
  aiSendBtnTitle: { ar: 'إرسال', fr: 'Envoyer' },
  aiFloatBtnTitle: { ar: 'المساعد الذكي (Ctrl+K)', fr: 'Assistant IA (Ctrl+K)' },
  aiContextLabel: { ar: 'السياق: {label}', fr: 'Contexte : {label}' },
  aiModeChat: { ar: 'اطرح سؤالك القانوني...', fr: 'Posez votre question juridique...' },
  aiModeSummarize: { ar: 'الصق النص القانوني للتلخيص...', fr: 'Collez le texte juridique à résumer...' },
  aiModeDraft: { ar: 'صف الوثيقة التي تريد صياغتها...', fr: 'Décrivez le document à rédiger...' },
  aiModeAnalyze: { ar: 'الصق النص للتحليل القانوني...', fr: 'Collez le texte pour analyse juridique...' },
  aiModeStrategy: { ar: 'صف الموقف القانوني للتحليل الاستراتيجي...', fr: 'Décrivez la situation pour analyse stratégique...' },
  aiModeRisk: { ar: 'صف الموقف لتحديد المخاطر...', fr: 'Décrivez la situation pour identifier les risques...' },
  aiModeHearingPrep: { ar: 'اختر قضية أو جلسة للتحضير...', fr: 'Choisissez une affaire ou audience...' },
  aiContextCase: { ar: 'حلل هذه القضية', fr: 'Analysez cette affaire' },
  aiContextClient: { ar: 'حلل هذا الموكل', fr: 'Analysez ce client' },
  aiContextDocument: { ar: 'حلل هذه الوثيقة', fr: 'Analysez ce document' },
  aiContextHearing: { ar: 'جهز لهذه الجلسة', fr: 'Préparez cette audience' },
  aiContextGeneral: { ar: 'اسأل المساعد الذكي...', fr: 'Demandez à l\'assistant IA...' },
  aiSendingOther: { ar: 'جاري معالجة رسالة أخرى...', fr: 'Un autre message est en cours...' },
  aiOffline: { ar: 'يرجى التحقق من الاتصال بالإنترنت', fr: 'Vérifiez votre connexion Internet' },
  aiErrorGeneral: { ar: 'حدث خطأ في الاتصال بالمساعد الذكي. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.', fr: 'Erreur de connexion à l\'assistant IA. Vérifiez votre connexion et réessayez.' },
  aiSetupFirst: { ar: 'الرجاء إعداد الذكاء الاصطناعي أولاً من قسم "الذكاء الاصطناعي"', fr: 'Veuillez configurer l\'IA d\'abord dans la section "Assistant IA"' },
  aiAnalysisTitle: { ar: 'تحليل الوثيقة بالذكاء الاصطناعي', fr: 'Analyse de document par IA' },
  aiAnalyzing: { ar: 'جاري تحليل الوثيقة...', fr: 'Analyse du document en cours...' },
  aiAnalysisError: { ar: 'حدث خطأ أثناء تحليل الوثيقة', fr: 'Erreur lors de l\'analyse du document' },
  aiCachedLabel: { ar: '(من الذاكرة المخبأة)', fr: '(depuis le cache)' },

  // Provider-specific labels
  aiLabelGroq: { ar: 'مفتاح API (Groq)', fr: 'Clé API (Groq)' },
  aiLabelOpenai: { ar: 'مفتاح API (OpenAI)', fr: 'Clé API (OpenAI)' },
  aiLabelAnthropic: { ar: 'مفتاح API (Anthropic)', fr: 'Clé API (Anthropic)' },
  aiLabelGemini: { ar: 'مفتاح API (Gemini)', fr: 'Clé API (Gemini)' },

  // Provider-specific hints
  aiHintGroq: { ar: 'احصل على مفتاح مجاني من <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Groq Console</a>', fr: 'Obtenez une clé gratuite sur <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Groq Console</a>' },
  aiHintOpenai: { ar: 'احصل على مفتاح من <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style="color:var(--info);">OpenAI Dashboard</a>', fr: 'Obtenez une clé sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style="color:var(--info);">OpenAI Dashboard</a>' },
  aiHintAnthropic: { ar: 'احصل على مفتاح من <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Anthropic Console</a>', fr: 'Obtenez une clé sur <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Anthropic Console</a>' },
  aiHintGemini: { ar: 'احصل على مفتاح مجاني من <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Google AI Studio</a>', fr: 'Obtenez une clé gratuite sur <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style="color:var(--info);">Google AI Studio</a>' },

  // AI toast / error messages
  aiEnterKey: { ar: 'الرجاء إدخال مفتاح API', fr: 'Veuillez entrer la clé API' },
  aiSaveFailed: { ar: 'فشل حفظ مفتاح API', fr: 'Échec de la sauvegarde de la clé API' },
  aiSorry: { ar: 'عذراً، لم أتمكن من معالجة طلبك.', fr: "Désolé, je n'ai pas pu traiter votre demande." },
  aiCopyMsg: { ar: 'نسخ الرسالة', fr: 'Copier le message' },
  aiInputGeneral: { ar: 'اكتب سؤالك...', fr: 'Écrivez votre question...' },

  // Analysis section headers
  aiAnalysisSummary: { ar: 'الخلاصة', fr: 'Résumé' },
  aiAnalysisKeyPoints: { ar: 'النقاط الرئيسية', fr: 'Points clés' },
  aiAnalysisLegalRecommendation: { ar: 'التوصية القانونية', fr: 'Recommandation juridique' },

  // ─── Settings ───
  aboutLabel: { ar: 'حول', fr: 'À propos' },
  darkModeLabel: { ar: 'الوضع الليلي', fr: 'Mode sombre' },
  passwordTitle: { ar: 'كلمة السر', fr: 'Mot de passe' },
  userManagement: { ar: 'إدارة المستخدمين', fr: 'Gestion des utilisateurs' },
  activityLog: { ar: 'سجل النشاط', fr: "Journal d'activité" },
  errorLog: { ar: 'سجل الأخطاء', fr: 'Journal des erreurs' },
  logExport: { ar: 'تصدير', fr: 'Exporter' },
  logClear: { ar: 'مسح', fr: 'Effacer' },
  autoBackup: { ar: 'النسخ الاحتياطي التلقائي', fr: 'Sauvegarde automatique' },
  manualBackup: { ar: 'إنشاء نسخة احتياطية يدوية', fr: 'Sauvegarde manuelle' },
  createBackupNow: { ar: 'إنشاء نسخة الآن', fr: 'Sauvegarder maintenant' },
  exportArchiveFull: { ar: 'تصدير أرشيف كامل', fr: "Exporter l'archive" },
  restorePoints: { ar: 'نقاط الاستعادة', fr: 'Points de restauration' },
  loadingBackups: { ar: 'جاري تحميل النسخ الاحتياطية...', fr: 'Chargement des sauvegardes...' },
  restoreConfirmTitle: { ar: 'تأكيد الاستعادة', fr: 'Confirmer la restauration' },
  restoreWarning: { ar: 'تحذير: استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية!', fr: 'Attention: La restauration remplacera toutes les données!' },
  storageMaintenance: { ar: 'صيانة التخزين', fr: 'Maintenance du stockage' },
  storageMaintenanceDesc: {
    ar: 'تنظيف الملفات الوهمية (orphan files) — الملفات الموجودة على القرص الصلب دون وجودها في قاعدة البيانات.',
    fr: 'Nettoyage des fichiers orphelins — fichiers présents sur le disque sans référence en base.'
  },
  cleanOrphansBtn: { ar: 'تنظيف الملفات الزائدة', fr: 'Nettoyer les fichiers orphelins' },
  alertSettings: { ar: 'إعدادات التنبيهات', fr: 'Paramètres des alertes' },
  saveSettings: { ar: 'حفظ الإعدادات', fr: 'Enregistrer' },
  firstAlert: { ar: 'التنبيه الأول (أيام)', fr: 'Première alerte (jours)' },
  secondAlert: { ar: 'التنبيه الثاني (أيام)', fr: 'Deuxième alerte (jours)' },
  thirdAlert: { ar: 'التنبيه الثالث (أيام)', fr: 'Troisième alerte (jours)' },

  // ─── Case Workspace ───
  cdOverview: { ar: 'نظرة عامة', fr: 'Aperçu' },
  cdCases: { ar: 'القضايا', fr: 'Affaires' },
  cdCommunications: { ar: 'الاتصالات', fr: 'Communications' },
  cdPayments: { ar: 'المدفوعات', fr: 'Paiements' },
  cdTimeline: { ar: 'النشاطات', fr: 'Activités' },
  cdNotes: { ar: 'الملاحظات', fr: 'Notes' },
  cdAnalytics: { ar: 'تحليلات', fr: 'Analyses' },
  cdNewClient: { ar: 'موكل جديد', fr: 'Nouveau client' },
  cdNewCase: { ar: 'قضية جديدة', fr: 'Nouvelle affaire' },
  cdNewHearing: { ar: 'حدث جديد', fr: 'Nouvel événement' },
  cdNewTask: { ar: 'مهمة', fr: 'Tâche' },
  cdUploadDoc: { ar: 'رفع', fr: 'Upload' },

  // ─── Calendar Legend ───
  calLegendHearings: { ar: 'جلسات', fr: 'Audiences' },
  calLegendDeadlines: { ar: 'مواعيد', fr: 'Échéances' },
  calLegendTasks: { ar: 'مهام', fr: 'Tâches' },
  calLegendMeetings: { ar: 'اجتماعات', fr: 'Réunions' },

  // ─── Table Headers ───
  thName: { ar: 'الاسم', fr: 'Nom' },
  thPhone: { ar: 'الهاتف', fr: 'Téléphone' },
  thEmail: { ar: 'البريد', fr: 'Email' },
  thCases: { ar: 'القضايا', fr: 'Affaires' },
  thLastActivity: { ar: 'آخر نشاط', fr: 'Dernière activité' },
  thBalance: { ar: 'الرصيد', fr: 'Solde' },
  thCaseNumber: { ar: 'رقم القضية', fr: "N° d'affaire" },
  thSubject: { ar: 'الموضوع', fr: 'Objet' },
  thClient: { ar: 'الموكل', fr: 'Client' },
  thCourt: { ar: 'المحكمة', fr: 'Tribunal' },
  thType: { ar: 'النوع', fr: 'Type' },
  thStatus: { ar: 'الحالة', fr: 'Statut' },
  thPriority: { ar: 'الأولوية', fr: 'Priorité' },
  thLastUpdate: { ar: 'آخر تحديث', fr: 'Dernière mise à jour' },
  thDate: { ar: 'التاريخ', fr: 'Date' },
  thTime: { ar: 'الوقت', fr: 'Heure' },
  thAmount: { ar: 'المبلغ', fr: 'Montant' },
  thPaymentMethod: { ar: 'طريقة الدفع', fr: 'Mode de paiement' },
  thNotes: { ar: 'ملاحظات', fr: 'Notes' },
  thActions: { ar: 'الإجراءات', fr: 'Actions' },
  thArchiveDate: { ar: 'تاريخ الأرشفة', fr: "Date d'archivage" },

  // ─── Search placeholders ───
  searchPlaceholderClients: { ar: 'اسم، هاتف، بريد...', fr: 'Nom, téléphone, email...' },
  searchPlaceholderCases: { ar: 'رقم القضية، الموكل، المحكمة...', fr: "N° d'affaire, client, tribunal..." },
  searchPlaceholderHearings: { ar: 'بحث في الجلسات...', fr: 'Rechercher dans les audiences...' },
  searchPlaceholderTasks: { ar: 'بحث في المهام...', fr: 'Rechercher dans les tâches...' },
  searchPlaceholderDocs: { ar: 'بحث في الوثائق...', fr: 'Rechercher dans les documents...' },
  searchPlaceholderArchive: { ar: 'بحث في الأرشيف...', fr: 'Rechercher dans les archives...' },
  searchPlaceholderAdvanced: { ar: 'اكتب كلمة البحث...', fr: 'Tapez votre recherche...' },
  searchPlaceholderLogs: { ar: 'بحث...', fr: 'Rechercher...' },

  // ─── Misc UI ───
  markAllRead: { ar: 'تحديد الكل كمقروء', fr: 'Tout marquer comme lu' },
  workflowsLabel: { ar: 'سير العمل', fr: 'Workflows' },
  addUserBtn: { ar: 'مستخدم', fr: 'Utilisateur' },
  changePwdBtn: { ar: 'تغيير كلمة السر', fr: 'Changer le mot de passe' },
  archiveBtn: { ar: 'أرشفة', fr: 'Archiver' },
  editBtn: { ar: 'تعديل', fr: 'Modifier' },
  restoreProceed: { ar: 'تأكيد الاستعادة', fr: 'Confirmer la restauration' },
  aiInputPlaceholder: { ar: 'اكتب سؤالك هنا...', fr: 'Écrivez votre question...' },

  // ─── Command palette ───
  cmdNav: { ar: 'تنقل', fr: 'Navigation' },
  cmdSelect: { ar: 'اختيار', fr: 'Sélection' },
  cmdNext: { ar: 'التالي', fr: 'Suivant' },
  cmdClose: { ar: 'إغلاق', fr: 'Fermer' },

  // ─── Document Viewer ───
  docVUploadDate: { ar: 'تاريخ الرفع', fr: 'Date de téléversement' },
  docVSize: { ar: 'الحجم', fr: 'Taille' },

  // ─── Settings Backup ───
  backupHoursLabel: { ar: 'عدد الساعات بين النسخ', fr: 'Heures entre les sauvegardes' },
  backupMaxLabel: { ar: 'الحد الأقصى للنسخ المحفوظة', fr: 'Maximum de sauvegardes conservées' },

  // ─── Archive ───
  noArchivedCases: { ar: 'لا توجد قضايا مؤرشفة', fr: 'Aucune affaire archivée' },
  failedLoadArchive: { ar: 'تعذر تحميل الأرشيف.', fr: 'Échec du chargement des archives' },

  // ─── Reports ───
  report: { ar: 'تقرير', fr: 'Rapport' },
  totalCasesN: { ar: 'إجمالي القضايا: {n}', fr: 'Total des affaires : {n}' },
  totalClientsN: { ar: 'إجمالي الموكلين: {n}', fr: 'Total des clients : {n}' },
  failedLoadReport: { ar: 'تعذر تحميل بيانات التقرير', fr: 'Échec du chargement du rapport' },
  pdfExportComing: { ar: 'تصدير PDF سيكون متاحاً في التحديث القادم', fr: "L'export PDF sera disponible dans la prochaine mise à jour" },
  topCourts: { ar: 'أبرز المحاكم', fr: 'Principaux tribunaux' },
  withCases: { ar: 'لديهم قضايا', fr: 'Avec des affaires' },
  withoutCases: { ar: 'بدون قضايا', fr: 'Sans affaires' },
  upcomingHearings: { ar: 'جلسات قادمة', fr: 'Audiences à venir' },
  nearestHearings: { ar: 'أقرب الجلسات', fr: 'Audiences les plus proches' },
  casesMonthly: { ar: 'القضايا شهرياً', fr: 'Affaires par mois' },
  totalClientsLabel: { ar: 'إجمالي الموكلين', fr: 'Total des clients' },
  casesMonthlyDistribution: { ar: 'توزيع القضايا شهرياً', fr: 'Répartition mensuelle des affaires' },

  // ─── UI ───
  sessionExpired: { ar: 'انتهت الجلسة — الرجاء إعادة تسجيل الدخول', fr: 'Session expirée — veuillez vous reconnecter' },

  // ─── Modal ───
  confirmArchive: { ar: 'تأكيد الأرشفة', fr: "Confirmer l'archivage" },

  // ─── Autosave ───
  autosaveUnsaved: { ar: 'تعديلات غير محفوظة', fr: 'Modifications non enregistrées' },
  autosaveError: { ar: 'فشل الحفظ', fr: 'Échec de la sauvegarde' },
  autosaveFoundDrafts: {
    ar: 'تم العثور على {count} مسودة غير محفوظة قبل إعادة التشغيل. هل تريد استعادتها؟',
    fr: '{count} brouillon(s) non sauvegardé(s) trouvé(s). Voulez-vous les restaurer ?'
  },
  autosaveRestoreAll: { ar: 'استعادة الكل', fr: 'Tout restaurer' },
  autosaveDismiss: { ar: 'تجاهل', fr: 'Ignorer' },
  autosaveRestored: { ar: 'تم استعادة المسودات بنجاح', fr: 'Brouillons restaurés avec succès' },
  autosaveLocalDrafts: { ar: 'مسودات محفوظة محلياً', fr: 'Brouillons sauvegardés localement' },

  // ─── Notifications ───
  failedLoadNotifications: { ar: 'تعذر تحميل الإشعارات.', fr: 'Échec du chargement des notifications' },

  // ─── Expenses ───
  noPayments: { ar: 'لا توجد مدفوعات', fr: 'Aucun paiement' },
  failedLoadExpenses: { ar: 'تعذر تحميل المصاريف.', fr: 'Échec du chargement des dépenses' },

  // ─── Hearings ───
  failedLoadHearings: { ar: 'تعذر تحميل الجلسات والمواعيد.', fr: 'Échec du chargement des audiences' },
  hearingsPast: { ar: 'سابقة', fr: 'Passée' },
  hearingsToday: { ar: 'اليوم', fr: "Aujourd'hui" },
  hearingsUpcoming: { ar: 'قادمة', fr: 'À venir' },
  noEvents: { ar: 'لا توجد أحداث', fr: 'Aucun événement' },

  // ─── Kanban ───
  caseStatusChanged: { ar: 'تم تغيير حالة القضية', fr: "Statut de l'affaire modifié" },
  failedStatusChange: { ar: 'فشل تغيير الحالة', fr: 'Échec de la modification du statut' },

  // ─── Auth ───
  createAdminAccount: { ar: 'إنشاء حساب المدير', fr: 'Créer le compte administrateur' },
  setupAdminSubtitle: { ar: 'أنشئ حساب المدير للبدء في استخدام البرنامج', fr: 'Créez le compte admin pour commencer' },
  enterPassword: { ar: 'الرجاء إدخال كلمة السر', fr: 'Veuillez entrer le mot de passe' },
  passwordIncorrect: { ar: 'كلمة السر خطأ', fr: 'Mot de passe incorrect' },
  loginErrorOccurred: { ar: 'حدث خطأ في تسجيل الدخول', fr: 'Erreur de connexion' },
  passwordMinLength: { ar: 'كلمة السر يجب أن تكون 8 أحرف على الأقل', fr: 'Le mot de passe doit avoir au moins 8 caractères' },
  passwordsNoMatch: { ar: 'كلمتا السر غير متطابقتين', fr: 'Les mots de passe ne correspondent pas' },
  savePasswordFailed: { ar: 'فشل حفظ كلمة السر', fr: "Échec de l'enregistrement du mot de passe" },
  errorSavingPassword: { ar: 'خطأ في حفظ كلمة السر', fr: "Erreur lors de l'enregistrement du mot de passe" },
  adminNameRequired: { ar: 'اسم المدير مطلوب', fr: "Nom de l'administrateur requis" },
  createAdminFailed: { ar: 'فشل إنشاء حساب المدير', fr: 'Échec de la création du compte administrateur' },
  errorCreatingAdmin: { ar: 'خطأ في إنشاء حساب المدير', fr: 'Erreur lors de la création du compte' },
  onbTitleStep1: { ar: 'إدارة القضايا والموكلين', fr: 'Gestion des affaires et clients' },
  onbDescStep1: {
    ar: 'أنشئ القضايا، أضف الموكلين، وتابع كل التفاصيل في مساحات عمل متخصصة. كل شيء مترابط.',
    fr: 'Créez des affaires, ajoutez des clients, suivez tous les détails.'
  },
  onbTitleStep2: { ar: 'التقويم والجلسات', fr: 'Calendrier et audiences' },
  onbDescStep2: {
    ar: 'جدول زمني قانوني شامل مع 4 طرق عرض، تنبيهات ذكية، وجلسات مرتبطة بالقضايا.',
    fr: 'Calendrier juridique complet avec 4 vues, alertes intégrées.'
  },
  onbTitleStep3: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  onbDescStep3: {
    ar: 'محرك ذكاء اصطناعي قانوني — حلل، صغ، استشر. سياق كامل لجميع قضاياك ووثائقك.',
    fr: "Moteur d'IA juridique — analysez, rédigez, consultez."
  },
  getStarted: { ar: 'ابدأ الآن', fr: 'Commencez' },
  securityQuestions: { ar: 'سؤال الأمان (لاستعادة كلمة السر)', fr: 'Question de sécurité (récupération du mot de passe)' },
  securityQuestionsRequired: { ar: 'الرجاء اختيار سؤال الأمان وإدخال الإجابة', fr: 'Veuillez choisir la question de sécurité et saisir la réponse' },
  nextBtn: { ar: 'التالي', fr: 'Suivant' },
  prevBtn: { ar: 'السابق', fr: 'Précédent' },
  setupStep1: { ar: 'معلومات المكتب', fr: 'Informations du cabinet' },
  setupStep2: { ar: 'كلمة السر', fr: 'Mot de passe' },
  setupStep2Heading: { ar: 'كلمة السر', fr: 'Mot de passe' },
  setupStep2Desc: { ar: 'اختر كلمة سر قوية لحساب المدير', fr: 'Choisissez un mot de passe fort pour le compte administrateur' },
  setupStep3: { ar: 'سؤال الأمان', fr: 'Question de sécurité' },
  setupStep3Heading: { ar: 'سؤال الأمان', fr: 'Question de sécurité' },
  setupStep3Desc: {
    ar: 'اختر سؤالاً وإجابة لاستعادة كلمة السر لاحقاً',
    fr: 'Choisissez une question et une réponse pour récupérer votre mot de passe plus tard'
  },

  forgotPassword: { ar: 'نسيت كلمة السر؟', fr: 'Mot de passe oublié ?' },
  forgotPasswordTitle: { ar: 'استعادة كلمة السر', fr: 'Récupération du mot de passe' },
  forgotSelectUser: { ar: 'اختر المستخدم لاستعادة كلمة السر', fr: "Choisissez l'utilisateur pour récupérer le mot de passe" },
  verifyAnswer: { ar: 'تحقق', fr: 'Vérifier' },
  resetPassword: { ar: 'إعادة تعيين كلمة السر', fr: 'Réinitialiser le mot de passe' },
  backToLogin: { ar: '→ العودة لتسجيل الدخول', fr: '← Retour à la connexion' },
  selectUserFirst: { ar: 'الرجاء اختيار مستخدم أولاً', fr: "Veuillez d'abord sélectionner un utilisateur" },
  enterAnswer: { ar: 'الرجاء إدخال الإجابة', fr: 'Veuillez saisir la réponse' },
  wrongSecurityAnswer: { ar: 'الإجابة غير صحيحة', fr: 'Réponse incorrecte' },
  noSecurityQuestions: { ar: 'لا توجد أسئلة أمان لهذا المستخدم', fr: 'Aucune question de sécurité pour cet utilisateur' },
  forgotMasterKeyHint: { ar: 'أو استخدم مفتاح الاستعادة السري', fr: 'Ou utilisez la clé de récupération secrète' },
  resetWithMasterKey: { ar: 'استعادة باستخدام مفتاح الاستعادة', fr: 'Réinitialiser avec la clé de récupération' },
  enterMasterKey: { ar: 'الرجاء إدخال مفتاح الاستعادة', fr: 'Veuillez saisir la clé de récupération' },
  resetFailed: { ar: 'فشلت إعادة تعيين كلمة السر', fr: 'Échec de la réinitialisation du mot de passe' },
  errorOccurred: { ar: 'حدث خطأ', fr: 'Une erreur est survenue' },

  // ─── Dashboard ───
  failedLoadDashboard: { ar: 'تعذر تحميل لوحة البيانات.', fr: 'Échec du chargement du tableau de bord' },

  // ─── Dashboard Views ───
  morningGreeting: { ar: 'صباح الخير', fr: 'Bonjour' },
  eveningGreeting: { ar: 'مساء الخير', fr: 'Bonsoir' },
  defaultLawyer: { ar: 'محامي', fr: 'Avocat' },
  greetingHello: { ar: 'السلام عليكم، {name}', fr: 'Bonjour, {name}' },
  weekOneHearing: { ar: 'لديك جلسة واحدة هذا الأسبوع', fr: 'Vous avez une audience cette semaine' },
  weekHearings: { ar: 'لديك {n} جلسات هذا الأسبوع', fr: 'Vous avez {n} audiences cette semaine' },
  todayOneFollowUp: { ar: 'وقضية تحتاج متابعة اليوم', fr: 'Et une affaire à suivre aujourd\'hui' },
  todayTwoFollowUp: { ar: 'وقضيتان تحتاجان متابعة اليوم', fr: 'Et deux affaires à suivre aujourd\'hui' },
  welcomeDashboard: { ar: 'مرحباً بك في لوحة التحكم', fr: 'Bienvenue sur le tableau de bord' },
  and: { ar: 'و', fr: 'et' },
  currencyMAD: { ar: ' د.م.', fr: ' MAD' },
  noEventsToday: { ar: 'لا توجد أحداث اليوم', fr: "Aucun événement aujourd'hui" },
  hearingLabel: { ar: 'جلسة', fr: 'Audience' },
  deadlineLabel: { ar: 'أجل', fr: 'Échéance' },
  remainingDays: { ar: 'باقي {n} يوم', fr: '{n} jour(s) restant(s)' },
  daysAbbr: { ar: '{n}ي', fr: '{n}j' },
  noDeadlinesLabel: { ar: 'لا توجد آجال', fr: 'Aucune échéance' },
  failedLoadDeadlines: { ar: 'تعذر تحميل المواعيد النهائية.', fr: 'Échec du chargement des échéances' },
  noActivityLabel: { ar: 'لا توجد نشاطات', fr: 'Aucune activité' },
  failedLoadActivity: { ar: 'تعذر تحميل النشاطات.', fr: 'Échec du chargement des activités' },
  noCasesLabel: { ar: 'لا توجد قضايا', fr: 'Aucune affaire' },
  noUrgentCasesLabel: { ar: 'لا توجد قضايا عاجلة', fr: 'Aucune affaire urgente' },
  noDocsLabel: { ar: 'لا توجد وثائق', fr: 'Aucun document' },
  failedLoadRecentDocs: { ar: 'تعذر تحميل الوثائق الأخيرة.', fr: 'Échec du chargement des documents récents' },
  taskTodoLabel: { ar: 'للقيام', fr: 'À faire' },
  taskInProgressLabel: { ar: 'قيد الإنجاز', fr: 'En cours' },
  taskCompletedLabel: { ar: 'مكتملة', fr: 'Terminée' },
  taskNoneLabel: { ar: 'لا توجد', fr: 'Aucune' },
  failedLoadTasksLabel: { ar: 'تعذر تحميل المهام.', fr: 'Échec du chargement des tâches' },
  hearingColon: { ar: 'جلسة: {n}', fr: 'Audience : {n}' },
  deadlineColon: { ar: 'أجل: {n}', fr: 'Échéance : {n}' },
  noUpcomingEventsLabel: { ar: 'لا توجد أحداث قادمة', fr: 'Aucun événement à venir' },
  failedLoadUpcomingEvents: { ar: 'تعذر تحميل الأحداث القادمة.', fr: 'Échec du chargement des événements à venir' },
  criticalLabel: { ar: 'حرجة', fr: 'Critique' },
  highLabel: { ar: 'عالية', fr: 'Haute' },
  mediumLabel: { ar: 'متوسطة', fr: 'Moyenne' },
  lowLabel: { ar: 'منخفضة', fr: 'Basse' },
  noActiveCasesHealth: { ar: 'لا توجد قضايا نشطة', fr: 'Aucune affaire active' },
  gradeExcellent: { ar: 'ممتاز', fr: 'Excellent' },
  gradeGood: { ar: 'جيد', fr: 'Bon' },
  gradeAverage: { ar: 'متوسط', fr: 'Moyen' },
  gradePoor: { ar: 'ضعيف', fr: 'Faible' },
  acrossActiveCases: { ar: 'عبر {n} قضية نشطة', fr: 'À travers {n} affaire(s) active(s)' },
  caseLabel: { ar: 'قضية', fr: 'Affaire' },
  noUpcomingDates: { ar: 'لا توجد مواعيد قادمة', fr: 'Aucun rendez-vous à venir' },
  overdueLabel: { ar: 'فائت!', fr: 'En retard !' },
  todayLabel: { ar: 'اليوم', fr: "Aujourd'hui" },
  withinDays: { ar: 'خلال {n} أيام', fr: 'Dans {n} jours' },
  moreAppointments: { ar: '+{n} موعد آخر', fr: '+{n} autre(s) rendez-vous' },
  activeF: { ar: 'نشطة', fr: 'Active' },
  pendingF: { ar: 'معلقة', fr: 'En attente' },
  closedF: { ar: 'مغلقة', fr: 'Fermée' },
  casesRegisteredLabel: { ar: 'القضايا المسجلة', fr: 'Affaires enregistrées' },

  // ─── Documents ───
  failedLoadDocuments: { ar: 'تعذر تحميل الوثائق.', fr: 'Échec du chargement des documents' },
  docNotFound: { ar: 'لم يتم العثور على الوثيقة', fr: 'Document introuvable' },
  docDeleteConfirm: {
    ar: 'هل تريد حذف هذه الوثيقة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.',
    fr: 'Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.'
  },
  docDeleted: { ar: 'تم حذف الوثيقة', fr: 'Document supprimé' },
  docDeleteFailed: { ar: 'فشل حذف الوثيقة', fr: 'Échec de la suppression du document' },
  docDownloaded: { ar: 'تم تحميل الوثيقة', fr: 'Document téléchargé' },
  noTagsLabel: { ar: 'لا توجد', fr: 'Aucun' },
  failedOpenFile: { ar: 'تعذر فتح الملف', fr: "Impossible d'ouvrir le fichier" },
  failedLoadFile: { ar: 'تعذر تحميل الملف', fr: 'Impossible de télécharger le fichier' },
  failedSaveNotes: { ar: 'فشل حفظ الملاحظات', fr: "Échec de l'enregistrement des notes" },
  uploadDocTitle: { ar: 'رفع وثيقة', fr: 'Téléverser un document' },
  caseSelectLabel: { ar: 'القضية', fr: 'Affaire' },
  selectCasePlaceholder: { ar: 'اختر القضية...', fr: 'Choisir une affaire...' },
  docTypeLabel: { ar: 'النوع', fr: 'Type' },
  docTagsPlaceholder: { ar: 'عاجل، سري، مهم', fr: 'Urgent, secret, important' },
  selectFileBtn: { ar: 'اختيار ملف ورفعه', fr: 'Sélectionner et téléverser' },
  uploadFileLimit: { ar: 'PDF, DOC, DOCX, JPG, PNG, TXT — حد أقصى 50 MB', fr: 'PDF, DOC, DOCX, JPG, PNG, TXT — max 50 Mo' },
  selectCaseFirst: { ar: 'اختر القضية أولاً', fr: "Choisissez d'abord l'affaire" },
  uploadingLabel: { ar: 'جاري الرفع...', fr: 'Téléversement...' },
  uploadingToast: { ar: 'جاري رفع الملف...', fr: 'Fichier en cours de téléversement...' },
  uploadSuccess: { ar: 'تم رفع {n} ملف بنجاح', fr: '{n} fichier(s) téléversé(s) avec succès' },
  uploadError: { ar: 'حدث خطأ أثناء الرفع', fr: 'Erreur lors du téléversement' },

  // ─── Documents Views ───
  docFinalBadge: { ar: 'نهائي', fr: 'Final' },
  docCountLabel: { ar: '{n} وثيقة', fr: '{n} document(s)' },
  noFoldersLabel: { ar: 'لا توجد مجلدات', fr: 'Aucun dossier' },

  // ─── Clients ───
  failedLoadClients: { ar: 'تعذر تحميل قائمة الموكلين.', fr: 'Échec du chargement des clients' },
  tryAgainLater: { ar: 'حاول مرة أخرى لاحقاً', fr: 'Réessayer plus tard' },
  activeBadge: { ar: 'نشط', fr: 'Actif' },
  newClientTitle: { ar: 'موكل جديد', fr: 'Nouveau client' },
  fullNameLabel: { ar: 'الاسم الكامل', fr: 'Nom complet' },
  phoneLabel: { ar: 'الهاتف', fr: 'Téléphone' },
  emailLabel: { ar: 'البريد الإلكتروني', fr: 'Email' },
  addressLabel: { ar: 'العنوان', fr: 'Adresse' },
  nationalIdLabel: { ar: 'رقم البطاقة الوطنية', fr: 'N° de carte nationale' },
  tagsLabel: { ar: 'تصنيفات (tags)', fr: 'Tags' },
  notesLabel: { ar: 'ملاحظات', fr: 'Notes' },
  duplicateClientPrefix: { ar: 'موكل مكرر: ', fr: 'Client en double: ' },
  nameRequired: { ar: 'الاسم إجباري', fr: 'Nom requis' },
  clientAdded: { ar: 'تم إضافة الموكل بنجاح', fr: 'Client ajouté avec succès' },
  clientAddFailed: { ar: 'فشل إضافة الموكل', fr: "Échec de l'ajout du client" },
  editClientComing: { ar: 'سيتم إضافة تعديل الموكل قريباً', fr: 'Modification client bientôt disponible' },
  archiveClientConfirm: { ar: 'أرشفة هذا الموكل؟', fr: 'Archiver ce client ?' },
  clientArchived: { ar: 'تم أرشفة الموكل', fr: 'Client archivé' },
  clientLabel: { ar: 'موكل', fr: 'Client' },

  // ─── Settings (user management etc.) ───
  editUserTitle: { ar: 'تعديل المستخدم', fr: "Modifier l'utilisateur" },
  userNameLabel: { ar: 'الاسم', fr: 'Nom' },
  userEmailLabel: { ar: 'البريد', fr: 'Email' },
  userRoleLabel: { ar: 'الدور', fr: 'Rôle' },
  userActiveLabel: { ar: 'نشط', fr: 'Actif' },
  userYesLabel: { ar: 'نعم', fr: 'Oui' },
  userNoLabel: { ar: 'لا', fr: 'Non' },
  userPwdPlaceholder: { ar: 'كلمة سر جديدة (اترك فارغاً للإبقاء)', fr: 'Nouveau mot de passe (laisser vide pour conserver)' },
  pwdHashFailed: { ar: 'فشل تشفير كلمة السر', fr: 'Échec du hachage du mot de passe' },
  userUpdateFailed: { ar: 'فشل تحديث المستخدم', fr: 'Échec de la mise à jour' },
  userUpdated: { ar: 'تم تحديث المستخدم بنجاح', fr: 'Utilisateur mis à jour' },
  deleteUserConfirm: { ar: 'حذف هذا المستخدم؟', fr: 'Supprimer cet utilisateur ?' },
  langChangedToArabic: { ar: 'تم تغيير اللغة إلى العربية', fr: 'Langue changée en arabe' },
  newUserTitle: { ar: 'مستخدم جديد', fr: 'Nouvel utilisateur' },
  userPwdLabel: { ar: 'كلمة السر', fr: 'Mot de passe' },
  enterCurrentPwd: { ar: 'الرجاء إدخال كلمة السر الحالية', fr: 'Veuillez entrer le mot de passe actuel' },
  currentPwdWrong: { ar: 'كلمة السر الحالية خطأ', fr: 'Mot de passe actuel incorrect' },
  newPwdMinLength: { ar: 'كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل', fr: 'Le nouveau mot de passe doit avoir au moins 8 caractères' },
  pwdNotMatch: { ar: 'كلمة السر غير متطابقة', fr: 'Les mots de passe ne correspondent pas' },
  pwdSaved: { ar: 'تم حفظ كلمة السر بنجاح', fr: 'Mot de passe enregistré' },
  pwdChanged: { ar: 'تم تغيير كلمة السر بنجاح', fr: 'Mot de passe modifié avec succès' },
  settingsSaved: { ar: 'تم حفظ الإعدادات', fr: 'Paramètres enregistrés' },
  settingsSaveFailed: { ar: 'فشل حفظ الإعدادات', fr: "Échec de l'enregistrement" },
  cleaningRunning: { ar: 'جاري التنظيف...', fr: 'Nettoyage en cours...' },
  cleanedOrphans: { ar: 'تم تنظيف {n} ملفاً يتيماً ({m} MB)', fr: '{n} fichier(s) orphelin(s) nettoyé(s) ({m} MB)' },
  cleanFailed: { ar: 'فشل تنظيف الملفات', fr: 'Échec du nettoyage' },
  backupCreated: { ar: 'تم إنشاء: {n}', fr: 'Sauvegarde créée : {n}' },
  backupCreateFailed: { ar: 'فشل إنشاء النسخة الاحتياطية', fr: 'Échec de la création de la sauvegarde' },
  archiveExported: { ar: 'تم التصدير: {n}', fr: 'Exporté : {n}' },
  archiveExportSuccess: { ar: 'تم تصدير الأرشيف بنجاح', fr: 'Archive exportée avec succès' },
  archiveExportFailed: { ar: 'فشل تصدير الأرشيف', fr: "Échec de l'export" },
  noBackupsList: { ar: 'لا توجد نسخ احتياطية', fr: 'Aucune sauvegarde' },
  backupTypeManual: { ar: 'يدوي', fr: 'Manuelle' },
  backupTypeAuto: { ar: 'تلقائي', fr: 'Automatique' },
  backupTypeArchive: { ar: 'أرشيف', fr: 'Archive' },
  backupFileHeader: { ar: 'الملف', fr: 'Fichier' },
  backupDateHeader: { ar: 'التاريخ', fr: 'Date' },
  backupSizeHeader: { ar: 'الحجم', fr: 'Taille' },
  backupTypeHeader: { ar: 'النوع', fr: 'Type' },
  backupStatusHeader: { ar: 'الحالة', fr: 'Statut' },
  backupActionsHeader: { ar: 'الإجراءات', fr: 'Actions' },
  backupValid: { ar: '✔ صالح', fr: '✔ Valide' },
  backupCorrupt: { ar: '✖ تالف', fr: '✖ Corrompu' },
  backupVerifyBtn: { ar: 'التحقق', fr: 'Vérifier' },
  backupRestoreBtn: { ar: 'استعادة', fr: 'Restaurer' },
  backupDeleteBtn: { ar: 'حذف', fr: 'Supprimer' },
  backupValidToast: { ar: 'النسخة سليمة', fr: 'Sauvegarde valide' },
  backupCorruptToast: { ar: 'النسخة تالفة', fr: 'Sauvegarde corrompue' },
  backupVerifyFailed: { ar: 'فشل التحقق', fr: 'Échec de la vérification' },
  restoreFileInfo: { ar: 'الملف: {n}\nسيتم استبدال جميع البيانات الحالية بنسخة الاحتياطي.', fr: 'Fichier : {n}\nToutes les données seront remplacées.' },
  restoringLabel: { ar: 'جاري الاستعادة...', fr: 'Restauration en cours...' },
  restoreSuccess: { ar: 'تمت استعادة النسخة الاحتياطية بنجاح. تحديث الصفحة...', fr: 'Sauvegarde restaurée. Rechargement...' },
  restoreFailed: { ar: 'فشل الاستعادة: {n}', fr: 'Échec de la restauration : {n}' },
  deleteBackupConfirm: { ar: 'حذف النسخة: {n}؟', fr: 'Supprimer la sauvegarde : {n} ?' },
  backupDeleted: { ar: 'تم حذف النسخة', fr: 'Sauvegarde supprimée' },
  backupDeleteFailed: { ar: 'فشل حذف النسخة', fr: 'Échec de la suppression' },
  failedLoadList: { ar: 'فشل تحميل القائمة', fr: 'Échec du chargement de la liste' },
  alertSettingsSaved: { ar: 'تم حفظ إعدادات التنبيهات', fr: "Paramètres d'alertes enregistrés" },
  logStatsLabel: { ar: '{n} مدخلة | {s}KB', fr: '{n} entrées | {s}KB' },
  logsExported: { ar: 'تم تصدير السجلات بنجاح', fr: 'Journaux exportés avec succès' },
  logsExportFailed: { ar: 'فشل تصدير السجلات', fr: "Échec de l'export" },
  clearLogsConfirm: { ar: 'مسح جميع سجلات الأخطاء؟', fr: 'Effacer tous les journaux ?' },
  logsCleared: { ar: 'تم مسح السجلات', fr: 'Journaux effacés' },
  logsClearFailed: { ar: 'فشل مسح السجلات', fr: "Échec de l'effacement" },
  loadMoreBtn: { ar: 'تحميل المزيد', fr: 'Charger plus' },
  inactiveBadge: { ar: 'غير نشط', fr: 'Inactif' },

  // ─── Cases Views ───
  noCasesInList: { ar: 'لا توجد قضايا', fr: 'Aucune affaire' },
  createFirstCase: { ar: 'أنشئ قضيتك الأولى لبدء التنظيم', fr: 'Créez votre première affaire' },
  defaultPriority: { ar: 'عادي', fr: 'Normal' },
  caseRestored: { ar: 'تم إرجاع القضية', fr: 'Affaire restaurée' },
  caseArchivedToast: { ar: 'تم أرشفة القضية', fr: 'Affaire archivée' },
  archiveToggleFailed: { ar: 'فشل تغيير حالة الأرشفة', fr: "Échec du changement d'état" },
  deleteCaseConfirm: { ar: 'حذف هذه القضية؟', fr: 'Supprimer cette affaire ?' },
  caseDeleted: { ar: 'تم حذف القضية', fr: 'Affaire supprimée' },
  caseDeleteFailed: { ar: 'فشل حذف القضية', fr: 'Échec de la suppression' },
  caseInfoLabel: { ar: 'معلومات القضية', fr: 'Informations' },
  clientInfoLabel: { ar: 'الموكل', fr: 'Client' },
  courtInfoLabel: { ar: 'المحكمة', fr: 'Tribunal' },
  typeInfoLabel: { ar: 'النوع', fr: 'Type' },
  priorityInfoLabel: { ar: 'الأولوية', fr: 'Priorité' },
  openDateInfoLabel: { ar: 'تاريخ الفتح', fr: "Date d'ouverture" },
  lastActivityInfoLabel: { ar: 'آخر نشاط', fr: 'Dernière activité' },
  quickActionsCaseLabel: { ar: 'إجراءات سريعة', fr: 'Actions rapides' },
  docQuickActionLabel: { ar: 'وثيقة', fr: 'Document' },
  hearingQuickActionLabel: { ar: 'جلسة', fr: 'Audience' },
  taskQuickActionLabel: { ar: 'مهمة', fr: 'Tâche' },
  noteQuickActionLabel: { ar: 'ملاحظة', fr: 'Note' },
  expenseQuickActionLabel: { ar: 'مصروف', fr: 'Dépense' },
  timelineAILabel: { ar: 'Timeline AI', fr: 'Timeline IA' },
  riskAILabel: { ar: 'مخاطر AI', fr: 'Risques IA' },
  chatAILabel: { ar: 'محادثة AI', fr: 'Chat IA' },
  noRecentDocs: { ar: 'لا توجد', fr: 'Aucun' },
  financialSummaryLabel: { ar: 'الملخص المالي', fr: 'Résumé financier' },
  feesAmount: { ar: 'الأتعاب', fr: 'Honoraires' },
  paidAmount: { ar: 'المدفوع', fr: 'Payé' },
  remainingAmount: { ar: 'المتبقي', fr: 'Restant' },
  noActivityRecorded: { ar: 'لا توجد نشاطات مسجلة', fr: 'Aucune activité' },
  failedLoadTimeline: { ar: 'تعذر تحميل الجدول الزمني.', fr: 'Échec du chargement' },
  docTypeOpening: { ar: 'مقال افتتاحي', fr: 'Acte introductif' },
  docTypeResponse: { ar: 'مذكرة جوابية', fr: 'Mémoire en réponse' },
  docTypeEvidence: { ar: 'حجة وإثبات', fr: 'Preuve' },
  docTypeJudgment: { ar: 'حكم أو قرار', fr: 'Jugement' },
  docTypeContract: { ar: 'عقد', fr: 'Contrat' },
  docTypeReport: { ar: 'تقرير', fr: 'Rapport' },
  docTypeOther: { ar: 'أخرى', fr: 'Autre' },
  uploadBtnLabel: { ar: 'رفع', fr: 'Upload' },
  docCount: { ar: '{n} وثيقة', fr: '{n} document(s)' },
  aiSummaryLabel: { ar: 'تلخيص AI', fr: 'Résumé IA' },
  filePathError: { ar: 'تعذر الحصول على مسار الملف', fr: 'Chemin introuvable' },
  fileUploadError: { ar: 'حدث خطأ أثناء رفع الملف', fr: 'Erreur de téléversement' },
  newHearingBtn: { ar: 'جلسة جديدة', fr: 'Nouvelle audience' },
  upcomingBadge: { ar: 'قادمة', fr: 'À venir' },
  pastBadge: { ar: 'سابقة', fr: 'Passée' },
  noHearingsLabel: { ar: 'لا توجد جلسات', fr: 'Aucune audience' },
  hearingSession: { ar: 'جلسة', fr: 'Audience' },
  hearingPleading: { ar: 'مرافعة', fr: 'Plaidoirie' },
  hearingDeliberation: { ar: 'تأجيل للنطق', fr: 'Mise en délibéré' },
  hearingNotesLabel: { ar: 'ملاحظات', fr: 'Notes' },
  hearingAddFailed: { ar: 'فشل إضافة الجلسة', fr: "Échec d'ajout" },
  newTaskBtn: { ar: 'مهمة جديدة', fr: 'Nouvelle tâche' },
  taskTitleLabel: { ar: 'العنوان', fr: 'Titre' },
  taskPriorityLabel: { ar: 'الأولوية', fr: 'Priorité' },
  taskDueDateLabel: { ar: 'تاريخ الاستحقاق', fr: 'Échéance' },
  taskTitleRequired: { ar: 'العنوان إجباري', fr: 'Titre requis' },
  taskAddFailed: { ar: 'فشل إضافة المهمة', fr: "Échec d'ajout" },
  boldLabel: { ar: 'عريض', fr: 'Gras' },
  italicLabel: { ar: 'مائل', fr: 'Italique' },
  listLabel: { ar: 'قائمة', fr: 'Liste' },
  notesPlaceholderText: { ar: 'اكتب ملاحظاتك هنا...', fr: 'Écrivez vos notes ici...' },
  notesSaveFailed: { ar: 'فشل حفظ الملاحظات', fr: "Échec d'enregistrement" },
  notSavedYet: { ar: 'لم يتم الحفظ بعد...', fr: 'Pas enregistré...' },
  addPaymentBtn: { ar: 'إضافة دفعة', fr: 'Ajouter un paiement' },
  paymentDateLabel: { ar: 'التاريخ', fr: 'Date' },
  paymentAmountLabel: { ar: 'المبلغ', fr: 'Montant' },
  paymentModeLabel: { ar: 'طريقة الدفع', fr: 'Mode de paiement' },
  paymentCash: { ar: 'نقداً', fr: 'Espèces' },
  paymentBank: { ar: 'تحويل بنكي', fr: 'Virement' },
  paymentCheque: { ar: 'شيك', fr: 'Chèque' },
  paymentNotesLabel: { ar: 'ملاحظات', fr: 'Notes' },
  paymentAmountRequired: { ar: 'المبلغ إجباري', fr: 'Montant requis' },
  paymentAddFailed: { ar: 'فشل إضافة الدفعة', fr: "Échec d'ajout" },
  contactClientRole: { ar: 'الموكل', fr: 'Client' },
  contactOpposing: { ar: 'المحامي المقابل', fr: 'Avocat adverse' },
  contactWitnesses: { ar: 'الشهود', fr: 'Témoins' },
  contactExperts: { ar: 'الخبراء', fr: 'Experts' },
  failedLoadContacts: { ar: 'تعذر تحميل جهات الاتصال.', fr: 'Échec du chargement' },
  analyticsHearings: { ar: 'الجلسات', fr: 'Audiences' },
  analyticsDocs: { ar: 'الوثائق', fr: 'Documents' },
  analyticsExpenses: { ar: 'المصاريف', fr: 'Dépenses' },
  analyticsTaskCompletion: { ar: 'إنجاز المهام', fr: 'Tâches' },
  failedLoadAnalytics: { ar: 'تعذر تحميل التحليلات.', fr: 'Échec du chargement' },
  aiContextualQuestion: { ar: 'اطرح سؤالاً حول هذه القضية — التحليل السياقي متاح', fr: 'Question contextuelle disponible' },
  aiInputPlaceholder: { ar: 'اسأل عن القضية...', fr: 'Interrogez...' },
  aiLoadingMsg: { ar: '🤖 جاري التحليل...', fr: '🤖 Analyse...' },
  aiErrorMsg: { ar: 'حدث خطأ في الاتصال بالمساعد الذكي. حاول مرة أخرى.', fr: 'Erreur IA. Réessayez.' },

  // ─── Calendar ───
  failedLoadCalendar: { ar: 'تعذر تحميل التقويم.', fr: 'Échec du chargement' },
  eventTypeHearing: { ar: 'جلسة', fr: 'Audience' },
  eventTypeDeadline: { ar: 'موعد نهائي', fr: 'Date limite' },
  eventTypeMeeting: { ar: 'اجتماع', fr: 'Réunion' },
  eventTypeTask: { ar: 'مهمة', fr: 'Tâche' },
  eventTypeDocument: { ar: 'تقديم وثائق', fr: 'Documents' },
  eventTypePayment: { ar: 'دفعة', fr: 'Paiement' },
  eventStatusScheduled: { ar: 'مجدول', fr: 'Programmé' },
  eventStatusPostponed: { ar: 'مؤجل', fr: 'Reporté' },
  eventStatusCompleted: { ar: 'مكتمل', fr: 'Terminé' },
  eventStatusCancelled: { ar: 'ملغي', fr: 'Annulé' },
  editEventTitle: { ar: 'تعديل الحدث', fr: "Modifier l'événement" },
  newEventTitle: { ar: 'حدث جديد', fr: 'Nouvel événement' },
  eventTitleLabel: { ar: 'العنوان', fr: 'Titre' },
  eventTitlePlaceholder: { ar: 'عنوان الحدث', fr: "Titre de l'événement" },
  eventCaseLabel: { ar: 'القضية', fr: 'Affaire' },
  eventOptional: { ar: '-- اختياري --', fr: '-- Optionnel --' },
  eventClientLabel: { ar: 'الموكل', fr: 'Client' },
  eventTypeLabel: { ar: 'النوع', fr: 'Type' },
  eventStatusLabel: { ar: 'الحالة', fr: 'Statut' },
  eventDateLabel: { ar: 'التاريخ', fr: 'Date' },
  eventFromLabel: { ar: 'من', fr: 'De' },
  eventToLabel: { ar: 'إلى', fr: 'À' },
  eventCourtLabel: { ar: 'المحكمة', fr: 'Tribunal' },
  eventJudgeLabel: { ar: 'القاضي', fr: 'Juge' },
  eventRoomLabel: { ar: 'الغرفة', fr: 'Salle' },
  eventUrgencyLow: { ar: 'منخفضة', fr: 'Basse' },
  eventUrgencyMedium: { ar: 'متوسطة', fr: 'Moyenne' },
  eventUrgencyHigh: { ar: 'عالية', fr: 'Haute' },
  eventUrgencyCritical: { ar: 'حرجة', fr: 'Critique' },
  eventRecurNone: { ar: 'بدون', fr: 'Aucun' },
  eventRecurDaily: { ar: 'يومي', fr: 'Quotidien' },
  eventRecurWeekly: { ar: 'أسبوعي', fr: 'Hebdomadaire' },
  eventRecurMonthly: { ar: 'شهري', fr: 'Mensuel' },
  eventRecurYearly: { ar: 'سنوي', fr: 'Annuel' },
  eventNotesPlaceholder: { ar: 'ملاحظات', fr: 'Notes' },
  eventOutcomeLabel: { ar: 'النتيجة (للجلسات المنجزة)', fr: 'Résultat (audiences)' },
  eventTitleRequired: { ar: 'العنوان مطلوب', fr: 'Titre requis' },
  eventDateRequired: { ar: 'التاريخ مطلوب', fr: 'Date requise' },
  eventSaveFailed: { ar: 'فشل حفظ الحدث', fr: "Échec d'enregistrement" },
  eventLoadError: { ar: 'حدث خطأ أثناء تحميل الحدث', fr: 'Erreur de chargement' },
  eventNotFound: { ar: 'الحدث غير موجود', fr: 'Événement introuvable' },
  eventInfoLabel: { ar: 'معلومات الحدث', fr: 'Informations' },
  eventLinkLabel: { ar: 'الارتباط', fr: 'Lien' },
  eventNotesHeading: { ar: 'ملاحظات', fr: 'Notes' },
  eventOutcomeHeading: { ar: 'النتيجة', fr: 'Résultat' },
  deleteEventConfirm: { ar: 'حذف هذا الحدث؟', fr: 'Supprimer ?' },
  eventDeleteFailed: { ar: 'فشل حذف الحدث', fr: 'Échec de suppression' },

  // ─── Search ───
  noResultsLabel: { ar: 'لا توجد نتائج', fr: 'Aucun résultat' },
  groupCases: { ar: 'القضايا', fr: 'Affaires' },
  groupClients: { ar: 'الموكلين', fr: 'Clients' },
  groupHearings: { ar: 'الجلسات', fr: 'Audiences' },
  groupDocuments: { ar: 'الوثائق', fr: 'Documents' },
  groupTasks: { ar: 'المهام', fr: 'Tâches' },
  groupExpenses: { ar: 'المصاريف', fr: 'Dépenses' },
  navHint: { ar: 'تنقل', fr: 'Naviguer' },
  openHint: { ar: 'فتح', fr: 'Ouvrir' },
  closeHint: { ar: 'إغلاق', fr: 'Fermer' },
  cmdDashboard: { ar: 'لوحة القيادة', fr: 'Tableau de bord' },
  cmdDashboardSub: { ar: 'الانتقال إلى dashboard', fr: 'Accueil' },
  cmdCases: { ar: 'القضايا', fr: 'Affaires' },
  cmdCasesSub: { ar: 'عرض جميع القضايا', fr: 'Voir les affaires' },
  cmdClients: { ar: 'الموكلين', fr: 'Clients' },
  cmdClientsSub: { ar: 'عرض جميع الموكلين', fr: 'Voir les clients' },
  cmdDocs: { ar: 'الوثائق', fr: 'Documents' },
  cmdDocsSub: { ar: 'إدارة الوثائق والملفات', fr: 'Gérer les documents' },
  cmdCalendar: { ar: 'التقويم', fr: 'Calendrier' },
  cmdCalendarSub: { ar: 'عرض الجلسات والمواعيد', fr: 'Voir le calendrier' },
  cmdTasks: { ar: 'المهام', fr: 'Tâches' },
  cmdTasksSub: { ar: 'إدارة المهام', fr: 'Gérer les tâches' },
  cmdAdvancedSearch: { ar: 'البحث المتقدم', fr: 'Recherche avancée' },
  cmdAdvancedSearchSub: { ar: 'بحث شامل في جميع البيانات', fr: 'Recherche complète' },
  cmdSettings: { ar: 'الإعدادات', fr: 'Paramètres' },
  cmdSettingsSub: { ar: 'تعديل الإعدادات', fr: 'Modifier' },
  cmdReports: { ar: 'التقارير', fr: 'Rapports' },
  cmdReportsSub: { ar: 'التقارير والإحصائيات', fr: 'Statistiques' },
  cmdAI: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  cmdAISub: { ar: 'AI Assistant', fr: 'Assistant IA' },
  cmdExpenses: { ar: 'المصاريف', fr: 'Dépenses' },
  cmdExpensesSub: { ar: 'عرض المصاريف والمدفوعات', fr: 'Voir les dépenses' },
  cmdArchive: { ar: 'الأرشيف', fr: 'Archive' },
  cmdArchiveSub: { ar: 'القضايا المؤرشفة', fr: 'Affaires archivées' },
  cmdNewCase: { ar: 'قضية جديدة', fr: 'Nouvelle affaire' },
  cmdNewCaseSub: { ar: 'إنشاء قضية جديدة', fr: 'Créer une affaire' },
  cmdNewClient: { ar: 'موكل جديد', fr: 'Nouveau client' },
  cmdNewClientSub: { ar: 'إضافة موكل جديد', fr: 'Ajouter un client' },
  cmdUploadDoc: { ar: 'رفع وثيقة', fr: 'Téléverser' },
  cmdUploadDocSub: { ar: 'تحميل مستند جديد', fr: 'Nouveau document' },
  cmdNewTask: { ar: 'مهمة جديدة', fr: 'Nouvelle tâche' },
  cmdNewTaskSub: { ar: 'إضافة مهمة جديدة', fr: 'Ajouter une tâche' },
  cmdNewHearing: { ar: 'جلسة جديدة', fr: 'Nouvelle audience' },
  cmdNewHearingSub: { ar: 'تسجيل جلسة جديدة', fr: 'Enregistrer' },
  cmdCreateBackup: { ar: 'إنشاء نسخة احتياطية', fr: 'Sauvegarder' },
  cmdCreateBackupSub: { ar: 'Backup يدوي', fr: 'Sauvegarde manuelle' },
  cmdIntegrityCheck: { ar: 'التحقق من سلامة البيانات', fr: 'Vérification' },
  cmdIntegrityCheckSub: { ar: 'Integrity Check', fr: 'Vérification intégrité' },
  cmdRepairData: { ar: 'إصلاح البيانات', fr: 'Réparation' },
  cmdRepairDataSub: { ar: 'Repair Orphans', fr: 'Réparation orphelins' },
  cmdViewDashboard: { ar: 'عرض لوحة المعلومات', fr: 'Dashboard' },
  cmdViewDashboardSub: { ar: 'Dashboard', fr: 'Tableau de bord' },
  cmdNavCategory: { ar: 'التنقل', fr: 'Navigation' },
  cmdCreateCategory: { ar: 'إنشاء', fr: 'Créer' },
  cmdQuickActionsCategory: { ar: 'إجراءات سريعة', fr: 'Actions rapides' },
  cmdRecentItems: { ar: 'آخر العناصر', fr: 'Récemment' },
  cmdEmptyTitle: { ar: 'ابدأ الكتابة للبحث...', fr: 'Commencez à chercher...' },
  cmdEmptyDesc: { ar: 'ابحث عن قضايا، موكلين، وثائق، مهام، أو اكتب أمراً', fr: 'Cherchez des affaires, clients, documents...' },
  cmdNoResults: { ar: 'لا توجد نتائج لـ "{q}"', fr: 'Aucun résultat pour "{q}"' },
  cmdTryDifferent: { ar: 'جرب كلمات مختلفة أو استخدم البحث المتقدم', fr: "Essayez d'autres mots" },

  // ─── Clients Views remaining ───
  noResultsSearch: { ar: 'لا توجد نتائج', fr: 'Aucun résultat' },
  searchClientsHint: { ar: 'ابحث باسم أو رقم هاتف أو بريد إلكتروني', fr: 'Cherchez par nom, téléphone, email' },
  deleteClientConfirm: { ar: 'حذف هذا الموكل؟', fr: 'Supprimer ce client ?' },
  clientDeleteFailed: { ar: 'فشل حذف الموكل', fr: 'Échec de suppression' },
  casesCountLabel: { ar: '{n} قضايا', fr: '{n} affaire(s)' },
  noClientsLabel: { ar: 'لا يوجد موكلون', fr: 'Aucun client' },
  addFirstClient: { ar: 'أضف موكلك الأول لتبدأ', fr: 'Ajoutez votre premier client' },
  segmentActive: { ar: 'نشطون', fr: 'Actifs' },
  segmentNew: { ar: 'جدد', fr: 'Nouveaux' },
  segmentMultipleCases: { ar: 'قضايا متعددة', fr: 'Multi-affaires' },
  segmentHighValue: { ar: 'ذوو قيمة', fr: 'Haute valeur' },
  zeroLabel: { ar: 'لا يوجد', fr: 'Aucun' },
  casesPlural: { ar: 'قضايا', fr: 'Affaires' },
  paidLabel: { ar: 'مدفوع', fr: 'Payé' },
  remainingLabel: { ar: 'متبقي', fr: 'Restant' },
  quickActionsLabel: { ar: 'إجراءات سريعة', fr: 'Actions rapides' },
  caseQuickAction: { ar: 'قضية', fr: 'Affaire' },
  commQuickAction: { ar: 'اتصال', fr: 'Contact' },
  docQuickAction: { ar: 'وثيقة', fr: 'Document' },
  noteQuickAction: { ar: 'ملاحظة', fr: 'Note' },
  contactInfoLabel: { ar: 'معلومات الاتصال', fr: 'Contact' },
  lastContactLabel: { ar: 'آخر اتصال', fr: 'Dernier contact' },
  noActivityLabel: { ar: 'لا توجد', fr: 'Aucun' },
  newCaseBtn: { ar: 'قضية جديدة', fr: 'Nouvelle affaire' },
  caseNumberHeader: { ar: 'رقم القضية', fr: "N° d'affaire" },
  subjectHeader: { ar: 'الموضوع', fr: 'Objet' },
  courtHeader: { ar: 'المحكمة', fr: 'Tribunal' },
  statusHeader: { ar: 'الحالة', fr: 'Statut' },
  priorityHeader: { ar: 'الأولوية', fr: 'Priorité' },
  noCasesForClient: { ar: 'لا توجد قضايا لهذا الموكل', fr: 'Aucune affaire' },
  noDocsLabel: { ar: 'لا توجد وثائق', fr: 'Aucun document' },
  newCommLabel: { ar: 'اتصال جديد', fr: 'Nouveau contact' },
  noCommsLabel: { ar: 'لا توجد اتصالات', fr: 'Aucun contact' },
  commTypeLabel: { ar: 'النوع', fr: 'Type' },
  commCall: { ar: 'مكالمة', fr: 'Appel' },
  commEmail: { ar: 'بريد', fr: 'Email' },
  commMeeting: { ar: 'اجتماع', fr: 'Réunion' },
  commMessage: { ar: 'رسالة', fr: 'Message' },
  commDateLabel: { ar: 'التاريخ', fr: 'Date' },
  commSummaryLabel: { ar: 'الملخص', fr: 'Résumé' },
  commAddFailed: { ar: 'فشل إضافة الاتصال', fr: 'Échec' },
  feesLabel: { ar: 'الأتعاب', fr: 'Honoraires' },
  noPaymentsLabel: { ar: 'لا توجد مدفوعات', fr: 'Aucun paiement' },
  noActivitiesLabel: { ar: 'لا توجد نشاطات مسجلة', fr: 'Aucune activité' },
  notesPlaceholderLong: { ar: 'ملاحظات داخلية، تقييم المخاطر، استراتيجية...', fr: 'Notes internes, risques, stratégie...' },
  totalCasesAnalytics: { ar: 'إجمالي القضايا', fr: 'Total affaires' },
  activeClosedLabel: { ar: 'نشطة / مغلقة', fr: 'Active / Fermée' },
  financialContribution: { ar: 'المساهمة المالية', fr: 'Contribution' },
  activityIndicator: { ar: 'مؤشر النشاط', fr: 'Activité' },
  openBtnTooltip: { ar: 'فتح', fr: 'Ouvrir' },
  callBtn: { ar: 'اتصال', fr: 'Appeler' },
  emailBtn: { ar: 'بريد', fr: 'Email' },
  recentActivityLabel: { ar: 'آخر النشاطات', fr: 'Activités récentes' },
  eventPriorityLabel: { ar: 'الأولوية', fr: 'Priorité' },
  eventRepeatLabel: { ar: 'تكرار', fr: 'Répétition' },
  moreEventsLabel: { ar: 'أكثر', fr: 'Plus' },
  calendarTimeHeader: { ar: 'الوقت', fr: 'Heure' },
  eventAllDayLabel: { ar: 'كل اليوم', fr: 'Toute la journée' },
  exampleCaseNumber: { ar: 'مثال: 2024/123', fr: 'Ex: 2024/123' },
  subjectPlaceholder: { ar: 'موضوع القضية', fr: 'Objet du dossier' },
  selectPlaceholder: { ar: '-- اختر --', fr: '-- Choisir --' },
  opponentPlaceholder: { ar: 'الطرف المقابل', fr: 'Partie adverse' },

  // ─── Profile ───
  profileTitle: { ar: 'الملف الشخصي', fr: 'Profil' },
  profileDesc: { ar: 'معلومات المحامي والإعدادات الشخصية', fr: 'Informations et paramètres personnels' },
  profilePersonalInfo: { ar: 'معلومات شخصية', fr: 'Informations personnelles' },
  profileProfessionalInfo: { ar: 'معلومات مهنية', fr: 'Informations professionnelles' },
  profileSecurity: { ar: 'الأمان', fr: 'Sécurité' },
  profileBarNumber: { ar: 'رقم القيد', fr: "N° d'inscription au barreau" },
  profileCity: { ar: 'المدينة', fr: 'Ville' },
  profileSpecialties: { ar: 'التخصصات', fr: 'Spécialités' },
  profileExperience: { ar: 'سنوات الخبرة', fr: "Années d'expérience" },
  profileApiKey: { ar: 'مفتاح API', fr: 'Clé API' },
  profileApiKeyNotSet: { ar: 'غير مضبوط', fr: 'Non configuré' },
  profileApiKeySet: { ar: 'مضبوط', fr: 'Configuré' },
  profileLastLogin: { ar: 'آخر دخول', fr: 'Dernière connexion' },
  profileRecentActivity: { ar: 'آخر النشاطات', fr: 'Activités récentes' },
  profileChangePhoto: { ar: 'تغيير الصورة', fr: 'Changer la photo' },
  savedSuccessfully: { ar: 'تم الحفظ بنجاح', fr: 'Enregistré avec succès' },
  licenseTitle: { ar: 'تفعيل الترخيص', fr: 'Activation de la licence' },
  licenseSub: { ar: 'أدخل مفتاح التفعيل لبدء استخدام LexOffece', fr: "Entrez la clé d'activation pour utiliser LexOffece" },
  licenseActivation: { ar: 'تفعيل الترخيص', fr: 'Activation de la licence' },
  licenseActivationDesc: { ar: 'الرجاء إدخال مفتاح الترخيص الخاص بك', fr: 'Veuillez entrer votre clé de licence' },
  licenseActivateBtn: { ar: 'تفعيل', fr: 'Activer' },
  licenseKeyPlaceholder: { ar: 'XXXX-XXXX-XXXX-XXXX', fr: 'XXXX-XXXX-XXXX-XXXX' },
  licenseChecking: { ar: 'جارٍ التحقق من الترخيص...', fr: 'Vérification de la licence...' },
  licenseActivating: { ar: 'جارٍ التفعيل...', fr: 'Activation en cours...' },
  licenseInvalidKey: { ar: 'مفتاح الترخيص غير صالح', fr: 'Clé de licence invalide' },
  licenseActivationFailed: { ar: 'فشل التفعيل. تحقق من المفتاح وحاول مرة أخرى.', fr: "Échec de l'activation. Vérifiez la clé et réessayez." },
  licenseActivationSuccess: { ar: 'تم التفعيل بنجاح!', fr: 'Activée avec succès !' },
  licenseAlreadyActivated: { ar: 'الترخيص مفعل بالفعل على هذا الجهاز', fr: 'Licence déjà activée sur cet appareil' },
  licenseOffline: { ar: 'لا يمكن التحقق من الترخيص (الرجاء الاتصال بالإنترنت)', fr: 'Impossible de vérifier la licence (veuillez vous connecter à Internet)' },
  licenseGraceDays: { ar: 'متبقي {{days}} يوم من فترة السماح', fr: '{{days}} jours restants de la période de grâce' },
  licenseServerError: { ar: 'تعذر الاتصال بخادم الترخيص', fr: 'Impossible de contacter le serveur de licence' },
  licenseSkip: { ar: 'تخطي (وضع التطوير)', fr: 'Ignorer (mode développement)' },
  licenseDeactivated: { ar: 'تم إلغاء تفعيل الترخيص', fr: 'Licence désactivée' },
  navLicense: { ar: 'الترخيص', fr: 'Licence' },
  licenseManageDesc: { ar: 'معلومات الترخيص على هذا الجهاز', fr: 'Informations de licence sur cet appareil' },
  licenseCurrentStatus: { ar: 'حالة الترخيص', fr: 'Statut de la licence' },
  licenseDeactivateBtn: { ar: 'إلغاء التفعيل', fr: 'Désactiver la licence' },
  licenseBack: { ar: 'رجوع', fr: 'Retour' },
  licenseDeactivateConfirm: { ar: 'هل تريد إلغاء تفعيل الترخيص على هذا الجهاز؟', fr: 'Voulez-vous désactiver la licence sur cet appareil ?' },
  licenseDeactivateSuccess: { ar: 'تم إلغاء التفعيل بنجاح', fr: 'Licence désactivée avec succès' },
  licenseValidStatus: { ar: 'الترخيص مفعل', fr: 'Licence activée' },
  licenseKeyLabel: { ar: 'المفتاح:', fr: 'Clé:' },
  licenseDeviceLabel: { ar: 'الجهاز:', fr: 'Appareil:' },
  licenseGraceLabel: { ar: 'فترة السماح:', fr: 'Période de grâce:' },
  caseDuplicateNumberArchived: { ar: 'رقم القضية "{n}" موجود في الأرشيف. هل تريد استخدام رقم مختلف؟', fr: 'Le numéro « {n} » existe dans les archives. Souhaitez-vous utiliser un numéro différent ?' },
  newCaseTitle: { ar: 'إضافة قضية جديدة', fr: 'Ajouter un dossier' },
  caseNumberLabel: { ar: 'رقم القضية', fr: "N° d'affaire" },
  caseTypeLabel: { ar: 'نوع القضية', fr: 'Type de dossier' },
  filterCourtPlaceholder: { ar: 'المحكمة', fr: 'Tribunal' },
  filterClientPlaceholder: { ar: 'الموكل', fr: 'Client' },
  aiTimelinePrompt: { ar: 'أنشئ جدولاً زمنياً لهذه القضية', fr: 'Générer une chronologie pour cette affaire' },
  aiRiskPrompt: { ar: 'حلل المخاطر القانونية لهذه القضية', fr: 'Analyser les risques juridiques de cette affaire' },
  aiSummarizePrompt: { ar: 'لخص "{docName}"', fr: 'Résumez "{docName}"' },
  caseTypeCivil: { ar: 'مدني', fr: 'Civil' },
  caseTypeCommercial: { ar: 'تجاري', fr: 'Commercial' },
  caseTypeAdministrative: { ar: 'إداري', fr: 'Administratif' },
  caseTypeCriminal: { ar: 'جنائي', fr: 'Pénal' },
  caseTypePersonalStatus: { ar: 'أحوال شخصية', fr: 'Statut personnel' },
  caseTypeSocial: { ar: 'اجتماعي', fr: 'Social' },
  caseTypeRealEstate: { ar: 'عقاري', fr: 'Immobilier' },
  clientSelectLabel: { ar: 'اختر الموكل', fr: 'Sélectionner le client' },
  courtSelectLabel: { ar: 'اختر المحكمة', fr: 'Sélectionner le tribunal' },
  court1stInstance: { ar: 'محكمة الدرجة الأولى', fr: 'Tribunal de première instance' },
  courtAppeal: { ar: 'محكمة الاستئناف', fr: "Cour d'appel" },
  courtCassation: { ar: 'محكمة النقض', fr: 'Cour de cassation' },
  courtCommercial: { ar: 'المحكمة التجارية', fr: 'Tribunal de commerce' },
  courtAdmin: { ar: 'المحكمة الإدارية', fr: 'Tribunal administratif' },
  courtSupreme: { ar: 'المجلس الأعلى', fr: 'Conseil suprême' },
  deadlineDateLabel: { ar: 'تاريخ الأجل', fr: "Date d'échéance" },
  openDateLabel: { ar: 'تاريخ الفتح', fr: "Date d'ouverture" },
  feesLabelCase: { ar: 'الأتعاب', fr: 'Honoraires' },
  notesLabelCase: { ar: 'ملاحظات', fr: 'Notes' },
  subjectLabel: { ar: 'الموضوع', fr: 'Objet' },
  caseCreated: { ar: 'تمت إضافة القضية بنجاح', fr: 'Dossier ajouté avec succès' },
  caseCreateFailed: { ar: 'فشل إنشاء القضية', fr: 'Échec de la création du dossier' },
  caseFieldsRequired: { ar: 'رقم القضية والعنوان مطلوبان', fr: 'Le numéro et le titre sont requis' },
  archiveCaseConfirm: { ar: 'هل تريد أرشفة هذه القضية؟', fr: 'Voulez-vous archiver ce dossier ?' },
  caseArchivedSuccess: { ar: 'تمت الأرشفة بنجاح', fr: 'Dossier archivé avec succès' },
  archiveFailed: { ar: 'فشل الأرشفة', fr: "Échec de l'archivage" },
  editCaseComing: { ar: 'تعديل القضية قيد التطوير', fr: 'Modification du dossier en développement' },
  failedLoad: { ar: 'تعذر التحميل', fr: 'Échec du chargement' },
  failedLoadCases: { ar: 'تعذر تحميل القضايا.', fr: 'Échec du chargement des dossiers' },
  noUrgentTasks: { ar: 'لا توجد مهام عاجلة', fr: 'Aucune tâche urgente' },
  noUpcomingLabel: { ar: 'لا توجد مواعيد قادمة', fr: 'Aucun rendez-vous à venir' },
  noTomorrowHearings: { ar: 'لا توجد جلسات غداً', fr: "Aucune audience demain" },
  revenueLabel: { ar: 'الإيرادات', fr: 'Revenus' },
  assignedToLabel: { ar: 'مسند إلى', fr: 'Assigné à' },
  taskDescLabel: { ar: 'الوصف', fr: 'Description' },
  editTask: { ar: 'تعديل المهمة', fr: 'Modifier la tâche' },
  priority_high: { ar: 'مرتفع', fr: 'Haute' },
  priority_critical: { ar: 'حرج', fr: 'Critique' },
  keyboardShortcuts: { ar: 'اختصارات لوحة المفاتيح', fr: 'Raccourcis clavier' },
  helpCmdPalette: { ar: 'لوحة الأوامر', fr: 'Palette de commandes' },
  helpShortcuts: { ar: 'عرض الاختصارات', fr: 'Afficher les raccourcis' },

  // ─── Clients Edit ───
  editClientTitle: { ar: 'تعديل الموكل', fr: 'Modifier le client' },

  // ─── Notifications ───
  notifDeadlineFormat: { ar: 'أجل قضية {case} — {text}', fr: 'Échéance affaire {case} — {text}' },
  notifHearingFormat: { ar: 'جلسة {case} — {text}', fr: 'Audience {case} — {text}' },
  notifTodayText: { ar: 'اليوم', fr: "Aujourd'hui" },
  notifAfterDays: { ar: 'بعد {n} يوم', fr: 'Dans {n} jour(s)' },

  // ─── Autosave ───
  autosaveAllSaved: { ar: 'تم حفظ جميع التعديلات', fr: 'Toutes les modifications ont été enregistrées' },

  // ─── IPC Cache ───
  communicationError: { ar: 'حدث خطأ في الاتصال: ', fr: 'Erreur de communication : ' },

  // ─── Profile ───
  profileDefaultAvatar: { ar: 'م', fr: 'M' },
  profileImageSizeError: { ar: 'حجم الصورة يجب أن لا يتجاوز 1 ميغابايت', fr: "La taille de l'image ne doit pas dépasser 1 Mo" },
  profileImageChanged: { ar: 'تم تغيير الصورة بنجاح', fr: 'Photo changée avec succès' },
  profileImageSaveFailed: { ar: 'فشل حفظ الصورة', fr: "Échec de la sauvegarde de la photo" },
  profileImageSaveError: { ar: 'خطأ في حفظ الصورة', fr: "Erreur lors de la sauvegarde de la photo" },
  profileSaveFailed: { ar: 'فشل الحفظ', fr: "Échec de l'enregistrement" },
  profileSaveError: { ar: 'خطأ في الحفظ', fr: "Erreur lors de l'enregistrement" },
  profileCurrentPwdRequired: { ar: 'كلمة السر الحالية مطلوبة', fr: 'Mot de passe actuel requis' },
  profilePwdChangeFailed: { ar: 'فشل تغيير كلمة السر', fr: 'Échec du changement de mot de passe' },
  profilePwdChangeError: { ar: 'خطأ في تغيير كلمة السر', fr: "Erreur lors du changement de mot de passe" },
  profileMasterKeyUnavailable: { ar: 'غير متاح', fr: 'Non disponible' },
  profileMasterKeyError: { ar: 'خطأ', fr: 'Erreur' },

  // ─── Settings ───
  userPwdGeneratePlaceholder: { ar: 'اتركه فارغاً لتوليد كلمة سر عشوائية', fr: 'Laissez vide pour générer un mot de passe aléatoire' },

  // ─── Shared / Error states ───
  retryLabel: { ar: 'إعادة المحاولة', fr: 'Réessayer' },

  // ─── Auth / Setup ───
  setupStepProgress: { ar: 'الخطوة {n} من 3', fr: 'Étape {n} sur 3' },
  pinValidationError: { ar: 'PIN يجب أن يكون 4-6 أرقام', fr: 'Le PIN doit contenir 4 à 6 chiffres' },
  pinNoMatch: { ar: 'PIN غير متطابق', fr: 'Les PIN ne correspondent pas' },
  enterPin: { ar: 'أدخل PIN', fr: 'Entrez le PIN' },
  pinIncorrect: { ar: 'PIN غير صحيح', fr: 'PIN incorrect' },
  verifyPinFirst: { ar: 'الرجاء التحقق من PIN أولاً', fr: 'Veuillez vérifier le PIN d\'abord' },
  masterKeyNotFound: { ar: 'تعذر العثور على مفتاح الاستعادة', fr: 'Clé de récupération introuvable' },

  // ─── Help / Guide titles ───
  guideDashboardTitle: { ar: 'لوحة التحكم', fr: 'Tableau de bord' },
  guideDashboardContent: {
    ar: '<p>لوحة التحكم هي الشاشة الرئيسية التي تظهر عند فتح البرنامج. تعرض لك:</p><ul><li><strong>الإحصائيات السريعة</strong>: عدد القضايا النشطة، الموكلين، المهام والجلسات القادمة</li><li><strong>المواعيد القادمة</strong>: الجلسات والمواعيد النهائية للأيام القادمة</li><li><strong>آخر النشاطات</strong>: سجل آخر التعديلات على القضايا</li><li><strong>رؤى الذكاء الاصطناعي</strong>: تحليلات ذكية لحالة المكتب (تتطلب إعداد AI)</li></ul><p>يمكنك تخصيص لوحة التحكم عبر إظهار/إخفاء العناصر من زر التخصيص في الأعلى.</p>',
    fr: '<p>Le tableau de bord est l\'écran principal qui s\'affiche à l\'ouverture du programme. Il vous montre :</p><ul><li><strong>Statistiques rapides</strong> : nombre d\'affaires actives, clients, tâches et audiences à venir</li><li><strong>Rendez-vous à venir</strong> : audiences et échéances des prochains jours</li><li><strong>Activités récentes</strong> : historique des dernières modifications</li><li><strong>Aperçus IA</strong> : analyses intelligentes du cabinet (nécessite configuration IA)</li></ul><p>Vous pouvez personnaliser le tableau de bord en affichant/masquant les éléments via le bouton de personnalisation en haut.</p>'
  },
  guideCasesTitle: { ar: 'إدارة القضايا', fr: 'Gestion des affaires' },
  guideCasesContent: {
    ar: '<p>قسم القضايا هو قلب البرنامج. يمكنك من:</p><ul><li><strong>إضافة قضية جديدة</strong>: الضغط على زر "إضافة قضية" وملء النموذج (الرقم، العنوان، الموكل، المحكمة، النوع...)</li><li><strong>عرض القضايا</strong>: جدول بكل القضايا مع إمكانية البحث والفلترة (حسب الحالة، المحكمة، الأولوية)</li><li><strong>مساحة العمل</strong>: الضغط على أي قضية يفتح مساحة عمل متكاملة فيها: معلومات القضية، الجدول الزمني، الوثائق، المهام، المصاريف، الذكاء الاصطناعي</li><li><strong>Kanban</strong>: عرض القضايا على شكل بطاقات حسب الحالة (نشط، معلق، مغلق)</li><li><strong>الأرشفة</strong>: نقل القضايا المنتهية إلى الأرشيف</li></ul><p>نصيحة: استخدم البحث السريع (Ctrl+K) للوصول الفوري لأي قضية.</p>',
    fr: '<p>La section affaires est le cœur du programme. Elle vous permet de :</p><ul><li><strong>Ajouter une nouvelle affaire</strong> : cliquer sur "Ajouter une affaire" et remplir le formulaire (numéro, titre, client, tribunal, type...)</li><li><strong>Voir les affaires</strong> : tableau avec recherche et filtres (statut, tribunal, priorité)</li><li><strong>Espace de travail</strong> : cliquer sur une affaire ouvre un espace complet : informations, chronologie, documents, tâches, dépenses, IA</li><li><strong>Kanban</strong> : visualisation par statut (actif, en attente, fermé)</li><li><strong>Archivage</strong> : déplacer les affaires terminées vers l\'archive</li></ul><p>Astuce : utilisez la recherche rapide (Ctrl+K) pour accéder instantanément à toute affaire.</p>'
  },
  guideClientsTitle: { ar: 'إدارة الموكلين', fr: 'Gestion des clients' },
  guideClientsContent: {
    ar: '<p>قسم الموكلين يسمح بتسجيل وإدارة جميع الموكلين:</p><ul><li><strong>إضافة موكل</strong>: الاسم، الهاتف، البريد الإلكتروني، العنوان، المعرف الوطني</li><li><strong>البطاقة التفصيلية</strong>: عند النقر على موكل تظهر كل قضاياه ومدفوعاته</li><li><strong>البحث والفلترة</strong>: بحث بالاسم أو الهاتف، فلترة حسب الحالة</li><li><strong>أرشفة الموكلين</strong>: إمكانية أرشفة الموكلين غير النشطين</li></ul>',
    fr: '<p>La section clients permet d\'enregistrer et de gérer tous les clients :</p><ul><li><strong>Ajouter un client</strong> : nom, téléphone, email, adresse, identifiant national</li><li><strong>Fiche détaillée</strong> : en cliquant sur un client, vous voyez toutes ses affaires et paiements</li><li><strong>Recherche et filtres</strong> : recherche par nom ou téléphone, filtrage par statut</li><li><strong>Archivage</strong> : possibilité d\'archiver les clients inactifs</li></ul>'
  },
  guideHearingsTitle: { ar: 'الجلسات والمواعيد', fr: 'Audiences et rendez-vous' },
  guideHearingsContent: {
    ar: '<p>قسم الجلسات يعرض كل الجلسات والمواعيد في مكان واحد:</p><ul><li><strong>إضافة جلسة</strong>: تحديد القضية، المحكمة، التاريخ، القاضي، الغرفة، النوع (جلسة، مرافعة، تأجيل)</li><li><strong>الحالة</strong>: مجدولة، مؤكدة، ملغاة، منعقدة</li><li><strong>التقويم</strong>: كل الجلسات تظهر أيضاً في التقويم القانوني</li><li><strong>التذكيرات</strong>: إشعارات قبل الجلسة بـ 7 و 3 و 1 يوم</li></ul>',
    fr: '<p>La section audiences affiche toutes les audiences et rendez-vous en un seul endroit :</p><ul><li><strong>Ajouter une audience</strong> : définir l\'affaire, le tribunal, la date, le juge, la salle, le type</li><li><strong>Statut</strong> : programmée, confirmée, annulée, tenue</li><li><strong>Calendrier</strong> : toutes les audiences apparaissent dans le calendrier juridique</li><li><strong>Rappels</strong> : notifications avant l\'audience à J-7, J-3 et J-1</li></ul>'
  },
  guideDocumentsTitle: { ar: 'الوثائق القانونية', fr: 'Documents juridiques' },
  guideDocumentsContent: {
    ar: '<p>نظام إدارة الوثائق يدعم:</p><ul><li><strong>رفع الوثائق</strong>: سحب وإفلات أو اختيار ملف (PDF, Word, Excel, صور)</li><li><strong>التصنيف</strong>: حسب النوع (عقد، حكم، مذكرة، مراسلة...) والوسوم</li><li><strong>البحث</strong>: بحث نصي في أسماء الوثائق والوسوم</li><li><strong>المعاينة</strong>: عرض الوثيقة داخل البرنامج</li><li><strong>الذكاء الاصطناعي</strong>: تحليل الوثيقة واستخراج الخلاصة والنقاط الرئيسية</li></ul>',
    fr: '<p>Le système de gestion documentaire prend en charge :</p><ul><li><strong>Téléversement</strong> : glisser-déposer ou sélectionner un fichier (PDF, Word, Excel, images)</li><li><strong>Classification</strong> : par type (contrat, jugement, note, correspondance...) et tags</li><li><strong>Recherche</strong> : recherche textuelle dans les noms et tags</li><li><strong>Aperçu</strong> : visualisation du document dans le programme</li><li><strong>IA</strong> : analyse du document, extraction du résumé et des points clés</li></ul>'
  },
  guideCalendarTitle: { ar: 'التقويم القانوني', fr: 'Calendrier juridique' },
  guideCalendarContent: {
    ar: '<p>تقويم قانوني بـ 4 طرق عرض:</p><ul><li><strong>شهري</strong>: نظرة عامة على كل الجلسات والمواعيد</li><li><strong>أسبوعي</strong>: تفاصيل الأسبوع مع التوقيت</li><li><strong>يومي</strong>: جدول زمني دقيق ليوم واحد</li><li><strong>قائمة</strong>: عرض الأحداث كقائمة مرتبة</li></ul><p>الألوان: الأزرق للجلسات، الأخضر للمواعيد، الأحمر للمهل، الذهبي للاستشارات، الأرجواني للوثائق.</p>',
    fr: '<p>Calendrier juridique avec 4 modes d\'affichage :</p><ul><li><strong>Mensuel</strong> : vue d\'ensemble des audiences et rendez-vous</li><li><strong>Hebdomadaire</strong> : détails de la semaine avec horaires</li><li><strong>Quotidien</strong> : planning précis d\'une journée</li><li><strong>Liste</strong> : événements sous forme de liste ordonnée</li></ul><p>Couleurs : bleu pour les audiences, vert pour les rendez-vous, rouge pour les échéances, doré pour les consultations, violet pour les documents.</p>'
  },
  guideTasksTitle: { ar: 'المهام', fr: 'Tâches' },
  guideTasksContent: {
    ar: '<p>نظام المهام يساعد على متابعة العمل:</p><ul><li><strong>إضافة مهمة</strong>: عنوان، وصف، أولوية (منخفضة/متوسطة/عالية/حرجة)، تاريخ الاستحقاق، القضية المرتبطة</li><li><strong>الحالات</strong>: متراكم، قيد الانتظار، قيد التنفيذ، مراجعة، منجز</li><li><strong>المهام الفرعية</strong>: تقسيم المهمة إلى خطوات أصغر</li><li><strong>التعليقات</strong>: إضافة ملاحظات وتعليقات على المهمة</li><li><strong>التحليلات</strong>: إحصائيات المهام المنجزة والمتأخرة</li></ul>',
    fr: '<p>Le système de tâches vous aide à suivre le travail :</p><ul><li><strong>Ajouter une tâche</strong> : titre, description, priorité (basse/moyenne/haute/critique), échéance, affaire liée</li><li><strong>Statuts</strong> : en suspens, à faire, en cours, révision, terminé</li><li><strong>Sous-tâches</strong> : diviser la tâche en plus petites étapes</li><li><strong>Commentaires</strong> : ajouter des notes et commentaires</li><li><strong>Analyses</strong> : statistiques des tâches terminées et en retard</li></ul>'
  },
  guideExpensesTitle: { ar: 'المصاريف والمدفوعات', fr: 'Dépenses et paiements' },
  guideExpensesContent: {
    ar: '<p>تتبع المصاريف والمدفوعات لكل قضية:</p><ul><li><strong>الأتعاب</strong>: تسجيل الأتعاب الإجمالية والمدفوعة والمتبقية</li><li><strong>المدفوعات</strong>: تسجيل كل دفعة مع تاريخها وطريقتها (نقداً، بنك، شيك)</li><li><strong>التقارير المالية</strong>: عرض إجمالي الأتعاب والمدفوعات لكل موكل</li></ul>',
    fr: '<p>Suivi des dépenses et paiements par affaire :</p><ul><li><strong>Honoraires</strong> : enregistrement des honoraires totaux, payés et restants</li><li><strong>Paiements</strong> : enregistrement de chaque paiement avec date et mode (espèces, virement, chèque)</li><li><strong>Rapports financiers</strong> : affichage des honoraires et paiements par client</li></ul>'
  },
  guideAITitle: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  guideAIContent: {
    ar: '<p>مساعد قانوني بتقنية الذكاء الاصطناعي مع 7 أوضاع:</p><ul><li><strong>محادثة</strong>: طرح أسئلة قانونية عامة</li><li><strong>تلخيص</strong>: تلخيص النصوص القانونية</li><li><strong>صياغة</strong>: صياغة وثائق قانونية</li><li><strong>تحليل</strong>: تحليل الأحكام والنصوص</li><li><strong>استراتيجية</strong>: تحليل استراتيجي للقضايا</li><li><strong>مخاطر</strong>: تحديد وتقييم المخاطر القانونية</li><li><strong>تحضير جلسة</strong>: تحضير شامل للجلسات القضائية</li></ul><p>يدعم المزودات: Groq (مجاني)، OpenAI، Anthropic Claude، Google Gemini.</p><p>للبدء: اختر المزود، أدخل مفتاح API، وابدأ المحادثة.</p>',
    fr: '<p>Assistant juridique IA avec 7 modes :</p><ul><li><strong>Chat</strong> : poser des questions juridiques générales</li><li><strong>Résumé</strong> : résumer des textes juridiques</li><li><strong>Rédaction</strong> : rédiger des documents juridiques</li><li><strong>Analyse</strong> : analyser des jugements et textes</li><li><strong>Stratégie</strong> : analyse stratégique des affaires</li><li><strong>Risques</strong> : identifier et évaluer les risques juridiques</li><li><strong>Préparation audience</strong> : préparation complète des audiences</li></ul><p>Fournisseurs supportés : Groq (gratuit), OpenAI, Anthropic Claude, Google Gemini.</p><p>Pour commencer : choisissez le fournisseur, entrez la clé API, et commencez la conversation.</p>'
  },
  guideReportsTitle: { ar: 'التقارير', fr: 'Rapports' },
  guideReportsContent: {
    ar: '<p>قسم التقارير يقدم تحليلات بيانية للمكتب:</p><ul><li><strong>تقرير القضايا</strong>: إحصائيات حسب الحالة والمحكمة والنوع</li><li><strong>تقرير المالي</strong>: الأتعاب والمدفوعات والمصروفات</li><li><strong>تقرير الجلسات</strong>: الجلسات القادمة والمنعقدة</li><li><strong>تقرير المهام</strong>: إنجاز المهام حسب المسؤول</li><li><strong>التقرير الشهري</strong>: نظرة شاملة على نشاط المكتب</li></ul><p>يمكن تصدير التقارير إلى PDF.</p>',
    fr: '<p>La section rapports offre des analyses graphiques du cabinet :</p><ul><li><strong>Rapport des affaires</strong> : statistiques par statut, tribunal et type</li><li><strong>Rapport financier</strong> : honoraires, paiements et dépenses</li><li><strong>Rapport des audiences</strong> : audiences à venir et tenues</li><li><strong>Rapport des tâches</strong> : achèvement par responsable</li><li><strong>Rapport mensuel</strong> : vue complète de l\'activité du cabinet</li></ul><p>Les rapports peuvent être exportés en PDF.</p>'
  },
  guideArchiveTitle: { ar: 'الأرشيف', fr: 'Archive' },
  guideArchiveContent: {
    ar: '<p>إدارة القضايا المؤرشفة:</p><ul><li>عرض كل القضايا المؤرشفة مع تاريخ الأرشفة</li><li>البحث في الأرشيف حسب رقم القضية أو العنوان</li><li>استعادة قضية من الأرشيف (مع مهامها)</li><li>الأرشفة التلقائية: القضايا المغلقة منذ 90 يوماً تُؤرشف تلقائياً</li></ul>',
    fr: '<p>Gestion des affaires archivées :</p><ul><li>Affichage de toutes les affaires archivées avec date d\'archivage</li><li>Recherche dans l\'archive par numéro ou titre</li><li>Restaurer une affaire depuis l\'archive (avec ses tâches)</li><li>Archivage automatique : les affaires fermées depuis 90 jours sont archivées automatiquement</li></ul>'
  },
  guideSearchTitle: { ar: 'البحث المتقدم', fr: 'Recherche avancée' },
  guideSearchContent: {
    ar: '<p>أداة بحث قوية لتجد أي شيء بسرعة:</p><ul><li><strong>البحث السريع</strong>: Ctrl+K لفتح نافذة البحث السريع</li><li><strong>البحث المتقدم</strong>: بحث في القضايا، الموكلين، الوثائق، المهام</li><li><strong>فلاتر</strong>: تحديد نطاق البحث (النوع، الحالة، التاريخ)</li></ul>',
    fr: '<p>Outil de recherche puissant pour trouver rapidement n\'importe quoi :</p><ul><li><strong>Recherche rapide</strong> : Ctrl+K pour ouvrir la recherche rapide</li><li><strong>Recherche avancée</strong> : rechercher dans les affaires, clients, documents, tâches</li><li><strong>Filtres</strong> : définir la portée de la recherche (type, statut, date)</li></ul>'
  },

  // ─── Help / FAQ ───
  faq01Q: { ar: 'كيف أضيف قضية جديدة؟', fr: 'Comment ajouter une nouvelle affaire ?' },
  faq01A: { ar: 'اذهب إلى قسم "القضايا" واضغط على زر "إضافة قضية" في أعلى اليمين. املأ النموذج بالبيانات المطلوبة (رقم القضية، العنوان، الموكل، المحكمة) ثم احفظ.', fr: 'Allez dans la section "Affaires" et cliquez sur le bouton "Ajouter une affaire" en haut à droite. Remplissez le formulaire (numéro, titre, client, tribunal) puis sauvegardez.' },
  faq02Q: { ar: 'كيف أبحث عن قضية بسرعة؟', fr: 'Comment rechercher rapidement une affaire ?' },
  faq02A: { ar: 'استخدم البحث السريع بالضغط على Ctrl+K (أو Cmd+K على Mac) واكتب رقم القضية أو اسمها. يمكنك أيضاً استخدام شريط البحث في أعلى كل قسم.', fr: 'Utilisez la recherche rapide avec Ctrl+K (ou Cmd+K sur Mac) et tapez le numéro ou le nom de l\'affaire. Vous pouvez aussi utiliser la barre de recherche en haut de chaque section.' },
  faq03Q: { ar: 'ما هي الأدوار والصلاحيات؟', fr: 'Quels sont les rôles et permissions ?' },
  faq03A: { ar: 'البرنامج يدعم 6 أدوار: مدير (صلاحية كاملة)، محامٍ أول، محامٍ، مساعد، متدرب، خارجي. كل دور له صلاحيات محددة للوصول إلى الأقسام وإجراء التعديلات. يمكن تعديل صلاحيات المستخدمين من الإعدادات.', fr: 'Le programme prend en charge 6 rôles : Administrateur (accès complet), Avocat principal, Avocat, Assistant, Stagiaire, Externe. Chaque rôle a des permissions spécifiques. Les permissions peuvent être modifiées dans les paramètres.' },
  faq04Q: { ar: 'كيف أعمل نسخة احتياطية؟', fr: 'Comment faire une sauvegarde ?' },
  faq04A: { ar: 'اذهب إلى "الإعدادات" > "النسخ الاحتياطي". يمكنك إنشاء نسخة يدوية أو تفعيل النسخ التلقائي (يومي/أسبوعي/شهري). جميع النسخ مشفرة لحماية البيانات.', fr: 'Allez dans "Paramètres" > "Sauvegarde". Vous pouvez créer une sauvegarde manuelle ou activer la sauvegarde automatique (quotidienne/hebdomadaire/mensuelle). Toutes les sauvegardes sont chiffrées.' },
  faq05Q: { ar: 'كيف أربط مفتاح API للذكاء الاصطناعي؟', fr: 'Comment configurer la clé API IA ?' },
  faq05A: { ar: 'اذهب إلى قسم "المساعد الذكي". اختر المزود الذي تريد (Groq مجاني وسريع)، ثم أدخل مفتاح API الخاص بك. يمكنك الحصول على مفتاح مجاني من Groq Console. بعد الحفظ، ابدأ المحادثة.', fr: 'Allez dans la section "Assistant IA". Choisissez le fournisseur (Groq est gratuit et rapide), puis entrez votre clé API. Obtenez une clé gratuite sur Groq Console. Après sauvegarde, commencez la conversation.' },
  faq06Q: { ar: 'ما الفرق بين أوضاع الذكاء الاصطناعي؟', fr: 'Quelle est la différence entre les modes IA ?' },
  faq06A: { ar: 'المساعد الذكي فيه 7 أوضاع: المحادثة للإجابة عن الأسئلة، التلخيص لتلخيص النصوص، الصياغة لكتابة الوثائق، التحليل لتحليل الأحكام، الاستراتيجية للتخطيط، المخاطر للتقييم القانوني، وتحضير الجلسة للاستعداد للجلسات القضائية.', fr: 'L\'assistant IA a 7 modes : Chat pour répondre aux questions, Résumé pour résumer des textes, Rédaction pour écrire des documents, Analyse pour analyser des jugements, Stratégie pour planifier, Risques pour évaluation juridique, et Préparation d\'audience.' },
  faq07Q: { ar: 'كيف أضيف وثيقة إلى قضية؟', fr: 'Comment ajouter un document à une affaire ?' },
  faq07A: { ar: 'افتح مساحة عمل القضية، اذهب إلى تبويب "الوثائق"، واسحب الملف إلى منطقة الإفلات أو اضغط على "رفع وثيقة".', fr: 'Ouvrez l\'espace de travail de l\'affaire, allez dans l\'onglet "Documents", et glissez-déposez le fichier ou cliquez sur "Téléverser un document".' },
  faq08Q: { ar: 'كيف أسجل دفعة مالية لقضية؟', fr: 'Comment enregistrer un paiement pour une affaire ?' },
  faq08A: { ar: 'في مساحة عمل القضية، اذهب إلى تبويب "المصاريف". ستجد إحصائيات الأتعاب والمدفوعات. اضغط على "إضافة دفعة" وسجل المبلغ وتاريخه وطريقة الدفع.', fr: 'Dans l\'espace de travail de l\'affaire, allez dans l\'onglet "Dépenses". Vous trouverez les statistiques des honoraires et paiements. Cliquez sur "Ajouter un paiement" et saisissez le montant, la date et le mode de paiement.' },
  faq09Q: { ar: 'كيف أضيف جلسة إلى التقويم؟', fr: 'Comment ajouter une audience au calendrier ?' },
  faq09A: { ar: 'من قسم "الجلسات" أو من التقويم مباشرة، اضغط على "إضافة جلسة". اختر القضية المرتبطة، المحكمة، التاريخ، القاضي، والغرفة.', fr: 'Depuis la section "Audiences" ou directement depuis le calendrier, cliquez sur "Ajouter une audience". Choisissez l\'affaire liée, le tribunal, la date, le juge et la salle.' },
  faq10Q: { ar: 'كيف أضيف مهمة فرعية؟', fr: 'Comment ajouter une sous-tâche ?' },
  faq10A: { ar: 'افتح المهمة الرئيسية، في قسم "المهام الفرعية" اضغط على "إضافة مهمة فرعية". يمكنك تحديد عنوانها وتاريخ استحقاقها.', fr: 'Ouvrez la tâche principale, dans la section "Sous-tâches" cliquez sur "Ajouter une sous-tâche". Vous pouvez définir son titre et sa date d\'échéance.' },
  faq11Q: { ar: 'كيف أغير كلمة السر؟', fr: 'Comment changer le mot de passe ?' },
  faq11A: { ar: 'اذهب إلى "الإعدادات" > "تغيير كلمة السر". أدخل كلمة السر الحالية ثم الجديدة. يجب أن تحتوي كلمة السر الجديدة على 8 أحرف على الأقل.', fr: 'Allez dans "Paramètres" > "Changer le mot de passe". Entrez le mot de passe actuel puis le nouveau. Le nouveau mot de passe doit contenir au moins 8 caractères.' },
  faq12Q: { ar: 'هل بياناتي آمنة؟', fr: 'Mes données sont-elles sécurisées ?' },
  faq12A: { ar: 'نعم. جميع البيانات مخزنة محلياً على جهازك ومشفرة. قاعدة البيانات مشفرة باستخدام AES-256-GCM. المفاتيح الحساسة (مثل API keys) مشفرة بشكل منفصل. لا تُشارك بياناتك مع أي طرف خارجي.', fr: 'Oui. Toutes les données sont stockées localement sur votre appareil et chiffrées. La base de données est chiffrée avec AES-256-GCM. Les clés sensibles (API keys) sont chiffrées séparément. Vos données ne sont jamais partagées avec des tiers.' },

  // ─── Help / Knowledge Base ───
  kbSecurityPermissionsTitle: { ar: 'نظام الأمان والصلاحيات', fr: 'Système de sécurité et permissions' },
  kbSecurityPermissionsContent: {
    ar: '<p>البرنامج يعتمد نظام أمان متعدد المستويات:</p><ul><li><strong>6 أدوار</strong>: مدير ← محامٍ أول ← محامٍ ← مساعد ← متدرب ← خارجي</li><li><strong>صلاحيات دقيقة</strong>: كل دور له صلاحية الوصول لأقسام محددة</li><li><strong>تشفير AES-256-GCM</strong>: لكل البيانات الحساسة</li><li><strong>سجل النشاطات</strong>: تسجيل كل عملية تعديل مع المستخدم والتاريخ</li><li><strong>Master Key</strong>: مفتاح استعادة في حال فقدان كلمة السر</li></ul>',
    fr: '<p>Le programme utilise un système de sécurité multi-niveaux :</p><ul><li><strong>6 rôles</strong> : Administrateur ← Avocat principal ← Avocat ← Assistant ← Stagiaire ← Externe</li><li><strong>Permissions précises</strong> : chaque rôle a un accès spécifique aux sections</li><li><strong>Chiffrement AES-256-GCM</strong> : pour toutes les données sensibles</li><li><strong>Journal d\'activité</strong> : enregistrement de chaque modification</li><li><strong>Master Key</strong> : clé de récupération en cas de perte du mot de passe</li></ul>'
  },
  kbSecurityKeysTitle: { ar: 'إدارة المفاتيح والترخيص', fr: 'Gestion des clés et licence' },
  kbSecurityKeysContent: {
    ar: '<p>البرنامج يتطلب ترخيصاً مهنياً للاستخدام. يمكن إدارة الترخيص من الإعدادات.</p><p>مفاتيح API للذكاء الاصطناعي تُخزّن مشفرة ولا تُشارك مع أي جهة.</p><p>ينصح باستخدام Groq للحصول على خدمة مجانية وسريعة للبدء.</p>',
    fr: '<p>Le programme nécessite une licence professionnelle. La licence peut être gérée depuis les paramètres.</p><p>Les clés API IA sont stockées chiffrées et ne sont jamais partagées.</p><p>Il est recommandé d\'utiliser Groq pour un service gratuit et rapide.</p>'
  },
  kbBackupTitle: { ar: 'النسخ الاحتياطي والاسترجاع', fr: 'Sauvegarde et restauration' },
  kbBackupContent: {
    ar: '<p>نظام النسخ الاحتياطي يوفر حماية كاملة للبيانات:</p><ul><li><strong>تلقائي</strong>: يومي، أسبوعي، أو شهري (حسب الإعدادات)</li><li><strong>يدوي</strong>: إنشاء نسخة احتياطية في أي وقت</li><li><strong>مشفّر</strong>: جميع النسخ مشفرة ولا يمكن فتحها إلا بالبرنامج</li><li><strong>الاسترجاع</strong>: استرجاع أي نسخة سابقة بسهولة</li><li><strong>التصدير</strong>: تصدير أرشيف كامل للبيانات</li></ul><p>يُنصح بعمل نسخة احتياطية أسبوعياً على الأقل.</p>',
    fr: '<p>Le système de sauvegarde offre une protection complète des données :</p><ul><li><strong>Automatique</strong> : quotidienne, hebdomadaire ou mensuelle</li><li><strong>Manuelle</strong> : créer une sauvegarde à tout moment</li><li><strong>Chiffrée</strong> : toutes les sauvegardes sont chiffrées</li><li><strong>Restauration</strong> : restaurer facilement toute sauvegarde antérieure</li><li><strong>Export</strong> : exporter une archive complète des données</li></ul><p>Il est recommandé d\'effectuer une sauvegarde au moins une fois par semaine.</p>'
  },
  kbKeyboardTitle: { ar: 'اختصارات لوحة المفاتيح', fr: 'Raccourcis clavier' },
  kbKeyboardContent: {
    ar: '<table class="help-shortcuts"><tr><th>الاختصار</th><th>الوظيفة</th></tr><tr><td><kbd>Ctrl+K</kbd></td><td>فتح البحث السريع</td></tr><tr><td><kbd>Ctrl+N</kbd></td><td>إضافة جديد (حسب القسم الحالي)</td></tr><tr><td><kbd>Escape</kbd></td><td>إغلاق النافذة المنبثقة</td></tr><tr><td><kbd>/</kbd></td><td>التركيز على شريط البحث</td></tr><tr><td><kbd>Ctrl+,</kbd></td><td>فتح الإعدادات</td></tr></table>',
    fr: '<table class="help-shortcuts"><tr><th>Raccourci</th><th>Fonction</th></tr><tr><td><kbd>Ctrl+K</kbd></td><td>Ouvrir la recherche rapide</td></tr><tr><td><kbd>Ctrl+N</kbd></td><td>Ajouter nouveau (selon la section)</td></tr><tr><td><kbd>Escape</kbd></td><td>Fermer la fenêtre contextuelle</td></tr><tr><td><kbd>/</kbd></td><td>Focus sur la barre de recherche</td></tr><tr><td><kbd>Ctrl+,</kbd></td><td>Ouvrir les paramètres</td></tr></table>'
  },
  kbTroubleshootingTitle: { ar: 'حل المشاكل الشائعة', fr: 'Dépannage' },
  kbTroubleshootingContent: {
    ar: '<p><strong>المشكلة:</strong> المساعد الذكي لا يعمل</p><p><strong>الحل:</strong> تحقق من اتصال الإنترنت، تأكد من صحة مفتاح API في إعدادات AI، جرب تغيير المزود إلى Groq.</p><p><strong>المشكلة:</strong> البرنامج بطيء</p><p><strong>الحل:</strong> حاول أرشفة القضايا المغلقة، نظف سجل النشاطات من الإعدادات، تأكد من وجود مساحة كافية على القرص.</p><p><strong>المشكلة:</strong> نسيت كلمة السر</p><p><strong>الحل:</strong> استخدم Master Key للاستعادة. إذا لم يكن لديك Master Key، اتصل بالدعم الفني.</p>',
    fr: '<p><strong>Problème :</strong> L\'assistant IA ne fonctionne pas</p><p><strong>Solution :</strong> Vérifiez votre connexion Internet, assurez-vous que la clé API est correcte dans les paramètres IA, essayez de changer le fournisseur pour Groq.</p><p><strong>Problème :</strong> Le programme est lent</p><p><strong>Solution :</strong> Archivez les affaires fermées, nettoyez le journal d\'activité dans les paramètres, assurez-vous d\'avoir assez d\'espace disque.</p><p><strong>Problème :</strong> Mot de passe oublié</p><p><strong>Solution :</strong> Utilisez la Master Key pour la récupération. Si vous n\'avez pas de Master Key, contactez le support technique.</p>'
  },
  helpKbNoResults: { ar: 'لا توجد نتائج للبحث', fr: 'Aucun résultat de recherche' },

  // ─── Setup Placeholders ───
  setupOfficeNamePlaceholder: { ar: 'اسم المكتب', fr: 'Nom du cabinet' },
  setupAdminNamePlaceholder: { ar: 'اسم المدير', fr: "Nom de l'administrateur" },
  setupPasswordPlaceholder: { ar: 'كلمة السر (8 أحرف على الأقل)', fr: 'Mot de passe (8 caractères min)' },
  setupPinPlaceholder: { ar: 'PIN (4-6 أرقام)', fr: 'PIN (4-6 chiffres)' },
  confirmPinPlaceholder: { ar: 'تأكيد PIN', fr: 'Confirmer le PIN' },
  forgotPinPlaceholder: { ar: 'PIN (4-6 أرقام)', fr: 'PIN (4-6 chiffres)' },
  forgotMasterKeyPlaceholder: { ar: 'مفتاح الاستعادة', fr: 'Clé de récupération' },

  // ─── Kanban ───
  kanbanArchived: { ar: 'مؤرشفة', fr: 'Archivée' },

  // ─── Calendar Legend ───
  calLegendDocuments: { ar: 'وثائق', fr: 'Documents' },
  calLegendPayments: { ar: 'دفعات', fr: 'Paiements' },

  // ─── Table Headers ───
  thTitle: { ar: 'العنوان', fr: 'Titre' },
  thCaseRef: { ar: 'القضية', fr: 'Affaire' },
  thUploadDate: { ar: 'تاريخ الرفع', fr: 'Date de téléversement' },
  thTags: { ar: 'الوسوم', fr: 'Tags' },
  thRole: { ar: 'الدور', fr: 'Rôle' },
  thLastLogin: { ar: 'آخر دخول', fr: 'Dernière connexion' },
  thTimeCol: { ar: 'الوقت', fr: 'Heure' },
  thUser: { ar: 'المستخدم', fr: 'Utilisateur' },
  thAction: { ar: 'الإجراء', fr: 'Action' },
  thDetails: { ar: 'التفاصيل', fr: 'Détails' },
  thLevel: { ar: 'المستوى', fr: 'Niveau' },
  thContext: { ar: 'السياق', fr: 'Contexte' },
  thMessage: { ar: 'الرسالة', fr: 'Message' },

  // ─── Profile ───
  profileMasterKeyLabel: { ar: 'مفتاح الاستعادة', fr: 'Clé de récupération' },

  // ─── About ───
  aboutDescription: { ar: 'تطبيق متكامل لإدارة مكاتب المحاماة في المغرب', fr: 'Application intégrée de gestion des cabinets d\'avocats au Maroc' },

  // ─── Modal ───
  modalTitle: { ar: 'عنوان', fr: 'Titre' },
  workflowModalTitle: { ar: 'سير العمل', fr: 'Workflow' },

  // ─── Dashboard Quick Actions ───
  dashAddCaseAction: { ar: 'إضافة قضية', fr: 'Ajouter une affaire' },
  dashAddClientAction: { ar: 'إضافة موكل', fr: 'Ajouter un client' },
  dashAddHearingAction: { ar: 'إضافة جلسة', fr: 'Ajouter une audience' },
  dashUploadDocumentAction: { ar: 'رفع وثيقة', fr: 'Téléverser un document' },

  // ─── Filter Options ───
  optionStatusLabel: { ar: 'الحالة', fr: 'Statut' },
  optionActive: { ar: 'نشط', fr: 'Actif' },
  optionArchived: { ar: 'مؤرشف', fr: 'Archivé' },
  optionMinCases: { ar: 'عدد القضايا', fr: "Nombre d'affaires" },
  optionCity: { ar: 'المدينة', fr: 'Ville' },
  optionCourt: { ar: 'المحكمة', fr: 'Tribunal' },
  optionStatus: { ar: 'الحالة', fr: 'Statut' },
  optionActiveF: { ar: 'نشطة', fr: 'Active' },
  optionPending: { ar: 'معلقة', fr: 'En attente' },
  optionClosed: { ar: 'مغلقة', fr: 'Fermée' },
  optionPriority: { ar: 'الأولوية', fr: 'Priorité' },
  optionHigh: { ar: 'عالية', fr: 'Haute' },
  optionMedium: { ar: 'متوسطة', fr: 'Moyenne' },
  optionLow: { ar: 'منخفضة', fr: 'Basse' },
  optionClient: { ar: 'الموكل', fr: 'Client' },
  optionHearingType: { ar: 'جلسات', fr: 'Audiences' },
  optionDeadlineType: { ar: 'مواعيد نهائية', fr: 'Dates limites' },
  optionMeetingType: { ar: 'اجتماعات', fr: 'Réunions' },
  optionTaskType: { ar: 'مهام', fr: 'Tâches' },
  optionDocumentType: { ar: 'تقديم وثائق', fr: 'Dépôt de documents' },
  optionPaymentType: { ar: 'دفعات', fr: 'Paiements' },
  optionAll: { ar: 'الكل', fr: 'Tous' },
  optionTodo: { ar: 'قيد التنفيذ', fr: 'À faire' },
  optionInProgress: { ar: 'قيد الإنجاز', fr: 'En cours' },
  optionWaiting: { ar: 'انتظار', fr: 'En attente' },
  optionReview: { ar: 'مراجعة', fr: 'Révision' },
  optionDone: { ar: 'منجز', fr: 'Terminé' },
  optionDocContracts: { ar: 'عقود', fr: 'Contrats' },
  optionDocJudgments: { ar: 'أحكام', fr: 'Jugements' },
  optionDocBriefs: { ar: 'مذكرات', fr: 'Mémoires' },
  optionDocEvidence: { ar: 'أدلة', fr: 'Preuves' },
  optionDocReports: { ar: 'تقارير', fr: 'Rapports' },
  optionDocInvoices: { ar: 'فواتير', fr: 'Factures' },
  optionDocOther: { ar: 'أخرى', fr: 'Autres' },

  // ─── Specialties ───
  specialtyCivil: { ar: 'مدني', fr: 'Civil' },
  specialtyCommercial: { ar: 'تجاري', fr: 'Commercial' },
  specialtyCriminal: { ar: 'جنائي', fr: 'Pénal' },
  specialtyFamily: { ar: 'أسرة', fr: 'Famille' },
  specialtyRealEstate: { ar: 'عقاري', fr: 'Immobilier' },
  specialtyAdmin: { ar: 'إداري', fr: 'Administratif' },
  specialtyLabor: { ar: 'شغل', fr: 'Travail' },
  specialtyTax: { ar: 'جبائي', fr: 'Fiscal' },

  // ─── AI Provider Descriptions ───
  aiProviderGroq: { ar: 'مجاني، سريع', fr: 'Gratuit, rapide' },
  aiProviderGemini: { ar: 'Google، مجاني', fr: 'Google, gratuit' },

  // ─── Log Level Filter ───
  optionAllLevels: { ar: 'جميع المستويات', fr: 'Tous les niveaux' },

  // ─── Profile Avatar ───
  changePhotoTooltip: { ar: 'انقر لتغيير الصورة', fr: 'Cliquez pour changer la photo' },

  // ─── Pre-existing HTML keys ───
  authLoginHeading: { ar: 'تسجيل الدخول', fr: 'Connexion' },
  authLoginSub: { ar: 'اختر المستخدم وأدخل كلمة السر', fr: "Choisissez l'utilisateur et entrez le mot de passe" },
  authOpenAtLogin: { ar: 'تشغيل مع ويندوز', fr: 'Lancer au démarrage' },
  authRemember30: { ar: 'تذكرني لمدة 30 يوماً', fr: 'Se souvenir de moi 30 jours' },
  authSetupBtn: { ar: 'إنشاء حساب المدير', fr: 'Créer le compte administrateur' },
  authSetupDesc: { ar: 'أدخل معلومات مكتب المحاماة للبدء', fr: 'Entrez les informations du cabinet pour commencer' },
  authSetupHeading: { ar: 'إعداد المكتب لأول مرة', fr: 'Configuration initiale du cabinet' },
  authSetupHint: { ar: 'يمكنك إضافة مستخدمين آخرين لاحقاً من الإعدادات', fr: 'Vous pouvez ajouter d\'autres utilisateurs plus tard depuis les paramètres' },
  authSetupSub: { ar: 'إنشاء حساب المدير العام للمكتب', fr: 'Créer le compte administrateur général' },
  authSetupTitle: { ar: 'إعداد المكتب', fr: 'Configuration du cabinet' },
  breadcrumbDashboard: { ar: 'الرئيسية', fr: 'Tableau de bord' },
  clickToReveal: { ar: 'اضغط للإظهار', fr: 'Cliquez pour afficher' },
  confirmPasswordPlaceholder: { ar: 'تأكيد كلمة السر', fr: 'Confirmer le mot de passe' },
  dashCasesByType: { ar: 'القضايا حسب النوع', fr: 'Affaires par type' },
  dashMonthlyCases: { ar: 'القضايا شهرياً', fr: 'Affaires mensuelles' },
  dashNoTomorrowHearings: { ar: 'لا توجد جلسات غداً', fr: 'Aucune audience demain' },
  dashOperations: { ar: 'العمليات', fr: 'Opérations' },
  dashRevenue12m: { ar: 'الإيرادات الشهرية خلال 12 شهراً', fr: 'Revenus mensuels sur 12 mois' },
  dashTomorrowHearings: { ar: 'جلسات الغد', fr: 'Audiences de demain' },
  dashUpcomingHearings: { ar: 'الجلسات القادمة', fr: 'Audiences à venir' },
  dashUrgentTasks: { ar: 'المهام العاجلة', fr: 'Tâches urgentes' },
  forgotEnterPin: { ar: 'أدخل PIN الرقمي لاستعادة كلمة السر:', fr: 'Entrez le PIN numérique pour récupérer le mot de passe :' },
  masterKeyDesc: { ar: 'هذا هو مفتاح الاستعادة الخاص بمكتبك. احتفظ به في مكان آمن — يمكنك استخدامه لاستعادة الوصول إذا نسيت كلمة السر.', fr: 'Ceci est la clé de récupération de votre cabinet. Conservez-la en lieu sûr — vous pouvez l\'utiliser pour récupérer l\'accès si vous oubliez votre mot de passe.' },
  masterKeyDone: { ar: 'تم — بدء استخدام المكتب', fr: 'Terminé — Commencer à utiliser le cabinet' },
  masterKeyTitle: { ar: 'مفتاح الاستعادة', fr: 'Clé de récupération' },
  showMyMasterKey: { ar: 'عرض مفتاح الاستعادة الخاص بي', fr: 'Afficher ma clé de récupération' },
  verifyPin: { ar: 'تحقق من PIN', fr: 'Vérifier le PIN' },

  darkModeToggle: { ar: 'الوضع الليلي', fr: 'Mode sombre' },
  lockTitleText: { ar: 'قفل', fr: 'Verrouiller' },

  // ─── Tasks ───
  tagPlaceholder: { ar: 'مهم، عاجل', fr: 'Important, urgent' },
  hoursAbbrev: { ar: 'س', fr: 'h' },
  minutesAbbrev: { ar: 'د', fr: 'min' },

  // ─── Quotes ───
  quote1: { ar: '"العدالة أساس الملك"', fr: '"La justice est le fondement du royaume"' },
  quote2: { ar: '"الحق فوق القوة"', fr: '"Le droit prime sur la force"' },
  quote3: { ar: '"القانون سلاح الضعفاء"', fr: '"La loi est l\'arme des faibles"' },
  quote4: { ar: '"العدل أساس العمران"', fr: '"La justice est le fondement de la civilisation"' },
  quote5: { ar: '"من حكم بين الناس بالعدل فهو في ذمة الله"', fr: '"Qui juge avec justice est sous la protection de Dieu"' },
  quote6: { ar: '"القاضي العادل يُحيي الأرض"', fr: '"Le juge équitable fait vivre la terre"' },
  quote7: { ar: '"العدل حياة القلوب"', fr: '"La justice est la vie des cœurs"' }
};

function _t(key) {
  const lang = A._currentLang || 'ar';
  const entry = A.i18n[key];
  return entry ? entry[lang] || entry.en || entry.ar || key : key;
}

A.getLocale = function () {
  const lang = A._currentLang || 'ar';
  return lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'ar-MA';
};

A.getDayNames = function (len) {
  const locale = A.getLocale();
  len = len || 'long';
  const base = new Date(2024, 0, 1);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(new Intl.DateTimeFormat(locale, { weekday: len }).format(d));
  }
  return days;
};

A.getShortDayNames = function () {
  return A.getDayNames('narrow');
};

A.getMonthNames = function () {
  const locale = A.getLocale();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(2024, i, 1);
    months.push(new Intl.DateTimeFormat(locale, { month: 'long' }).format(d));
  }
  return months;
};

A.setLanguage = function (lang) {
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
  try {
    localStorage.setItem('app_lang', lang);
  } catch (e) {}
  const sel = document.getElementById('settingLang');
  if (sel) sel.value = lang;
  A.updateUI();
  if (A.state && A.state.loadedSections) {
    const currentSection = document.querySelector('.nav-item.active')?.dataset?.section || 'dashboard';
    A.state.loadedSections.clear();
    A.navigateTo(currentSection);
  }
  if (A.AutoSave) A.AutoSave.markDirty('i18n');
};

A.getLanguage = function () {
  return A._currentLang || 'ar';
};

A.updateUI = function () {
  const lang = A._currentLang || 'ar';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    const entry = A.i18n[key];
    if (!entry) return;
    const text = entry[lang] || entry.en || entry.ar || key;
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, text);
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.setAttribute('placeholder', text);
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-html');
    const entry = A.i18n[key];
    if (!entry) return;
    let html = entry[lang] || entry.en || entry.ar || key;
    html = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    el.innerHTML = html;
  });
};

A.initI18n = function () {
  let saved = 'ar';
  try {
    saved = localStorage.getItem('app_lang') || 'ar';
  } catch (e) {}
  A.setLanguage(saved);
};

window._t = _t;
window.setLanguage = A.setLanguage;
window.getLanguage = A.getLanguage;
