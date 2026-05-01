import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load E2E-specific env file (fallback to .env for local dev)
dotenv.config({ path: ".env.e2e" });
dotenv.config({ override: false }); // fallback to .env

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  /* Global timeout per test */
  timeout: 30_000,
  /* Expect timeout for assertions */
  expect: { timeout: 5_000 },
  /* Run all tests in parallel */
  fullyParallel: true,
  /* Fail fast on CI */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* Reporters */
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],
  /* Shared settings for all tests */
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    /* Supabase env forwarded to page context via globalSetup or fixtures */
    extraHTTPHeaders: {
      "x-e2e-test": "1",
    },
  },
  /* Projects — desktop Chromium only for CI speed; add more for full coverage */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  /* Start the Vite dev server automatically when not already running */
  webServer: {
    command: "yarn dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
