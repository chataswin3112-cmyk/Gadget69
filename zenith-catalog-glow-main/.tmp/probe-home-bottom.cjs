const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  for (let i = 0; i < 8; i += 1) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 1.4)));
    await page.waitForTimeout(900);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  const text = await page.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    url: page.url(),
    textSample: text.slice(0, 2500),
    hasCustomerFeedback: text.includes("Customer Feedback"),
    hasWhatPeopleSay: text.includes("What People Say"),
    hasCommunity: text.includes("Community"),
    bodyLength: text.length,
  }, null, 2));
  await page.screenshot({ path: "c:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/zenith-catalog-glow-main/.tmp/probe-home-bottom.png", fullPage: true });
  await browser.close();
})();
