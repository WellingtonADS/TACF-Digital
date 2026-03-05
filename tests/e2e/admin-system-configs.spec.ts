import { expect, test, type Page } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createE2ELocation,
  createE2ESessionForLocation,
  deleteBookingById,
  deleteLocationById,
  deleteLocationSchedulesByLocationId,
  deleteSessionById,
  findBookingByOrderNumber,
  getAccessProfilesByRoles,
  getSessionById,
  getUserIdByEmail,
  hasDbConnection,
  listConfirmedSemestersByUserId,
  listLocationSchedulesByLocationId,
  listPermissionIdsByAccessProfile,
  listPermissions,
  restoreAccessProfilePermissions,
  snapshotAccessProfilePermissions,
  upsertLocationSchedule,
  type AccessProfilePermissionsSnapshot,
} from "./support/db";

type TestSeed = {
  locationId: string | null;
  locationName: string | null;
  sessionId: string | null;
  sessionDate: string | null;
  sessionPeriod: string | null;
  scheduleStartTime: string;
  createdBookingId: string | null;
  permissionSnapshots: AccessProfilePermissionsSnapshot[];
  userId: string | null;
};

function parseIsoDateLocal(dateIso: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatCalendarLabel(dateIso: string): string {
  return parseIsoDateLocal(dateIso)
    .toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    })
    .toLowerCase();
}

function formatTargetDay(dateIso: string): string {
  return String(parseIsoDateLocal(dateIso).getDate());
}

async function selectSessionInScheduling(
  page: Page,
  sessionDate: string,
  sessionPeriod: string,
): Promise<void> {
  const monthLabel = formatCalendarLabel(sessionDate);
  const targetDay = formatTargetDay(sessionDate);

  const calendarCard = page
    .locator("div")
    .filter({
      has: page.getByRole("heading", { name: "Calendário de Testes" }),
    })
    .first();

  for (let steps = 0; steps < 16; steps += 1) {
    const currentLabel = (
      (await calendarCard
        .locator("p")
        .filter({ hasText: /\d{4}/ })
        .first()
        .textContent()) ?? ""
    )
      .trim()
      .toLowerCase();

    if (currentLabel === monthLabel) break;

    await calendarCard
      .locator("button")
      .filter({ has: page.locator("svg") })
      .nth(1)
      .click();
  }

  await calendarCard
    .locator("button")
    .filter({ hasText: new RegExp(`^${targetDay}$`) })
    .first()
    .click();

  const slotButton = page
    .locator("button")
    .filter({
      hasText: new RegExp(`${sessionPeriod}[\\s\\S]*Vagas:\\s*\\d+\\/`, "i"),
    })
    .first();

  await expect(
    slotButton,
    "Sessão de teste não encontrada na listagem de horários disponíveis.",
  ).toBeVisible();

  await slotButton.click();
}

test.describe("Admin system configs 5.7", () => {
  test.describe.configure({ timeout: 180000 });

  test.skip(
    !hasCredentials("admin") || !hasCredentials("user"),
    "Credenciais E2E ausentes: defina E2E_ADMIN_* e E2E_USER_*.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  const seed: TestSeed = {
    locationId: null,
    locationName: null,
    sessionId: null,
    sessionDate: null,
    sessionPeriod: null,
    scheduleStartTime: "07:30",
    createdBookingId: null,
    permissionSnapshots: [],
    userId: null,
  };

  test.beforeEach(async () => {
    seed.locationId = null;
    seed.locationName = null;
    seed.sessionId = null;
    seed.sessionDate = null;
    seed.sessionPeriod = null;
    seed.createdBookingId = null;
    seed.permissionSnapshots = [];
    seed.userId = null;

    const userCredentials = getCredentials("user");
    const userId = await getUserIdByEmail(userCredentials.email);
    expect(
      userId,
      "Usuário de teste não encontrado em auth.users.",
    ).toBeTruthy();
    seed.userId = userId;

    const occupiedSemesters = new Set(
      await listConfirmedSemestersByUserId(userId!),
    );
    test.skip(
      occupiedSemesters.has("1") && occupiedSemesters.has("2"),
      "Usuário de teste já possui agendamentos confirmados nos dois semestres.",
    );

    const targetSemester: "1" | "2" = occupiedSemesters.has("1") ? "2" : "1";

    const location = await createE2ELocation({
      status: "active",
      maxCapacity: 50,
    });
    seed.locationId = location.id;
    seed.locationName = location.name;

    await upsertLocationSchedule(location.id, {
      dayOfWeek: 1,
      period: "morning",
      startTime: seed.scheduleStartTime,
      isActive: true,
    });

    const session = await createE2ESessionForLocation({
      locationId: location.id,
      preferredPeriod: "morning",
      targetSemester,
      maxCapacity: 21,
    });
    seed.sessionId = session.id;
    seed.sessionDate = session.date;
    seed.sessionPeriod = session.period;

    const profiles = await getAccessProfilesByRoles(["admin", "user"]);
    const adminProfile = profiles.find((item) => item.role === "admin");
    const userProfile = profiles.find((item) => item.role === "user");

    if (adminProfile) {
      seed.permissionSnapshots.push(
        await snapshotAccessProfilePermissions(adminProfile.id),
      );
    }

    if (userProfile) {
      seed.permissionSnapshots.push(
        await snapshotAccessProfilePermissions(userProfile.id),
      );
    }
  });

  test.afterEach(async () => {
    for (const snapshot of seed.permissionSnapshots) {
      await restoreAccessProfilePermissions(snapshot);
    }

    if (seed.createdBookingId) {
      await deleteBookingById(seed.createdBookingId);
      seed.createdBookingId = null;
    }

    if (seed.sessionId) {
      await deleteSessionById(seed.sessionId);
      seed.sessionId = null;
      seed.sessionDate = null;
      seed.sessionPeriod = null;
    }

    if (seed.locationId) {
      await deleteLocationSchedulesByLocationId(seed.locationId);
      await deleteLocationById(seed.locationId);
      seed.locationId = null;
    }
  });

  test("desktop 1440: cadastros, permissões, sincronização e refinamento visual", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");

    const adminCredentials = getCredentials("admin");
    const userCredentials = getCredentials("user");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    await authPage.login(adminCredentials.email, adminCredentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);
    await shell.assertResponsiveShell();

    await page.goto("/app/configuracoes");
    await expect(
      page.getByRole("heading", { name: "Configurações do Sistema" }),
    ).toBeVisible();

    await expect(page.locator(".overflow-x-auto table").first()).toBeVisible();

    await page.getByRole("button", { name: "Locais / OM" }).click();
    await expect(
      page.getByRole("button", { name: "Ir para Gestão de Locais e OMs" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ir para Gestão de Locais e OMs" })
      .click();

    await expect(page).toHaveURL(/\/app\/om-locations$/);
    await expect(page.getByText(seed.locationName!)).toBeVisible();

    const locationCard = page
      .locator("article")
      .filter({ hasText: seed.locationName! })
      .first();
    await expect(locationCard).toBeVisible();
    await locationCard.getByRole("button", { name: /Horários/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/app/om/${seed.locationId}/schedules$`),
    );
    await expect(
      page.getByRole("heading", { name: "Horários Disponíveis" }),
    ).toBeVisible();
    await expect(page.getByText(seed.locationName!)).toBeVisible();

    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toHaveValue(seed.scheduleStartTime);
    await expect(
      page.locator("div.h-5.w-10.rounded-full").first(),
    ).toBeVisible();

    await timeInput.fill("07:45");
    await page.getByRole("button", { name: /Salvar Horários/i }).click();
    await expect(page.getByText("Horários salvos com sucesso.")).toBeVisible();

    const persistedSchedules = await listLocationSchedulesByLocationId(
      seed.locationId!,
    );
    expect(
      persistedSchedules.some(
        (row) =>
          row.day_of_week === 1 &&
          row.period === "morning" &&
          row.start_time === "07:45" &&
          row.is_active,
      ),
      "Persistência de horário no banco não refletiu a edição feita na UI.",
    ).toBeTruthy();

    await page.goto("/app/configuracoes/perfis");
    await expect(
      page.getByRole("heading", { name: /Permissões do Perfil:/i }).first(),
    ).toBeVisible();

    const profiles = await getAccessProfilesByRoles(["admin", "user"]);
    const adminProfile = profiles.find((item) => item.role === "admin");
    const userProfile = profiles.find((item) => item.role === "user");

    expect(adminProfile, "Perfil admin não encontrado.").toBeTruthy();
    expect(userProfile, "Perfil user/militar não encontrado.").toBeTruthy();

    const [permissions, adminPermissionIds, userPermissionIds] =
      await Promise.all([
        listPermissions(),
        listPermissionIdsByAccessProfile(adminProfile!.id),
        listPermissionIdsByAccessProfile(userProfile!.id),
      ]);

    const adminSet = new Set(adminPermissionIds);
    const userSet = new Set(userPermissionIds);

    const differingPermission = permissions.find(
      (permission) =>
        adminSet.has(permission.id) !== userSet.has(permission.id),
    );

    expect(
      differingPermission,
      "Não foi encontrada diferença de permissão entre perfis Militar e Administrador para validar alternância visual.",
    ).toBeTruthy();

    await page
      .locator("aside button")
      .filter({ hasText: adminProfile!.name })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`Permissões do Perfil:\\s*${adminProfile!.name}`, "i"),
      }),
    ).toBeVisible();

    const adminPermissionRow = page
      .locator("tbody tr")
      .filter({ hasText: differingPermission!.name })
      .first();
    await expect(
      adminPermissionRow.locator('input[type="checkbox"]').first(),
    ).toHaveJSProperty("checked", adminSet.has(differingPermission!.id));

    await page
      .locator("aside button")
      .filter({ hasText: userProfile!.name })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`Permissões do Perfil:\\s*${userProfile!.name}`, "i"),
      }),
    ).toBeVisible();

    const userPermissionRow = page
      .locator("tbody tr")
      .filter({ hasText: differingPermission!.name })
      .first();
    await expect(
      userPermissionRow.locator('input[type="checkbox"]').first(),
    ).toHaveJSProperty("checked", userSet.has(differingPermission!.id));

    await shell.logout();
    await authPage.login(userCredentials.email, userCredentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);

    await page.goto("/app/agendamentos");
    await expect(
      page.getByRole("heading", { name: "Novo Agendamento" }),
    ).toBeVisible();

    const sessionFromDb = await getSessionById(seed.sessionId!);
    expect(
      sessionFromDb,
      "Sessão de apoio não encontrada no banco.",
    ).toBeTruthy();

    await selectSessionInScheduling(
      page,
      sessionFromDb!.date,
      sessionFromDb!.period,
    );

    await page
      .getByRole("button", { name: /CONTINUAR PARA CONFIRMAÇÃO/i })
      .click();

    await expect(page).toHaveURL(/\/app\/agendamentos\/confirmacao/);
    const locationVisible = await page
      .getByText(seed.locationName!, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);

    if (!locationVisible) {
      throw new Error(
        `falha de sincronização entre cadastro e disponibilidade no agendamento: local ${seed.locationName} não apareceu na confirmação.`,
      );
    }

    const confirmationResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/rpc/confirmar_agendamento") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: /Confirmar Agendamento/i }).click();

    const confirmationResponse = await confirmationResponsePromise;
    const confirmationJson = await confirmationResponse.json();
    const confirmationResult = Array.isArray(confirmationJson)
      ? confirmationJson[0]
      : confirmationJson;

    expect(confirmationResponse.ok()).toBeTruthy();
    expect(confirmationResult?.success).toBeTruthy();
    expect(confirmationResult?.booking_id).toBeTruthy();

    await expect(page).toHaveURL(/\/app\/ticket/);

    const orderCodeRaw =
      (await page
        .locator('span:has-text("Código de Validação") + p')
        .first()
        .textContent()) ?? "";
    const orderCode = orderCodeRaw.replace(/\s+/g, "").trim();

    expect(
      orderCode,
      "Código de validação não encontrado no ticket.",
    ).toBeTruthy();

    const persisted = await findBookingByOrderNumber(orderCode);
    expect(persisted, "Agendamento não persistiu no banco.").toBeTruthy();

    seed.createdBookingId = persisted!.bookingId;

    if (persisted!.locationName !== seed.locationName) {
      throw new Error(
        `falha de sincronização entre cadastro e disponibilidade no agendamento: local esperado ${seed.locationName}, local persistido ${persisted!.locationName}.`,
      );
    }
  });

  test("mobile 375: responsividade do formulário de horários e refinamento visual", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");

    const adminCredentials = getCredentials("admin");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    await authPage.login(adminCredentials.email, adminCredentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);
    await shell.assertResponsiveShell();

    await page.goto(`/app/om/${seed.locationId}/schedules`);
    await expect(
      page.getByRole("heading", { name: "Horários Disponíveis" }),
    ).toBeVisible();

    const scheduleContainer = page.locator(".grid.grid-cols-3").first();
    await expect(scheduleContainer).toBeVisible();

    const firstToggleLabel = page
      .locator("label")
      .filter({ has: page.locator('input[type="checkbox"]') })
      .first();
    await expect(firstToggleLabel).toContainText(/Ativo|Inativo/i);

    const visibleTimeInput = page.locator('input[type="time"]').first();
    if (!(await visibleTimeInput.isVisible().catch(() => false))) {
      await firstToggleLabel.click();
    }

    const timeInput = page.locator('input[type="time"]').first();
    await expect(timeInput).toBeVisible();
    await expect(timeInput).toHaveClass(/focus:ring-primary/);

    await timeInput.focus();
    await expect(timeInput).toBeFocused();

    const viewportWidth = page.viewportSize()?.width ?? 375;
    const inputBox = await timeInput.boundingBox();
    expect(
      inputBox,
      "Input de hora não renderizou corretamente no mobile.",
    ).not.toBeNull();
    expect((inputBox?.x ?? 0) + (inputBox?.width ?? 0)).toBeLessThanOrEqual(
      viewportWidth + 2,
    );

    await expect(
      page.locator("div.h-5.w-10.rounded-full").first(),
    ).toBeVisible();
  });
});
