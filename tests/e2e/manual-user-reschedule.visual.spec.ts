import { expect, type Locator, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { LoginPage } from "./pages/LoginPage";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name];
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function getBackendDashboardSummary(email: string, password: string) {
  const url = requireEnv("VITE_SUPABASE_URL");
  const anonKey = requireEnv("VITE_SUPABASE_ANON_KEY");

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const { data, error } = await supabase.rpc("get_user_dashboard_summary");
  if (error) throw error;

  return data as {
    bookings_count?: number | null;
    next_session_booking_id?: string | null;
    next_session?: { date?: string | null } | null;
    has_pending_swap?: boolean | null;
  };
}

async function getAvailableCalendarDays(page: Page) {
  const locator = page.locator('[data-state="available"]');
  const testIds = await locator.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-testid") || ""),
  );

  return testIds
    .map((value) => value.replace("calendar-day-", ""))
    .filter(Boolean);
}

async function findAlternativeAvailableDate(page: Page, currentDate: string) {
  let availableDates = await getAvailableCalendarDays(page);
  let candidate = availableDates.find((date) => date !== currentDate);

  if (candidate) return candidate;

  const nextMonthButton = page.locator(
    '[data-testid="calendar-next-month"], button:has([data-lucide="chevron-right"])',
  );

  if (await nextMonthButton.count()) {
    await nextMonthButton.first().click();
    await page.waitForTimeout(1500);
    availableDates = await getAvailableCalendarDays(page);
    candidate = availableDates.find((date) => date !== currentDate);
  }

  if (!candidate) {
    throw new Error(
      "Não foi encontrada uma data alternativa disponível para validar o reagendamento.",
    );
  }

  return candidate;
}

async function fillDateInput(input: Locator, value: string) {
  await input.fill(value);
  await input.dispatchEvent("input");
  await input.dispatchEvent("change");
}

async function waitForToastText(page: Page, patterns: RegExp[]) {
  const notificationRegion = page.getByRole("region", {
    name: /Notifications/i,
  });

  for (const pattern of patterns) {
    const toast = notificationRegion.getByText(pattern);
    if (await toast.isVisible({ timeout: 1000 }).catch(() => false)) {
      return;
    }
  }

  await Promise.any(
    patterns.map((pattern) =>
      notificationRegion.getByText(pattern).waitFor({ state: "visible" }),
    ),
  );
}

test.describe("Prático visual: usuário militar solicita reagendamento", () => {
  test.setTimeout(240000);

  const email = getOptionalEnv("E2E_USER_EMAIL");
  const password = getOptionalEnv("E2E_USER_PASSWORD");

  test("usuário real abre o agendamento existente e solicita reagendamento", async ({
    page,
  }) => {
    test.skip(
      !email || !password,
      "Teste manual requer E2E_USER_EMAIL e E2E_USER_PASSWORD configurados.",
    );

    const backendSummary = await getBackendDashboardSummary(email, password);

    expect(backendSummary.bookings_count ?? 0).toBeGreaterThan(0);
    expect(backendSummary.next_session_booking_id).toBeTruthy();

    const loginPage = new LoginPage(page);

    await page.goto("/login");
    await waitForPageReady(page);
    await expect(loginPage.emailInput).toBeVisible({ timeout: 60000 });
    await loginPage.login(email, password);

    await expect(page).toHaveURL(/\/app(\/)?$/, { timeout: 60000 });
    await waitForPageReady(page);
    await expect(page.getByTestId("operational-dashboard")).toBeVisible({
      timeout: 30000,
    });

    const rescheduleButton = page.getByRole("button", {
      name: /Solicitar Reagendamento/i,
    });
    await expect(rescheduleButton).toBeVisible({ timeout: 30000 });

    await page.screenshot({
      path: "test-results/manual-user-reschedule-dashboard.png",
      fullPage: true,
    });

    await rescheduleButton.click();

    const currentDateInput = page.locator("#current-date");
    await expect(currentDateInput).toBeVisible({ timeout: 15000 });
    const currentDate = await currentDateInput.inputValue();

    await page.goto("/app/agendamentos");
    await waitForPageReady(page);
    await expect(page.getByTestId("scheduling-page")).toBeVisible({
      timeout: 30000,
    });

    const rescheduleDate = await findAlternativeAvailableDate(page, currentDate);

    await page.goto("/app");
    await waitForPageReady(page);
    await page
      .getByRole("button", { name: /Solicitar Reagendamento/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /Solicitar Reagendamento/i }),
    ).toBeVisible({ timeout: 15000 });

    await fillDateInput(page.locator("#new-date"), rescheduleDate);
    await expect
      .poll(async () => page.locator("#session-select option").count(), {
        timeout: 15000,
      })
      .toBeGreaterThan(1);
    await page.locator("#session-select").selectOption({ index: 1 });
    await page
      .locator("#reason")
      .fill("Teste E2E visual com usuário real para validar reagendamento.");

    await page.screenshot({
      path: "test-results/manual-user-reschedule-filled.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: /^Enviar$/i }).click();

    await waitForToastText(page, [
      /Solicitação enviada/i,
      /Já existe uma solicitação pendente/i,
    ]);

    await page.goto("/app");
    await waitForPageReady(page);
    await expect(page.getByText(/Reagendamento Pendente/i)).toBeVisible({
      timeout: 30000,
    });

    await page.screenshot({
      path: "test-results/manual-user-reschedule-success.png",
      fullPage: true,
    });
  });
});
