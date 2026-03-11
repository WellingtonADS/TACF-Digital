/**
 * @page DigitalTicket
 * @description Geração e visualização de bilhete digital (QR/PDF).
 * @path src/pages/DigitalTicket.tsx
 */



import Layout from "@/components/layout/Layout";
import type { TicketData } from "@/hooks/useTicket";
import useTicket from "@/hooks/useTicket";
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Download,
  Info,
  MapPin,
  Printer,
  ShieldCheck,
} from "@/icons";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useCallback, useMemo, useState } from "react";
import QR from "react-qr-code";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Breadcrumbs from "../components/Breadcrumbs";
import FullPageLoading from "../components/FullPageLoading";

// no longer need formatTicketDate or route state types; they live in the hook

export default function DigitalTicket({ ticket }: { ticket?: TicketData }) {
  const navigate = useNavigate();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // centralizamos o carregamento em um hook reaproveitável
  const { ticket: ticketData, loading } = useTicket(ticket);

  const generatePdf = useCallback(async () => {
    if (!ticketData) return;
    setIsGeneratingPdf(true);
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
      toast.success("Comprovante salvo em PDF.");
    } catch (err) {
      // fallback: abrir diálogo de impressão

      console.error(err);
      toast.error("Falha ao gerar PDF. Abrindo impressão como alternativa.");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [ticketData]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const qrValue = useMemo(() => ticketData?.code ?? "", [ticketData]);

  const copyValidationCode = useCallback(async () => {
    if (!ticketData?.code) return;

    try {
      await navigator.clipboard.writeText(ticketData.code);
      setCopiedCode(true);
      toast.success("Código de validação copiado.");

      window.setTimeout(() => {
        setCopiedCode(false);
      }, 1800);
    } catch {
      toast.error("Não foi possível copiar o código neste dispositivo.");
    }
  }, [ticketData?.code]);

  function goToAppointments() {
    navigate("/app/agendamentos");
  }

  if (loading) {
    return (
      <Layout>
        <FullPageLoading
          message="Carregando bilhete digital..."
          description="Buscando os dados do seu agendamento confirmado."
        />
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
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={goToAppointments}
            onMouseEnter={() => prefetchRoute("/app/agendamentos")}
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <ArrowLeft size={16} />
            Meus Agendamentos
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-semibold text-text-muted">
            <ShieldCheck size={14} className="text-primary" />
            Bilhete Digital
          </div>
        </div>

        <Breadcrumbs items={["Agendamentos", "Bilhete Digital"]} />

        <section className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm ticket-container print:shadow-none">
          <header className="bg-primary px-5 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/85">
                  Comprovante de Agendamento
                </p>
                <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                  Teste de Avaliação do Condicionamento Físico
                </h1>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-500/20 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-green-50">
                  {ticketData.confirmed ? "Confirmado" : "Agendado"}
                </span>
              </div>
            </div>
          </header>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className="p-5 sm:p-8">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
                    Militar
                  </p>
                  <p className="mt-1 break-words text-2xl font-black text-text-body">
                    {ticketData.name}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
                    SARAM
                  </p>
                  <p className="mt-1 break-all font-mono text-xl font-bold text-text-body">
                    {ticketData.saram}
                  </p>
                </div>

                <div className="rounded-xl border border-border-default bg-bg-default p-4">
                  <div className="mb-1 inline-flex items-center gap-2 text-primary">
                    <MapPin size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                      Local
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text-body">
                    {ticketData.location}
                  </p>
                </div>

                <div className="rounded-xl border border-border-default bg-bg-default p-4">
                  <div className="mb-1 inline-flex items-center gap-2 text-primary">
                    <Clock3 size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                      Data e Horário
                    </span>
                  </div>
                  <p className="text-sm font-bold text-text-body">
                    {ticketData.date}
                    <span className="mx-2 text-primary/70">|</span>
                    {ticketData.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border-default bg-bg-default p-5 sm:p-8 lg:border-t-0 lg:border-l">
              <div className="rounded-xl border border-primary/15 bg-bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/70">
                  Código de Validação
                </p>
                <p className="mt-2 break-all font-mono text-lg font-bold tracking-[0.08em] text-primary">
                  {ticketData.code}
                </p>
              </div>

              <div className="mt-4 flex justify-center rounded-xl border border-primary/10 bg-bg-card p-4">
                <div className="w-40 sm:w-44">
                  <QR
                    value={qrValue}
                    size={256}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </div>

              <button
                onClick={copyValidationCode}
                className="mt-4 w-full rounded-xl border border-primary/20 bg-bg-card px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  {copiedCode ? "CODIGO COPIADO" : "COPIAR CODIGO DE VALIDACAO"}
                </span>
              </button>

              <div className="mt-4 rounded-xl bg-primary/5 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-primary">
                  <Info size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    Instruções
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  Apresente o QR code ou o código no acesso à pista e leve sua
                  identidade militar original.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl border-2 border-primary/20 px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Printer size={18} />
              IMPRIMIR
            </span>
          </button>
          <button
            onClick={generatePdf}
            disabled={isGeneratingPdf}
            className="flex-1 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Download size={18} />
              {isGeneratingPdf ? "GERANDO PDF..." : "SALVAR COMO PDF"}
            </span>
          </button>
        </div>

        <div className="mt-5 text-center text-sm text-text-muted print:hidden">
          Dúvidas sobre o agendamento?{" "}
          <button
            onClick={() => navigate("/app/documentos")}
            onMouseEnter={() => prefetchRoute("/app/documentos")}
            className="font-semibold text-primary hover:underline"
          >
            Consulte os documentos e orientações
          </button>
          .
        </div>
      </div>
    </Layout>
  );
}
