import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  webServer: {
    command: "npm.cmd run build && npm.cmd run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "tablet",
      use: {
        ...devices["iPad (gen 7)"],
        browserName: "chromium",
      },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
