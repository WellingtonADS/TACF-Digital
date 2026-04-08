import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type ReportPeriod = {
  from: string;
  to: string;
};

type PendingRevalidationRow = {
  priority: "ALTA" | "MEDIA" | "BAIXA";
  militaryName: string;
  warName: string | null;
  identity: string;
  rank: string | null;
  unit: string;
  expiration: string;
  status: "Expirado" | "Pendente" | "Agendado";
  lastResult: "apto" | "inapto" | null;
};

type UnitPerformanceRow = {
  unit: string;
  total: number;
  apt: number;
  inapt: number;
  pending: number;
  percent: number;
};

type FullStaffRow = {
  warName: string | null;
  militaryName: string;
  identity: string;
  rank: string | null;
  unit: string;
  lastResult: "apto" | "inapto" | null;
  expiration: string;
  status: string;
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

function formatPeriodLabel(period: ReportPeriod): string {
  const from = format(parseISO(period.from), "dd/MM/yyyy", { locale: ptBR });
  const to = format(parseISO(period.to), "dd/MM/yyyy", { locale: ptBR });
  return `${from} ate ${to}`;
}

function createBaseDocument(title: string, period: ReportPeriod) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 14, 16);

  doc.setFontSize(10);
  doc.text(`Periodo: ${formatPeriodLabel(period)}`, 14, 23);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    14,
    28,
  );

  return doc;
}

export function generatePendingRevalidationPdf(params: {
  period: ReportPeriod;
  rows: PendingRevalidationRow[];
}): string {
  const doc = createBaseDocument("Revalidacao Pendente", params.period);

  autoTable(doc, {
    startY: 34,
    head: [
      [
        "Prioridade",
        "Militar",
        "SARAM",
        "Graduacao",
        "Unidade",
        "Validade",
        "Status",
        "Ultimo Resultado",
      ],
    ],
    body:
      params.rows.length > 0
        ? params.rows.map((row) => [
            row.priority,
            row.warName ?? row.militaryName,
            row.identity,
            row.rank ?? "--",
            row.unit,
            row.expiration,
            row.status,
            row.lastResult ?? "sem avaliacao",
          ])
        : [["-", "Sem dados no periodo", "-", "-", "-", "-", "-", "-"]],
    styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const filename = `revalidacao-pendente-${sanitizeFilePart(params.period.from)}-${sanitizeFilePart(params.period.to)}.pdf`;
  doc.save(filename);
  return filename;
}

export function generateUnitPerformancePdf(params: {
  period: ReportPeriod;
  rows: UnitPerformanceRow[];
}): string {
  const doc = createBaseDocument("Desempenho por Unidade", params.period);

  autoTable(doc, {
    startY: 34,
    head: [["Unidade", "Total", "Aptos", "Inaptos", "Pendentes", "% Aptidao"]],
    body:
      params.rows.length > 0
        ? params.rows.map((row) => [
            row.unit,
            String(row.total),
            String(row.apt),
            String(row.inapt),
            String(row.pending),
            `${row.percent.toFixed(1)}%`,
          ])
        : [["Sem dados", "0", "0", "0", "0", "0%"]],
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const filename = `desempenho-unidade-${sanitizeFilePart(params.period.from)}-${sanitizeFilePart(params.period.to)}.pdf`;
  doc.save(filename);
  return filename;
}

export function generateFullStaffPdf(params: {
  period: ReportPeriod;
  rows: FullStaffRow[];
}): string {
  const doc = createBaseDocument("Efetivo Completo", params.period);

  autoTable(doc, {
    startY: 34,
    head: [
      [
        "Nome de Guerra",
        "Nome Completo",
        "SARAM",
        "Graduacao",
        "Unidade",
        "Ultimo Resultado",
        "Validade",
        "Status",
      ],
    ],
    body:
      params.rows.length > 0
        ? params.rows.map((row) => [
            row.warName ?? row.militaryName,
            row.militaryName,
            row.identity,
            row.rank ?? "--",
            row.unit,
            row.lastResult ?? "sem avaliacao",
            row.expiration,
            row.status,
          ])
        : [["Sem dados", "-", "-", "-", "-", "-", "-", "-"]],
    styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const filename = `efetivo-completo-${sanitizeFilePart(params.period.from)}-${sanitizeFilePart(params.period.to)}.pdf`;
  doc.save(filename);
  return filename;
}
