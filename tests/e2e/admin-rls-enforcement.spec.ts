/**
 * RLS enforcement spec — verifies that a regular (non-admin) user cannot
 * access admin-only routes and receives the expected denied/forbidden state.
 */
import { expect, test } from "./fixtures/auth";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

const ADMIN_ROUTES = [
  "/app/admin/dashboard",
  "/app/admin/sessoes",
  "/app/admin/agendamentos",
  "/app/admin/usuarios",
  "/app/admin/configuracoes",
];

test.describe("RLS / Route-access enforcement", () => {
  test.skip(
    !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
    "E2E_USER_EMAIL/PASSWORD not set",
  );

  for (const route of ADMIN_ROUTES) {
    test(`regular user is denied access to ${route}`, async ({
      userContext,
    }) => {
      const page = await userContext.newPage();
      await page.goto(`${BASE}${route}`);

      // Expect either a redirect to /app (home), /forbidden, or a forbidden message
      const isForbidden =
        (await page.url()).includes("/forbidden") ||
        ((await page.url()).includes("/app") && !page.url().includes("/admin"));

      const hasForbiddenText = await page
        .getByText(/acesso negado|não autorizado|forbidden|unauthorized/i)
        .isVisible()
        .catch(() => false);

      expect(isForbidden || hasForbiddenText).toBe(true);

      await page.close();
    });
  }
});
