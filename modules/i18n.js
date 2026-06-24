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
  dashNoEvents: { ar: 'لا توجد أحداث اليوم', fr: 'Aucun événement aujourd\'hui' },
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
  todayBtn: { ar: 'اليوم', fr: 'Aujourd\'hui' },
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
  tasksDesc: { ar: 'نظام تنفيذ قانوني — مهام، مهام فرعية، تبعيات، سير عمل، تتبع زمني', fr: 'Système d\'exécution juridique' },
  documentsDesc: { ar: 'نظام إدارة الوثائق القانونية — بحث، تصنيف، إصدارات', fr: 'Gestion documentaire juridique' },
  expensesDesc: { ar: 'تتبع المصاريف والمدفوعات والفواتير', fr: 'Suivi des dépenses et paiements' },
  notificationsDesc: { ar: 'مركز الإشعارات والتنبيهات', fr: 'Centre de notifications' },
  searchDesc: { ar: 'بحث شامل في جميع بيانات التطبيق', fr: 'Recherche complète' },
  reportsDesc: { ar: 'إنشاء وتصدير التقارير والإحصائيات', fr: 'Générer des rapports' },
  aiDesc: { ar: 'محرك الذكاء القانوني — تحليل، صياغة، استراتيجية، مخاطر', fr: 'Moteur d\'IA juridique' },
  archiveDesc: { ar: 'القضايا المؤرشفة والملفات المنتهية', fr: 'Affaires archivées' },
  settingsDesc: { ar: 'تخصيص إعدادات التطبيق', fr: 'Personnaliser les paramètres' },

  // ─── Kanban (Cases) ───
  kanbanNew: { ar: 'جديد', fr: 'Nouveau' },
  kanbanActive: { ar: 'قيد المعالجة', fr: 'En cours' },
  kanbanPending: { ar: 'معلق', fr: 'En attente' },
  kanbanAppeal: { ar: 'استئناف', fr: 'Appel' },
  kanbanClosed: { ar: 'مغلقة', fr: 'Fermée' },

  // ─── Task Status ───
  taskBacklog: { ar: 'متروك', fr: 'En suspens' },
  taskTodo: { ar: 'قيد التنفيذ', fr: 'À faire' },
  taskInProgress: { ar: 'قيد الإنجاز', fr: 'En cours' },
  taskWaiting: { ar: 'انتظار', fr: 'En attente' },
  taskReview: { ar: 'مراجعة', fr: 'Révision' },
  taskDone: { ar: 'منجز', fr: 'Terminé' },

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
  aiSetupDesc: { ar: 'اختر مزود الذكاء الاصطناعي المفضل لديك', fr: 'Choisissez votre fournisseur d\'IA' },
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

  // ─── Settings ───
  aboutLabel: { ar: 'حول', fr: 'À propos' },
  darkModeLabel: { ar: 'الوضع الليلي', fr: 'Mode sombre' },
  passwordTitle: { ar: 'كلمة السر', fr: 'Mot de passe' },
  userManagement: { ar: 'إدارة المستخدمين', fr: 'Gestion des utilisateurs' },
  activityLog: { ar: 'سجل النشاط', fr: 'Journal d\'activité' },
  errorLog: { ar: 'سجل الأخطاء', fr: 'Journal des erreurs' },
  logExport: { ar: 'تصدير', fr: 'Exporter' },
  logClear: { ar: 'مسح', fr: 'Effacer' },
  autoBackup: { ar: 'النسخ الاحتياطي التلقائي', fr: 'Sauvegarde automatique' },
  manualBackup: { ar: 'إنشاء نسخة احتياطية يدوية', fr: 'Sauvegarde manuelle' },
  createBackupNow: { ar: 'إنشاء نسخة الآن', fr: 'Sauvegarder maintenant' },
  exportArchiveFull: { ar: 'تصدير أرشيف كامل', fr: 'Exporter l\'archive' },
  restorePoints: { ar: 'نقاط الاستعادة', fr: 'Points de restauration' },
  loadingBackups: { ar: 'جاري تحميل النسخ الاحتياطية...', fr: 'Chargement des sauvegardes...' },
  restoreConfirmTitle: { ar: 'تأكيد الاستعادة', fr: 'Confirmer la restauration' },
  restoreWarning: { ar: 'تحذير: استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية!', fr: 'Attention: La restauration remplacera toutes les données!' },
  storageMaintenance: { ar: 'صيانة التخزين', fr: 'Maintenance du stockage' },
  storageMaintenanceDesc: { ar: 'تنظيف الملفات الوهمية (orphan files) — الملفات الموجودة على القرص الصلب دون وجودها في قاعدة البيانات.', fr: 'Nettoyage des fichiers orphelins — fichiers présents sur le disque sans référence en base.' },
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
  thCaseNumber: { ar: 'رقم القضية', fr: 'N° d\'affaire' },
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
  thArchiveDate: { ar: 'تاريخ الأرشفة', fr: 'Date d\'archivage' },

  // ─── Search placeholders ───
  searchPlaceholderClients: { ar: 'اسم، هاتف، بريد...', fr: 'Nom, téléphone, email...' },
  searchPlaceholderCases: { ar: 'رقم القضية، الموكل، المحكمة...', fr: 'N° d\'affaire, client, tribunal...' },
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
  docVNotesPlaceholder: { ar: 'ملاحظات قانونية...', fr: 'Notes juridiques...' },

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
  pdfExportComing: { ar: 'تصدير PDF سيكون متاحاً في التحديث القادم', fr: 'L\'export PDF sera disponible dans la prochaine mise à jour' },

  // ─── UI ───
  sessionExpired: { ar: 'انتهت الجلسة — الرجاء إعادة تسجيل الدخول', fr: 'Session expirée — veuillez vous reconnecter' },

  // ─── Modal ───
  confirmArchive: { ar: 'تأكيد الأرشفة', fr: 'Confirmer l\'archivage' },

  // ─── Autosave ───
  autosaveUnsaved: { ar: 'تعديلات غير محفوظة', fr: 'Modifications non enregistrées' },
  autosaveError: { ar: 'فشل الحفظ', fr: 'Échec de la sauvegarde' },
  autosaveFoundDrafts: { ar: 'تم العثور على {count} مسودة غير محفوظة قبل إعادة التشغيل. هل تريد استعادتها؟', fr: '{count} brouillon(s) non sauvegardé(s) trouvé(s). Voulez-vous les restaurer ?' },
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
  hearingsToday: { ar: 'اليوم', fr: 'Aujourd\'hui' },
  hearingsUpcoming: { ar: 'قادمة', fr: 'À venir' },
  noEvents: { ar: 'لا توجد أحداث', fr: 'Aucun événement' },

  // ─── Kanban ───
  caseStatusChanged: { ar: 'تم تغيير حالة القضية', fr: 'Statut de l\'affaire modifié' },
  failedStatusChange: { ar: 'فشل تغيير الحالة', fr: 'Échec de la modification du statut' },

  // ─── Auth ───
  createAdminAccount: { ar: 'إنشاء حساب المدير', fr: 'Créer le compte administrateur' },
  setupAdminSubtitle: { ar: 'أنشئ حساب المدير للبدء في استخدام البرنامج', fr: 'Créez le compte admin pour commencer' },
  enterPassword: { ar: 'الرجاء إدخال كلمة السر', fr: 'Veuillez entrer le mot de passe' },
  passwordIncorrect: { ar: 'كلمة السر خطأ', fr: 'Mot de passe incorrect' },
  loginErrorOccurred: { ar: 'حدث خطأ في تسجيل الدخول', fr: 'Erreur de connexion' },
  passwordMinLength: { ar: 'كلمة السر يجب أن تكون 8 أحرف على الأقل', fr: 'Le mot de passe doit avoir au moins 8 caractères' },
  passwordsNoMatch: { ar: 'كلمتا السر غير متطابقتين', fr: 'Les mots de passe ne correspondent pas' },
  savePasswordFailed: { ar: 'فشل حفظ كلمة السر', fr: 'Échec de l\'enregistrement du mot de passe' },
  errorSavingPassword: { ar: 'خطأ في حفظ كلمة السر', fr: 'Erreur lors de l\'enregistrement du mot de passe' },
  adminNameRequired: { ar: 'اسم المدير مطلوب', fr: 'Nom de l\'administrateur requis' },
  createAdminFailed: { ar: 'فشل إنشاء حساب المدير', fr: 'Échec de la création du compte administrateur' },
  errorCreatingAdmin: { ar: 'خطأ في إنشاء حساب المدير', fr: 'Erreur lors de la création du compte' },
  onbTitleStep1: { ar: 'إدارة القضايا والموكلين', fr: 'Gestion des affaires et clients' },
  onbDescStep1: { ar: 'أنشئ القضايا، أضف الموكلين، وتابع كل التفاصيل في مساحات عمل متخصصة. كل شيء مترابط.', fr: 'Créez des affaires, ajoutez des clients, suivez tous les détails.' },
  onbTitleStep2: { ar: 'التقويم والجلسات', fr: 'Calendrier et audiences' },
  onbDescStep2: { ar: 'جدول زمني قانوني شامل مع 4 طرق عرض، تنبيهات ذكية، وجلسات مرتبطة بالقضايا.', fr: 'Calendrier juridique complet avec 4 vues, alertes intégrées.' },
  onbTitleStep3: { ar: 'المساعد الذكي', fr: 'Assistant IA' },
  onbDescStep3: { ar: 'محرك ذكاء اصطناعي قانوني — حلل، صغ، استشر. سياق كامل لجميع قضاياك ووثائقك.', fr: 'Moteur d\'IA juridique — analysez, rédigez, consultez.' },
  getStarted: { ar: 'ابدأ الآن', fr: 'Commencez' },

  // ─── Dashboard ───
  failedLoadDashboard: { ar: 'تعذر تحميل لوحة البيانات.', fr: 'Échec du chargement du tableau de bord' },

  // ─── Dashboard Views ───
  morningGreeting: { ar: 'صباح الخير', fr: 'Bonjour' },
  eveningGreeting: { ar: 'مساء الخير', fr: 'Bonsoir' },
  defaultLawyer: { ar: 'محامي', fr: 'Avocat' },
  currencyMAD: { ar: ' د.م.', fr: ' MAD' },
  noEventsToday: { ar: 'لا توجد أحداث اليوم', fr: 'Aucun événement aujourd\'hui' },
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
  todayLabel: { ar: 'اليوم', fr: 'Aujourd\'hui' },
  withinDays: { ar: 'خلال {n} أيام', fr: 'Dans {n} jours' },
  moreAppointments: { ar: '+{n} موعد آخر', fr: '+{n} autre(s) rendez-vous' },
  activeF: { ar: 'نشطة', fr: 'Active' },
  pendingF: { ar: 'معلقة', fr: 'En attente' },
  closedF: { ar: 'مغلقة', fr: 'Fermée' },
  casesRegisteredLabel: { ar: 'القضايا المسجلة', fr: 'Affaires enregistrées' },

  // ─── Documents ───
  failedLoadDocuments: { ar: 'تعذر تحميل الوثائق.', fr: 'Échec du chargement des documents' },
  docNotFound: { ar: 'لم يتم العثور على الوثيقة', fr: 'Document introuvable' },
  docDeleteConfirm: { ar: 'هل تريد حذف هذه الوثيقة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.', fr: 'Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.' },
  docDeleted: { ar: 'تم حذف الوثيقة', fr: 'Document supprimé' },
  docDeleteFailed: { ar: 'فشل حذف الوثيقة', fr: 'Échec de la suppression du document' },
  docDownloaded: { ar: 'تم تحميل الوثيقة', fr: 'Document téléchargé' },
  noTagsLabel: { ar: 'لا توجد', fr: 'Aucun' },
  currentVersionLabel: { ar: 'الإصدار الحالي', fr: 'Version actuelle' },
  failedOpenFile: { ar: 'تعذر فتح الملف', fr: 'Impossible d\'ouvrir le fichier' },
  failedLoadFile: { ar: 'تعذر تحميل الملف', fr: 'Impossible de télécharger le fichier' },
  notesSaved: { ar: 'تم حفظ الملاحظات', fr: 'Notes enregistrées' },
  failedSaveNotes: { ar: 'فشل حفظ الملاحظات', fr: 'Échec de l\'enregistrement des notes' },
  uploadDocTitle: { ar: 'رفع وثيقة', fr: 'Téléverser un document' },
  caseSelectLabel: { ar: 'القضية', fr: 'Affaire' },
  selectCasePlaceholder: { ar: 'اختر القضية...', fr: 'Choisir une affaire...' },
  docTypeLabel: { ar: 'النوع', fr: 'Type' },
  docTagsPlaceholder: { ar: 'عاجل، سري، مهم', fr: 'Urgent, secret, important' },
  selectFileBtn: { ar: 'اختيار ملف ورفعه', fr: 'Sélectionner et téléverser' },
  uploadFileLimit: { ar: 'PDF, DOC, DOCX, JPG, PNG, TXT — حد أقصى 50 MB', fr: 'PDF, DOC, DOCX, JPG, PNG, TXT — max 50 Mo' },
  selectCaseFirst: { ar: 'اختر القضية أولاً', fr: 'Choisissez d\'abord l\'affaire' },
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
  nameRequired: { ar: 'الاسم إجباري', fr: 'Nom requis' },
  clientAdded: { ar: 'تم إضافة الموكل بنجاح', fr: 'Client ajouté avec succès' },
  clientAddFailed: { ar: 'فشل إضافة الموكل', fr: 'Échec de l\'ajout du client' },
  editClientComing: { ar: 'سيتم إضافة تعديل الموكل قريباً', fr: 'Modification client bientôt disponible' },
  archiveClientConfirm: { ar: 'أرشفة هذا الموكل؟', fr: 'Archiver ce client ?' },
  clientArchived: { ar: 'تم أرشفة الموكل', fr: 'Client archivé' },
  clientLabel: { ar: 'موكل', fr: 'Client' },

  // ─── Settings (user management etc.) ───
  editUserTitle: { ar: 'تعديل المستخدم', fr: 'Modifier l\'utilisateur' },
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
  langChangedToArabic: { ar: 'تم تغيير اللغة إلى العربية', fr: 'Langue changée en français' },
  newUserTitle: { ar: 'مستخدم جديد', fr: 'Nouvel utilisateur' },
  userPwdLabel: { ar: 'كلمة السر', fr: 'Mot de passe' },
  enterCurrentPwd: { ar: 'الرجاء إدخال كلمة السر الحالية', fr: 'Veuillez entrer le mot de passe actuel' },
  currentPwdWrong: { ar: 'كلمة السر الحالية خطأ', fr: 'Mot de passe actuel incorrect' },
  newPwdMinLength: { ar: 'كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل', fr: 'Le nouveau mot de passe doit avoir au moins 8 caractères' },
  pwdNotMatch: { ar: 'كلمة السر غير متطابقة', fr: 'Les mots de passe ne correspondent pas' },
  pwdSaved: { ar: 'تم حفظ كلمة السر بنجاح', fr: 'Mot de passe enregistré' },
  pwdChanged: { ar: 'تم تغيير كلمة السر بنجاح', fr: 'Mot de passe modifié avec succès' },
  settingsSaved: { ar: 'تم حفظ الإعدادات', fr: 'Paramètres enregistrés' },
  settingsSaveFailed: { ar: 'فشل حفظ الإعدادات', fr: 'Échec de l\'enregistrement' },
  cleaningRunning: { ar: 'جاري التنظيف...', fr: 'Nettoyage en cours...' },
  cleanedOrphans: { ar: 'تم تنظيف {n} ملفاً يتيماً ({m} MB)', fr: '{n} fichier(s) orphelin(s) nettoyé(s) ({m} MB)' },
  cleanFailed: { ar: 'فشل تنظيف الملفات', fr: 'Échec du nettoyage' },
  backupCreated: { ar: 'تم إنشاء: {n}', fr: 'Sauvegarde créée : {n}' },
  backupCreateFailed: { ar: 'فشل إنشاء النسخة الاحتياطية', fr: 'Échec de la création de la sauvegarde' },
  archiveExported: { ar: 'تم التصدير: {n}', fr: 'Exporté : {n}' },
  archiveExportSuccess: { ar: 'تم تصدير الأرشيف بنجاح', fr: 'Archive exportée avec succès' },
  archiveExportFailed: { ar: 'فشل تصدير الأرشيف', fr: 'Échec de l\'export' },
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
  alertSettingsSaved: { ar: 'تم حفظ إعدادات التنبيهات', fr: 'Paramètres d\'alertes enregistrés' },
  logStatsLabel: { ar: '{n} مدخلة | {s}KB', fr: '{n} entrées | {s}KB' },
  logsExported: { ar: 'تم تصدير السجلات بنجاح', fr: 'Journaux exportés avec succès' },
  logsExportFailed: { ar: 'فشل تصدير السجلات', fr: 'Échec de l\'export' },
  clearLogsConfirm: { ar: 'مسح جميع سجلات الأخطاء؟', fr: 'Effacer tous les journaux ?' },
  logsCleared: { ar: 'تم مسح السجلات', fr: 'Journaux effacés' },
  logsClearFailed: { ar: 'فشل مسح السجلات', fr: 'Échec de l\'effacement' },
  loadMoreBtn: { ar: 'تحميل المزيد', fr: 'Charger plus' },
  inactiveBadge: { ar: 'غير نشط', fr: 'Inactif' },

  // ─── Cases Views ───
  noCasesInList: { ar: 'لا توجد قضايا', fr: 'Aucune affaire' },
  createFirstCase: { ar: 'أنشئ قضيتك الأولى لبدء التنظيم', fr: 'Créez votre première affaire' },
  defaultPriority: { ar: 'عادي', fr: 'Normal' },
  caseRestored: { ar: 'تم إرجاع القضية', fr: 'Affaire restaurée' },
  caseArchivedToast: { ar: 'تم أرشفة القضية', fr: 'Affaire archivée' },
  archiveToggleFailed: { ar: 'فشل تغيير حالة الأرشفة', fr: 'Échec du changement d\'état' },
  deleteCaseConfirm: { ar: 'حذف هذه القضية؟', fr: 'Supprimer cette affaire ?' },
  caseDeleted: { ar: 'تم حذف القضية', fr: 'Affaire supprimée' },
  caseDeleteFailed: { ar: 'فشل حذف القضية', fr: 'Échec de la suppression' },
  caseInfoLabel: { ar: 'معلومات القضية', fr: 'Informations' },
  clientInfoLabel: { ar: 'الموكل', fr: 'Client' },
  courtInfoLabel: { ar: 'المحكمة', fr: 'Tribunal' },
  typeInfoLabel: { ar: 'النوع', fr: 'Type' },
  priorityInfoLabel: { ar: 'الأولوية', fr: 'Priorité' },
  openDateInfoLabel: { ar: 'تاريخ الفتح', fr: 'Date d\'ouverture' },
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
  hearingAddFailed: { ar: 'فشل إضافة الجلسة', fr: 'Échec d\'ajout' },
  newTaskBtn: { ar: 'مهمة جديدة', fr: 'Nouvelle tâche' },
  taskTitleLabel: { ar: 'العنوان', fr: 'Titre' },
  taskPriorityLabel: { ar: 'الأولوية', fr: 'Priorité' },
  taskDueDateLabel: { ar: 'تاريخ الاستحقاق', fr: 'Échéance' },
  taskTitleRequired: { ar: 'العنوان إجباري', fr: 'Titre requis' },
  taskAddFailed: { ar: 'فشل إضافة المهمة', fr: 'Échec d\'ajout' },
  boldLabel: { ar: 'عريض', fr: 'Gras' },
  italicLabel: { ar: 'مائل', fr: 'Italique' },
  listLabel: { ar: 'قائمة', fr: 'Liste' },
  notesPlaceholderText: { ar: 'اكتب ملاحظاتك هنا...', fr: 'Écrivez vos notes ici...' },
  notesSaveFailed: { ar: 'فشل حفظ الملاحظات', fr: 'Échec d\'enregistrement' },
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
  paymentAddFailed: { ar: 'فشل إضافة الدفعة', fr: 'Échec d\'ajout' },
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
  eventTypeHearing: { ar: '⚖️ جلسة', fr: '⚖️ Audience' },
  eventTypeDeadline: { ar: '⏰ موعد نهائي', fr: '⏰ Date limite' },
  eventTypeMeeting: { ar: '📋 اجتماع', fr: '📋 Réunion' },
  eventTypeTask: { ar: '✅ مهمة', fr: '✅ Tâche' },
  eventTypeDocument: { ar: '📄 تقديم وثائق', fr: '📄 Documents' },
  eventTypePayment: { ar: '💰 دفعة', fr: '💰 Paiement' },
  eventStatusScheduled: { ar: 'مجدول', fr: 'Programmé' },
  eventStatusPostponed: { ar: 'مؤجل', fr: 'Reporté' },
  eventStatusCompleted: { ar: 'مكتمل', fr: 'Terminé' },
  eventStatusCancelled: { ar: 'ملغي', fr: 'Annulé' },
  editEventTitle: { ar: 'تعديل الحدث', fr: 'Modifier l\'événement' },
  newEventTitle: { ar: 'حدث جديد', fr: 'Nouvel événement' },
  eventTitleLabel: { ar: 'العنوان', fr: 'Titre' },
  eventTitlePlaceholder: { ar: 'عنوان الحدث', fr: 'Titre de l\'événement' },
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
  eventSaveFailed: { ar: 'فشل حفظ الحدث', fr: 'Échec d\'enregistrement' },
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
  cmdTryDifferent: { ar: 'جرب كلمات مختلفة أو استخدم البحث المتقدم', fr: 'Essayez d\'autres mots' },

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
  caseNumberHeader: { ar: 'رقم القضية', fr: 'N° d\'affaire' },
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
};

function _t(key) {
  var lang = A._currentLang || 'ar';
  var entry = A.i18n[key];
  return entry ? (entry[lang] || entry.en || entry.ar || key) : key;
}

A.getLocale = function() {
  var lang = A._currentLang || 'ar';
  return lang === 'fr' ? 'fr-FR' : (lang === 'en' ? 'en-US' : 'ar-MA');
};

A.getDayNames = function(len) {
  var locale = A.getLocale();
  len = len || 'long';
  var base = new Date(2024, 0, 1);
  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(new Intl.DateTimeFormat(locale, { weekday: len }).format(d));
  }
  return days;
};

A.getShortDayNames = function() {
  return A.getDayNames('narrow');
};

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
  if (A.state && A.state.loadedSections) {
    const currentSection = document.querySelector('.nav-item.active')?.dataset?.section || 'dashboard';
    A.state.loadedSections.clear();
    A.navigateTo(currentSection);
  }
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
    var text = entry[lang] || entry.en || entry.ar || key;
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
    el.innerHTML = entry[lang] || entry.en || entry.ar || key;
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
