import type {
  BookingWithDetails,
  SessionWithBookings,
} from "@/types/database.types";
import jsPDF from "jspdf";
import "jspdf-autotable";

export async function generateSessionPDF(
  session: SessionWithBookings & { bookings: BookingWithDetails[] },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;

  const title = `chamada-${formatDateForFilename(session.date)}.pdf`;

  // Header
  const headerY = 50;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("TACF Digital", margin, headerY);

  doc.setFontSize(16);
  doc.text("Lista de Chamada - TACF", pageWidth / 2, headerY, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(
    `Data: ${formatDisplayDate(session.date)}  |  Turno: ${mapPeriod(session.period)}`,
    margin,
    headerY + 20,
  );
  doc.text(
    `Aplicadores: ${(session.applicators ?? []).join(", ") || "—"}`,
    margin,
    headerY + 35,
  );

  // Prepare table data: only confirmed bookings with profile
  const safeBookings = (session.bookings ?? []) as BookingWithDetails[];
  const rows = safeBookings
    .map((b) => ({
      order_number: b.order_number ?? "—",
      rank: b.user?.rank ?? "—",
      full_name: b.user?.full_name ?? "—",
    }))
    .sort((a, b) => {
      // sort by rank then name
      const r = a.rank.localeCompare(b.rank, "pt-BR");
      if (r !== 0) return r;
      return a.full_name.localeCompare(b.full_name, "pt-BR");
    });

  // AutoTable
  // Column widths: SARAM small, rank small, name flexible, signature wide
  const colSaramWidth = 80;
  const colRankWidth = 110;
  const colSigWidth = 160;
  const colNameWidth =
    usableWidth - (colSaramWidth + colRankWidth + colSigWidth);

  const docAny = doc as unknown as { autoTable: (opts: unknown) => void };
  docAny.autoTable({
    startY: headerY + 60,
    head: [
      ["Nº Ordem", "Posto/Grad", "Nome Completo", "Assinatura / Resultado"],
    ],
    body: rows.map((r) => [r.order_number, r.rank, r.full_name, ""]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [36, 60, 81], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: colSaramWidth },
      1: { cellWidth: colRankWidth },
      2: { cellWidth: colNameWidth },
      3: { cellWidth: colSigWidth },
    },
    theme: "grid",
    didDrawPage: () => {
      // nothing here; we'll add footers after table generation
    },
  });

  // Footer: Generated at and page numbers on every page
  const generatedAt = new Date();
  const genText = `Gerado em: ${formatDateTime(generatedAt)}`;

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const y = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(9);
    doc.text(genText, margin, y);
    const pageText = `Página ${i} de ${totalPages}`;
    doc.text(pageText, pageWidth - margin, y, { align: "right" });
  }

  // Save with expected filename
  doc.save(title);
}

function formatDateForFilename(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function formatDateTime(d: Date) {
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function mapPeriod(p: string | undefined) {
  if (!p) return "—";
  return p === "morning" || p === "Manhã" ? "Manhã" : "Tarde";
}
