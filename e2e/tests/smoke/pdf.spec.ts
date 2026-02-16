import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { signInViaUI } from "../../fixtures/auth";
import { createServiceClient } from "../../fixtures/supabaseClient";
import { PdfPage } from "../../pages/pdfPage";

dotenv.config();

test.describe("PDF generation (real backend)", () => {
  let test_run_id: string;

  test.beforeAll(async () => {
    test_run_id = `e2e-${Date.now()}`;
    const svc = createServiceClient();

    // criar sessão e booking de exemplo
    await svc.from("sessions").insert({
      title: "Sessão para E2E PDF",
      starts_at: new Date().toISOString(),
      capacity: 5,
      metadata: { test_run_id },
    });

    // (opcional) criar bookings se necessário para popular o PDF
  });

  test.afterAll(async () => {
    const svc = createServiceClient();
    await svc
      .from("bookings")
      .delete()
      .eq("metadata->>test_run_id", test_run_id);
    await svc
      .from("sessions")
      .delete()
      .eq("metadata->>test_run_id", test_run_id);
  });

  test("admin can generate call list PDF", async ({ page }) => {
    const adminEmail = process.env.SEED_ADMIN_EMAIL!;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD!;

    await signInViaUI(page, adminEmail, adminPassword);
    const pdf = new PdfPage(page);
    await pdf.gotoAdminPdf();

    // iniciar download e aguardar evento
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      pdf.triggerGeneratePdf(),
    ]);

    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/i);
  });
});
