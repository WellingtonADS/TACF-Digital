import { Page } from "@playwright/test";

export class BookingPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async selectSessionByTitle(title: string) {
    // UI renders 'Agendar' buttons per day; click the first available
    await this.page
      .getByRole("button", { name: /agendar/i })
      .first()
      .click();
  }

  async confirmBooking() {
    await this.page
      .getByRole("button", { name: /confirmar|reservar/i })
      .click();
  }

  async waitForConfirmation() {
    // reload para forçar fetch de dados caso tenha sido criado via service role
    await this.page.reload();
    // Aguarda pelo comprovante renderizado via componente com `data-testid`
    await this.page
      .locator('[data-testid="comprovante-ticket"]', { hasText: "" })
      .waitFor({ timeout: 10000 });
    const orderText = await this.page
      .locator('[data-testid="booking-id"]')
      .textContent();
    return orderText;
  }
}
