import { Page } from "@playwright/test";

export class BookingPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto("/user/booking");
  }

  async selectSessionByTitle(title: string) {
    await this.page.getByRole("button", { name: title }).click();
  }

  async confirmBooking() {
    await this.page.getByRole("button", { name: /confirmar|reservar/i }).click();
  }

  async waitForConfirmation() {
    await this.page.getByText(/agendamento confirmado|comprovante/i).waitFor({ timeout: 10000 });
    const orderText = await this.page.locator(".order-number").textContent();
    return orderText;
  }
}
