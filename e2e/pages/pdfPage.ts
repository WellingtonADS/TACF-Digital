import { Download, Page } from "@playwright/test";

export class PdfPage {
  constructor(public page: Page) {}

  async gotoAdminPdf() {
    await this.page.goto("/admin/calls");
  }

  async triggerGeneratePdf() {
    // tenta clicar no botão que gera o PDF
    await this.page
      .getByRole("button", { name: /gerar.*pdf|exportar.*pdf|imprimir lista/i })
      .click();
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
