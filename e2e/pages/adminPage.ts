import { Page } from "@playwright/test";

export class AdminPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto("/admin");
  }

  async openUserManagement() {
    // Navigate directly to users management to avoid relying on nav labels
    await this.page.goto("/admin/users");
    // For tests, force the UI to show inactive users so seeded inactives appear
    try {
      const checkbox = this.page.locator(
        'label:has-text("Mostrar inativos") input[type="checkbox"]',
      );
      await checkbox.waitFor({ timeout: 3000 });
      const isChecked = await checkbox.isChecked();
      if (!isChecked) await checkbox.check();
      // aguarda breve para o fetch completar e a tabela ser atualizada
      await this.page.waitForTimeout(1000);
      // espera pelo footer que indica que a tabela foi atualizada
      await this.page.getByText(/Mostrando \d+ registro\(s\)/i).waitFor({
        timeout: 10000,
      });
    } catch (e) {
      // ignore failures here; the test will still try to find the row
    }
  }

  async approveUserByEmail(email: string) {
    const row = this.page.locator(`text=${email}`).first();
    // aguarda a linha aparecer
    await row.waitFor({ timeout: 30000 });
    // tenta clicar em qualquer botão de aprovação (case-insensitive)
    const approveButton = row
      .locator("button", { hasText: /aprovar/i })
      .first();
    await approveButton.click({ timeout: 5000 });
    await this.page.waitForSelector(`text=Usuário aprovado`, {
      timeout: 10000,
    });
  }

  async getAuditLog() {
    await this.page.getByRole("link", { name: /audit/i }).click();
    return this.page.locator(".audit-list").textContent();
  }
}
