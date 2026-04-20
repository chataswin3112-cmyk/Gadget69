const { chromium } = require("playwright");
const fs = require("fs");

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR;
const seed = JSON.parse(fs.readFileSync(process.env.SEED_PATH, "utf8"));

(async () => {
  const checks = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const shot = async (name) => {
    if (!SCREENSHOT_DIR) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
  };

  const expectHeading = async (name) => {
    await page.getByRole("heading", { name }).waitFor({ state: "visible", timeout: 20000 });
  };

  try {
    await page.goto(`${TARGET_URL}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("admin@gadget69.com");
    await page.locator('input[type="password"]').first().fill("Admin@123");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL("**/admin/dashboard", { timeout: 20000 });
    await expectHeading("Dashboard");
    await shot("admin-dashboard");
    checks.push("Admin login and dashboard loaded");

    const adminPages = [
      ["/admin/categories", "Categories"],
      ["/admin/products", "Products"],
      ["/admin/offers", "Offers"],
      ["/admin/orders", "Order Management"],
      ["/admin/media", "Community Media"],
      ["/admin/settings", "Settings"],
    ];

    for (const [path, heading] of adminPages) {
      await page.goto(`${TARGET_URL}${path}`, { waitUntil: "domcontentloaded" });
      await expectHeading(heading);
      checks.push(`Admin page loaded: ${heading}`);
    }

    await page.goto(`${TARGET_URL}/admin/products`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Search products...").fill(seed.productName);
    await page.getByText(seed.productName).first().waitFor({ state: "visible", timeout: 20000 });
    const row = page.locator("tbody tr").filter({ hasText: seed.productName }).first();
    await row.locator("button").first().click();
    await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("tab", { name: "Media" }).click();
    await page.getByText("Product Media").waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("tab", { name: "Variants" }).click();
    await page.getByText("Ocean Blue").waitFor({ state: "visible", timeout: 10000 });
    await shot("admin-product-editor");
    checks.push("Admin product editor shows media and variants");

    await page.goto(`${TARGET_URL}/admin/offers`, { waitUntil: "domcontentloaded" });
    await page.getByText(seed.productName).first().waitFor({ state: "visible", timeout: 20000 });
    checks.push("Admin offers page shows seeded offer");

    await page.goto(`${TARGET_URL}/admin/orders`, { waitUntil: "domcontentloaded" });
    await page.getByText(seed.orderCustomer).first().waitFor({ state: "visible", timeout: 20000 });
    checks.push("Admin orders page shows seeded order");

    await page.goto(`${TARGET_URL}/admin/settings`, { waitUntil: "domcontentloaded" });
    const phoneValue = await page.locator("label", { hasText: "Shop Phone" }).locator("..").locator("input").inputValue();
    const emailValue = await page.locator("label", { hasText: "Support Email" }).locator("..").locator("input").inputValue();
    if (phoneValue !== seed.shopPhone) throw new Error(`Unexpected shop phone: ${phoneValue}`);
    if (emailValue !== seed.supportEmail) throw new Error(`Unexpected support email: ${emailValue}`);
    checks.push("Admin settings show updated phone and support email");

    await page.goto(`${TARGET_URL}/products/${seed.productId}`, { waitUntil: "domcontentloaded" });
    await expectHeading(seed.productName);
    await page.locator('button[title="Ocean Blue"]').click();
    await page.getByText(/Color:\s*Ocean Blue/i).waitFor({ state: "visible", timeout: 10000 });
    await page.getByText(seed.bluePriceText).first().waitFor({ state: "visible", timeout: 10000 });
    await shot("store-product-detail");
    checks.push("Store product page switches variant and price");

    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.getByText(/Cart \(/i).waitFor({ state: "visible", timeout: 10000 });
    await page.getByText(seed.blueVariantName).first().waitFor({ state: "visible", timeout: 10000 });
    checks.push("Add to cart opens drawer with selected variant");

    await page.getByRole("link", { name: /view cart/i }).click();
    await page.waitForURL("**/cart", { timeout: 10000 });
    await page.getByText(seed.productName).first().waitFor({ state: "visible", timeout: 10000 });
    await page.getByText(seed.blueVariantName).first().waitFor({ state: "visible", timeout: 10000 });
    await shot("store-cart");
    checks.push("Cart page preserves the variant line item");

    await page.goto(`${TARGET_URL}/contact`, { waitUntil: "domcontentloaded" });
    await page.getByText(seed.shopPhone).first().waitFor({ state: "visible", timeout: 10000 });
    await page.getByText(seed.supportEmail).first().waitFor({ state: "visible", timeout: 10000 });
    const pageText = await page.locator("body").innerText();
    if (/facebook/i.test(pageText)) throw new Error("Facebook is still visible on contact page");
    checks.push("Contact page shows phone/email and no Facebook");

    console.log("E2E_OK " + JSON.stringify(checks));
  } catch (error) {
    console.error("E2E_FAIL " + (error && error.stack ? error.stack : error));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
