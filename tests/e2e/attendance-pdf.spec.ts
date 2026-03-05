import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createEphemeralOpenSession,
  createPendingBookingsForSession,
  deleteSessionById,
  hasDbConnection,
  listSessionsWithPendingBookings,
} from "./support/db";

const CREATE_SESSION_IF_EMPTY =
  process.env.E2E_ATTENDANCE_PDF_CREATE_SESSION === "true" || true;

test.describe("Attendance PDF generation", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  let createdSessionId: string | null = null;

  test("deve gerar lista de presença em PDF para turma com militares agendados", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    let sessions = await listSessionsWithPendingBookings();

    if (sessions.length === 0 && CREATE_SESSION_IF_EMPTY) {
      console.log(
        "Nenhuma turma com pendentes encontrada. Criando sessão ephemeral...",
      );
      const ephemeral = await createEphemeralOpenSession();
      createdSessionId = ephemeral.sessionId;
      const created = await createPendingBookingsForSession(
        createdSessionId,
        3,
      );
      console.log(`✓ ${created} bookings criados para PDF`);
      sessions = await listSessionsWithPendingBookings();
    }

    test.skip(
      sessions.length === 0,
      "Sem turmas com militares agendados. Use E2E_ATTENDANCE_PDF_CREATE_SESSION=true ou prepare dados no banco.",
    );

    const targetSession = sessions[0];
    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);

    await shell.navigateBySidebar("Gerenciar Turmas");
    await expect(page).toHaveURL(/\/app\/turmas$/);

    await page.goto(`/app/turmas/${targetSession.session_id}/agendamentos`);

    try {
      await expect(page).toHaveURL(/\/app\/turmas\/.+\/agendamentos$/, {
        timeout: 20000,
      });
    } catch (error) {
      throw new Error(
        "Timeout ao abrir agendamentos da turma. Banco/consulta pode estar lento.",
        { cause: error },
      );
    }

    await expect(
      page.getByRole("heading", { name: "Agendamentos da Turma" }),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText("Nenhum agendamento encontrado."),
    ).not.toBeVisible({ timeout: 20000 });

    const pdfButton = page.getByRole("button", {
      name: /Gerar Lista de Presença/i,
    });

    await expect(pdfButton).toBeVisible({ timeout: 10000 });
    await expect(pdfButton).toBeEnabled({ timeout: 10000 });
    await expect(pdfButton).toHaveClass(/text-primary|border-primary/);
    await expect(pdfButton.locator("svg")).toBeVisible();

    const pdfCapture: { contentType: string | null } = { contentType: null };
    const responseListener = (response: {
      headers: () => Record<string, string>;
    }) => {
      const headers = response.headers();
      const contentType = headers["content-type"] || headers["Content-Type"];
      if (contentType?.toLowerCase().includes("application/pdf")) {
        pdfCapture.contentType = contentType;
      }
    };
    page.on("response", responseListener);

    const startedAt = Date.now();
    const downloadPromise = page.waitForEvent("download", { timeout: 30000 });

    await pdfButton.click();
    await expect(pdfButton).toContainText(/Processando\.\.\./i, {
      timeout: 5000,
    });

    const download = await downloadPromise.catch((error) => {
      throw new Error(
        `Timeout aguardando download do PDF. O processamento da lista pode estar lento. Erro original: ${String(error)}`,
      );
    });

    page.off("response", responseListener);

    const generationLatencyMs = Date.now() - startedAt;
    test.info().annotations.push({
      type: "pdf-latency",
      description: `Geração de PDF latência: ${generationLatencyMs}ms`,
    });

    if (pdfCapture.contentType !== null) {
      expect(pdfCapture.contentType.toLowerCase()).toContain("application/pdf");
    } else {
      test.info().annotations.push({
        type: "pdf-content-type",
        description:
          "Sem response HTTP application/pdf (fluxo client-side). Validado por download + assinatura %PDF.",
      });
    }

    const suggestedName = download.suggestedFilename();
    expect(suggestedName.toLowerCase()).toContain(".pdf");

    const outputPath = path.join(
      testInfo.outputDir,
      suggestedName || "lista-presenca.pdf",
    );

    await download.saveAs(outputPath);
    const failure = await download.failure();
    expect(failure).toBeNull();

    const fileBuffer = await fs.readFile(outputPath);
    expect(fileBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  test.afterEach(async () => {
    if (!createdSessionId) return;

    const removed = await deleteSessionById(createdSessionId);
    expect(removed).toBeGreaterThan(0);
    createdSessionId = null;
    console.log("✓ Sessão ephemeral removida");
  });
});
