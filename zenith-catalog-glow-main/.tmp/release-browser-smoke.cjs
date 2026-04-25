const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:4173";
const REPO_ROOT = process.env.SMOKE_REPO_ROOT || process.cwd();
const OUTPUT_PATH =
  process.env.SMOKE_OUTPUT ||
  path.join(REPO_ROOT, ".tmp", "release-browser-report.json");
const ARTIFACT_DIR =
  process.env.SMOKE_ARTIFACT_DIR ||
  path.join(REPO_ROOT, ".tmp", "release-browser-artifacts");

const ADMIN_EMAIL = "admin@gadget69.com";
const ADMIN_PASSWORD = "Admin@123";
const RUN_ID = `${Date.now()}`.slice(-6);
const IMAGE_TITLE = `Smoke Image ${RUN_ID}`;
const VIDEO_TITLE = `Smoke Video ${RUN_ID}`;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function findFirstExisting(paths) {
  for (const candidate of paths) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`No file found from candidates: ${paths.join(", ")}`);
}

async function captureStep(page, report, label, action) {
  const consoleErrors = [];
  const requestFailures = [];
  const pageErrors = [];

  const handleConsole = (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  const handleRequestFailed = (request) => {
    const errorText = request.failure()?.errorText || "FAILED";
    if (!errorText.includes("ERR_ABORTED")) {
      requestFailures.push(`${request.method()} ${request.url()} ${errorText}`);
    }
  };
  const handlePageError = (error) => {
    pageErrors.push(String(error));
  };

  page.on("console", handleConsole);
  page.on("requestfailed", handleRequestFailed);
  page.on("pageerror", handlePageError);

  const startedAt = new Date().toISOString();
  try {
    const details = await action();
    const screenshotPath = path.join(ARTIFACT_DIR, `${label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    report.steps.push({
      label,
      status: "passed",
      startedAt,
      finishedAt: new Date().toISOString(),
      url: page.url(),
      title: await page.title(),
      consoleErrors,
      requestFailures,
      pageErrors,
      screenshotPath,
      details,
    });
  } catch (error) {
    const screenshotPath = path.join(ARTIFACT_DIR, `${label}-failed.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    report.steps.push({
      label,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      url: page.url(),
      title: await page.title().catch(() => ""),
      consoleErrors,
      requestFailures,
      pageErrors,
      screenshotPath,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  } finally {
    page.off("console", handleConsole);
    page.off("requestfailed", handleRequestFailed);
    page.off("pageerror", handlePageError);
  }
}

async function waitForText(page, text, timeout = 20000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

async function scrollIntoView(page, text, attempts = 10) {
  const locator = page.getByText(text, { exact: false }).first();
  for (let index = 0; index < attempts; index += 1) {
    if (await locator.isVisible().catch(() => false)) {
      return locator;
    }
    await page.evaluate(() => {
      window.scrollBy(0, Math.round(window.innerHeight * 0.9));
    });
    await page.waitForTimeout(600);
  }

  throw new Error(`Could not find text on page after scrolling: ${text}`);
}

async function openPage(context, route) {
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(`${TARGET_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  return page;
}

async function main() {
  await ensureDir(ARTIFACT_DIR);

  const smokeImage = await findFirstExisting([
    path.join(REPO_ROOT, "uploads", "images", "28058149-5653-42b0-9274-f41b18a71b92.png"),
    path.join(REPO_ROOT, "uploads", "images", "73fd0903-2467-40db-aabc-8109c35618cf.png"),
    path.join(REPO_ROOT, "backend", "uploads", "images", "11d5b8de-a46c-4fe1-a6a1-99d43d4085ae.jpg"),
  ]);
  const smokeVideo = await findFirstExisting([
    path.join(REPO_ROOT, "uploads", "videos", "ad3a403a-c74c-441f-9dd4-e9e76a8f073b.mp4"),
    path.join(REPO_ROOT, "uploads", "videos", "e0a87a15-7c9d-43af-951c-ba09efe6eadf.mp4"),
    path.join(REPO_ROOT, "backend", "uploads", "videos", "8865a483-1565-44bd-b66e-82232c36af80.mp4"),
  ]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });

  const report = {
    targetUrl: TARGET_URL,
    startedAt: new Date().toISOString(),
    smokeImage,
    smokeVideo,
    steps: [],
  };

  try {
    {
      const page = await openPage(context, "/");
      await captureStep(page, report, "home", async () => {
        await waitForText(page, "Premium Electronics");
        await waitForText(page, "Explore Categories");
        const heroCount = await page.locator(".home-hero img").count();
        if (heroCount < 1) {
          throw new Error("Hero image did not render");
        }

        const nextBannerButton = page.getByRole("button", { name: "Next banner" });
        if ((await nextBannerButton.count()) === 1) {
          await nextBannerButton.click();
        }

        return {
          heroImageCount: heroCount,
          bannerControlsVisible: (await nextBannerButton.count()) === 1,
        };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/products");
      await captureStep(page, report, "products", async () => {
        await waitForText(page, "Products");
        const searchInput = page.getByPlaceholder("Search products...");
        await searchInput.fill("pro");
        const productLinks = page.locator('a[href^="/products/"]');
        const productCount = await productLinks.count();
        if (productCount < 1) {
          throw new Error("Products list rendered without any product links");
        }

        const firstProductHref = await productLinks.nth(0).getAttribute("href");
        return {
          productCount,
          firstProductHref,
        };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/products");
      await captureStep(page, report, "product-details", async () => {
        const productLinks = page.locator('a[href^="/products/"]');
        const productCount = await productLinks.count();
        if (productCount < 1) {
          throw new Error("No product links available to open a product detail page");
        }

        const firstProductLink = productLinks.nth(0);
        const destination = await firstProductLink.getAttribute("href");
        await firstProductLink.click();
        await page.waitForURL("**/products/*", { timeout: 20000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await waitForText(page, "Add to Cart");
        const addToCartButton = page.getByText("Add to Cart", { exact: true });
        const addToCartButtonCount = await addToCartButton.count();
        if (addToCartButtonCount !== 1) {
          throw new Error(`Expected 1 visible Add to Cart CTA, found ${addToCartButtonCount}`);
        }
        await addToCartButton.click();
        await waitForText(page, "Cart (1)");
        await waitForText(page, "View Cart");

        const videoCount = await page.locator("video").count();
        const imageCount = await page.locator("img").count();
        return {
          destination,
          videoCount,
          imageCount,
        };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/categories");
      await captureStep(page, report, "categories", async () => {
        await waitForText(page, "All Categories");
        const categoryLinks = page.locator('a[href^="/categories/"]');
        const categoryCount = await categoryLinks.count();
        if (categoryCount < 1) {
          throw new Error("No category links rendered on categories page");
        }

        return {
          categoryCount,
        };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/track-order");
      await captureStep(page, report, "track-order", async () => {
        await waitForText(page, "Track Order");
        await page.getByPlaceholder("12345").waitFor({ timeout: 10000 });
        await page.getByPlaceholder("+91 98765 43210").waitFor({ timeout: 10000 });
        return { formReady: true };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/contact");
      await captureStep(page, report, "contact", async () => {
        await waitForText(page, "Contact Us");
        await waitForText(page, "Business Details");
        await waitForText(page, "Phone");
        return { formReady: true };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/admin/login");
      await captureStep(page, report, "admin-login", async () => {
        await page.getByLabel("Email").fill(ADMIN_EMAIL);
        await page.getByLabel("Password").fill(ADMIN_PASSWORD);
        await page.getByRole("button", { name: "Sign In" }).click();
        await page.waitForURL("**/admin/dashboard", { timeout: 20000 });
        await waitForText(page, "Catalog Control Center");
        return { loginWorked: true };
      });
      await page.close();
    }

    {
      const page = await openPage(context, "/admin/media");
      await captureStep(page, report, "admin-media", async () => {
        await waitForText(page, "Community Media");

        await page.getByRole("button", { name: "Add Media" }).click();
        await waitForText(page, "Add Media Item");
        const dialog = page.locator('[role="dialog"]');

        await dialog.locator("input").nth(0).fill(IMAGE_TITLE);
        await dialog.locator("textarea").nth(0).fill("Release image upload smoke test");
        await dialog.locator('input[type="file"]').first().setInputFiles(smokeImage);
        await dialog.getByRole("button", { name: "Save" }).click();
        await waitForText(page, "Media item created", 30000);
        await page.getByText(IMAGE_TITLE, { exact: true }).first().waitFor({ timeout: 30000 });

        await page.getByRole("button", { name: "Add Media" }).click();
        await waitForText(page, "Add Media Item");
        const videoDialog = page.locator('[role="dialog"]');
        await videoDialog.locator("input").nth(0).fill(VIDEO_TITLE);
        await videoDialog.locator("textarea").nth(0).fill("Release video upload smoke test");
        await videoDialog.getByRole("combobox").first().click();
        await page.getByText("Video", { exact: true }).click();
        await videoDialog.locator('input[aria-label="Upload community video"]').setInputFiles(smokeVideo);
        await videoDialog.getByRole("button", { name: "Save" }).click();
        await waitForText(page, "Media item created", 90000);
        await page.getByText(VIDEO_TITLE, { exact: true }).first().waitFor({ timeout: 90000 });

        return {
          imageCreated: IMAGE_TITLE,
          videoCreated: VIDEO_TITLE,
        };
      });
      await page.close();
    }
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
