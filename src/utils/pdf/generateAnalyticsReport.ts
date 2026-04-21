import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type GenerateAnalyticsReportInput = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  filename: string;
};

export function generateAnalyticsReportPdf({
  title,
  subtitle,
  headers,
  rows,
  filename,
}: GenerateAnalyticsReportInput) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, 14, 24);
  }

  autoTable(doc, {
    startY: subtitle ? 30 : 24,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [28, 63, 170],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
  });

  doc.save(filename);
}
