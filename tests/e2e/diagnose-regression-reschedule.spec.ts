/**
 * @test Diagnóstico de Regressão - Fluxo de Reagendamento
 * @description Testa visualmente e praticamente o fluxo de reagendamento com wteste@test.com
 * Objetivo: Identificar onde exatamente a regressão aconteceu
 */

import { test } from "@playwright/test";

const TEST_USER_EMAIL = "wteste@test.com";
const TEST_USER_PASSWORD = "wtest123";
const BASE_URL = "http://localhost:5173";

test.describe("Diagnóstico: Regressão de Reagendamento", () => {
  test("Step 1: Login e Dashboard - Verificar Próximo Agendamento", async ({
    page,
  }) => {
    console.log("=== STEP 1: Login ===");
    await page.goto(`${BASE_URL}/`);

    // Wait for auth page
    await page.waitForURL("**/auth/**", { timeout: 5000 });

    // Login
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/app**`, { timeout: 10000 });
    console.log("✓ Login bem-sucedido, redirecionado para dashboard");

    // Take screenshot of dashboard state
    await page.waitForTimeout(2000); // Allow dashboard to fully load
    await page.screenshot({ path: "step1-dashboard.png", fullPage: true });

    // Check if "Próximo Evento" section exists
    const proximoEventoSection = page.locator(
      "text=/Próximo Evento|Próxima Sessão/i",
    );
    const proximoEventoVisible = await proximoEventoSection
      .isVisible()
      .catch(() => false);

    console.log(`📊 Seção "Próximo Evento" visível: ${proximoEventoVisible}`);

    // Check for reschedule button
    const rescheduleButton = page.locator(
      'button:has-text("Solicitar Reagendamento"), button:has-text("Reagendar")',
    );
    const rescheduleButtonVisible = await rescheduleButton
      .isVisible()
      .catch(() => false);
    console.log(
      `🔘 Botão "Solicitar Reagendamento" visível: ${rescheduleButtonVisible}`,
    );

    // Get dashboard data via console to inspect backend state
    const dashboardState = await page.evaluate(() => {
      return {
        bodyHTML: document.body.innerText.substring(0, 500),
      };
    });

    console.log(
      "📄 Dashboard HTML (primeiros 500 chars):",
      dashboardState.bodyHTML,
    );
  });

  test("Step 2: Histórico de Avaliações - Verificar Agendamentos Futuros", async ({
    page,
  }) => {
    console.log("\n=== STEP 2: Histórico de Avaliações ===");
    await page.goto(`${BASE_URL}/`);

    // Login
    await page.waitForURL("**/auth/**", { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to results history
    await page.waitForURL(`${BASE_URL}/app**`, { timeout: 10000 });
    await page.click(
      'button:has-text("Meus Testes"), button:has-text("Histórico")',
    );

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "step2-results-history.png",
      fullPage: true,
    });

    console.log("✓ Navegado para Histórico de Avaliações");

    // Check for future bookings section
    const futureBookingsSection = page.locator(
      "text=/Agendamentos Futuros|Próximos Agendamentos/i",
    );
    const futureBookingsVisible = await futureBookingsSection
      .isVisible()
      .catch(() => false);
    console.log(
      `📊 Seção de Agendamentos Futuros visível: ${futureBookingsVisible}`,
    );

    // Look for reschedule buttons
    const rescheduleButtons = page.locator(
      'button:has-text("Reagendar"), button:has-text("Solicitar Reagendamento")',
    );
    const rescheduleCount = await rescheduleButtons.count();
    console.log(`🔘 Quantidade de botões Reagendar: ${rescheduleCount}`);

    if (rescheduleCount > 0) {
      for (let i = 0; i < rescheduleCount; i++) {
        const isVisible = await rescheduleButtons.nth(i).isVisible();
        console.log(`  - Botão ${i}: visível=${isVisible}`);
      }
    }
  });

  test("Step 3: Dialog de Reagendamento - Verificar Estrutura", async ({
    page,
  }) => {
    console.log("\n=== STEP 3: Dialog de Reagendamento ===");
    await page.goto(`${BASE_URL}/`);

    // Login
    await page.waitForURL("**/auth/**", { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Go to dashboard
    await page.waitForURL(`${BASE_URL}/app**`, { timeout: 10000 });

    // Try to find and click reschedule button via multiple strategies
    const rescheduleButton = page
      .locator('button:has-text("Solicitar Reagendamento")')
      .first();

    const isVisible = await rescheduleButton.isVisible().catch(() => false);
    console.log(
      `🔍 Botão "Solicitar Reagendamento" encontrado e visível: ${isVisible}`,
    );

    if (isVisible) {
      await rescheduleButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: "step3-reschedule-dialog.png",
        fullPage: true,
      });

      // Check dialog structure
      const dialog = page.locator('[role="dialog"], .dialog, .modal');
      const dialogVisible = await dialog.isVisible().catch(() => false);
      console.log(`🎯 Dialog aberto: ${dialogVisible}`);

      // Check for form fields
      const dateInput = page.locator(
        'input[type="date"], input[placeholder*="data"]',
      );
      const dateVisible = await dateInput.isVisible().catch(() => false);
      console.log(`📅 Input de data visível: ${dateVisible}`);

      const sessionSelect = page.locator(
        'select, [role="combobox"], button:has-text("Sessão")',
      );
      const sessionVisible = await sessionSelect.isVisible().catch(() => false);
      console.log(`🎭 Seletor de sessão visível: ${sessionVisible}`);

      const submitButton = page.locator(
        'button:has-text("Enviar"), button:has-text("Solicitar"), button:has-text("Confirmar")',
      );
      const submitVisible = await submitButton.isVisible().catch(() => false);
      console.log(`✅ Botão Enviar visível: ${submitVisible}`);
    } else {
      console.log("⚠️ Botão Reagendamento não visível - REGRESSÃO DETECTADA");
    }
  });

  test("Step 4: Console Errors - Verificar Erros de JS", async ({ page }) => {
    console.log("\n=== STEP 4: Verificação de Erros ===");

    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`);

    // Login
    await page.waitForURL("**/auth/**", { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(`${BASE_URL}/app**`, { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log(`📋 Erros de console detectados: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    }
  });
});
