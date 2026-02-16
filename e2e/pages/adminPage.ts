import { Page } from "@playwright/test";

export class AdminPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto("/admin");
  }

  async openUserManagement() {
    await this.page.getByRole("link", { name: /pessoas|usuários/i }).click();
  }

  async approveUserByEmail(email: string) {
    const row = this.page.locator(`text=${email}`).first();
    await row.locator("button:has-text('Aprovar')").click();
    await this.page.waitForSelector(`text=Usuário aprovado`, { timeout: 5000 });
  }

  async getAuditLog() {
    await this.page.getByRole("link", { name: /audit/i }).click();
    return this.page.locator(".audit-list").textContent();
  }
}
