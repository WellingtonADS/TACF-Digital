import { test as base, type BrowserContext } from "@playwright/test";

type AuthFixtures = {
  adminContext: BrowserContext;
  userContext: BrowserContext;
};

/**
 * Performs a UI-based login and returns a new BrowserContext with the session
 * persisted in storage state so individual tests don't need to repeat the flow.
 */
async function loginAs(
  browser: import("@playwright/test").Browser,
  email: string,
  password: string,
): Promise<BrowserContext> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
  await page.goto(`${baseURL}/login`);

  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha|password/i).fill(password);
  await page.getByRole("button", { name: /entrar|login|sign in/i }).click();

  // Wait until redirect away from /login is complete
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });

  await page.close();
  return context;
}

export const test = base.extend<AuthFixtures>({
  adminContext: async ({ browser }, use) => {
    const email = process.env.E2E_ADMIN_EMAIL ?? "";
    const password = process.env.E2E_ADMIN_PASSWORD ?? "";
    const ctx = await loginAs(browser, email, password);
    await use(ctx);
    await ctx.close();
  },

  userContext: async ({ browser }, use) => {
    const email = process.env.E2E_USER_EMAIL ?? "";
    const password = process.env.E2E_USER_PASSWORD ?? "";
    const ctx = await loginAs(browser, email, password);
    await use(ctx);
    await ctx.close();
  },
});

export { expect } from "@playwright/test";
