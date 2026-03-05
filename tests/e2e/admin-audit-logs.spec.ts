import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createEphemeralAuditLogEntry,
  deleteAuditLogById,
  hasDbConnection,
  waitForRecentRelevantAuditLog,
} from "./support/db";

function formatDateTimeBr(value: string | null): {
  date: string;
  time: string;
} {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR"),
  };
}

test.describe("Admin audit logs", () => {
  const createdAuditLogIds: string[] = [];

  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  test("desktop: deve filtrar logs recentes e validar rastreabilidade operacional", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");
    test.setTimeout(120000);

    const targetLog = await waitForRecentRelevantAuditLog({
      minutes: 30,
      timeoutMs: 60000,
      pollIntervalMs: 5000,
    });

    const ensuredLog =
      targetLog ??
      (await createEphemeralAuditLogEntry({
        action: "UPDATE_INDEX_ENTRY",
        entity: "bookings",
      }));
    if (!targetLog) {
      createdAuditLogIds.push(ensuredLog.id);
    }

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);

    await shell.navigateBySidebar("Logs de Auditoria");
    await expect(page).toHaveURL(/\/app\/auditoria$/);

    await expect(
      page.getByRole("heading", { name: /Log de Auditoria/i }),
    ).toBeVisible({
      timeout: 15000,
    });

    // Filtros para aproximar o registro esperado (últimos 30 min / ação / entidade / usuário)
    const userFilter = page.getByPlaceholder(/Ex: 7234567 ou Nome/i);
    const actionSelect = page.locator("select").nth(0);
    const moduleSelect = page.locator("select").nth(1);

    await expect(userFilter).toBeVisible();
    await userFilter.fill(ensuredLog.user_name ?? "");

    if (ensuredLog.action) {
      await actionSelect.selectOption({ label: ensuredLog.action });
    }

    if (ensuredLog.entity) {
      await moduleSelect.selectOption({ label: ensuredLog.entity });
    }

    await page.getByRole("button", { name: /Filtrar/i }).click();

    const expectedDateTime = formatDateTimeBr(ensuredLog.created_at);

    const row = page
      .locator("tbody tr")
      .filter({ hasText: ensuredLog.user_name ?? "" })
      .filter({ hasText: ensuredLog.action ?? "" })
      .filter({ hasText: ensuredLog.entity ?? "" })
      .first();

    await expect(row).toBeVisible({ timeout: 15000 });

    // Integridade de rastreabilidade
    await expect(row).toContainText(ensuredLog.user_name ?? "");
    await expect(row).toContainText(ensuredLog.action ?? "");
    await expect(row).toContainText(ensuredLog.entity ?? "");
    await expect(row).toContainText(expectedDateTime.date);
    await expect(row).toContainText(expectedDateTime.time);

    // Refinamento visual (badge de ação e tabela legível)
    const actionBadge = row
      .locator("span")
      .filter({ hasText: ensuredLog.action ?? "" })
      .first();
    await expect(actionBadge).toBeVisible();

    const actionUpper = (ensuredLog.action ?? "").toUpperCase();
    if (actionUpper.includes("DELETE")) {
      await expect(actionBadge).toHaveClass(/red|border-red/);
    } else if (actionUpper.includes("UPDATE") || actionUpper.includes("EDIT")) {
      await expect(actionBadge).toHaveClass(/amber|border-amber/);
    } else if (
      actionUpper.includes("INSERT") ||
      actionUpper.includes("CREATE")
    ) {
      await expect(actionBadge).toHaveClass(/emerald|border-emerald/);
    }

    // Verifica abertura de detalhes JSON (timeline/tabela de histórico com detalhes)
    const jsonButton = row.getByRole("button", { name: /JSON/i }).first();
    if (await jsonButton.isVisible().catch(() => false)) {
      await jsonButton.click();
      await expect(
        page.getByText(/Detalhes do Evento|JSON|Payload/i).first(),
      ).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("mobile: logs devem permanecer legíveis e detalhes acessíveis", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");
    test.setTimeout(120000);

    const targetLog = await waitForRecentRelevantAuditLog({
      minutes: 30,
      timeoutMs: 60000,
      pollIntervalMs: 5000,
    });

    const ensuredLog =
      targetLog ??
      (await createEphemeralAuditLogEntry({
        action: "UPDATE_INDEX_ENTRY",
        entity: "bookings",
      }));
    if (!targetLog) {
      createdAuditLogIds.push(ensuredLog.id);
    }

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);

    await page.goto("/app/auditoria");
    await expect(
      page.getByRole("heading", { name: /Log de Auditoria/i }),
    ).toBeVisible({
      timeout: 15000,
    });

    const userFilter = page.getByPlaceholder(/Ex: 7234567 ou Nome/i);
    await userFilter.fill(ensuredLog.user_name ?? "");
    await page.getByRole("button", { name: /Filtrar/i }).click();

    const card = page
      .locator("article")
      .filter({ hasText: ensuredLog.user_name ?? "" })
      .first();

    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card).toContainText(ensuredLog.action ?? "");
    await expect(card).toContainText(ensuredLog.entity ?? "");

    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      const viewportWidth = page.viewportSize()?.width ?? 375;
      expect(cardBox.width).toBeLessThanOrEqual(viewportWidth);
    }

    const jsonButton = card.getByRole("button", { name: /JSON/i }).first();
    if (await jsonButton.isVisible().catch(() => false)) {
      await jsonButton.click();
      await expect(page.getByRole("dialog").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test.afterEach(async () => {
    while (createdAuditLogIds.length > 0) {
      const id = createdAuditLogIds.pop();
      if (!id) continue;
      const removed = await deleteAuditLogById(id);
      expect(removed).toBeGreaterThan(0);
    }
  });
});
