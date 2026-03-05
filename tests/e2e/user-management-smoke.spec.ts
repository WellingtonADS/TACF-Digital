import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { UserManagementPage } from "./page-objects/UserManagementPage";
import { getCredentials, hasCredentials } from "./support/credentials";

test.describe("User management smoke", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const credentials = getCredentials("admin");

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("desktop: deve carregar lista completa de efetivo e manter filtros alinhados", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");

    const shell = new AppShell(page);
    const userManagement = new UserManagementPage(page);

    await shell.assertResponsiveShell();
    await userManagement.assertPersonnelLoadingVisual();
    await userManagement.assertPersonnelTableComplete();
    await userManagement.assertDesktopFilterAlignment();

    await expect(
      page.getByText(/Mostrando \d+ de \d+ militares/i),
    ).toBeVisible();
  });

  test("desktop: deve editar status no perfil com loading visual e feedback", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");

    const userManagement = new UserManagementPage(page);

    await userManagement.gotoPersonnel();
    await userManagement.assertPersonnelLoaded();
    await userManagement.openFirstProfile();

    await expect(
      page.getByText("Carregando informações adicionais..."),
    ).toBeVisible();
    await userManagement.assertProfileActionsAccessible();

    await userManagement.toggleActiveWithVisualAssertions();
    await userManagement.toggleActiveWithVisualAssertions();
  });

  test("mobile: formulário responsivo e ações da lista acessíveis por toque", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");

    const shell = new AppShell(page);
    const userManagement = new UserManagementPage(page);

    await shell.assertResponsiveShell();
    await userManagement.gotoPersonnel();
    await userManagement.assertPersonnelLoaded();
    await userManagement.assertMobileFormResponsive();
    await userManagement.assertMobileActionsAccessibleByTouch();
  });

  test("deve carregar e editar permissões na lista de perfis de acesso", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) <= 767,
      "Fluxo coberto no desktop.",
    );

    const userManagement = new UserManagementPage(page);

    await userManagement.assertAccessProfilesLoadingVisual();
    await userManagement.toggleFirstPermissionAndRollback();
  });
});
