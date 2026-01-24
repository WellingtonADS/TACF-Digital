import { Page } from "@playwright/test";

export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for auth bootstrap (profile fetch)
  // wait for either a Logout button (successful full login) or the ProfileSetup page prompt
  await Promise.race([
    page.waitForSelector("text=Logout", { timeout: 10000 }).catch(() => null),
    page
      .waitForSelector("text=Complete seu perfil", { timeout: 10000 })
      .catch(() => null),
  ]).catch(() => null);
}