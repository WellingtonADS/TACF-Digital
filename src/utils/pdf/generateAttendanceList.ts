import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type AttendanceSession = {
  id: string;
  date: string;
  period: string;
  max_capacity: number | null;
};

type AttendanceBooking = {
  order_number: string | null;
  rank: string | null;
  full_name: string | null;
  war_name: string | null;
  saram: string | null;
  status: string;
  attendance_confirmed: boolean | null;
};

const PERIOD_LABEL: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noturno",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

type GenerateAttendanceListInput = {
  session: AttendanceSession;
  bookings: AttendanceBooking[];
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

export function generateAttendanceListPdf({
  session,
  bookings,
}: GenerateAttendanceListInput): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const dateLabel = format(parseISO(session.date), "dd/MM/yyyy", {
    locale: ptBR,
  });
  const longDate = format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const periodLabel = PERIOD_LABEL[session.period] ?? session.period;

  doc.setFontSize(14);
  doc.text("Lista de Presença", 14, 16);

  doc.setFontSize(10);
  doc.text(`Data: ${longDate}`, 14, 23);
  doc.text(`Período: ${periodLabel}`, 14, 28);
  if (session.max_capacity != null) {
    doc.text(`Capacidade: ${session.max_capacity}`, 14, 33);
  }
  doc.text(`Turma: ${session.id}`, 14, 38);

  autoTable(doc, {
    startY: 44,
    head: [
      ["Nº", "Posto/Grad", "Nome", "Guerra", "SARAM", "Status", "Presença"],
    ],
    body: bookings.map((booking) => [
      booking.order_number ?? "—",
      booking.rank ?? "—",
      booking.full_name ?? "—",
      booking.war_name ?? "—",
      booking.saram ?? "—",
      STATUS_LABEL[booking.status] ?? booking.status,
      booking.attendance_confirmed ? "Sim" : "Não",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const filename = `lista-presenca-${sanitizeFilePart(dateLabel)}-${sanitizeFilePart(periodLabel)}.pdf`;
  doc.save(filename);
  return filename;
}
