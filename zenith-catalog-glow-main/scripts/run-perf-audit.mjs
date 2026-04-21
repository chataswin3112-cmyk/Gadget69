import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const tmpDir = path.join(projectRoot, ".tmp", "perf-audit");
const frontendPort = Number(process.env.PERF_FRONTEND_PORT || 4173);
const backendPort = Number(process.env.PERF_BACKEND_PORT || 8081);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;
const adminEmail = process.env.PERF_ADMIN_EMAIL || "admin@gadget69.com";
const adminPassword = process.env.PERF_ADMIN_PASSWORD || "Admin@123";
const useExistingBackend = process.env.PERF_USE_EXISTING_BACKEND === "1";

await mkdir(tmpDir, { recursive: true });

const spawnCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const isWindowsCmd =
      process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: options.shell ?? isWindowsCmd,
      stdio: options.detached ? "ignore" : "inherit",
      detached: Boolean(options.detached),
      ...options,
    });

    if (options.detached) {
      child.unref();
      resolve(child);
      return;
    }

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(child);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });

const spawnCapture = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const isWindowsCmd =
      process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: options.shell ?? isWindowsCmd,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
    child.on("error", reject);
  });

const spawnBackground = (command, args, logPrefix) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${logPrefix}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${logPrefix}] ${chunk}`);
  });

  return child;
};

const waitForHttp = async (url, timeoutMs = 120000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const findBackendJar = async () => {
  const targetDir = path.join(projectRoot, "backend", "target");
  const files = await readdir(targetDir);
  const jar = files.find((file) => file.endsWith(".jar") && !file.startsWith("original-"));
  if (!jar) {
    throw new Error("No backend jar found in backend/target");
  }
  return path.join(targetDir, jar);
};

const seedAdminProfile = async (profileDir) => {
  const browser = await chromium.launchPersistentContext(profileDir, {
    ...devices["Pixel 7"],
    baseURL: frontendUrl,
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', adminEmail);
  await page.fill('input[type="password"]', adminPassword);
  await Promise.all([
    page.waitForURL("**/admin/dashboard", { timeout: 20000 }),
    page.getByRole("button", { name: /sign in|login/i }).click(),
  ]);
  await browser.close();
};

const runLighthouseAudit = async (routePath, outputFile, profileDir) => {
  const chromeFlags = [`--headless=new`, `--user-data-dir=${profileDir}`];
  const result = await spawnCapture(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "--yes",
      "lighthouse",
      `${frontendUrl}${routePath}`,
      "--quiet",
      "--form-factor",
      "mobile",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--disable-storage-reset",
      "--chrome-flags",
      chromeFlags.join(" "),
      "--output=json",
      "--output-path=stdout",
    ]
  );

  const trimmedOutput = result.stdout.trim();
  if (!trimmedOutput) {
    throw new Error(result.stderr || `No Lighthouse output captured for ${routePath}`);
  }

  await writeFile(outputFile, trimmedOutput, "utf8");
  return JSON.parse(trimmedOutput);
};

const childProcesses = [];
try {
  await spawnCommand(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);

  if (useExistingBackend) {
    console.log(`Using existing backend at ${backendUrl}`);
  } else {
    const backendJar = await findBackendJar();
    const backendProcess = spawnBackground(
      "java",
      ["-jar", backendJar, `--server.port=${backendPort}`],
      "backend"
    );
    childProcesses.push(backendProcess);
  }
  await waitForHttp(`${backendUrl}/api/health`);

  const frontendProcess = spawnBackground(
    process.execPath,
    [path.join(projectRoot, "scripts", "serve-dist-with-proxy.mjs"), "--port", String(frontendPort), "--backend", backendUrl],
    "frontend"
  );
  childProcesses.push(frontendProcess);
  await waitForHttp(frontendUrl);

  await spawnCommand(process.execPath, [
    path.join(projectRoot, "scripts", "mobile-route-audit.mjs"),
    "--frontend-url",
    frontendUrl,
    "--backend-url",
    backendUrl,
    "--output",
    path.join(tmpDir, "mobile-smoke.json"),
  ]);

  const productResponse = await fetch(`${backendUrl}/api/products`);
  const productList = productResponse.ok ? await productResponse.json() : [];
  const productId = productList[0]?.id;

  const profileDir = path.join(tmpDir, "lighthouse-profile");
  await mkdir(profileDir, { recursive: true });
  await seedAdminProfile(profileDir);

  const routes = [
    { path: "/", label: "home" },
    { path: "/products", label: "products" },
    ...(productId ? [{ path: `/products/${productId}`, label: "product-details" }] : []),
    { path: "/admin", label: "admin-login" },
    { path: "/admin/orders", label: "admin-orders" },
  ];

  const summary = [];
  for (const route of routes) {
    const outputFile = path.join(tmpDir, `${route.label}.lighthouse.json`);
    const report = await runLighthouseAudit(route.path, outputFile, profileDir);
    summary.push({
      route: route.path,
      performance: Math.round((report.categories.performance?.score || 0) * 100),
      accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((report.categories["best-practices"]?.score || 0) * 100),
      seo: Math.round((report.categories.seo?.score || 0) * 100),
    });
  }

  await writeFile(
    path.join(tmpDir, "summary.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        frontendUrl,
        backendUrl,
        results: summary,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Performance audit saved to ${tmpDir}`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  childProcesses.forEach((child) => {
    if (child?.pid) {
      child.kill();
    }
  });
}
