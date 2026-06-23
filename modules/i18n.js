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
