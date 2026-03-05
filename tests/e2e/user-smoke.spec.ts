import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";

test.describe("User smoke", () => {
  test.skip(
    !hasCredentials("user"),
    "Credenciais E2E de user ausentes: defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
  );

  test("deve autenticar usuário, navegar no menu e manter layout responsivo", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);
    const credentials = getCredentials("user");

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);
    await expect(
      page.getByText("Seja bem-vindo ao portal de agendamento do HACO"),
    ).toBeVisible();
    await shell.assertResponsiveShell();

    await shell.navigateBySidebar("Documentos");
    await expect(page).toHaveURL(/\/app\/documentos$/);
    await expect(
      page.getByRole("heading", { name: "Documentos e Normas" }),
    ).toBeVisible();
    await shell.assertBreadcrumbVisible();

    await shell.navigateBySidebar("Dashboard");
    await expect(page).toHaveURL(/\/app(\/)?$/);
    await expect(
      page.getByText("Seja bem-vindo ao portal de agendamento do HACO"),
    ).toBeVisible();

    await shell.logout();
  });
});
