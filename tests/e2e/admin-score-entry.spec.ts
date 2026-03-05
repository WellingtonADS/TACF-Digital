import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createEphemeralOpenSession,
  createPendingBookingsForSession,
  deleteSessionById,
  getBookingResultDetails,
  hasDbConnection,
  listPendingBookingsInSession,
  listSessionsWithPendingBookings,
  updateBookingResultDetails,
} from "./support/db";

const CREATE_SESSION_IF_EMPTY =
  process.env.E2E_ADMIN_SCORE_CREATE_SESSION === "true" || true; // Default true

test.describe("Admin score entry", () => {
  test.skip(
    !hasCredentials("admin"),
    "Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  let targetBookingId: string | null = null;
  let originalResultDetails: string | null = null;
  let createdSessionId: string | null = null;

  test("deve lançar índices (Apto) para um militar, validar persistência e limpar", async ({
    page,
  }) => {
    test.setTimeout(90000);

    const credentials = getCredentials("admin");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    // === Preparação: buscar sessão com bookings pendentes ===
    let sessions = await listSessionsWithPendingBookings();

    if (sessions.length === 0 && CREATE_SESSION_IF_EMPTY) {
      console.log(
        "Nenhuma sessão com Pendente encontrada. Criando ephemeral...",
      );
      const ephemeral = await createEphemeralOpenSession();
      createdSessionId = ephemeral.sessionId;
      // Criar bookings pendentes para essa sessão
      const created = await createPendingBookingsForSession(
        createdSessionId,
        3,
      );
      console.log(`✓ ${created} bookings pendentes criados`);
      sessions = await listSessionsWithPendingBookings();
    }

    test.skip(
      sessions.length === 0,
      "Sem sessões com bookings Pendente no banco. Use E2E_ADMIN_SCORE_CREATE_SESSION=true ou crie manualmente.",
    );

    const targetSession = sessions[0];
    expect(targetSession.pending_count).toBeGreaterThan(0);

    const pendingBookings = await listPendingBookingsInSession(
      targetSession.session_id,
    );
    expect(pendingBookings.length).toBeGreaterThan(0);

    const targetBooking = pendingBookings[0];
    targetBookingId = targetBooking.booking_id;

    // Salva o valor original para restaurar depois
    originalResultDetails = await getBookingResultDetails(targetBookingId);

    console.log(`Test session: ${targetSession.session_id}`);
    console.log(`Target booking: ${targetBookingId}`);
    console.log(`Original result_details: ${originalResultDetails}`);

    // === Login Admin ===
    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/admin)?$/);
    console.log("✓ Admin autenticado");

    // === Navega para Turmas ===
    await shell.navigateBySidebar("Gerenciar Turmas");
    await expect(page).toHaveURL(/\/app\/turmas$/);
    await expect(
      page.getByRole("heading", { name: "Gerenciar Turmas" }),
    ).toBeVisible();
    console.log("✓ Turmas carregadas");

    // === Busca a turma específica por ID curto (funciona em tabela e cards) ===
    const sessionShortId = targetSession.session_id.slice(0, 12).toUpperCase();
    const sessionContainer = page
      .locator("tr, div")
      .filter({ hasText: sessionShortId })
      .first();

    await expect(sessionContainer).toBeVisible({ timeout: 10000 });
    console.log(`✓ Sessão encontrada: ${sessionShortId}`);

    // === Clica no botão de lançamento dentro da sessão encontrada ===
    const launchBtn = sessionContainer
      .locator(
        "button[aria-label='Lançar índices'], button:has-text('Índices'), button:has-text('Lançar')",
      )
      .first();

    await expect(launchBtn).toBeVisible({ timeout: 5000 });
    await launchBtn.click();

    await page.waitForLoadState("networkidle");
    console.log("✓ Clicado em Lançar índices");

    // === Valida chegada em ScoreEntry (Lançamento de Índices) ===
    await expect(
      page.getByRole("heading", {
        name: /[Ll]ançamento de Índices?/i,
      }),
    ).toBeVisible({ timeout: 10000 });
    console.log("✓ ScoreEntry carregado");

    const sessionSelect = page.locator("#session-select");
    await expect(sessionSelect).toBeVisible({ timeout: 10000 });
    await sessionSelect.selectOption(targetSession.session_id);
    await page.waitForLoadState("networkidle");

    // === Aguarda lista de militares ===
    await page.waitForLoadState("networkidle");

    // === Busca o militar alvo na lista ===
    // Campo de busca: placeholder "Buscar por nome ou SARAM..."
    const searchInput = page.locator("input[placeholder*='Buscar']").first();

    // Usa o nome de guerra ou nome completo do militar alvo
    const militarySearchName =
      targetBooking.saram || targetBooking.war_name || targetBooking.full_name;
    await searchInput.fill(militarySearchName);
    await page.waitForTimeout(300); // delay para filtro aplicar

    console.log(`✓ Filtro aplicado: "${militarySearchName}"`);

    // === Localiza e clica no militar na lista ===
    const militaryButton = page
      .locator("button")
      .filter({ hasText: militarySearchName })
      .first();

    await expect(militaryButton).toBeVisible({ timeout: 5000 });
    await militaryButton.click();
    console.log(`✓ Militar selecionado: ${militarySearchName}`);

    await page.waitForLoadState("networkidle");

    // === Clica em Apto ===
    const aptoButton = page.getByRole("button", { name: "Apto", exact: true });

    await expect(aptoButton).toBeVisible({ timeout: 5000 });
    await aptoButton.scrollIntoViewIfNeeded();
    await aptoButton.click({ force: true, timeout: 5000 });

    // Valida que Apto ficou selecionado (mudou estilo para emerald)
    await expect(aptoButton).toHaveClass(/emerald|bg-emerald/);
    console.log("✓ Clicado em Apto");

    // === Salva ===
    const saveStart = Date.now();
    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/bookings") &&
        response.request().method() === "PATCH",
      { timeout: 10000 },
    );

    const saveButton = page
      .getByRole("button", { name: /Salvar/ })
      .filter({ hasText: /Salvar/ });

    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    await saveResponsePromise.catch(async () => {
      // Fallback se não interceptar response (pode estar offline ou diferente endpoint)
      await page.waitForLoadState("networkidle");
    });

    const saveLatencyMs = Date.now() - saveStart;
    test.info().annotations.push({
      type: "rpc-latency",
      description: `Salvar resultado latência: ${saveLatencyMs}ms`,
    });

    // Aguarda toast de sucesso
    await expect(page.getByText(/[Ss]alvo com sucesso/i)).toBeVisible({
      timeout: 5000,
    });
    console.log(`✓ Salvo (latência: ${saveLatencyMs}ms)`);

    // === Validação imediata: badge muda de Pendente para Apto ===
    // Após salvar, o militar na lista deve ter badge "Apto"
    const militaryBadgeAfterSave = page
      .locator("button")
      .filter({ hasText: militarySearchName })
      .filter({ hasText: /Apto/ }) // agora tem "Apto", não "Pendente"
      .first();

    await expect(militaryBadgeAfterSave).toBeVisible({ timeout: 5000 });
    console.log("✓ Badge atualizado para Apto");

    // === Reload e validação de persistência ===
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: /[Ll]ançamento de Índices?/i,
      }),
    ).toBeVisible({ timeout: 10000 });

    // Reapply filtro (em caso de reset)
    const searchInputAfterReload = page
      .locator("input[placeholder*='Buscar']")
      .first();

    const sessionSelectAfterReload = page.locator("#session-select");
    await expect(sessionSelectAfterReload).toBeVisible({ timeout: 10000 });
    await sessionSelectAfterReload.selectOption(targetSession.session_id);
    await page.waitForLoadState("networkidle");

    await searchInputAfterReload.fill(militarySearchName);
    await page.waitForTimeout(300);

    const persistedMilitaryButton = page
      .locator("button")
      .filter({ hasText: militarySearchName })
      .first();
    await expect(persistedMilitaryButton).toBeVisible({ timeout: 5000 });
    await persistedMilitaryButton.click();

    const aptoButtonAfterReload = page.getByRole("button", {
      name: "Apto",
      exact: true,
    });
    await expect(aptoButtonAfterReload).toHaveClass(/emerald|bg-emerald/, {
      timeout: 5000,
    });
    console.log("✓ Persistência validada (Apto mantém após reload)");

    // === Validação extra: consulta banco para garantir persistência ===
    const persistedValue = await getBookingResultDetails(targetBookingId);
    expect(persistedValue).toBe("apto");
    console.log("✓ Banco confirma: result_details = apto");

    test.info().annotations.push({
      type: "test-status",
      description: `Lançamento de índices completo: ${militarySearchName} → Apto (persistido)`,
    });
  });

  test.afterEach(async () => {
    // Restaurar booking se foi modificado
    if (!targetBookingId || originalResultDetails === undefined) {
      // Limpar sessão ephemeral se foi criada
      if (createdSessionId) {
        const removed = await deleteSessionById(createdSessionId);
        expect(removed).toBeGreaterThan(0);
        console.log("✓ Sessão ephemeral removida");
      }
      return;
    }

    console.log(
      `Teardown: restaurando booking ${targetBookingId} para ${originalResultDetails}`,
    );

    const updated = await updateBookingResultDetails(
      targetBookingId,
      originalResultDetails,
    );

    expect(
      updated,
      `Teardown falhou: não conseguiu restaurar result_details para booking ${targetBookingId}.`,
    ).toBeGreaterThan(0);

    console.log("✓ Teardown concluído");

    // Limpar sessão ephemeral por último (bookings dependem dela)
    if (createdSessionId) {
      const removed = await deleteSessionById(createdSessionId);
      expect(removed).toBeGreaterThan(0);
      console.log("✓ Sessão ephemeral removida");
    }
  });
});
