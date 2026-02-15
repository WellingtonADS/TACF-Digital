// Carrega `jspdf` dinamicamente para reduzir bundle inicial
// `jspdf-autotable` é um side-effect que estende o prototype, carregamos também dinamicamente
import QRCode from "qrcode";

export type ReceiptBooking = {
  booking_id: string;
  order_number?: string | null;
  saram?: string;
  full_name: string;
  rank: string;
  date: string; // ISO
  period: "Manhã" | "Tarde";
};

export async function generateReceipt(
  booking: ReceiptBooking,
  download = true,
): Promise<Blob | undefined> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const title = `Comprovante_${booking.order_number ?? booking.booking_id}_${formatDateForFilename(booking.date)}.pdf`;

  doc.setFontSize(14);
  doc.text("Comprovante de Agendamento - TACF HACO", 40, 50);

  doc.setFontSize(10);
  doc.text(`Número de Ordem: ${booking.order_number}`, 40, 75);
  doc.text(`Nome: ${booking.full_name}`, 40, 90);
  doc.text(`Posto/Grad: ${booking.rank}`, 40, 105);

  doc.text(`Data: ${formatDisplayDate(booking.date)}`, 40, 130);
  doc.text(`Turno: ${booking.period}`, 40, 145);

  // generate QR code data URL
  const codeData = JSON.stringify({
    order_number: booking.order_number,
    booking_id: booking.booking_id,
  });
  try {
    const dataUrl = await QRCode.toDataURL(codeData, { margin: 0 });
    // add image at right side
    doc.addImage(dataUrl, "PNG", 400, 60, 120, 120);
  } catch (err) {
    // ignore QR errors, but continue
    console.warn("QR generation failed", err);
  }

  // Footer timestamp
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 700);

  if (download) {
    doc.save(title);
    return undefined;
  }

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
