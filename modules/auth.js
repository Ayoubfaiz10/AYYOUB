window.App = window.App || {};
const A = window.App;

A.checkAuth = function() {
  const loginOverlay = document.getElementById('loginOverlay');
  const appEl = document.getElementById('app');
  if (loginOverlay) loginOverlay.style.display = 'none';
  if (appEl) appEl.style.display = 'flex';
  if (typeof A.loadDashboard === 'function') A.loadDashboard();
};

A.initAuth = function() {
  document.getElementById('lockAppBtn')?.addEventListener('click', () => {
    const pw = document.getElementById('loginPassword');
    if (pw) pw.value = '';
    const loginOverlay = document.getElementById('loginOverlay');
    const appEl = document.getElementById('app');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (appEl) appEl.style.display = 'none';
  });

  let onbStep = 0;
  const onbData = [
    { title: 'مرحباً بك في مدير المكتب', desc: 'منصة إدارة المكاتب القانونية — نظّم قضاياك، موكليك، وثائقك، وجلساتك في مكان واحد متكامل.' },
    { title: 'إدارة القضايا والموكلين', desc: 'أنشئ القضايا، أضف الموكلين، وتابع كل التفاصيل في مساحات عمل متخصصة. كل شيء مترابط.' },
    { title: 'التقويم والجلسات', desc: 'جدول زمني قانوني شامل مع 4 طرق عرض، تنبيهات ذكية، وجلسات مرتبطة بالقضايا.' },
    { title: 'المساعد الذكي', desc: 'محرك ذكاء اصطناعي قانوني — حلل، صغ، استشر. سياق كامل لجميع قضاياك ووثائقك.' },
  ];

  function showOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    if (localStorage.getItem('onboardingDone')) return;
    overlay.style.display = 'flex';
    updateOnbStep();
  }

  function updateOnbStep() {
    const title = document.getElementById('onbTitle');
    const desc = document.getElementById('onbDesc');
    const dots = document.querySelectorAll('.onboarding-dot');
    const next = document.getElementById('onbNext');
    if (title) title.textContent = onbData[onbStep].title;
    if (desc) desc.textContent = onbData[onbStep].desc;
    dots.forEach((d, i) => d.classList.toggle('active', i === onbStep));
    if (next) next.textContent = onbStep === onbData.length - 1 ? 'ابدأ الآن' : 'التالي';
  }

  document.getElementById('onbNext')?.addEventListener('click', () => {
    onbStep++;
    if (onbStep >= onbData.length) {
      const overlay = document.getElementById('onboardingOverlay');
      if (overlay) overlay.style.display = 'none';
      localStorage.setItem('onboardingDone', 'true');
    } else {
      updateOnbStep();
    }
  });

  document.getElementById('onbSkip')?.addEventListener('click', () => {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';
    localStorage.setItem('onboardingDone', 'true');
  });

  document.getElementById('loginBtn')?.addEventListener('click', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const appEl = document.getElementById('app');
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (appEl) appEl.style.display = 'flex';
    A.loadDashboard();
  });

  window.addEventListener('load', () => setTimeout(showOnboarding, 800));
};
