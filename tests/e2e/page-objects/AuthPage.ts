import { expect, type Page } from "@playwright/test";

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto("/login");
    await expect(
      this.page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
  }

  async gotoRegister() {
    await this.page.goto("/register");
    await expect(
      this.page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
  }

  async gotoForgotPassword() {
    await this.page.goto("/forgot");
    await expect(
      this.page.getByRole("heading", { name: "Recuperar Senha" }),
    ).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.gotoLogin();
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.getByRole("button", { name: "ENTRAR" }).click();
  }

  async assertPrimaryButtonIdentity() {
    const submitButton = this.page.getByRole("button", { name: "ENTRAR" });
    await expect(submitButton).toBeVisible();

    await expect(submitButton).toHaveClass(/bg-\[#1B365D\]/);
    await expect(submitButton).toHaveClass(/hover:bg-\[#152a48\]/);
  }
}
