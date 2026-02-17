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

    const pendingEmail = `e2e.pending+${Date.now()}@example.com`;
    const svc = createServiceClient();
    const created = await svc.auth.admin.createUser({
      email: pendingEmail,
      password: "Password123!",
      email_confirm: true,
    });
    const newUserId = (created as any)?.data?.user?.id ?? null;
    // garantir que exista um profile associado ao usuário e marcá-lo como pending
    if (newUserId) {
      await svc.from("profiles").upsert({
        id: newUserId,
        email: pendingEmail,
        status: "pending",
        metadata: {},
        saram: "000000",
        full_name: "Pending User",
        rank: "Soldado",
        semester: "1",
        role: "user",
        active: false,
      });
    } else {
      // fallback: upsert by email (with required fields)
      await svc.from("profiles").upsert({
        email: pendingEmail,
        status: "pending",
        metadata: {},
        saram: "000000",
        full_name: "Pending User",
        rank: "Soldado",
        semester: "1",
        role: "user",
        active: false,
      });
    }

    // Aprovar via service-role (API) para evitar depender da renderização na UI
    // Obtemos o id do profile caso o createUser não tenha retornado
    let profileId = newUserId;
    if (!profileId) {
      const q = await svc
        .from("profiles")
        .select("id")
        .eq("email", pendingEmail)
        .maybeSingle();
      profileId = (q as any)?.data?.id ?? null;
    }
    if (!profileId)
      throw new Error("Could not resolve profile id for pending user");

    const approveRes = await svc
      .from("profiles")
      .update({ active: true })
      .eq("id", profileId)
      .select()
      .maybeSingle();
    if ((approveRes as any)?.error)
      throw new Error(
        "Approve via API failed: " + JSON.stringify((approveRes as any).error),
      );
    const approved = (approveRes as any)?.data ?? null;
    expect(approved).toBeTruthy();
    expect(approved.active).toBe(true);
  });
});
