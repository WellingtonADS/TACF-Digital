import { expect, test } from "@playwright/test";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createEphemeralPendingRescheduleRequest,
  deleteSessionById,
  getRescheduleRequestState,
  hasDbConnection,
} from "./support/db";

test.describe("Admin rescheduling", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  let createdSessionId: string | null = null;
  let targetBookingId: string | null = null;
  let requestedDate: string | null = null;
  let expectedReason: string | null = null;

  test("deve deferir pedido de reagendamento pendente e persistir status no banco e na UI", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) <= 767,
      "Fluxo de análise coberto no desktop.",
    );
    test.setTimeout(90000);

    const setup = await createEphemeralPendingRescheduleRequest();
    createdSessionId = setup.sessionId;
    targetBookingId = setup.request.booking_id;
    requestedDate = setup.request.requested_date;
    expectedReason = setup.request.reason;

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);

    await page.goto("/app/reagendamentos");
    await expect(page).toHaveURL(/\/app\/reagendamentos/);

    await expect(
      page.getByRole("heading", {
        name: /Gestão de Solicitações de Reagendamento/i,
      }),
    ).toBeVisible({ timeout: 15000 });

    const searchInput = page.getByPlaceholder(/PESQUISAR POR SARAM OU NOME/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill(setup.request.saram);

    const requestRow = page
      .locator("tbody tr")
      .filter({ hasText: setup.request.saram })
      .filter({ hasText: requestedDate ?? "" })
      .first();

    await expect(requestRow).toBeVisible({ timeout: 10000 });

    const pendingBadge = requestRow.locator(".status-pendente").first();
    await expect(pendingBadge).toBeVisible();
    await expect(pendingBadge).toContainText(/Pendente/i);

    const viewReasonButton = requestRow
      .getByRole("button", { name: /Ver Justificativa/i })
      .first();
    await viewReasonButton.click();

    await expect(page.getByText(/Justificativa Selecionada/i)).toBeVisible();
    await expect(page.getByText(expectedReason ?? "")).toBeVisible();

    await expect(
      page.locator("textarea, input").filter({ hasText: /observa|justific/i }),
    ).toHaveCount(0);

    const deferButton = requestRow
      .getByRole("button", { name: /Deferir/i })
      .first();
    await expect(deferButton).toBeVisible();
    await expect(deferButton).toBeEnabled();

    await deferButton.click();

    await expect(
      page.locator("tbody tr").filter({ hasText: setup.request.saram }),
    ).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("button", { name: /APROVADOS/i }).click();
    await searchInput.fill(setup.request.saram);

    const approvedRow = page
      .locator("tbody tr")
      .filter({ hasText: setup.request.saram })
      .filter({ hasText: requestedDate ?? "" })
      .first();

    await expect(approvedRow).toBeVisible({ timeout: 10000 });
    await expect(approvedRow.locator(".status-aprovado")).toContainText(
      /Aprovado/i,
    );
    await expect(approvedRow).toContainText(requestedDate ?? "");

    const persisted = await getRescheduleRequestState(targetBookingId);
    expect(persisted.status).toBe("confirmed");
    expect(persisted.requested_date).toBe(requestedDate);
    expect(persisted.reason).toBe(expectedReason);

    expect(
      persisted.requested_date,
      "Pedido deferido deve manter nova data solicitada disponível para o TACF.",
    ).toBeTruthy();
  });

  test("mobile: lista de reagendamentos deve manter responsividade e status visual padrão", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");

    const setup = await createEphemeralPendingRescheduleRequest();
    createdSessionId = setup.sessionId;

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);

    await page.goto("/app/reagendamentos");
    await expect(
      page.getByRole("heading", {
        name: /Gestão de Solicitações de Reagendamento/i,
      }),
    ).toBeVisible({ timeout: 15000 });

    const tableWrapper = page.locator(".overflow-x-auto").first();
    await expect(tableWrapper).toBeVisible();

    const requestRow = page
      .locator("tbody tr")
      .filter({ hasText: setup.request.saram })
      .filter({ hasText: setup.request.requested_date })
      .first();
    await expect(requestRow).toBeVisible({ timeout: 10000 });

    const rowHandle = await requestRow.elementHandle();
    await rowHandle?.evaluate((element) => {
      element.scrollIntoView({ block: "center", inline: "center" });
    });

    const pendingBadge = requestRow.locator(".status-pendente").first();
    await expect(pendingBadge).toBeVisible();
    await expect(pendingBadge).toContainText(/Pendente/i);

    const deferIcon = requestRow
      .locator("button.btn-deferir .material-icons")
      .first();
    const rejectIcon = requestRow
      .locator("button.btn-indeferir .material-icons")
      .first();

    await expect(deferIcon).toBeVisible();
    await expect(rejectIcon).toBeVisible();
  });

  test.afterEach(async () => {
    if (createdSessionId) {
      const removed = await deleteSessionById(createdSessionId);
      expect(removed).toBeGreaterThan(0);
      createdSessionId = null;
      targetBookingId = null;
      requestedDate = null;
      expectedReason = null;
      console.log("✓ Sessão ephemeral de reagendamento removida");
    }
  });
});
