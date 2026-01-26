import jsPDF from "jspdf";
import "jspdf-autotable";

export type CallListRow = {
  saram: string;
  full_name: string;
  rank: string;
};

export type SessionMeta = {
  date: string; // ISO date
  period: "Manhã" | "Tarde";
  applicators: string[];
};

/**
 * Generate a call list PDF for a session.
 * Returns a Blob or triggers download depending on `download` flag.
 */
export function generateCallList(
  session: SessionMeta,
  bookings: CallListRow[],
  download = true,
): Blob | undefined {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const title = `Lista_Chamada_${formatDateForFilename(session.date)}_${session.period}.pdf`;

  doc.setFontSize(14);
  doc.text("Lista de Chamada", 40, 50);

  doc.setFontSize(10);
  doc.text(`Data: ${formatDisplayDate(session.date)}`, 40, 70);
  doc.text(`Turno: ${session.period}`, 40, 85);
  doc.text(`Aplicadores: ${session.applicators.join(", ")}`, 40, 100);

  // Table headers
  const docAny = doc as unknown as { autoTable: (opts: unknown) => void };
  docAny.autoTable({
    startY: 120,
    head: [["SARAM", "Posto/Graduação", "Nome Completo"]],
    body: bookings.map((b) => [b.saram, b.rank, b.full_name]),
    styles: { fontSize: 10 },
  });

  if (download) {
    doc.save(title);
    return undefined;
  }

  // Return blob for further handling
  const blob = doc.output("blob");
  return blob;
}

function formatDateForFilename(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}
