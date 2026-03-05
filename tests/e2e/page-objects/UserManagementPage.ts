import { expect, type Locator, type Page } from "@playwright/test";

export class UserManagementPage {
  constructor(private readonly page: Page) {}

  private get isMobile(): boolean {
    return (this.page.viewportSize()?.width ?? 1440) <= 767;
  }

  private get profilesUpdateUrlPattern(): RegExp {
    return /\/rest\/v1\/profiles\?/;
  }

  private get permissionsTable(): Locator {
    return this.page.locator("table").filter({ hasText: "Módulo" }).first();
  }

  async gotoPersonnel() {
    await this.page.goto("/app/efetivo");
  }

  async gotoAccessProfiles() {
    await this.page.goto("/app/configuracoes/perfis");
  }

  async assertPersonnelLoaded() {
    await expect(
      this.page.getByRole("heading", { name: "Gestão de Efetivo" }),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder("Buscar por SARAM ou Nome..."),
    ).toBeVisible();
  }

  async assertPersonnelTableComplete() {
    await expect(
      this.page.getByRole("columnheader", { name: "Militar" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("columnheader", { name: "SARAM" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("columnheader", { name: "Último Teste" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("columnheader", { name: "Ações" }),
    ).toBeVisible();
  }

  async assertDesktopFilterAlignment() {
    const search = this.page.getByPlaceholder("Buscar por SARAM ou Nome...");
    const rankSelect = this.page.getByRole("combobox").nth(0);
    const statusSelect = this.page.getByRole("combobox").nth(1);

    const [searchBox, rankBox, statusBox] = await Promise.all([
      search.boundingBox(),
      rankSelect.boundingBox(),
      statusSelect.boundingBox(),
    ]);

    expect(searchBox, "Search input precisa estar renderizado").not.toBeNull();
    expect(rankBox, "Filtro de posto precisa estar renderizado").not.toBeNull();
    expect(
      statusBox,
      "Filtro de status precisa estar renderizado",
    ).not.toBeNull();

    if (!searchBox || !rankBox || !statusBox) return;

    const sameRowTolerance = 12;
    expect(Math.abs(searchBox.y - rankBox.y)).toBeLessThanOrEqual(
      sameRowTolerance,
    );
    expect(Math.abs(searchBox.y - statusBox.y)).toBeLessThanOrEqual(
      sameRowTolerance,
    );
  }

  async assertMobileFormResponsive() {
    const search = this.page.getByPlaceholder("Buscar por SARAM ou Nome...");
    const rankSelect = this.page.getByRole("combobox").nth(0);
    const statusSelect = this.page.getByRole("combobox").nth(1);

    await expect(search).toBeVisible();
    await expect(rankSelect).toBeVisible();
    await expect(statusSelect).toBeVisible();

    const [searchBox, rankBox, statusBox] = await Promise.all([
      search.boundingBox(),
      rankSelect.boundingBox(),
      statusSelect.boundingBox(),
    ]);

    expect(searchBox).not.toBeNull();
    expect(rankBox).not.toBeNull();
    expect(statusBox).not.toBeNull();

    if (!searchBox || !rankBox || !statusBox) return;

    expect(rankBox.y).toBeGreaterThanOrEqual(searchBox.y);
    expect(statusBox.y).toBeGreaterThanOrEqual(rankBox.y);
  }

  async openFirstProfile() {
    const viewProfileButton = this.page
      .locator('button[title="Ver perfil"]')
      .first();
    await expect(viewProfileButton).toBeVisible();
    await viewProfileButton.click();
    await expect(this.page.getByText("Identificação")).toBeVisible();
  }

  async assertProfileActionsAccessible() {
    const activeButton = this.page.getByRole("button", {
      name: "Ativo",
      exact: true,
    });
    const inactiveButton = this.page.getByRole("button", {
      name: "Inativo",
      exact: true,
    });

    await expect(activeButton).toBeVisible();
    await expect(inactiveButton).toBeVisible();

    const activeEnabled = await activeButton.isEnabled();
    const inactiveEnabled = await inactiveButton.isEnabled();
    expect(activeEnabled || inactiveEnabled).toBeTruthy();
  }

  async toggleActiveWithVisualAssertions() {
    const activeButton = this.page.getByRole("button", {
      name: "Ativo",
      exact: true,
    });
    const inactiveButton = this.page.getByRole("button", {
      name: "Inativo",
      exact: true,
    });

    const activateAction = await activeButton.isEnabled();
    const actionButton = activateAction ? activeButton : inactiveButton;

    await this.page.route(this.profilesUpdateUrlPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    try {
      await actionButton.click();

      await expect(this.page.locator(".animate-spin").first()).toBeVisible();
      await expect(this.page.locator("[data-sonner-toast]")).toContainText(
        /Militar (ativado|inativado)\./,
      );
    } finally {
      await this.page.unroute(this.profilesUpdateUrlPattern);
    }
  }

  async assertAccessProfilesLoaded() {
    await expect(this.page).toHaveURL(/\/app\/configuracoes\/perfis$/, {
      timeout: 15000,
    });

    await expect(
      this.page
        .getByRole("heading", { name: /Permissões do Perfil:/i })
        .first(),
    ).toBeVisible({ timeout: 15000 });

    await expect(this.permissionsTable).toBeVisible({ timeout: 15000 });
  }

  async assertAccessProfilesLoadingVisual() {
    await this.gotoAccessProfiles();
    await this.assertAccessProfilesLoaded();
  }

  async assertPersonnelLoadingVisual() {
    const loadingPattern = /\/rest\/v1\/(profiles|bookings)/;
    await this.page.route(loadingPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });

    try {
      await this.gotoPersonnel();
      await expect(this.page.getByText("Carregando efetivo...")).toBeVisible();
      await this.assertPersonnelLoaded();
    } finally {
      await this.page.unroute(loadingPattern);
    }
  }

  async toggleFirstPermissionAndRollback() {
    await this.assertAccessProfilesLoaded();

    const firstPermissionCheckbox = this.permissionsTable
      .locator('tbody tr input[type="checkbox"]')
      .first();
    await expect(firstPermissionCheckbox).toBeVisible();

    const initialChecked = await firstPermissionCheckbox.isChecked();
    await firstPermissionCheckbox.click();
    await expect(firstPermissionCheckbox).toHaveJSProperty(
      "checked",
      !initialChecked,
    );

    await firstPermissionCheckbox.click();
    await expect(firstPermissionCheckbox).toHaveJSProperty(
      "checked",
      initialChecked,
    );
  }

  async assertMobileActionsAccessibleByTouch() {
    if (!this.isMobile) return;

    const viewProfileButton = this.page
      .locator('button[title="Ver perfil"]')
      .first();
    await expect(viewProfileButton).toBeVisible();
    await viewProfileButton.tap();

    await this.assertProfileActionsAccessible();
  }
}
