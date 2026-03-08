import { expect, type Page } from "@playwright/test";

export async function goToUserProfile(page: Page) {
  await page.goto("/app/perfil");
  await expect(
    page.getByRole("heading", { name: "Gerenciamento de Perfil" }),
  ).toBeVisible({ timeout: 20000 });
}

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export async function ensureProfileRequiredFields(page: Page) {
  const fullNameInput = page.getByPlaceholder("Ex.: João da Silva");
  const emailInput = page.getByPlaceholder("Ex.: joao.silva@fab.mil.br");
  const warNameInput = page.getByPlaceholder("Ex.: SILVA");
  const saramInput = page.getByPlaceholder("Ex.: 1234567");
  const sectorInput = page.getByPlaceholder("Ex.: 2º/10º GAV");
  const rankSelect = page.getByRole("combobox", { name: "Posto/Graduação" });

  const fullName = (await fullNameInput.inputValue()).trim();
  const email = (await emailInput.inputValue()).trim();
  const warName = (await warNameInput.inputValue()).trim();
  const saram = (await saramInput.inputValue()).replace(/\D/g, "");
  const sector = (await sectorInput.inputValue()).trim();
  const rank = await rankSelect.inputValue();

  if (!fullName) await fullNameInput.fill("Militar E2E User");
  if (!email) await emailInput.fill(`user.e2e.${Date.now()}@fab.mil.br`);
  if (!warName) await warNameInput.fill("E2EUSER");
  if (saram.length !== 7) await saramInput.fill("1234567");
  if (!sector) await sectorInput.fill("OM E2E");
  if (!rank) await rankSelect.selectOption("Soldado");
}

export async function updatePhoneWithRollback(page: Page) {
  const phoneInput = page.getByPlaceholder("(00) 00000-0000");
  const saveButton = page.getByRole("button", { name: "SALVAR ALTERAÇÕES" });

  const originalPhone = await phoneInput.inputValue();
  const originalDigits = sanitizePhone(originalPhone);

  const mutatedDigits =
    originalDigits.length >= 10
      ? `${originalDigits.slice(0, originalDigits.length - 1)}${originalDigits.endsWith("9") ? "8" : "9"}`
      : "51999999999";

  const mutatedPhone =
    mutatedDigits.length === 11
      ? `(${mutatedDigits.slice(0, 2)}) ${mutatedDigits.slice(2, 7)}-${mutatedDigits.slice(7)}`
      : "(51) 99999-9999";

  await phoneInput.fill(mutatedPhone);
  await saveButton.click();
  await expect(page.getByText("Alterações salvas com sucesso.")).toBeVisible({
    timeout: 15000,
  });

  await phoneInput.fill(originalPhone);
  await saveButton.click();
  await expect(page.getByText("Alterações salvas com sucesso.")).toBeVisible({
    timeout: 15000,
  });
}

export async function submitAppealRequest(page: Page) {
  await page.goto(`/app/recurso?result=E2E_RESULT_${Date.now()}`);
  await expect(
    page.getByRole("heading", { name: "Solicitação de Revisão de Resultado" }),
  ).toBeVisible({ timeout: 20000 });

  await page.getByRole("combobox", { name: "Motivo do Recurso" }).selectOption({
    label: "Outro motivo",
  });

  await page
    .getByPlaceholder(
      "Descreva detalhadamente os fatos que embasam a solicitação de revisão...",
    )
    .fill(
      "Justificativa de teste E2E com conteúdo suficiente para validar o fluxo de envio de recurso no contexto do usuário.",
    );

  await page.getByRole("button", { name: "Enviar Solicitação" }).click();
  await expect(
    page.getByRole("heading", { name: "Solicitação Registrada" }),
  ).toBeVisible({ timeout: 15000 });
}

export async function discardAppealDraft(page: Page) {
  await page.goto(`/app/recurso?result=E2E_DISCARD_${Date.now()}`);
  await expect(
    page.getByRole("heading", { name: "Solicitação de Revisão de Resultado" }),
  ).toBeVisible({ timeout: 20000 });

  await page.getByRole("combobox", { name: "Motivo do Recurso" }).selectOption({
    label: "Erro no registro do resultado",
  });

  await page
    .getByPlaceholder(
      "Descreva detalhadamente os fatos que embasam a solicitação de revisão...",
    )
    .fill("Rascunho E2E para validar descarte do fluxo de recurso.");

  await page.getByRole("button", { name: "Cancelar" }).click();
}

export async function goToResultsHistory(page: Page) {
  await page.goto("/app/resultados");
  await expect(
    page.getByRole("heading", { name: "Histórico de Avaliações" }),
  ).toBeVisible({ timeout: 20000 });
}

export async function goToDocuments(page: Page) {
  await page.goto("/app/documentos");
  await expect(
    page.getByRole("heading", { name: "Documentos e Normas" }),
  ).toBeVisible({ timeout: 20000 });
}

type ConditionalActionResult = {
  executed: boolean;
  reason?: string;
};

function getNextWeekdayIsoDate(offsetDays = 14): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function submitRescheduleIfEligible(
  page: Page,
): Promise<ConditionalActionResult> {
  await goToResultsHistory(page);

  const rescheduleButtons = page.getByRole("button", { name: /Reagendar/i });
  const totalButtons = await rescheduleButtons.count();

  if (totalButtons === 0) {
    return {
      executed: false,
      reason:
        "Sem agendamento elegivel para reagendamento na tela de historico.",
    };
  }

  for (let i = 0; i < totalButtons; i += 1) {
    const button = rescheduleButtons.nth(i);
    const label = (await button.innerText()).toLowerCase();
    if (label.includes("pendente")) {
      continue;
    }

    await button.click();

    await expect(
      page.getByRole("heading", { name: "Solicitar Reagendamento" }),
    ).toBeVisible({ timeout: 10000 });

    await page.locator("#new-date").fill(getNextWeekdayIsoDate(14));
    await page
      .locator("#reason")
      .fill(
        "Solicitacao de reagendamento em teste E2E para validar fluxo condicional do contexto usuario.",
      );

    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Solicitação enviada")).toBeVisible({
      timeout: 15000,
    });

    return { executed: true };
  }

  return {
    executed: false,
    reason:
      "Todos os agendamentos elegiveis ja possuem reagendamento pendente.",
  };
}
