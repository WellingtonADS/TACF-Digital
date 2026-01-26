import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./global-setup",
  globalTeardown: "./global-teardown",
  testDir: "./tests",
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ["list"],
        ["junit", { outputFile: "results/results.xml" }],
        ["html", { open: "never" }],
      ]
    : "list",
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
