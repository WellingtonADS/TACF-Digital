import { expect, type Page } from "@playwright/test";

export async function measureActionDurationMs(
  action: () => Promise<void>,
): Promise<number> {
  const start = Date.now();
  await action();
  return Date.now() - start;
}

export async function assertToastVisible(page: Page, text: string | RegExp) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 15000 });
}

export async function assertResponseTimeBelow(
  elapsedMs: number,
  maxMs: number,
  context: string,
) {
  expect(
    elapsedMs,
    `${context} excedeu tempo maximo esperado (${elapsedMs}ms > ${maxMs}ms)`,
  ).toBeLessThan(maxMs);
}

export async function forceSlowLocationsRpc(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/rpc/get_locations", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowSessionsRpc(page: Page, delayMs = 1200) {
  await page.route(
    "**/rest/v1/rpc/get_sessions_availability",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    },
  );
}

export async function forceSlowBookingsQuery(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/bookings**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowProfilesQuery(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/profiles**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowAccessProfilesQuery(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/access_profiles**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
  await page.route("**/rest/v1/permissions**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowSystemSettingsQuery(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/system_settings**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowAuditLogsQuery(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/audit_logs**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function forceSlowResultsHistoryRpc(page: Page, delayMs = 1200) {
  await page.route("**/rest/v1/rpc/get_results_history**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}
