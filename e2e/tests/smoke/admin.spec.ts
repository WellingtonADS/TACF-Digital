import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { signInViaUI } from "../../fixtures/auth";
import { createServiceClient } from "../../fixtures/supabaseClient";
import { AdminPage } from "../../pages/adminPage";

dotenv.config();

test.describe("Admin management (real backend)", () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL!;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD!;

  test.beforeAll(async () => {
    // Assumimos SEED_ADMIN_EMAIL já existe; caso contrário, seed script deve criá-lo
  });

  test("admin can approve a pending user", async ({ page }) => {
    await signInViaUI(page, adminEmail, adminPassword);
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openUserManagement();

    const pendingEmail = `e2e.pending+${Date.now()}@example.com`;
    const svc = createServiceClient();
    await svc.auth.admin.createUser({
      email: pendingEmail,
      password: "Password123!",
      email_confirm: true,
    });
    await svc
      .from("profiles")
      .update({ status: "pending", metadata: {} })
      .eq("email", pendingEmail);

    await admin.approveUserByEmail(pendingEmail);
    const audit = await admin.getAuditLog();
    expect(audit).toContain(pendingEmail);
  });
});
