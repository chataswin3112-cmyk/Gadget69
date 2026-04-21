import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const frontendUrl = args.get("--frontend-url") || process.env.PERF_FRONTEND_URL || "http://127.0.0.1:8080";
const backendUrl = args.get("--backend-url") || process.env.PERF_BACKEND_URL || "http://127.0.0.1:8081";
const outputPath =
  args.get("--output") ||
  process.env.PERF_MOBILE_OUTPUT ||
  path.join(projectRoot, ".tmp", "perf-audit", "mobile-smoke.json");
const adminEmail = process.env.PERF_ADMIN_EMAIL || "admin@gadget69.com";
const adminPassword = process.env.PERF_ADMIN_PASSWORD || "Admin@123";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["Pixel 7"],
  baseURL: frontendUrl,
});
const page = await context.newPage();

const results = [];

const captureRoute = async (routePath, action) => {
  const consoleErrors = [];
  const requestFailures = [];

  const onConsole = (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  const onRequestFailed = (request) => {
    requestFailures.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText || "FAILED"}`
    );
  };

  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);

  let status = "ok";
  let error = null;

  try {
    await page.goto(routePath, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    if (action) {
      await action(page);
    }
    await page.waitForTimeout(1200);
  } catch (routeError) {
    status = "error";
    error = routeError instanceof Error ? routeError.message : String(routeError);
  }

  const metrics = await page.evaluate(() => ({
    title: document.title,
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    snippet: document.body.innerText.slice(0, 800),
  }));

  results.push({
    path: routePath,
    status,
    error,
    ...metrics,
    consoleErrors,
    requestFailures,
  });

  page.off("console", onConsole);
  page.off("requestfailed", onRequestFailed);
};

const productResponse = await fetch(`${backendUrl}/api/products`);
const productList = productResponse.ok ? await productResponse.json() : [];
const productId = productList[0]?.id;

await captureRoute("/", async () => {});
await captureRoute("/products", async () => {});
if (productId) {
  await captureRoute(`/products/${productId}`, async () => {});
}

await captureRoute("/admin", async (adminPage) => {
  await adminPage.fill('input[type="email"]', adminEmail);
  await adminPage.fill('input[type="password"]', adminPassword);
  await Promise.all([
    adminPage.waitForURL("**/admin/dashboard", { timeout: 20000 }),
    adminPage.getByRole("button", { name: /sign in|login/i }).click(),
  ]);
});

await captureRoute("/admin/orders", async () => {});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(
    {
      frontendUrl,
      backendUrl,
      productId,
      generatedAt: new Date().toISOString(),
      results,
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Mobile route audit saved to ${outputPath}`);
console.log(JSON.stringify({ productId, results }, null, 2));

await browser.close();
