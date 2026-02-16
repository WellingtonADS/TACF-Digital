import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [["list"]],
  webServer: {
    command: "yarn dev --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    headless: true,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173",
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: "yarn dev",
    url: "http://127.0.0.1:5173",
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
