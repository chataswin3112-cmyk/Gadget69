const { createRequire } = require('module');
const requireFromProject = createRequire('C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/zenith-catalog-glow-main/package.json');
const { chromium } = requireFromProject('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log(`BROWSER_CONSOLE [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => console.log(`PAGE_ERROR ${err.message}`));
  page.on('request', (req) => {
    if (req.url().includes('/admin/login')) console.log(`REQUEST ${req.method()} ${req.url()}`);
  });
  page.on('requestfailed', (req) => {
    if (req.url().includes('/admin/login')) console.log(`REQUEST_FAILED ${req.method()} ${req.url()} ${req.failure()?.errorText || 'unknown'}`);
  });
  page.on('response', async (response) => {
    if (response.url().includes('/admin/login')) {
      let body = '';
      try { body = await response.text(); } catch {}
      console.log(`RESPONSE ${response.status()} ${response.url()} ${body}`);
    }
  });

  await page.goto('http://127.0.0.1:8080/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('#email', 'admin@gadget69.com');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);

  console.log(`CURRENT_URL ${page.url()}`);
  console.log(`TOKEN ${await page.evaluate(() => localStorage.getItem('mzflow_admin_token') || '')}`);
  await page.screenshot({ path: 'C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/.tmp/admin-login-trace.png', fullPage: true });
  await browser.close();
})();
