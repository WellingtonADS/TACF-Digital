import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";

export type ReceiptBooking = {
  booking_id: string;
  saram: string;
  full_name: string;
  rank: string;
  date: string; // ISO
  period: "Manhã" | "Tarde";
};

export async function generateReceipt(
  booking: ReceiptBooking,
  download = true,
): Promise<Blob | undefined> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const title = `Comprovante_${booking.saram}_${formatDateForFilename(booking.date)}.pdf`;

  doc.setFontSize(14);
  doc.text("Comprovante de Agendamento - TACF HACO", 40, 50);

  doc.setFontSize(10);
  doc.text(`SARAM: ${booking.saram}`, 40, 75);
  doc.text(`Nome: ${booking.full_name}`, 40, 90);
  doc.text(`Posto/Grad: ${booking.rank}`, 40, 105);

  doc.text(`Data: ${formatDisplayDate(booking.date)}`, 40, 130);
  doc.text(`Turno: ${booking.period}`, 40, 145);

  // generate QR code data URL
  const codeData = JSON.stringify({
    saram: booking.saram,
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
