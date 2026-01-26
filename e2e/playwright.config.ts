import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./global-setup",
  globalTeardown: "./global-teardown",
  testDir: "./tests",
  // Increase global timeout to help mitigate slow environments
  timeout: 60 * 1000,
  expect: { timeout: 10000 },
  forbidOnly: !!process.env.CI,
  // Be a bit more forgiving when running locally
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [
        ["list"],
        ["junit", { outputFile: "results/results.xml" }],
        ["html", { open: "never" }],
      ]
    : "list",

  // Start the dev server automatically before running tests (hardening)
  webServer: {
    command: "yarn dev",
    port: 5174,
    timeout: 120000,
    reuseExistingServer: true,
  },

  use: {
    actionTimeout: 0,
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
