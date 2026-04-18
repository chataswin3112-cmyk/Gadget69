import { chromium } from "playwright";

const APP_URL = "http://127.0.0.1:8080";
const API_URL = "http://127.0.0.1:8081/api";
const OUT_DIR = "C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/.tmp/browser-check";

const ensure = async (response, label) => {
  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const slugify = (value) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

const [products, sections] = await Promise.all([
  fetch(`${API_URL}/products`).then((response) => ensure(response, "products")),
  fetch(`${API_URL}/sections`).then((response) => ensure(response, "sections")),
]);

if (!products.length || !sections.length) {
  throw new Error("Seed data missing for browser checks");
}

const routes = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "product-details", path: `/products/${products[0].id}` },
  { name: "categories", path: "/categories" },
  { name: "category-details", path: `/categories/${sections[0].id}` },
  { name: "contact", path: "/contact" },
  { name: "cart", path: "/cart" },
  { name: "admin-login", path: "/admin" },
  { name: "admin-dashboard", path: "/admin/dashboard", requiresLogin: true },
];

const viewports = [
  { name: "desktop", context: { viewport: { width: 1440, height: 900 } } },
  {
    name: "mobile",
    context: {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    },
  },
];

const browser = await chromium.launch({ headless: true });
const issues = [];
const summaries = [];

for (const viewport of viewports) {
  const context = await browser.newContext(viewport.context);
  const page = await context.newPage();
  const consoleIssues = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleIssues.push(`console:${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleIssues.push(`pageerror:${error.message}`);
  });

  let loggedIn = false;

  for (const route of routes) {
    if (route.requiresLogin && !loggedIn) {
      await page.goto(`${APP_URL}/admin`, { waitUntil: "networkidle", timeout: 30000 });
      await page.getByLabel("Email").fill("admin@gadget69.com");
      await page.getByLabel("Password").fill("Admin@123");
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForURL("**/admin/dashboard", { timeout: 30000 });
      loggedIn = true;
    } else {
      await page.goto(`${APP_URL}${route.path}`, { waitUntil: "networkidle", timeout: 30000 });
    }

    if (viewport.name === "mobile" && route.name === "home") {
      const menuButton = page.getByRole("button").filter({ has: page.locator("svg.lucide-menu") }).first();
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(250);
      }
    }

    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const horizontalOverflow = root.scrollWidth - window.innerWidth;
      const header = document.querySelector("h1, h2");
      return {
        title: document.title,
        horizontalOverflow,
        bodyHeight: document.body.scrollHeight,
        headerText: header?.textContent?.trim() || "",
      };
    });

    const newConsoleIssues = consoleIssues.splice(0, consoleIssues.length);
    if (metrics.horizontalOverflow > 1) {
      issues.push(`${viewport.name}:${route.name}: horizontal overflow ${metrics.horizontalOverflow}px`);
    }
    if (newConsoleIssues.length) {
      issues.push(`${viewport.name}:${route.name}: ${newConsoleIssues.join(" | ")}`);
    }

    const screenshotPath = `${OUT_DIR}/${viewport.name}-${slugify(route.name)}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    summaries.push({ viewport: viewport.name, route: route.name, ...metrics, screenshotPath });
  }

  await context.close();
}

await browser.close();

console.log(JSON.stringify({ issues, summaries }, null, 2));
