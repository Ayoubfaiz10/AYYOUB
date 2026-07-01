const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '../..');

test.describe('مدير مكتب المحامي — Smoke Test', () => {
  let app;
  let window;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [path.join(APP_DIR, 'main.js')],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    window = await app.firstWindow();
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test('يُظهر نافذة التطبيق بالعنوان الصحيح', async () => {
    await expect(window).toHaveTitle('مدير مكتب المحامي');
  });

  test('النافذة مرئية ولها أبعاد صحيحة', async () => {
    const bounds = await window.evaluate(() => {
      const el = document.documentElement;
      return { w: el.clientWidth, h: el.clientHeight };
    });
    expect(bounds.w).toBeGreaterThan(200);
    expect(bounds.h).toBeGreaterThan(200);
  });

  test('عناصر HTML الأساسية موجودة', async () => {
    const hasApp = await window.evaluate(() => !!document.getElementById('app'));
    const hasStartup = await window.evaluate(() => !!document.getElementById('startupOverlay'));
    expect(hasApp).toBe(true);
    expect(hasStartup).toBe(true);
  });
});
