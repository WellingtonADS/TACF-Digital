// Lazy-load pesado `jspdf` para reduzir bundle inicial

export type CallListRow = {
  order_number: string;
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
export async function generateCallList(
  session: SessionMeta,
  bookings: CallListRow[],
  download = true,
): Promise<Blob | undefined> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const title = `Lista_Chamada_${formatDateForFilename(session.date)}_${session.period}.pdf`;

  doc.setFontSize(14);
  doc.text("Lista de Chamada", 40, 50);

  doc.setFontSize(10);
  doc.text(`Data: ${formatDisplayDate(session.date)}`, 40, 70);
  doc.text(`Turno: ${session.period}`, 40, 85);
  doc.text(`Aplicadores: ${session.applicators.join(", ")}`, 40, 100);

  // Table headers
  const docAny = doc as unknown as { autoTable?: (opts: unknown) => void };
  if (typeof docAny.autoTable === "function") {
    docAny.autoTable({
      startY: 120,
      head: [["Nº Ordem", "Posto/Graduação", "Nome Completo"]],
      body: bookings.map((b) => [b.order_number, b.rank, b.full_name]),
      styles: { fontSize: 10 },
    });
  } else {
    // Fallback mínimo quando jspdf-autotable não estiver disponível (ambiente de teste)
    const startY = 120;
    const rowHeight = 16;
    // cabeçalho
    doc.setFontSize(10);
    doc.text("Nº Ordem", 40, startY);
    doc.text("Posto/Graduação", 120, startY);
    doc.text("Nome Completo", 300, startY);
    // linhas
    bookings.forEach((b, i) => {
      const y = startY + (i + 1) * rowHeight;
      doc.text(String(b.order_number), 40, y);
      doc.text(String(b.rank), 120, y);
      doc.text(String(b.full_name), 300, y);
    });
  }

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
