import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:4173";
const OUTPUT_PATH = path.join(process.cwd(), ".tmp", "playwright-browser-verify.json");
const ADMIN_EMAIL = "admin@gadget69.com";
const ADMIN_PASSWORD = "Admin@123";

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const checkPage = async (label, route, verify, options = {}) => {
    const page = await browser.newPage({
      viewport: options.viewport ?? { width: 1440, height: 960 },
    });
    page.setDefaultTimeout(15000);
    const consoleErrors = [];
    const requestFailures = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("requestfailed", (request) => {
      const failureText = request.failure()?.errorText ?? "FAILED";
      if (!failureText.includes("ERR_ABORTED")) {
        requestFailures.push(`${request.method()} ${request.url()} ${failureText}`);
      }
    });

    let status = "ok";
    let error = null;

    try {
      await page.goto(`${TARGET_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.locator("body").waitFor({ state: "visible", timeout: 10000 });
      await verify(page);
    } catch (pageError) {
      status = "error";
      error = pageError instanceof Error ? pageError.message : String(pageError);
    }

    results.push({
      label,
      route,
      status,
      error,
      title: await page.title(),
      url: page.url(),
      consoleErrors,
      requestFailures,
    });

    await page.close();
  };

  await checkPage("home", "/", async (page) => {
    await page.locator("text=Premium Electronics").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=Explore Categories").waitFor({ state: "visible", timeout: 10000 });
  });

  await checkPage("products", "/products", async (page) => {
    await page.locator("text=All Products").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=5 products").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=Gadget Pro Max").waitFor({ state: "visible", timeout: 10000 });
  });

  await checkPage("product-details", "/products/1", async (page) => {
    await page.locator("h1:has-text('Gadget Pro Max')").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("button:has-text('Add to Cart')").waitFor({ state: "visible", timeout: 10000 });
  });

  await checkPage(
    "home-mobile",
    "/",
    async (page) => {
      await page.locator("text=Skip to content").waitFor({ state: "visible", timeout: 10000 });
      await page.locator("text=Explore Categories").waitFor({ state: "visible", timeout: 10000 });
    },
    { viewport: { width: 412, height: 915 } }
  );

  await checkPage("admin-login", "/admin", async (page) => {
    await page.locator("input[type='email']").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("input[type='password']").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("button:has-text('Sign In')").waitFor({ state: "visible", timeout: 10000 });
  });

  await checkPage("admin-dashboard", "/admin", async (page) => {
    await page.locator("input[type='email']").fill(ADMIN_EMAIL);
    await page.locator("input[type='password']").fill(ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL("**/admin/dashboard", { timeout: 20000 }),
      page.locator("button:has-text('Sign In')").click(),
    ]);
    await page.locator("text=Catalog Control Center").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=Total Revenue").waitFor({ state: "visible", timeout: 10000 });
  });

  await checkPage("admin-orders", "/admin", async (page) => {
    await page.locator("input[type='email']").fill(ADMIN_EMAIL);
    await page.locator("input[type='password']").fill(ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL("**/admin/dashboard", { timeout: 20000 }),
      page.locator("button:has-text('Sign In')").click(),
    ]);
    await page.goto(`${TARGET_URL}/admin/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator("body").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=Order Management").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("text=5 order(s) match the current queue view.").waitFor({ state: "visible", timeout: 10000 });
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf8");
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
};

run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
