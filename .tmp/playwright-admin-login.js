const { createRequire } = require('module');
const requireFromProject = createRequire('C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/zenith-catalog-glow-main/package.json');
const { chromium } = requireFromProject('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`BROWSER_CONSOLE [${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`PAGE_ERROR ${err.message}`);
  });

  await page.goto('http://127.0.0.1:8080/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('#email', 'admin@gadget69.com');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  const dashboardUrl = page.waitForURL('**/admin/dashboard', { timeout: 15000 }).then(() => 'success');
  const toastVisible = page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => 'toast').catch(() => null);
  const result = await Promise.race([dashboardUrl, toastVisible]);

  if (result === 'toast') {
    const toastText = await page.locator('[data-sonner-toast]').first().innerText();
    console.log(`LOGIN_TOAST ${toastText}`);
    await page.screenshot({ path: 'C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/.tmp/admin-login-failed.png', fullPage: true });
    await browser.close();
    process.exit(2);
  }

  console.log(`FINAL_URL ${page.url()}`);
  await page.screenshot({ path: 'C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/.tmp/admin-dashboard.png', fullPage: true });
  await browser.close();
})();
