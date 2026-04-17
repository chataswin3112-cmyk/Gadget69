const { createRequire } = require('module');
const requireFromProject = createRequire('C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/zenith-catalog-glow-main/package.json');
const { chromium } = requireFromProject('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log(`BROWSER_CONSOLE [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => console.log(`PAGE_ERROR ${err.message}`));
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/admin/login')) {
      let body = '';
      try { body = await response.text(); } catch {}
      console.log(`LOGIN_HTTP ${response.status()} ${body}`);
    }
  });

  await page.goto('http://127.0.0.1:8080/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('#email', 'admin@gadget69.com');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  const token = await page.evaluate(() => localStorage.getItem('mzflow_admin_token'));
  const toast = await page.locator('[data-sonner-toast]').count() > 0
    ? await page.locator('[data-sonner-toast]').first().innerText()
    : 'NO_TOAST';

  console.log(`CURRENT_URL ${currentUrl}`);
  console.log(`TOKEN_PRESENT ${token ? 'YES' : 'NO'}`);
  console.log(`TOAST_TEXT ${toast}`);

  await page.screenshot({ path: 'C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/.tmp/admin-login-diagnose.png', fullPage: true });
  await browser.close();
})();
