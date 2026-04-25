const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(process.env.TARGET_URL || 'http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 4837));
  await page.waitForTimeout(2000);
  const imgs = await page.$$eval('.home-product-card img', imgs => imgs.map((img, i) => ({
    i,
    alt: img.getAttribute('alt'),
    src: img.getAttribute('src'),
    currentSrc: img.currentSrc,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    rect: (() => { const r = img.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })(),
    visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
  })));
  console.log(JSON.stringify(imgs, null, 2));
  await browser.close();
})();
