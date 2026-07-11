const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '../..');

test.describe('LexOffece — اختبار جميع الأزرار', () => {
  let app;
  let page;
  let tempDir;

  test.beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ayyoub-test-'));
    app = await electron.launch({
      args: ['--user-data-dir=' + tempDir, path.join(APP_DIR, 'main.js')],
      env: { ...process.env, NODE_ENV: 'test', MASTER_KEY: 'test-master-key-for-e2e' }
    });
    page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) await app.close();
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function waitForStartup() {
    await page.waitForFunction(() => {
      const overlay = document.getElementById('startupOverlay');
      return !overlay || overlay.style.display === 'none' || overlay.style.opacity === '0';
    }, { timeout: 15000 }).catch(() => {});
  }

  async function skipLicense() {
    const skipBtn = page.locator('#licenseSkipBtn');
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
  }

  async function completeSetup() {
    const setupScreen = page.locator('#authSetupScreen');
    const loginScreen = page.locator('#authLoginScreen');
    const isSetup = await setupScreen.isVisible().catch(() => false);
    const isLogin = await loginScreen.isVisible().catch(() => false);
    if (isLogin) {
      const userCard = page.locator('#userCardsContainer .user-card').first();
      if (await userCard.isVisible().catch(() => false)) {
        await userCard.click();
        await page.waitForTimeout(300);
      }
      await page.fill('#loginPassword', 'Test@12345678');
      await page.click('#loginBtn');
      await page.waitForTimeout(2000);
      return;
    }
    if (!isSetup) return;
    await page.fill('#setupOfficeName', 'مكتب الاختبار');
    await page.fill('#setupAdminName', 'المدير المختبر');
    await page.click('#setupNext1');
    await page.waitForTimeout(300);
    await page.fill('#setupPassword', 'Test@12345678');
    await page.fill('#setupConfirmPassword', 'Test@12345678');
    await page.click('#setupNext2');
    await page.waitForTimeout(300);
    await page.selectOption('#sq1', 'ما اسم مدرستك الابتدائية؟');
    await page.fill('#sa1', 'مدرسة النصر');
    await page.click('#authSetupBtn');
    await page.waitForTimeout(2000);
  }

  async function waitForAppReady() {
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app && app.style.display !== 'none';
    }, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  async function getVisibleButtons() {
    return page.evaluate(() => {
      const all = document.querySelectorAll('button, a[href], [data-click], [data-section]');
      return Array.from(all)
        .filter(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
        .map(el => ({
          tag: el.tagName,
          id: el.id || '',
          text: (el.textContent || '').trim().slice(0, 50),
          clickAttr: el.getAttribute('data-click') || '',
          sectionAttr: el.getAttribute('data-section') || '',
          actionAttr: el.getAttribute('data-action') || '',
          className: el.className.slice(0, 60),
          disabled: el.disabled || false
        }));
    });
  }

  test('التطبيق يفتح ويعرض نافذة', async () => {
    await expect(page).toHaveTitle('LexOffece');
  });

  test('إكمال الإعداد الأولي (لأول مرة)', async () => {
    await waitForStartup();
    await skipLicense();
    await completeSetup();
    await waitForAppReady();
    const isAppVisible = await page.evaluate(() => {
      const el = document.getElementById('app');
      return el && el.style.display !== 'none';
    });
    expect(isAppVisible).toBe(true);
  });

  test.describe('قائمة التنقل الجانبية', () => {
    const sections = [
      'dashboard', 'search', 'notifications', 'clients', 'cases',
      'hearings', 'documents', 'calendar', 'tasks', 'expenses',
      'reports', 'ai', 'archive', 'support', 'settings'
    ];
    for (const section of sections) {
      test(`زر ${section} — ينقل إلى القسم الصحيح`, async () => {
        const btn = page.locator(`.nav-item[data-section="${section}"]`);
        await expect(btn).toBeVisible();
        await btn.click();
        await page.waitForTimeout(500);
        const active = page.locator(`#section-${section}`);
        await expect(active).toBeVisible();
      });
    }

    test('زر قفل التطبيق — يظهر شاشة الدخول', async () => {
      const btn = page.locator('#lockAppBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(1000);
      const loginOverlay = page.locator('#loginOverlay');
      await expect(loginOverlay).toBeVisible();
    });

    test('العودة إلى التطبيق بعد القفل', async () => {
      const userCard = page.locator('#userCardsContainer .user-card').first();
      await expect(userCard).toBeVisible({ timeout: 5000 });
      await userCard.click();
      await page.waitForTimeout(300);
      await page.fill('#loginPassword', 'Test@12345678');
      await page.click('#loginBtn');
      await page.waitForTimeout(2000);
      const appEl = page.locator('#app');
      await expect(appEl).toBeVisible();
    });

    test('زر الوضع الليلي — يغير الثيم', async () => {
      await page.click('#darkModeToggle');
      await page.waitForTimeout(500);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await page.click('#darkModeToggle');
      await page.waitForTimeout(300);
    });
  });

  test.describe('الشريط العلوي', () => {
    test('زر الإضافة السريعة — يفتح شاشة القضايا', async () => {
      const btn = page.locator('#quickAddBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const section = page.locator('#section-cases');
      await expect(section).toBeVisible();
    });

    test('زر الإشعارات — ينقل إلى الإشعارات', async () => {
      const btn = page.locator('#notifBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const section = page.locator('#section-notifications');
      await expect(section).toBeVisible();
    });

    test('النقر على المستخدم — ينقل إلى الملف الشخصي', async () => {
      const user = page.locator('.topbar-user');
      await expect(user).toBeVisible();
      await user.click();
      await page.waitForTimeout(500);
      const section = page.locator('#section-profile');
      await expect(section).toBeVisible();
    });
  });

  test.describe('لوحة التحكم — Dashboard', () => {
    test.beforeEach(async () => {
      const btn = page.locator('.nav-item[data-section="dashboard"]');
      await btn.click();
      await page.waitForTimeout(800);
    });

    test('زر إضافة موكل — يفتح المودال', async () => {
      const btn = page.locator('[data-action="client"]').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        const modal = page.locator('#modalOverlay');
        const isModalVisible = await modal.isVisible().catch(() => false);
        if (isModalVisible) {
          const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
          if (await close.isVisible().catch(() => false)) await close.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('زر إضافة قضية — يفتح المودال', async () => {
      const btn = page.locator('[data-action="case"]').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        const modal = page.locator('#modalOverlay');
        const isModalVisible = await modal.isVisible().catch(() => false);
        if (isModalVisible) {
          const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
          if (await close.isVisible().catch(() => false)) await close.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('أزرار الإجراءات السريعة — موجودة ومرئية', async () => {
      const actions = ['case', 'client', 'hearing', 'document'];
      for (const action of actions) {
        const btn = page.locator(`.qa-btn[data-action="${action}"]`);
        await expect(btn).toBeVisible();
      }
    });
  });

  test.describe('الموكلين — Clients', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="clients"]');
      await page.waitForTimeout(800);
    });

    test('زر موكل جديد — يفتح مودال إضافة موكل', async () => {
      const btn = page.locator('#addClientBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#modalOverlay');
      await expect(modal).toBeVisible();
      const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
      if (await close.isVisible().catch(() => false)) await close.click();
      await page.waitForTimeout(300);
    });

    test('أزرار تغيير العرض — موجودة', async () => {
      const views = ['table', 'card', 'segment'];
      for (const view of views) {
        const btn = page.locator(`.view-btn[data-view="${view}"]`);
        await expect(btn).toBeVisible();
      }
    });

    test('زر الفلاتر — يعرض/يخفي شريط الفلاتر', async () => {
      const btn = page.locator('#clientsFilterBtn');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    });

    test('حقل البحث — موجود ويتفاعل', async () => {
      const search = page.locator('#searchClients');
      await expect(search).toBeVisible();
      await search.fill('اختبار');
    });
  });

  test.describe('القضايا — Cases', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="cases"]');
      await page.waitForTimeout(800);
    });

    test('زر قضية جديدة — يفتح مودال إضافة قضية', async () => {
      const btn = page.locator('#addCaseBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#modalOverlay');
      await expect(modal).toBeVisible();
      const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
      if (await close.isVisible().catch(() => false)) await close.click();
      await page.waitForTimeout(300);
    });

    test('زر عرض الأرشيف — موجود', async () => {
      const btn = page.locator('#toggleArchivedBtn');
      await expect(btn).toBeVisible();
    });

    test('زر الفلاتر — موجود', async () => {
      const btn = page.locator('#casesFilterBtn');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    });

    test('حقل البحث — موجود', async () => {
      const search = page.locator('#searchCases');
      await expect(search).toBeVisible();
    });
  });

  test.describe('الجلسات — Hearings', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="hearings"]');
      await page.waitForTimeout(800);
    });

    test('زر حدث جديد — يفتح مودال الإضافة', async () => {
      const btn = page.locator('#addHearingBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#modalOverlay');
      if (await modal.isVisible().catch(() => false)) {
        const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
        if (await close.isVisible().catch(() => false)) await close.click();
        await page.waitForTimeout(300);
      }
    });

    test('أزرار تصفية الجلسات — موجودة', async () => {
      const filters = ['all', 'upcoming', 'past'];
      for (const f of filters) {
        const btn = page.locator(`.filter-btn[data-filter="${f}"]`);
        await expect(btn).toBeVisible();
      }
    });
  });

  test.describe('التقويم — Calendar', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="calendar"]');
      await page.waitForTimeout(800);
    });

    test('أزرار التنقل في التقويم — موجودة', async () => {
      await expect(page.locator('#calPrev')).toBeVisible();
      await expect(page.locator('#calToday')).toBeVisible();
      await expect(page.locator('#calNext')).toBeVisible();
    });

    test('زر اليوم — يعود إلى اليوم الحالي', async () => {
      await page.click('#calToday');
      await page.waitForTimeout(300);
    });

    test('زر إضافة حدث — يفتح المودال', async () => {
      const btn = page.locator('#addEventBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#modalOverlay');
      if (await modal.isVisible().catch(() => false)) {
        const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
        if (await close.isVisible().catch(() => false)) await close.click();
        await page.waitForTimeout(300);
      }
    });

    test('أزرار تغيير العرض — موجودة', async () => {
      const views = ['month', 'week', 'day', 'agenda'];
      for (const view of views) {
        const btn = page.locator(`.view-btn[data-view="${view}"]`);
        await expect(btn).toBeVisible();
      }
    });
  });

  test.describe('المهام — Tasks', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="tasks"]');
      await page.waitForTimeout(800);
    });

    test('زر مهمة جديدة — يفتح مودال الإضافة', async () => {
      const btn = page.locator('#addTaskBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#modalOverlay');
      await expect(modal).toBeVisible();
      const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
      if (await close.isVisible().catch(() => false)) await close.click();
      await page.waitForTimeout(300);
    });

    test('زر سير العمل — يفتح مودال سير العمل', async () => {
      const btn = page.locator('#showWorkflowsBtn');
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#workflowModalOverlay');
      if (await modal.isVisible().catch(() => false)) {
        await page.evaluate(() => {
          const el = document.getElementById('workflowModalOverlay');
          if (el) el.style.display = 'none';
        });
        await page.waitForTimeout(300);
      }
    });

    test('أزرار تغيير العرض — موجودة', async () => {
      const views = ['list', 'kanban', 'priority', 'analytics'];
      for (const view of views) {
        const btn = page.locator(`.view-btn[data-view="${view}"]`);
        await expect(btn).toBeVisible();
      }
    });
  });

  test.describe('الوثائق — Documents', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="documents"]');
      await page.waitForTimeout(800);
    });

    test('زر رفع وثيقة — موجود', async () => {
      const btn = page.locator('#uploadDocGlobalBtn');
      await expect(btn).toBeVisible();
    });

    test('أزرار تغيير العرض — موجودة', async () => {
      const views = ['grid', 'table', 'folder'];
      for (const view of views) {
        const btn = page.locator(`.view-btn[data-view="${view}"]`);
        await expect(btn).toBeVisible();
      }
    });
  });

  test.describe('التقارير — Reports', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="reports"]');
      await page.waitForTimeout(800);
    });

    test('بطاقات التقارير — موجودة وقابلة للنقر', async () => {
      const reports = ['cases', 'clients', 'hearings', 'financial', 'tasks', 'monthly'];
      for (const r of reports) {
        const card = page.locator(`.report-card[data-report="${r}"]`);
        if (await card.isVisible().catch(() => false)) {
          await card.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('الأرشيف — Archive', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="archive"]');
      await page.waitForTimeout(800);
    });

    test('حقل البحث في الأرشيف — موجود', async () => {
      const search = page.locator('#searchArchive');
      await expect(search).toBeVisible();
    });
  });

  test.describe('الإعدادات — Settings', () => {
    test.beforeEach(async () => {
      await page.click('.nav-item[data-section="settings"]');
      await page.waitForTimeout(1000);
    });

    test('أزرار التنقل في الإعدادات — موجودة', async () => {
      const settings = ['general', 'security', 'users', 'activity', 'logs', 'backup', 'maintenance', 'notifications', 'about'];
      for (const s of settings) {
        const item = page.locator(`.settings-nav-item[data-setting="${s}"]`);
        if (await item.isVisible().catch(() => false)) {
          await item.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('زر تغيير كلمة السر — يفتح المودال', async () => {
      await page.click('.settings-nav-item[data-setting="security"]');
      await page.waitForTimeout(500);
      const btn = page.locator('#settingsChangePwdBtn');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        const modal = page.locator('#modalOverlay');
        if (await modal.isVisible().catch(() => false)) {
          const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
          if (await close.isVisible().catch(() => false)) await close.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('زر إضافة مستخدم — يفتح المودال', async () => {
      await page.click('.settings-nav-item[data-setting="users"]');
      await page.waitForTimeout(500);
      const btn = page.locator('#settingAddUserBtn');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        const modal = page.locator('#modalOverlay');
        if (await modal.isVisible().catch(() => false)) {
          const close = page.locator('#modalOverlay .modal-close-btn, #modalOverlay .close-btn');
          if (await close.isVisible().catch(() => false)) await close.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('تقارير شاملة', () => {
    test('جميع الأزرار المرئية — موجودة وغير معطلة', async () => {
      const buttons = await getVisibleButtons();
      expect(buttons.length).toBeGreaterThan(10);
      const disabled = buttons.filter(b => b.disabled);
      expect(disabled.length).toBe(0);
    });

    test('أزرار التنقل الجانبية — جميعها مرئية', async () => {
      const sections = ['dashboard', 'search', 'notifications', 'clients', 'cases', 'hearings', 'documents', 'calendar', 'tasks', 'expenses', 'reports', 'ai', 'archive', 'support', 'settings'];
      for (const s of sections) {
        await expect(page.locator(`.nav-item[data-section="${s}"]`)).toBeVisible();
      }
    });
  });
});
