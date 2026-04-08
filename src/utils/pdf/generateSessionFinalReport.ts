import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatSessionPeriod } from "../booking";

type SessionFinalReportSession = {
  id: string;
  date: string;
  period: string;
  max_capacity: number | null;
  location_name: string;
};

type SessionFinalReportRow = {
  order_number: string;
  rank: string | null;
  full_name: string;
  war_name: string | null;
  saram: string | null;
  result: "apto" | "inapto";
};

type GenerateSessionFinalReportInput = {
  session: SessionFinalReportSession;
  rows: SessionFinalReportRow[];
  pendingConvertedCount: number;
};

function sanitizeFilePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildRowsTable(rows: SessionFinalReportRow[]): Array<string[]> {
  return rows.map((row) => [
    row.order_number,
    row.rank ?? "-",
    row.war_name ?? "-",
    row.full_name,
    row.saram ?? "-",
    row.result === "apto" ? "Apto" : "Inapto",
  ]);
}

export function generateSessionFinalReportPdf({
  session,
  rows,
  pendingConvertedCount,
}: GenerateSessionFinalReportInput): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const longDate = format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const shortDate = format(parseISO(session.date), "dd/MM/yyyy", {
    locale: ptBR,
  });
  const periodLabel = formatSessionPeriod(session.period);

  const aptRows = rows.filter((row) => row.result === "apto");
  const inaptoRows = rows.filter((row) => row.result === "inapto");
  const total = rows.length;
  const aptPercent = total > 0 ? Math.round((aptRows.length / total) * 100) : 0;
  const inaptoPercent =
    total > 0 ? Math.round((inaptoRows.length / total) * 100) : 0;

  doc.setFontSize(14);
  doc.text("Relatorio Tecnico de Encerramento", 14, 16);

  doc.setFontSize(10);
  doc.text(`Turma: ${session.id}`, 14, 23);
  doc.text(`Data: ${longDate}`, 14, 28);
  doc.text(`Periodo: ${periodLabel}`, 14, 33);
  doc.text(`Local: ${session.location_name}`, 14, 38);
  if (session.max_capacity != null) {
    doc.text(`Capacidade maxima: ${session.max_capacity}`, 14, 43);
  }
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    14,
    session.max_capacity != null ? 48 : 43,
  );

  const startSummaryY = session.max_capacity != null ? 54 : 49;

  autoTable(doc, {
    startY: startSummaryY,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total de avaliados", String(total)],
      ["Total de aptos", String(aptRows.length)],
      ["Total de inaptos", String(inaptoRows.length)],
      ["Percentual de aptos", `${aptPercent}%`],
      ["Percentual de inaptos", `${inaptoPercent}%`],
      ["Pendentes convertidos na finalizacao", String(pendingConvertedCount)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const summaryFinalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? startSummaryY + 30;

  doc.setFontSize(11);
  doc.text("Lista de Aptos", 14, summaryFinalY + 8);

  autoTable(doc, {
    startY: summaryFinalY + 11,
    head: [
      ["N", "Posto/Grad", "Nome Guerra", "Nome Completo", "SARAM", "Resultado"],
    ],
    body:
      aptRows.length > 0
        ? buildRowsTable(aptRows)
        : [["-", "-", "-", "Nenhum militar apto.", "-", "-"]],
    styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: {
      fillColor: [16, 135, 115],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  const aptFinalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? summaryFinalY + 45;

  doc.setFontSize(11);
  doc.text("Lista de Inaptos", 14, aptFinalY + 8);

  autoTable(doc, {
    startY: aptFinalY + 11,
    head: [
      ["N", "Posto/Grad", "Nome Guerra", "Nome Completo", "SARAM", "Resultado"],
    ],
    body:
      inaptoRows.length > 0
        ? buildRowsTable(inaptoRows)
        : [["-", "-", "-", "Nenhum militar inapto.", "-", "-"]],
    styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: {
      fillColor: [168, 43, 43],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [252, 247, 247] },
  });

  const filename = `relatorio-tecnico-${sanitizeFilePart(shortDate)}-${sanitizeFilePart(periodLabel)}-${sanitizeFilePart(session.id.slice(0, 8))}.pdf`;
  doc.save(filename);
  return filename;
}
