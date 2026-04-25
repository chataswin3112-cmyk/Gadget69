import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const targetUrl = process.env.TARGET_URL || "http://127.0.0.1:8080";
const outputDir = path.join(process.cwd(), ".tmp", "scroll-check");

const collectVisibleState = async (page) =>
  page.evaluate(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const visibleNodes = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width > 4 &&
          rect.height > 4 &&
          rect.bottom > 0 &&
          rect.top < viewportHeight &&
          rect.right > 0 &&
          rect.left < viewportWidth &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          Number(style.opacity) > 0.02
        );
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
        className: typeof element.className === "string" ? element.className.slice(0, 80) : "",
      }));

    const centerElement = document.elementFromPoint(viewportWidth / 2, viewportHeight / 2);

    return {
      scrollY: Math.round(window.scrollY),
      viewportHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyTextLength: document.body.innerText.trim().length,
      visibleCount: visibleNodes.length,
      visibleNodes,
      centerElement: centerElement
        ? {
            tag: centerElement.tagName.toLowerCase(),
            text: (centerElement.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
            className:
              typeof centerElement.className === "string" ? centerElement.className.slice(0, 100) : "",
          }
        : null,
    };
  });

const runViewport = async (browser, label, viewport) => {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const requestFailures = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("requestfailed", (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "FAILED"}`);
  });

  await page.goto(`${targetUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("body").waitFor({ state: "visible", timeout: 10000 });

  const states = [];
  let position = 0;
  let previousScrollY = -1;
  for (let index = 0; index < 18; index += 1) {
    const maxScroll = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    );
    position = index === 0 ? 0 : Math.min(maxScroll, position + Math.round(viewport.height * 0.72));
    await page.evaluate((nextScrollY) => window.scrollTo(0, nextScrollY), position);
    await page.waitForTimeout(600);
    const actualScrollY = await page.evaluate(() => Math.round(window.scrollY));
    const screenshotPath = path.join(outputDir, `${label}-${index}-${Math.round(position)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    states.push({
      screenshot: screenshotPath,
      ...(await collectVisibleState(page)),
    });
    if (actualScrollY === previousScrollY && actualScrollY >= maxScroll - 2) {
      break;
    }
    previousScrollY = actualScrollY;
    position = actualScrollY;
  }

  await page.close();

  return {
    label,
    viewport,
    consoleErrors,
    requestFailures,
    states,
  };
};

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [
  await runViewport(browser, "desktop", { width: 1440, height: 960 }),
  await runViewport(browser, "mobile", { width: 412, height: 915 }),
];
await browser.close();

await fs.writeFile(path.join(outputDir, "scroll-report.json"), JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
