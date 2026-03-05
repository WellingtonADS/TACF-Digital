import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";

test.describe("Admin smoke", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test("deve autenticar admin, acessar dashboard e navegar para turmas", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);
    const credentials = getCredentials("admin");

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard Administrativo" }),
    ).toBeVisible();
    await shell.assertResponsiveShell();

    await shell.navigateBySidebar("Gerenciar Turmas");
    await expect(page).toHaveURL(/\/app\/turmas$/);
    await expect(
      page.getByRole("heading", { name: "Gerenciar Turmas" }),
    ).toBeVisible();

    await shell.navigateBySidebar("Visão Geral");
    await expect(page).toHaveURL(/\/app\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard Administrativo" }),
    ).toBeVisible();

    await shell.logout();
  });
});
