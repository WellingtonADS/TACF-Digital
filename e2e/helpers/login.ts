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
      .waitForSelector("text=Completar Perfil", { timeout: 10000 })
      .catch(() => null),
    page
      .waitForSelector("button:has-text('Confirmar Dados')", { timeout: 10000 })
      .catch(() => null),
  ]).catch(() => null);

  // If onboarding is required, complete it with valid test data
  if (await page.locator("text=Completar Perfil").count()) {
    await page.fill(
      'input[placeholder="DIGITE SEU NOME COMPLETO"]',
      "E2E User Test",
    );
    await page.fill('input[placeholder="0000000"]', "1234567");
    await page.click("text=Selecione...");
    await page.click("text=Soldado");
    await page.click('button:has-text("Confirmar Dados")');
    // Wait for post-onboarding UI (e.g., Logout button)
    await page.waitForSelector("text=Logout", { timeout: 10000 });
  }
}
