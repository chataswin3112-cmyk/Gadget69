const { chromium } = require("playwright");

const TARGET_URL = "http://127.0.0.1:5173";
const API_URL = "http://127.0.0.1:8081/api";
const UPLOAD_PATH =
  "C:/Users/Admin/Downloads/zenith-catalog-glow-main (1)/zenith-catalog-glow-main/.tmp/gadget69-upload-smoke.png";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const pageErrors = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${TARGET_URL}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByLabel("Email").fill("admin@gadget69.com");
    await page.getByLabel("Password").fill("Admin@123");
    await Promise.all([
      page.waitForURL("**/admin/dashboard", { timeout: 15000 }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    const token = await page.evaluate(() => localStorage.getItem("mzflow_admin_token"));
    if (!token) {
      throw new Error("Admin token was not stored after login");
    }

    const suffix = Date.now();
    const parentName = `Smoke Category ${suffix}`;
    const childName = `Smoke Subcategory ${suffix}`;
    const productName = `Smoke Product ${suffix}`;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const parentResponse = await page.request.post(`${API_URL}/admin/sections`, {
      headers: authHeaders,
      data: {
        name: parentName,
        description: "Smoke parent category",
        imageUrl: "/placeholder.svg",
        is_active: true,
        show_in_explore: true,
        show_in_top_category: false,
        sort_order: 999,
        parentSectionId: null,
      },
    });
    if (!parentResponse.ok()) {
      throw new Error(`Parent section create failed: ${parentResponse.status()} ${await parentResponse.text()}`);
    }
    const parent = await parentResponse.json();

    const childResponse = await page.request.post(`${API_URL}/admin/sections`, {
      headers: authHeaders,
      data: {
        name: childName,
        description: "Smoke child category",
        imageUrl: "/placeholder.svg",
        is_active: true,
        show_in_explore: true,
        show_in_top_category: false,
        sort_order: 999,
        parentSectionId: parent.id,
      },
    });
    if (!childResponse.ok()) {
      throw new Error(`Child section create failed: ${childResponse.status()} ${await childResponse.text()}`);
    }
    const child = await childResponse.json();

    await page.goto(`${TARGET_URL}/admin/products`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /add product/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ timeout: 10000 });
    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: childName }).click();

    const textboxes = dialog.getByRole("textbox");
    await textboxes.nth(0).fill(productName);
    await textboxes.nth(1).fill(`SMK-${suffix}`);
    await textboxes.nth(2).fill("Created by live admin upload smoke test.");

    const spinbuttons = dialog.getByRole("spinbutton");
    await spinbuttons.nth(0).fill("1299");
    await spinbuttons.nth(2).fill("7");

    await dialog.getByRole("tab", { name: "Media" }).click();
    await dialog.locator('input[type="file"]').first().setInputFiles(UPLOAD_PATH);
    await dialog.getByText("IMAGE").first().waitFor({ timeout: 20000 });

    await dialog.getByRole("button", { name: /create product/i }).click();
    await dialog.getByRole("button", { name: /save changes/i }).waitFor({ timeout: 20000 });

    const productsResponse = await page.request.get(`${API_URL}/admin/products`, {
      headers: authHeaders,
    });
    if (!productsResponse.ok()) {
      throw new Error(`Admin products fetch failed: ${productsResponse.status()} ${await productsResponse.text()}`);
    }
    const products = await productsResponse.json();
    const product = products.find((item) => item.name === productName);
    if (!product) {
      throw new Error("Created product was not returned by admin products API");
    }
    if (product.sectionId !== child.id || product.parentSectionId !== parent.id) {
      throw new Error("Created product is not attached to the expected subcategory");
    }
    if (!product.media?.some((item) => item.mediaUrl?.startsWith("/uploads/images/"))) {
      throw new Error("Product media did not use local upload fallback");
    }

    await page.goto(`${TARGET_URL}/products/${product.id}`, { waitUntil: "domcontentloaded" });
    await page.getByText(productName).waitFor({ timeout: 15000 });

    if (pageErrors.length) {
      throw new Error(`Browser page errors: ${pageErrors.join(" | ")}`);
    }

    console.log(`Admin upload smoke passed for ${productName}`);
    console.log(`Product ${product.id} saved under ${parentName} / ${childName}`);
    console.log(`Media URL: ${product.media[0].mediaUrl}`);
  } finally {
    await browser.close();
  }
})();
