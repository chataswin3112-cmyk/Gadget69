const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:4173";
const REPO_ROOT = process.env.SMOKE_REPO_ROOT || process.cwd();
const OUTPUT_PATH =
  process.env.SMOKE_OUTPUT ||
  path.join(REPO_ROOT, ".tmp", "playwright-smoke-report.json");
const ARTIFACT_DIR =
  process.env.SMOKE_ARTIFACT_DIR ||
  path.join(REPO_ROOT, ".tmp", "playwright-smoke-artifacts");

const ADMIN_EMAIL = "admin@gadget69.com";
const ADMIN_PASSWORD = "Admin@123";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 20000 });
}

async function clickIfVisible(page, role, name) {
  const locator = page.getByRole(role, { name });
  const count = await locator.count();
  if (count === 1 && (await locator.isVisible())) {
    await locator.click();
    return true;
  }
  return false;
}

async function scrollUntilVisible(page, locator, attempts = 12) {
  for (let index = 0; index < attempts; index += 1) {
    if ((await locator.count()) > 0 && (await locator.first().isVisible())) {
      return true;
    }
    await page.evaluate(() => {
      window.scrollBy(0, Math.round(window.innerHeight * 1.35));
    });
    await page.waitForTimeout(1000);
  }
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(2500);
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

async function main() {
  await ensureDir(ARTIFACT_DIR);

  const browser = await chromium.launch({ headless: false, slowMo: 75 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  const report = {
    targetUrl: TARGET_URL,
    startedAt: new Date().toISOString(),
    home: {},
    admin: {},
    consoleErrors,
    pageErrors,
  };

  const smokeImage = path.join(REPO_ROOT, ".tmp", "upload-smoke-8082", "smoke-image.png");
  const smokeVideo = path.join(REPO_ROOT, ".tmp", "upload-smoke-8082", "smoke-video.mp4");

  try {
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

    report.home.title = await page.title();
    report.home.heroLoaded = await page.getByRole("link", { name: "Shop Now" }).isVisible();

    await clickIfVisible(page, "button", "Next banner");
    await clickIfVisible(page, "button", "Previous banner");

    await page.getByRole("link", { name: "Search products" }).click();
    await page.waitForURL("**/products", { timeout: 20000 });
    report.home.productsRouteReached = page.url().includes("/products");

    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

    const reviewHeading = page.getByText("Customer Feedback", { exact: false });
    const reviewVisible = await scrollUntilVisible(page, reviewHeading);
    if (!reviewVisible) {
      throw new Error("Review section never became visible after scrolling");
    }
    await waitForText(page, "Customer Feedback");

    const communityHeading = page.getByText("Join The Clan", { exact: false });
    const communityVisible = await scrollUntilVisible(page, communityHeading);
    if (!communityVisible) {
      throw new Error("Community section never became visible after scrolling");
    }
    await waitForText(page, "Join The Clan");

    report.home.reviewSectionVisible = reviewVisible;
    report.home.communitySectionVisible = communityVisible;

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "home.png"),
      fullPage: true,
    });

    await page.goto(`${TARGET_URL}/admin/login`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/admin/dashboard", { timeout: 20000 });
    report.admin.loginWorked = page.url().includes("/admin/dashboard");

    await page.goto(`${TARGET_URL}/admin/media`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForText(page, "Community Media");
    await page.getByRole("button", { name: "Add Media" }).click();
    await waitForText(page, "Add Media Item");
    const dialog = page.locator('[role="dialog"]');

    await dialog.locator("input").nth(0).fill("Codex Smoke Image");
    await dialog.locator("textarea").nth(0).fill("Browser smoke image upload");
    await dialog.locator('input[type="file"]').first().setInputFiles(smokeImage);
    await dialog.getByRole("button", { name: "Save" }).click();
    await waitForText(page, "Media item created");
    await waitForText(page, "Codex Smoke Image");

    report.admin.imageUploadWorked = true;

    await page.getByRole("button", { name: "Add Media" }).click();
    await waitForText(page, "Add Media Item");
    await dialog.locator("input").nth(0).fill("Codex Smoke Video");
    await dialog.locator("textarea").nth(0).fill("Browser smoke video upload");
    await dialog.getByRole("combobox").first().click();
    await page.getByText("Video", { exact: true }).click();
    await dialog.locator('input[aria-label="Upload community video"]').setInputFiles(smokeVideo);
    await dialog.getByRole("button", { name: "Save" }).click();
    await waitForText(page, "Media item created");

    report.admin.videoUploadWorked = true;

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "admin-media.png"),
      fullPage: true,
    });
  } catch (error) {
    report.failed = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
