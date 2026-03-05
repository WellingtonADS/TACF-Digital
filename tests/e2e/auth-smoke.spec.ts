import { expect, test } from "@playwright/test";
import { AuthPage } from "./page-objects/AuthPage";

test.describe("Auth public pages", () => {
  test("deve renderizar login, cadastro e recuperação com identidade visual", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await authPage.assertPrimaryButtonIdentity();

    await authPage.gotoRegister();
    await expect(page.getByRole("button", { name: "CADASTRAR" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Fazer login" })).toBeVisible();

    await authPage.gotoForgotPassword();
    await expect(
      page.getByRole("button", { name: "Enviar Instruções" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voltar para o Login" }),
    ).toBeVisible();
  });
});
