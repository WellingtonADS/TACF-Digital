/**
 * @page AppointmentConfirmation
 * @description Confirmação e detalhes de agendamento.
 * @path src/pages/AppointmentConfirmation.tsx
 */

import Layout from "@/components/layout/Layout";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from "@/icons";
import {
  fetchAppointmentContext,
  type AppointmentBookingPreview,
  type AppointmentProfilePreview,
  type AppointmentSessionPreview,
} from "@/services/bookings";
import { confirmarAgendamentoRPC, supabase } from "@/services/supabase";
import {
  fetchExistingSemesterBooking,
  formatSessionPeriod,
  translateBookingError,
} from "@/utils/booking";
import {
  formatDatePtBr,
  getMilitaryBookingRuleMessage,
  getSemesterFromDate,
} from "@/utils/date";
import { prefetchRoute } from "@/router/prefetchRoutes";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageSkeleton from "../components/PageSkeleton";

export const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const localRoteamento = useLocation();
  type EstadoRoteamento = { bookingId?: string; sessionId?: string };

  type PreviaAgendamento = AppointmentBookingPreview;
  type PreviaSessao = AppointmentSessionPreview;
  type PreviaPerfil = AppointmentProfilePreview;

  const bookingIdState = (localRoteamento.state as EstadoRoteamento)?.bookingId;
  const sessionIdState = (localRoteamento.state as EstadoRoteamento)?.sessionId;
  const parametrosUrl = new URLSearchParams(localRoteamento.search);
  const bookingIdQuery = parametrosUrl.get("bookingId");
  const sessionIdQuery = parametrosUrl.get("sessionId");

  const bookingId = bookingIdState ?? bookingIdQuery ?? null;
  const sessaoIdEntrada = sessionIdState ?? sessionIdQuery ?? null;

  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [agendamento, setAgendamento] = useState<PreviaAgendamento | null>(null);
  const [sessao, setSessao] = useState<PreviaSessao | null>(null);
  const [perfil, setPerfil] = useState<PreviaPerfil | null>(null);
  const [agendamentoExistenteNaData, setAgendamentoExistenteNaData] =
    useState<PreviaAgendamento | null>(null);
  const [agendamentoExistenteSemestre, setAgendamentoExistenteSemestre] =
    useState<PreviaAgendamento | null>(null);
  // Garante que o analisador reconheça o uso em todos os contextos de build.
  void agendamentoExistenteNaData;
  const [sessaoIdResolvida, setSessaoIdResolvida] = useState<string | null>(
    sessaoIdEntrada,
  );

  const mensagemRegraAgendamento = sessao?.date
    ? getMilitaryBookingRuleMessage(sessao.date)
    : null;

  // Auxiliares importados de `utils/booking`.

  useEffect(() => {
    async function fetchData() {
      if (!bookingId && !sessaoIdEntrada) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      try {
        const respostaUsuario = await supabase.auth.getUser();
        const userId = respostaUsuario.data.user?.id ?? null;
        const data = await fetchAppointmentContext({
          bookingId,
          sessionIdInput: sessaoIdEntrada,
          userId,
        });

        setAgendamento(data.booking as PreviaAgendamento | null);
        setSessao(data.session as PreviaSessao | null);
        setPerfil(data.profile as PreviaPerfil | null);
        setAgendamentoExistenteNaData(
          data.existingBookingForDate as PreviaAgendamento | null,
        );
        setSessaoIdResolvida(data.resolvedSessionId);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }

    fetchData();
  }, [bookingId, sessaoIdEntrada]);

  function voltarParaAgendamentos() {
    // Sempre volta para a lista de agendamentos, sem depender do histórico.
    navigate("/app/agendamentos");
  }

  async function confirmarAgendamento() {
    if (!sessaoIdResolvida) {
      toast.error("Sessão inválida para confirmação.");
      return;
    }

    setConfirmando(true);
    try {
      const respostaUsuario = await supabase.auth.getUser();
      const userId = respostaUsuario.data.user?.id;

      if (!userId) {
        toast.error("Usuário não autenticado.");
        return;
      }

      if (mensagemRegraAgendamento) {
        toast.error(mensagemRegraAgendamento);
        return;
      }

      // Pré-validação: verificar se o usuário já possui um agendamento
      // confirmado no mesmo semestre da sessão, para evitar a chamada RPC
      // que retornaria erro do servidor.
      try {
        if (sessao?.date) {
          const semestre = getSemesterFromDate(sessao.date!);
          if (semestre) {
            const agendamentoExistente =
              await fetchExistingSemesterBooking(semestre);
            if (agendamentoExistente && agendamentoExistente.id !== agendamento?.id) {
              setAgendamentoExistenteSemestre(
                agendamentoExistente as unknown as PreviaAgendamento,
              );
              toast.error(
                "Você já possui um agendamento neste semestre. Cancele o agendamento existente para marcar outro.",
              );
              return;
            }
          }
        }
      } catch {
        // falhar silenciosamente na pré-validação e deixar a RPC tratar
      }

      const result = await confirmarAgendamentoRPC(userId, sessaoIdResolvida);

      if (!result.success || !result.booking_id) {
        const translated = translateBookingError(result.error);
        toast.error(
          translated ??
            result.error ??
            "Não foi possível confirmar o agendamento.",
        );
        return;
      }

      toast.success("Agendamento confirmado com sucesso.");
      navigate("/app/ticket", {
        state: {
          bookingId: result.booking_id,
          orderNumber: result.order_number ?? null,
          sessionId: sessaoIdResolvida,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao confirmar.";
      toast.error(msg);
    } finally {
      setConfirmando(false);
    }
  }

  if (!bookingId && !sessaoIdEntrada) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">Agendamento não encontrado.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div className="mx-auto max-w-2xl px-3 sm:px-0">
          <div className="mb-8 text-center sm:mb-10">
            <h2 className="mb-5 text-2xl font-bold text-text-body sm:mb-6 sm:text-3xl">
              Revisar Agendamento
            </h2>

            {/* Etapas do fluxo: etapa 2 ativa */}
            <div className="sm:hidden">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-sm font-bold text-primary-foreground">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-[11px] font-semibold text-success">
                    Seleção
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-primary">
                    Confirmação
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-default text-sm font-bold text-text-muted">
                    3
                  </div>
                  <span className="text-[11px] font-semibold text-text-muted">
                    Finalizado
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center gap-4 sm:flex">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-sm font-bold text-primary-foreground">
                  <CheckCircle size={16} />
                </div>
                <span className="text-sm font-semibold text-success">
                  Seleção
                </span>
              </div>
              <div className="h-px w-12 bg-success/20" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </div>
                <span className="text-sm font-bold text-primary">
                  Confirmação
                </span>
              </div>
              <div className="h-px w-12 bg-border-default" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-default text-sm font-bold text-text-muted">
                  3
                </div>
                <span className="text-sm font-semibold text-text-muted">
                  Finalizado
                </span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-xl shadow-2xl overflow-hidden border border-border-default relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <div className="p-5 sm:p-8 md:p-10">
              {carregando ? (
                <PageSkeleton rows={6} />
              ) : (
                <div className="space-y-8">
                  <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                      Militar
                    </label>
                    <div className="flex items-start gap-4 rounded-lg bg-bg-default p-4">
                      <div className="text-primary/80 text-3xl">
                        <CheckCircle size={28} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-text-body sm:text-lg">
                          {perfil?.war_name ?? perfil?.full_name ?? "--"}
                        </p>
                        <p className="text-sm text-text-muted break-words">
                          SARAM: {perfil?.saram ?? "--"} • Posto/Graduação:{" "}
                          {perfil?.rank ?? "--"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                      Local da Avaliação
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="text-primary" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-text-body sm:text-lg">
                          {sessao?.location_name ?? "Local não informado"}
                        </p>
                        {sessao?.location_address && (
                          <p className="mt-1 break-words text-sm text-text-muted">
                            {sessao.location_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-default">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                        Data e Hora
                      </label>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary/70" size={18} />
                        <span className="text-base font-bold text-text-body sm:text-lg">
                          {sessao?.date ? formatDatePtBr(sessao.date) : "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Clock className="text-primary/70" size={18} />
                        <span className="text-base font-bold text-primary sm:text-lg">
                          {sessao?.period
                            ? formatSessionPeriod(sessao.period)
                            : "--"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                        Requisitos
                      </label>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-text-body">
                          <CheckCircle className="text-success" size={16} />{" "}
                          Uniforme de TAF completo
                        </li>
                        <li className="flex items-center gap-2 text-sm text-text-body">
                          <CheckCircle className="text-success" size={16} />{" "}
                          Documento de Identidade Original
                        </li>
                        <li className="flex items-center gap-2 text-sm text-text-body">
                          <CheckCircle className="text-success" size={16} />{" "}
                          Atestado Médico (se aplicável)
                        </li>
                      </ul>
                    </div>
                  </div>

                  {agendamento?.order_number && (
                    <div className="mt-4 rounded-lg border border-success/20 bg-success/10 p-4 text-success">
                      Bilhete gerado: <strong>{agendamento.order_number}</strong>
                    </div>
                  )}

                  {mensagemRegraAgendamento && (
                    <div className="rounded-lg border border-alert/20 bg-alert/10 p-4 text-sm text-alert">
                      {mensagemRegraAgendamento}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-bg-default p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-default">
              {agendamentoExistenteNaData &&
                agendamentoExistenteNaData.id !== agendamento?.id && (
                  <div className="mb-3 w-full rounded-lg border border-alert/20 bg-alert/10 p-3 text-sm text-alert">
                    Você já possui um agendamento nesta data (
                    {formatDatePtBr(agendamentoExistenteNaData.test_date ?? "")}).
                    Para agendar outra data, cancele primeiro o agendamento
                    existente.
                  </div>
                )}
              {agendamentoExistenteSemestre &&
                agendamentoExistenteSemestre.id !== agendamento?.id && (
                  <div className="mb-3 w-full rounded-lg border border-alert/20 bg-alert/10 p-3 text-sm text-alert">
                    Você já possui um agendamento neste semestre (
                    {formatDatePtBr(agendamentoExistenteSemestre.test_date ?? "")}).
                    Cancele o agendamento existente para marcar outro.
                  </div>
                )}
              <button
                onClick={voltarParaAgendamentos}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-text-muted hover:text-text-body transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar e Editar
              </button>
              <button
                onClick={confirmarAgendamento}
                onMouseEnter={() => prefetchRoute("/app/ticket")}
                disabled={
                  carregando ||
                  confirmando ||
                  !sessaoIdResolvida ||
                  !!mensagemRegraAgendamento ||
                  !!(
                    agendamentoExistenteNaData &&
                    agendamentoExistenteNaData.id !== agendamento?.id
                  )
                }
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-sm font-bold uppercase tracking-widest">
                  {confirmando ? "Confirmando..." : "Confirmar Agendamento"}
                </span>
                <CheckCircle size={18} />
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-text-muted">
            Problemas com o agendamento?{" "}
            <a className="text-primary font-semibold underline" href="#">
              Contatar a Seção de Preparo
            </a>
            .
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default AppointmentConfirmation;
