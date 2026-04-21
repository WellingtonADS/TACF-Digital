import { expect, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput() {
    return this.page.getByTestId("login-email-input");
  }

  get passwordInput() {
    return this.page.getByTestId("login-password-input");
  }

  get submitButton() {
    return this.page.getByTestId("login-submit-button");
  }

  async goto() {
    await this.page.goto("/login");
    await expect(this.emailInput).toBeVisible({ timeout: 30000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
