import supabase, { confirmarAgendamentoRPC } from "@/services/supabase";
import type {
  BookingRow as DBBookingRow,
  Profile as DBProfile,
  SessionRow as DBSessionRow,
} from "@/types";
import {
  fetchExistingSemesterBooking,
  formatDatePtBr,
  formatSessionPeriod,
  getSemesterFromDate,
  translateBookingError,
} from "@/utils/booking";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageSkeleton from "../components/PageSkeleton";
import Layout from "../layout/Layout";

export const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  type LocationState = { bookingId?: string; sessionId?: string };

  type BookingPreview = Pick<
    DBBookingRow,
    | "id"
    | "user_id"
    | "session_id"
    | "status"
    | "test_date"
    | "order_number"
    | "score"
    | "result_details"
  >;

  type SessionPreview = Pick<
    DBSessionRow,
    "id" | "date" | "period" | "max_capacity"
  > & { location_name?: string | null; location_address?: string | null };

  type ProfilePreview = Pick<
    DBProfile,
    "id" | "full_name" | "war_name" | "saram" | "rank" | "sector"
  >;

  const bookingIdFromState = (location.state as LocationState)?.bookingId;
  const sessionIdFromState = (location.state as LocationState)?.sessionId;
  const urlParams = new URLSearchParams(location.search);
  const bookingIdFromQuery = urlParams.get("bookingId");
  const sessionIdFromQuery = urlParams.get("sessionId");

  const bookingId = bookingIdFromState ?? bookingIdFromQuery ?? null;
  const sessionIdInput = sessionIdFromState ?? sessionIdFromQuery ?? null;

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState<BookingPreview | null>(null);
  const [session, setSession] = useState<SessionPreview | null>(null);
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [existingBookingForDate, setExistingBookingForDate] =
    useState<BookingPreview | null>(null);
  const [existingSemesterBooking, setExistingSemesterBooking] =
    useState<BookingPreview | null>(null);
  // ensure analyzer sees usage in all build contexts
  void existingBookingForDate;
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(
    sessionIdInput,
  );

  // helpers imported from utils/booking

  useEffect(() => {
    async function fetchData() {
      if (!bookingId && !sessionIdInput) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let localBooking: BookingPreview | null = null;
        let localSessionId = sessionIdInput;
        let localUserId: string | null = null;

        if (bookingId) {
          const { data: bData, error: bErr } = await supabase
            .from("bookings")
            .select(
              "id, user_id, session_id, status, test_date, order_number, score, result_details",
            )
            .eq("id", bookingId)
            .maybeSingle<BookingPreview>();

          if (bErr || !bData) {
            setBooking(null);
            setSession(null);
            setProfile(null);
            setResolvedSessionId(sessionIdInput);
            return;
          }

          localBooking = bData;
          localSessionId = bData.session_id;
          localUserId = bData.user_id;
          setBooking(bData);
        } else {
          setBooking(null);
        }

        if (!localUserId) {
          const userResp = await supabase.auth.getUser();
          localUserId = userResp.data.user?.id ?? null;
        }

        const sessionPromise = localSessionId
          ? supabase
              .from("sessions")
              .select(
                "id, date, period, max_capacity, location:locations(name, address)",
              )
              .eq("id", localSessionId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const profilePromise = localUserId
          ? supabase
              .from("profiles")
              .select("id, full_name, war_name, saram, rank, sector")
              .eq("id", localUserId)
              .maybeSingle<ProfilePreview>()
          : Promise.resolve({ data: null });

        const [{ data: sData }, { data: pData }] = await Promise.all([
          sessionPromise,
          profilePromise,
        ]);

        if (sData) {
          // prefer nested location payload when present
          let locName: string | null = null;
          let locAddress: string | null = null;

          const locRaw = sData.location as
            | { name?: string | null; address?: string | null }[]
            | { name?: string | null; address?: string | null }
            | null;

          const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;

          if (loc && (loc.name || loc.address)) {
            locName = loc.name ?? null;
            locAddress = loc.address ?? null;
          } else if ((sData as { location_id?: string | null }).location_id) {
            // fallback: explicitly fetch from locations table by id
            try {
              const sessionLocationId = (
                sData as { location_id?: string | null }
              ).location_id!;
              const { data: locationRow, error: locationErr } = await supabase
                .from("locations")
                .select("name, address")
                .eq("id", sessionLocationId)
                .maybeSingle();

              if (!locationErr && locationRow) {
                locName = locationRow.name ?? null;
                locAddress = locationRow.address ?? null;
              }
            } catch {
              // ignore location fetch errors and keep nulls
            }
          }

          const enriched: SessionPreview = {
            id: sData.id,
            date: sData.date,
            period: sData.period,
            max_capacity: sData.max_capacity,
            location_name: locName,
            location_address: locAddress,
          };
          setSession(enriched);
          setResolvedSessionId(sData.id);
          // check if user already has a booking on this session date
          if (localUserId) {
            try {
              const { data: existing, error: existingErr } = await supabase
                .from("bookings")
                .select(
                  "id, user_id, session_id, status, test_date, order_number",
                )
                .eq("user_id", localUserId)
                .eq("test_date", sData.date)
                .maybeSingle<BookingPreview>();

              if (!existingErr && existing) {
                setExistingBookingForDate(existing as BookingPreview);
              } else {
                setExistingBookingForDate(null);
              }
            } catch {
              setExistingBookingForDate(null);
            }
          } else {
            setExistingBookingForDate(null);
          }
        } else if (localSessionId) {
          setSession(null);
          setResolvedSessionId(localSessionId);
        } else {
          setSession(null);
          setResolvedSessionId(null);
        }

        setProfile(pData ?? null);

        if (!localBooking) {
          setBooking(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [bookingId, sessionIdInput]);

  function handleBack() {
    // Always return to the agendamentos list instead of relying on history
    navigate("/app/agendamentos");
  }

  async function handleConfirm() {
    if (!resolvedSessionId) {
      toast.error("Sessão inválida para confirmação.");
      return;
    }

    setConfirming(true);
    try {
      const userResp = await supabase.auth.getUser();
      const userId = userResp.data.user?.id;

      if (!userId) {
        toast.error("Usuário não autenticado.");
        return;
      }

      // Pré-validação: verificar se o usuário já possui um agendamento
      // confirmado no mesmo semestre da sessão, para evitar a chamada RPC
      // que retornaria erro do servidor.
      try {
        if (session?.date) {
          const semester = getSemesterFromDate(session.date!);
          if (semester) {
            const existing = await fetchExistingSemesterBooking(
              userId,
              semester,
            );
            if (existing && existing.id !== booking?.id) {
              setExistingSemesterBooking(existing as unknown as BookingPreview);
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

      const result = await confirmarAgendamentoRPC(userId, resolvedSessionId);

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
          sessionId: resolvedSessionId,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao confirmar.";
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  }

  if (!bookingId && !sessionIdInput) {
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
            <h2 className="mb-5 text-2xl font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-3xl">
              Revisar Agendamento
            </h2>

            {/* Stepper — etapa 2 ativa */}
            <div className="sm:hidden">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Seleção
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-primary">
                    Confirmação
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
                    3
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Finalizado
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center gap-4 sm:flex">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  <CheckCircle size={16} />
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  Seleção
                </span>
              </div>
              <div className="h-px w-12 bg-emerald-200" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  2
                </div>
                <span className="text-sm font-bold text-primary">
                  Confirmação
                </span>
              </div>
              <div className="h-px w-12 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
                  3
                </div>
                <span className="text-sm font-semibold text-slate-400">
                  Finalizado
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <div className="p-5 sm:p-8 md:p-10">
              {loading ? (
                <PageSkeleton rows={6} />
              ) : (
                <div className="space-y-8">
                  <section>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                      Militar
                    </label>
                    <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4">
                      <div className="text-primary/80 text-3xl">
                        <CheckCircle size={28} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-900 sm:text-lg">
                          {profile?.war_name ?? profile?.full_name ?? "--"}
                        </p>
                        <p className="text-sm text-slate-600 break-words">
                          SARAM: {profile?.saram ?? "--"} • Posto/Graduação:{" "}
                          {profile?.rank ?? "--"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                      Local da Avaliação
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="text-primary" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900 sm:text-lg">
                          {session?.location_name ?? "Local não informado"}
                        </p>
                        {session?.location_address && (
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {session.location_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                        Data e Hora
                      </label>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary/70" size={18} />
                        <span className="text-base font-bold text-slate-900 sm:text-lg">
                          {session?.date ? formatDatePtBr(session.date) : "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Clock className="text-primary/70" size={18} />
                        <span className="text-base font-bold text-primary sm:text-lg">
                          {session?.period
                            ? formatSessionPeriod(session.period)
                            : "--"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                        Requisitos
                      </label>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Uniforme de TAF completo
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Documento de Identidade Original
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Atestado Médico (se aplicável)
                        </li>
                      </ul>
                    </div>
                  </div>

                  {booking?.order_number && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700">
                      Bilhete gerado: <strong>{booking.order_number}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              {existingBookingForDate &&
                existingBookingForDate.id !== booking?.id && (
                  <div className="w-full mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Você já possui um agendamento nesta data (
                    {formatDatePtBr(existingBookingForDate.test_date ?? "")}).
                    Para agendar outra data, cancele primeiro o agendamento
                    existente.
                  </div>
                )}
              {existingSemesterBooking &&
                existingSemesterBooking.id !== booking?.id && (
                  <div className="w-full mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Você já possui um agendamento neste semestre (
                    {formatDatePtBr(existingSemesterBooking.test_date ?? "")}).
                    Cancele o agendamento existente para marcar outro.
                  </div>
                )}
              <button
                onClick={handleBack}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar e Editar
              </button>
              <button
                onClick={handleConfirm}
                onMouseEnter={() => prefetchRoute("/app/ticket")}
                disabled={
                  loading ||
                  confirming ||
                  !resolvedSessionId ||
                  !!(
                    existingBookingForDate &&
                    existingBookingForDate.id !== booking?.id
                  )
                }
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-sm font-bold uppercase tracking-widest">
                  {confirming ? "Confirmando..." : "Confirmar Agendamento"}
                </span>
                <CheckCircle size={18} />
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-slate-500">
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
