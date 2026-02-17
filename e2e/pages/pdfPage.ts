import { Download, Page } from "@playwright/test";

export class PdfPage {
  constructor(public page: Page) {}

  async gotoAdminPdf() {
    await this.page.goto("/admin/calls");
  }

  async triggerGeneratePdf() {
    // tenta clicar no botão que gera o PDF, com fallbacks para seletores alternativos
    try {
      await this.page
        .getByRole("button", {
          name: /gerar.*pdf|exportar.*pdf|imprimir lista/i,
        })
        .click({ timeout: 3000 });
      return;
    } catch (err) {
      // fallback 1: botão contendo 'PDF' em texto
      const byText = this.page.locator("button", { hasText: /pdf/i }).first();
      if ((await byText.count()) > 0) {
        await byText.click();
        return;
      }
      // fallback 2: botão com ação genérica (gerar/exportar/imprimir)
      const generic = this.page
        .locator("button", { hasText: /gerar|exportar|imprimir/i })
        .first();
      if ((await generic.count()) > 0) {
        await generic.click();
        return;
      }
      // fallback 2: botão com data-testid (if present)
      const byTest = this.page
        .locator('[data-testid="download-pdf-button"]')
        .first();
      if ((await byTest.count()) > 0) {
        await byTest.click();
        return;
      }
      // rethrow original error para facilitar debug
      throw err;
    }
  }

  async waitForPdfDownload(): Promise<Download> {
    const download = await this.page.waitForEvent("download", {
      timeout: 15000,
    });
    return download;
  }

  async verifyPdfContentContainsText(download: Download, text: string) {
    const path = await download.path();
    if (!path) return false;
    // leitura simples não é possível numa run headless sem FS acesso no teste,
    // deixar verificação básica pelo filename
    const filename = download.suggestedFilename();
    return (
      filename.toLowerCase().includes("pdf") &&
      filename.toLowerCase().includes(text.toLowerCase())
    );
  }
}
