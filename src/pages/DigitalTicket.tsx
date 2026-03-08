import Layout from "@/components/layout/Layout";
import type { TicketData } from "@/hooks/useTicket";
import useTicket from "@/hooks/useTicket";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Calendar,
  Download,
  Info,
  MapPin,
  Printer,
  ShieldCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useMemo } from "react";
import QR from "react-qr-code";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import PageSkeleton from "../components/PageSkeleton";

// no longer need formatTicketDate or route state types; they live in the hook

export default function DigitalTicket({ ticket }: { ticket?: TicketData }) {
  const navigate = useNavigate();

  // centralizamos o carregamento em um hook reaproveitável
  const { ticket: ticketData, loading } = useTicket(ticket);

  const generatePdf = useCallback(async () => {
    if (!ticketData) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const qrDataUrl = await QRCode.toDataURL(ticketData.code, {
        margin: 0,
        width: 200,
        color: { dark: "#000000", light: "#ffffff" },
      });

      // Header
      doc.setFillColor(28, 56, 95);
      doc.rect(40, 40, 515, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("COMPROVANTE DE AGENDAMENTO", 60, 75);
      doc.setFontSize(11);
      doc.text(ticketData.location, 60, 95);

      // Body
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("Militar:", 60, 140);
      doc.setFontSize(16);
      doc.text(ticketData.name, 140, 140);

      doc.setFontSize(12);
      doc.text("SARAM:", 60, 170);
      doc.setFontSize(16);
      doc.text(ticketData.saram, 140, 170);

      doc.setFontSize(12);
      doc.text("Data:", 60, 200);
      doc.setFontSize(14);
      doc.text(`${ticketData.date} | ${ticketData.time}`, 140, 200);

      doc.setFontSize(12);
      doc.text("Local:", 60, 230);
      doc.setFontSize(12);
      doc.text(ticketData.location, 140, 230);

      // Code and QR
      doc.setFontSize(12);
      doc.text("Código de Validação:", 60, 270);
      doc.setFontSize(14);
      doc.text(ticketData.code, 60, 290);

      doc.addImage(qrDataUrl, "PNG", 380, 150, 150, 150);

      doc.save(`comprovante-${ticketData.saram}-${ticketData.code}.pdf`);
    } catch (err) {
      // fallback: abrir diálogo de impressão

      console.error(err);
      window.print();
    }
  }, [ticketData]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const qrValue = useMemo(() => ticketData?.code ?? "", [ticketData]);

  function goToAppointments() {
    navigate("/app/agendamentos");
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto">
          <PageSkeleton rows={8} />
        </div>
      </Layout>
    );
  }

  if (!ticketData) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goToAppointments}
              className="flex items-center gap-2 text-primary font-bold text-sm"
            >
              <ArrowLeft size={16} />
              Meus Agendamentos
            </button>
          </div>
          <Breadcrumbs items={["Agendamentos", "Bilhete Digital"]} />

          <div className="mt-8 text-center space-y-4">
            <ShieldCheck className="mx-auto text-text-muted" size={48} />
            <h2 className="text-xl font-bold text-text-body">
              Sem agendamento encontrado
            </h2>
            <p className="text-text-muted text-sm">
              Você ainda não possui um agendamento confirmado. Acesse a área de
              agendamentos para reservar uma sessão.
            </p>
            <button
              onClick={() => navigate("/app/agendamentos")}
              onMouseEnter={() => prefetchRoute("/app/agendamentos")}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm"
            >
              Ir para Agendamentos
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-3 py-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col print:hidden">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToAppointments}
            onMouseEnter={() => prefetchRoute("/app/agendamentos")}
            className="flex items-center gap-2 text-primary font-bold text-sm print:hidden"
          >
            <ArrowLeft size={16} />
            Meus Agendamentos
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[color:var(--primary,#1c385f)] rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight">
              TACF-Digital
            </h1>
          </div>
        </div>
        <Breadcrumbs items={["Agendamentos", "Bilhete Digital"]} />
      </div>

      <div className="w-full max-w-2xl bg-bg-card dark:bg-bg-card rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ticket-container print:bg-white print:shadow-none">
        <div className="bg-primary px-4 py-6 sm:px-8 sm:py-8 text-white relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">
                  Documento Oficial
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                COMPROVANTE DE AGENDAMENTO
              </h2>
              <p className="mt-1 text-blue-200/80 font-medium">
                Teste de Avaliação do Condicionamento Físico
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-green-100">
                {ticketData.confirmed ? "Confirmado" : "Agendado"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Militar
              </span>
              <p className="break-words text-xl font-black text-text-body dark:text-text-inverted sm:text-2xl">
                {ticketData.name}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                SARAM
              </span>
              <p className="break-all text-xl font-mono font-semibold text-text-body dark:text-text-inverted sm:text-2xl">
                {ticketData.saram}
              </p>
            </div>

            <div className="space-y-1 col-span-full md:col-span-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Local do Teste
              </span>
              <div className="flex items-start gap-2">
                <MapPin className="text-primary" size={18} />
                <p className="break-words text-base font-mono font-medium text-text-body dark:text-text-muted sm:text-lg">
                  {ticketData.location}
                </p>
              </div>
            </div>

            <div className="space-y-1 col-span-full md:col-span-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Data e Horário
              </span>
              <div className="flex items-start gap-2">
                <Calendar className="text-primary" size={18} />
                <p className="text-base font-bold text-text-body dark:text-text-inverted sm:text-lg">
                  {ticketData.date}{" "}
                  <span className="text-primary font-normal mx-2">|</span>{" "}
                  {ticketData.time}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative py-4">
          <div className="ticket-cutout-left dark:bg-background-dark" />
          <div className="perforated-line" />
          <div className="ticket-cutout-right dark:bg-background-dark" />
        </div>

        <div className="bg-bg-default dark:bg-bg-card/50 p-4 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="flex-shrink-0 rounded-2xl border-2 border-primary/10 bg-bg-card p-3 shadow-sm dark:bg-bg-card">
            <div className="w-32 md:w-36">
              <QR
                value={qrValue}
                size={256}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-primary/70 dark:text-blue-300 uppercase tracking-[0.16em]">
                Código de Validação
              </span>
              <p className="break-all text-lg sm:text-xl font-mono font-bold text-primary dark:text-blue-300 tracking-[0.08em] sm:tracking-[0.2em]">
                {ticketData.code}
              </p>
            </div>

            <div className="w-full bg-primary/5 dark:bg-primary/20 p-4 rounded-xl flex items-start gap-3">
              <Info className="text-primary" size={16} />
              <p className="text-xs text-text-muted leading-relaxed">
                Apresente este código ou QR code no acesso à pista. Tenha em
                mãos sua identidade militar original.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-2xl print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-bold py-3 px-6 rounded-xl print:hidden"
        >
          <Printer size={18} />
          IMPRIMIR
        </button>
        <button
          onClick={generatePdf}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg print:hidden"
        >
          <Download size={18} />
          SALVAR COMO PDF
        </button>
      </div>

      <div className="mt-6 text-center text-text-muted text-sm print:hidden">
        Dúvidas ou problemas com o agendamento?{" "}
        <a href="#" className="text-primary hover:underline">
          Contate o suporte TACF
        </a>
      </div>
    </div>
  );
}
