import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { UserManagementPage } from "./page-objects/UserManagementPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  getPersonnelBySaram,
  getPersonnelSearchTargets,
  hasDbConnection,
} from "./support/db";

type AptitudeStatus = "APTO" | "INAPTO" | "VENCIDO";

function expectedStatusClass(status: AptitudeStatus): RegExp {
  if (status === "APTO") return /success/;
  if (status === "VENCIDO") return /error/;
  return /primary/;
}

test.describe("Admin personnel management", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const credentials = getCredentials("admin");

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);
  });

  test("desktop: pesquisar por nome e identificação, validando status de aptidão e tabela", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");

    const shell = new AppShell(page);
    const userManagement = new UserManagementPage(page);
    const targets = await getPersonnelSearchTargets();

    await shell.assertResponsiveShell();
    await userManagement.gotoPersonnel();
    await userManagement.assertPersonnelLoaded();
    await userManagement.assertPersonnelTableComplete();
    await userManagement.assertDesktopFilterAlignment();

    const searchInput = page.getByPlaceholder("Buscar por SARAM ou Nome...");

    // Busca por nome
    await searchInput.fill(targets.byName.full_name);
    const nameRow = page
      .locator("tbody tr")
      .filter({ hasText: targets.byName.display_name })
      .filter({ hasText: targets.byName.saram })
      .first();

    await expect(nameRow).toBeVisible({ timeout: 10000 });

    const nameStatusBadge = nameRow
      .locator("td")
      .nth(3)
      .locator("span")
      .first();
    await expect(nameStatusBadge).toContainText(targets.byName.status);
    await expect(nameStatusBadge).toHaveClass(
      expectedStatusClass(targets.byName.status),
    );
    await expect(nameStatusBadge.locator("span").first()).toBeVisible();

    // Busca por identificação (SARAM)
    await searchInput.fill(targets.byId.saram);
    const idRow = page
      .locator("tbody tr")
      .filter({ hasText: targets.byId.saram })
      .first();

    await expect(idRow).toBeVisible({ timeout: 10000 });
    await expect(idRow).toContainText(targets.byId.full_name);

    const idStatusBadge = idRow.locator("td").nth(3).locator("span").first();
    await expect(idStatusBadge).toContainText(targets.byId.status);
    await expect(idStatusBadge).toHaveClass(
      expectedStatusClass(targets.byId.status),
    );

    const persisted = await getPersonnelBySaram(targets.byId.saram);
    expect(persisted).not.toBeNull();
    expect(persisted?.full_name).toBe(targets.byId.full_name);
    expect(persisted?.status).toBe(targets.byId.status);
  });

  test("mobile: busca funcional e informações críticas legíveis na listagem", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");

    const shell = new AppShell(page);
    const userManagement = new UserManagementPage(page);
    const targets = await getPersonnelSearchTargets();

    await shell.assertResponsiveShell();
    await userManagement.gotoPersonnel();
    await userManagement.assertPersonnelLoaded();
    await userManagement.assertMobileFormResponsive();

    const searchInput = page.getByPlaceholder("Buscar por SARAM ou Nome...");
    await searchInput.fill(targets.byId.saram);

    const mobileRow = page
      .locator("tbody tr")
      .filter({ hasText: targets.byId.saram })
      .first();

    await expect(mobileRow).toBeVisible({ timeout: 10000 });
    await expect(mobileRow).toContainText(targets.byId.full_name);

    const statusBadge = mobileRow.locator("td").nth(3).locator("span").first();
    await expect(statusBadge).toContainText(targets.byId.status);
    await expect(statusBadge).toHaveClass(
      expectedStatusClass(targets.byId.status),
    );

    const tableWrapper = page.locator(".overflow-x-auto").first();
    await expect(tableWrapper).toBeVisible();
  });
});
