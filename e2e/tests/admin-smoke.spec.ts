import { expect, test } from "@playwright/test";

// Smoke test: with VITE_ENABLE_ADMIN=true the /admin route should be reachable and show admin content
test("admin route loads when feature flag enabled", async ({
  page,
  baseURL,
}) => {
  // Ensure we have a baseURL
  const url = baseURL || "http://localhost:5173";

  // Visit home and sign in as seeded admin user
  await page.goto(url);

  // Fill login form using stable selectors (ids and type)
  const email = process.env.SEED_ADMIN_EMAIL ?? "e2e-admin@example.test";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "password";
  await page.fill("#email", email);
  await page.fill('input[type="password"]', password);
  // Click the submit button (label in UI is 'ENTRAR')
  await page.click('button[type="submit"]');

  // Wait for dashboard to settle and Admin link to appear, then navigate
  try {
    await page.waitForSelector('a:has-text("Admin")', { timeout: 10000 });
    await page.click('a:has-text("Admin")');
  } catch {
    // If admin link didn't appear, navigate directly as a fallback
    await page.goto(`${url}/admin/swaps`);
  }

  // If profile setup is shown after sign-in, complete it so we can access admin routes
  if (await page.locator("text=Completar Perfil").count()) {
    // Fill profile form with valid data
    await page.fill(
      'input[placeholder="DIGITE SEU NOME COMPLETO"]',
      "E2E Admin Test",
    );
    // Fill phone instead of SARAM
    await page.fill("#phone", "5511999998888");
    // Open rank select and choose 'Soldado'
    await page.click("text=Selecione...");
    await page.click("text=Soldado");

    // Confirm profile
    await page.click('button:has-text("Confirmar Dados")');

    // Wait for redirect / dashboard to be available
    await page.waitForSelector('a:has-text("Admin")', { timeout: 10000 });
    await page.click('a:has-text("Admin")');
  }

  // Expect admin page content (Pedidos de Troca Pendentes) to be visible
  const adminText = page.locator("text=Pedidos de Troca Pendentes");
  await expect(adminText).toHaveCount(1);
});
