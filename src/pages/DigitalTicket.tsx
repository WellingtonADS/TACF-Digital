import supabase from "@/services/supabase";
import { jsPDF } from "jspdf";
import {
  Calendar,
  Download,
  Info,
  MapPin,
  Printer,
  ShieldCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import QR from "react-qr-code";
import { useLocation, useNavigate } from "react-router-dom";
import PageSkeleton from "../components/PageSkeleton";
import Layout from "../layout/Layout";

type TicketData = {
  name: string;
  saram: string;
  location: string;
  date: string;
  time: string;
  code: string;
  confirmed?: boolean;
};

type TicketRouteState = {
  bookingId?: string;
  orderNumber?: string | null;
  sessionId?: string;
};

function formatTicketDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "")
    .toUpperCase();
}

export default function DigitalTicket({ ticket }: { ticket?: TicketData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as TicketRouteState | null) ?? null;

  const [ticketData, setTicketData] = useState<TicketData | null>(
    ticket ?? null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFromBooking() {
      setLoading(true);
      try {
        const bookingId = routeState?.bookingId;

        // Se não há bookingId e há ticket prop, usa o ticket prop
        if (!bookingId && ticket) {
          setTicketData({
            ...ticket,
            code: routeState?.orderNumber ?? ticket.code,
            confirmed: true,
          });
          return;
        }

        let resolvedBookingId = bookingId;

        // Sem bookingId no state → tenta carregar o último agendamento do usuário
        if (!resolvedBookingId) {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData?.user?.id;
          if (!uid) return;

          const { data: latestBooking } = await supabase
            .from("bookings")
            .select("id, order_number")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!latestBooking) return; // nenhum agendamento encontrado
          resolvedBookingId = latestBooking.id;
        }

        const { data: bookingData } = await supabase
          .from("bookings")
          .select("id, user_id, session_id, order_number, status")
          .eq("id", resolvedBookingId)
          .maybeSingle();

        if (!bookingData || cancelled) return;

        const [sessionResp, profileResp] = await Promise.all([
          supabase
            .from("sessions")
            .select("id, date, period, location:locations(name)")
            .eq("id", bookingData.session_id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("id, war_name, full_name, saram")
            .eq("id", bookingData.user_id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const sessionData = sessionResp.data;
        const profileData = profileResp.data;

        const locRaw = sessionData?.location as
          | { name?: string | null }[]
          | { name?: string | null }
          | null
          | undefined;
        const locName = Array.isArray(locRaw)
          ? (locRaw[0]?.name ?? null)
          : (locRaw?.name ?? null);

        setTicketData((prev) => ({
          ...(prev ?? {}),
          name:
            profileData?.war_name ?? profileData?.full_name ?? prev?.name ?? "",
          saram: profileData?.saram ?? prev?.saram ?? "",
          location: locName ?? prev?.location ?? "",
          date: sessionData?.date
            ? formatTicketDate(sessionData.date)
            : (prev?.date ?? ""),
          time: sessionData?.period ?? prev?.time ?? "",
          code:
            bookingData.order_number ??
            routeState?.orderNumber ??
            prev?.code ??
            "",
          confirmed: bookingData.status === "confirmed",
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFromBooking();

    return () => {
      cancelled = true;
    };
  }, [routeState?.bookingId, routeState?.orderNumber, ticket]);

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
        <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
          <ShieldCheck className="mx-auto text-slate-300" size={48} />
          <h2 className="text-xl font-bold text-slate-700">
            Sem agendamento encontrado
          </h2>
          <p className="text-slate-500 text-sm">
            Você ainda não possui um agendamento confirmado. Acesse a área de
            agendamentos para reservar uma sessão.
          </p>
          <button
            onClick={() => navigate("/app/agendamentos")}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm"
          >
            Ir para Agendamentos
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 flex flex-col items-center">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[color:var(--primary,#1c385f)] rounded-lg flex items-center justify-center text-white">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-xl font-bold text-primary tracking-tight">
          TACF-Digital
        </h1>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ticket-container">
        <div className="bg-primary px-8 py-8 text-white relative">
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

        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Militar
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {ticketData.name}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                SARAM
              </span>
              <p className="text-2xl font-mono font-semibold text-slate-900 dark:text-white">
                {ticketData.saram}
              </p>
            </div>

            <div className="space-y-1 col-span-full md:col-span-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Local do Teste
              </span>
              <div className="flex items-start gap-2">
                <MapPin className="text-primary" size={18} />
                <p className="text-lg font-mono font-medium text-slate-700 dark:text-slate-300">
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
                <p className="text-lg font-bold text-slate-900 dark:text-white">
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

        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-900 border-2 border-primary/10 rounded-2xl shadow-sm">
            <div className="w-32 h-32 md:w-36 md:h-36 bg-white p-2">
              <QR value={qrValue} size={128} />
            </div>
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                Código de Validação
              </span>
              <p className="text-xl font-mono font-bold text-primary tracking-[0.25em]">
                {ticketData.code}
              </p>
            </div>

            <div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-xl inline-flex items-center gap-3">
              <Info className="text-primary" size={16} />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Apresente este código ou QR code no acesso à pista. Tenha em
                mãos sua identidade militar original.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-bold py-3 px-6 rounded-xl"
        >
          <Printer size={18} />
          IMPRIMIR
        </button>
        <button
          onClick={generatePdf}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg"
        >
          <Download size={18} />
          SALVAR COMO PDF
        </button>
      </div>

      <div className="mt-6 text-center text-slate-500 text-sm">
        Dúvidas ou problemas com o agendamento?{" "}
        <a href="#" className="text-primary hover:underline">
          Contate o suporte TACF
        </a>
      </div>
    </div>
  );
}
