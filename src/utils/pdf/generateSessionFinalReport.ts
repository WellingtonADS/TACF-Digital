import type { SessionInfo, SessionClosureChecklist } from "@/services/sessions";
import type { BookingRow } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { getBookingResultStatus } from "@/utils/bookingResults";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type BookingForReport = BookingRow & {
  full_name?: string | null;
  war_name?: string | null;
  saram?: string | null;
  rank?: string | null;
};

type GenerateSessionFinalReportInput = {
  session: SessionInfo;
  bookings: BookingForReport[];
  checklist?: SessionClosureChecklist | null;
};

export function generateSessionFinalReportPdf({
  session,
  bookings,
  checklist,
}: GenerateSessionFinalReportInput): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateLabel = format(parseISO(session.date), "dd/MM/yyyy", {
    locale: ptBR,
  });
  const periodLabel = formatSessionPeriod(session.period);

  const activeBookings = bookings.filter((item) => item.status !== "cancelado");
  const summary = activeBookings.reduce(
    (acc, booking) => {
      const status = getBookingResultStatus(booking.result_details);
      if (status === "apto") acc.apto += 1;
      else if (status === "inapto") acc.inapto += 1;
      else acc.pendente += 1;
      return acc;
    },
    { apto: 0, inapto: 0, pendente: 0 },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório Final da Sessão", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Data: ${dateLabel} • Turno: ${periodLabel} • Local: ${session.location_name ?? "Não informado"}`,
    14,
    25,
  );
  doc.text(
    `Status: ${session.status} • Capacidade: ${session.capacity ?? 0} min / ${session.max_capacity ?? 0} max`,
    14,
    31,
  );
  doc.text(
    `Resumo: ${summary.apto} aptos • ${summary.inapto} inaptos • ${summary.pendente} pendentes`,
    14,
    37,
  );

  if (checklist) {
    doc.text(
      `Checklist: ${checklist.bookings_total} reservas • ${checklist.attendance_treated_count} presenças tratadas • ${checklist.pending_swap_requests} reagendamentos pendentes`,
      14,
      43,
    );
  }

  autoTable(doc, {
    startY: checklist ? 49 : 43,
    head: [["Militar", "SARAM", "Presença", "Resultado"]],
    body: activeBookings.map((booking) => [
      booking.war_name ?? booking.full_name ?? "Sem nome",
      booking.saram ?? "--",
      booking.attendance_confirmed ? "Confirmada" : "Não confirmada",
      getBookingResultStatus(booking.result_details) ?? "pendente",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [28, 63, 170],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
  });

  const filename = `relatorio-final-${session.date}-${session.period}.pdf`;
  doc.save(filename);
  return filename;
}
