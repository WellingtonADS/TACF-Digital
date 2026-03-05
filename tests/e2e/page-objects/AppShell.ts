import { expect, type Page } from "@playwright/test";

export class AppShell {
  constructor(private readonly page: Page) {}

  private get viewportWidth(): number {
    return this.page.viewportSize()?.width ?? 1440;
  }

  async assertResponsiveShell() {
    if (this.viewportWidth <= 767) {
      await expect(
        this.page.getByRole("button", { name: "Abrir menu" }),
      ).toBeVisible();
    } else {
      await expect(
        this.page.getByRole("button", { name: "Sair" }),
      ).toBeVisible();
    }
  }

  async openSidebarIfMobile() {
    if (this.viewportWidth <= 767) {
      const openButton = this.page.getByRole("button", { name: "Abrir menu" });
      await expect(openButton).toBeVisible();
      await openButton.click();
      await expect(
        this.page.getByRole("button", { name: "Fechar menu" }),
      ).toBeVisible();
    }
  }

  async navigateBySidebar(label: string) {
    await this.openSidebarIfMobile();
    await this.page
      .getByRole("link", { name: new RegExp(label, "i") })
      .first()
      .click();
  }

  async assertBreadcrumbVisible() {
    await expect(this.page.getByLabel("breadcrumb")).toBeVisible();
  }

  async logout() {
    await this.openSidebarIfMobile();
    await this.page.getByRole("button", { name: "Sair" }).click();
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
