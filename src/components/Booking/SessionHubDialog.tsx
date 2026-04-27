import Dialog from "@/components/Dialog";
import AppIcon from "@/components/atomic/AppIcon";
import useAuth from "@/hooks/useAuth";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  Edit2,
  FileDown,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  UserCheck,
  XCircle,
} from "@/icons";
import {
  closeSessionWithChecklist,
  fetchSessionBookingsWithProfiles,
  fetchSessionById,
  fetchSessionClosureChecklist,
  updateBookingResult,
  updateSession,
  type SessionClosureChecklist,
  type SessionInfo,
} from "@/services/sessions";
import type { BookingRow, Profile } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import {
  buildBookingResultPayload,
  getBookingResultStatus,
  parseBookingResult,
  type BookingResultStatus,
} from "@/utils/bookingResults";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
import { generateSessionFinalReportPdf } from "@/utils/pdf/generateSessionFinalReport";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProfileLookup = Pick<
  Profile,
  "id" | "full_name" | "war_name" | "saram" | "rank" | "email"
>;

type BookingWithProfile = BookingRow & {
  full_name: string | null;
  war_name: string | null;
  saram: string | null;
  rank: string | null;
  email: string | null;
};

type SessionHubMode = "manage" | "view";

type ResultDraft = {
  bookingId: string;
  corrida: string;
  flexao: string;
  abdominal: string;
  resultStatus: BookingResultStatus;
};

function buildDraft(booking: BookingWithProfile): ResultDraft {
  const parsed = parseBookingResult(booking.result_details);

  return {
    bookingId: booking.id,
    corrida: parsed?.corrida ?? "",
    flexao: parsed?.flexao ?? "",
    abdominal: parsed?.abdominal ?? "",
    resultStatus: parsed?.result_status ?? "apto",
  };
}

function resultLabel(status: BookingResultStatus | null): string {
  if (status === "apto") return "Apto";
  if (status === "inapto") return "Inapto";
  return "Pendente";
}

function resultBadgeClass(status: BookingResultStatus | null): string {
  if (status === "apto") {
    return "border border-success/35 bg-success/15 text-success";
  }

  if (status === "inapto") {
    return "border border-error/35 bg-error/15 text-error";
  }

  return "border border-alert/40 bg-alert/18 text-alert";
}

export default function SessionHubDialog({
  open,
  sessionId,
  onClose,
  onSessionUpdated,
}: {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  onSessionUpdated: () => Promise<void> | void;
}) {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.role === "coordinator";

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [checklist, setChecklist] = useState<SessionClosureChecklist | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [reopeningSession, setReopeningSession] = useState(false);
  const [resultDraft, setResultDraft] = useState<ResultDraft | null>(null);
  const [currentBookingIndex, setCurrentBookingIndex] = useState<number | null>(
    null,
  );
  const [finalizationDialogOpen, setFinalizationDialogOpen] = useState(false);

  const mode: SessionHubMode = session?.status === "open" ? "manage" : "view";

  const loadSession = useCallback(async () => {
    if (!open || !sessionId) {
      return;
    }

    setLoading(true);
    try {
      const sessionData = await fetchSessionById(sessionId);
      if (!sessionData) {
        throw new Error("Sessao nao encontrada.");
      }

      const { bookings: bookingsData, profilesById } =
        await fetchSessionBookingsWithProfiles(sessionId);
      const checklistData = await fetchSessionClosureChecklist(sessionId);

      const enriched = (bookingsData as BookingRow[]).map((booking) => {
        const profileData = profilesById.get(booking.user_id) as
          | ProfileLookup
          | undefined;

        return {
          ...booking,
          full_name: profileData?.full_name ?? null,
          war_name: profileData?.war_name ?? null,
          saram: profileData?.saram ?? null,
          rank: profileData?.rank ?? null,
          email: profileData?.email ?? null,
        } satisfies BookingWithProfile;
      });

      setSession(sessionData);
      setBookings(enriched);
      setChecklist(checklistData);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel carregar a sessao selecionada.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose, open, sessionId]);

  useEffect(() => {
    if (!open) {
      setResultDraft(null);
      setCurrentBookingIndex(null);
      setFinalizationDialogOpen(false);
      return;
    }

    void loadSession();
  }, [loadSession, open]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "cancelado"),
    [bookings],
  );

  const summary = useMemo(() => {
    return activeBookings.reduce(
      (acc, booking) => {
        const resultStatus = getBookingResultStatus(booking.result_details);
        if (resultStatus === "apto") acc.apto += 1;
        else if (resultStatus === "inapto") acc.inapto += 1;
        else acc.pendente += 1;
        return acc;
      },
      { apto: 0, inapto: 0, pendente: 0 },
    );
  }, [activeBookings]);

  const currentResultBooking = useMemo(() => {
    if (!resultDraft) {
      return null;
    }

    return (
      activeBookings.find((booking) => booking.id === resultDraft.bookingId) ??
      null
    );
  }, [activeBookings, resultDraft]);

  const hasNextBooking =
    typeof currentBookingIndex === "number" &&
    currentBookingIndex >= 0 &&
    currentBookingIndex < activeBookings.length - 1;

  async function refreshAll() {
    await loadSession();
    await onSessionUpdated();
  }

  async function handleSaveResult(andNext = false) {
    if (!resultDraft) {
      return;
    }

    setSavingResult(true);
    try {
      const payload = buildBookingResultPayload({
        result_status: resultDraft.resultStatus,
        corrida: resultDraft.corrida,
        flexao: resultDraft.flexao,
        abdominal: resultDraft.abdominal,
      });

      await updateBookingResult(resultDraft.bookingId, payload);

      setBookings((current) =>
        current.map((booking) =>
          booking.id === resultDraft.bookingId
            ? { ...booking, result_details: payload }
            : booking,
        ),
      );

      toast.success("Lançamento salvo.");

      if (
        andNext &&
        hasNextBooking &&
        typeof currentBookingIndex === "number"
      ) {
        const nextBooking = activeBookings[currentBookingIndex + 1];
        if (nextBooking) {
          setCurrentBookingIndex(currentBookingIndex + 1);
          setResultDraft(buildDraft(nextBooking));
          await onSessionUpdated();
          return;
        }
      }

      setResultDraft(null);
      setCurrentBookingIndex(null);
      await refreshAll();
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel salvar o lancamento.");
    } finally {
      setSavingResult(false);
    }
  }

  async function handleFinalizeSession() {
    if (!sessionId || !canManage || mode !== "manage") {
      return;
    }

    setClosingSession(true);
    try {
      const closureResult = await closeSessionWithChecklist(sessionId);
      const nextChecklist = closureResult.checklist;
      setChecklist(nextChecklist);
      generateSessionFinalReportPdf({
        session: session
          ? {
              id: session.id,
              date: session.date,
              period: session.period,
              max_capacity: session.max_capacity,
              capacity: session.capacity,
              location_id: session.location_id,
              location_name: session.location_name,
              coordinator_id: session.coordinator_id,
              status: closureResult.session_status ?? "completed",
            }
          : {
              id: sessionId,
              date: new Date().toISOString().slice(0, 10),
              period: "manha",
              max_capacity: null,
              capacity: null,
              location_id: null,
              location_name: null,
              coordinator_id: null,
              status: closureResult.session_status ?? "completed",
            },
        bookings,
        checklist: nextChecklist,
      });
      toast.success("Sessao concluida com sucesso.");
      setFinalizationDialogOpen(false);
      await refreshAll();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir a sessao.",
      );
    } finally {
      setClosingSession(false);
    }
  }

  async function handleReopenSession() {
    if (!sessionId || !canManage || session?.status !== "closed") {
      return;
    }

    setReopeningSession(true);
    try {
      await updateSession(sessionId, { status: "open" });
      toast.success("Sessao reaberta.");
      await refreshAll();
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel reabrir a sessao.");
    } finally {
      setReopeningSession(false);
    }
  }

  async function handlePrintList() {
    if (!session) {
      return;
    }

    setPrinting(true);
    try {
      generateAttendanceListPdf({
        session,
        bookings: bookings.map((booking) => ({
          ...booking,
          order_number: booking.order_number ?? null,
          attendance_confirmed: booking.attendance_confirmed ?? null,
        })),
      });
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel gerar o PDF.");
    } finally {
      setPrinting(false);
    }
  }

  function handlePrintFinalReport() {
    if (!session) {
      return;
    }

    try {
      generateSessionFinalReportPdf({
        session,
        bookings,
        checklist,
      });
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel gerar o relatório final.");
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={mode === "manage" ? "Gestão da Turma" : "Consulta da Turma"}
        description={
          mode === "manage"
            ? undefined
            : "Consulta somente leitura para sessões fechadas ou concluídas."
        }
        widthClassName="max-w-[860px]"
      >
        {loading || !session ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Carregando sessao...
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border-default bg-bg-default px-3 py-2.5">
              <div className="grid gap-2 lg:grid-cols-[1.25fr_1.05fr_0.75fr_auto] lg:items-center">
                <article className="flex min-w-0 items-center gap-2.5 px-2 py-1.5">
                  <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-bg-card text-text-muted">
                    <AppIcon icon={MapPin} size="sm" decorative />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-none text-text-muted">
                      Local:
                    </p>
                    <p
                      className="truncate pt-1 text-base font-semibold leading-tight text-text-body"
                      title={session.location_name ?? "Nao informado"}
                    >
                      {session.location_name ?? "Nao informado"}
                    </p>
                  </div>
                </article>

                <article className="flex min-w-0 items-center gap-2.5 px-2 py-1.5 lg:border-l lg:border-border-default/70">
                  <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-bg-card text-text-muted">
                    <AppIcon icon={Calendar} size="sm" decorative />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-none text-text-muted">
                      Data:
                    </p>
                    <p className="truncate pt-1 text-base font-semibold leading-tight text-text-body">
                      {format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </article>

                <article className="flex min-w-0 items-center gap-2.5 px-2 py-1.5 lg:border-l lg:border-border-default/70">
                  <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-bg-card text-text-muted">
                    <AppIcon icon={Clock3} size="sm" decorative />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-none text-text-muted">
                      Turno:
                    </p>
                    <p className="truncate pt-1 text-base font-semibold leading-tight text-text-body">
                      {formatSessionPeriod(session.period)}
                    </p>
                  </div>
                </article>

                <button
                  type="button"
                  onClick={handlePrintList}
                  disabled={printing}
                  className="inline-flex h-10 items-center justify-center gap-2 self-center rounded-lg border border-border-default bg-bg-card px-4 text-sm font-semibold text-text-body hover:border-primary/30 hover:text-primary disabled:opacity-60"
                >
                  {printing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  Gerar PDF de Chamada
                </button>
              </div>
            </section>

            <div className="overflow-hidden rounded-xl border border-border-default">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-default">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-text-muted">
                      Posto
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-text-muted">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-text-muted">
                      SARAM
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-text-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-text-muted text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-text-muted"
                      >
                        Nenhum militar inscrito nesta turma.
                      </td>
                    </tr>
                  ) : null}
                  {bookings.map((booking) => {
                    const resultStatus = getBookingResultStatus(
                      booking.result_details,
                    );
                    const showPrimaryAction =
                      mode === "manage" && resultStatus === null;

                    return (
                      <tr key={booking.id} className="bg-bg-card">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-text-body">
                            {booking.rank ?? "--"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-text-body">
                            {booking.war_name ||
                              booking.full_name ||
                              "Sem nome"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-body">
                          {booking.saram ?? "--"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${resultBadgeClass(resultStatus)}`}
                          >
                            {resultLabel(resultStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const index = activeBookings.findIndex(
                                (item) => item.id === booking.id,
                              );
                              setCurrentBookingIndex(index >= 0 ? index : null);
                              setResultDraft(buildDraft(booking));
                            }}
                            className={
                              showPrimaryAction
                                ? "inline-flex h-9 items-center gap-2 rounded-xl border border-border-default bg-bg-default px-3 py-1.5 text-sm font-semibold text-text-body hover:border-primary/30 hover:text-primary"
                                : "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-default text-text-body hover:border-primary/30 hover:text-primary"
                            }
                            title={
                              mode === "manage"
                                ? "Lancar resultado"
                                : "Ver resultado"
                            }
                            aria-label={
                              mode === "manage"
                                ? "Lancar resultado"
                                : "Ver resultado"
                            }
                          >
                            <AppIcon
                              icon={mode === "manage" ? Edit2 : UserCheck}
                              size="xs"
                              decorative
                            />
                            {showPrimaryAction ? "Lançar Resultado" : null}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 border-t border-border-default pt-3">
              {mode === "manage" ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setFinalizationDialogOpen(true)}
                    disabled={closingSession || !canManage}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary/95 via-primary to-primary/90 px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {closingSession ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Finalizar Sessão
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handlePrintFinalReport}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body hover:border-primary/30 hover:text-primary"
                  >
                    <FileDown size={16} />
                    Imprimir relatório final
                  </button>
                  {session.status === "closed" ? (
                    <button
                      type="button"
                      onClick={handleReopenSession}
                      disabled={reopeningSession || !canManage}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {reopeningSession ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                      Reabrir sessão
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={finalizationDialogOpen}
        onClose={() => {
          if (!closingSession) {
            setFinalizationDialogOpen(false);
          }
        }}
        closeDisabled={closingSession}
        title="Confirmação de Finalização"
        description="Confirme para concluir a sessão e gerar automaticamente o relatório final em PDF."
        widthClassName="max-w-2xl"
        footer={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinalizeSession}
                  disabled={closingSession}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary/95 via-primary to-primary/90 px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-60"
                >
                  {closingSession ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  Finalizar e Gerar PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFinalizationDialogOpen(false);
                    toast.success(
                      "Dados preservados. A sessão permanece aberta para novos lançamentos.",
                    );
                  }}
                  disabled={closingSession}
                  className="rounded-lg border border-primary/40 bg-bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                >
                  Salvar como Rascunho
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFinalizationDialogOpen(false)}
                disabled={closingSession}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-text-body disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>

            <div className="mx-auto max-w-[560px] rounded-lg border border-alert/25 bg-alert/5 px-3 py-2">
              <p className="flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-text-body">
                <AppIcon
                  icon={AlertTriangle}
                  size="xs"
                  className="mt-0.5 text-alert"
                  decorative
                />
                <span>
                  <span className="font-semibold">Atenção operacional:</span>{" "}
                  ao finalizar, toda avaliação pendente será marcada como
                  "Não Realizado". Use "Salvar como Rascunho" se ainda houver
                  lançamentos.
                </span>
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <section className="rounded-xl border border-border-default bg-bg-default p-4">
            <div className="grid gap-2 sm:grid-cols-2 sm:divide-x sm:divide-border-default">
              <p className="flex items-center gap-2 text-base font-semibold text-text-body sm:pr-4">
                <CheckCircle2 size={18} className="text-success" />
                Avaliados:{" "}
                <span className="font-bold text-text-body">
                  {summary.apto + summary.inapto}
                </span>
              </p>
              <p className="flex items-center gap-2 text-base font-semibold text-alert sm:pl-4">
                <Clock3 size={18} className="text-alert" />
                Pendentes:{" "}
                <span className="font-bold">
                  {checklist?.results_pending ?? summary.pendente}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border-default bg-bg-default p-4 text-sm text-text-body">
            <p className="text-base text-text-body">
              Você está prestes a finalizar a sessão. Os dados dos avaliados
              serão processados.
            </p>
          </section>
        </div>
      </Dialog>

      <Dialog
        open={resultDraft !== null}
        onClose={() => {
          setResultDraft(null);
          setCurrentBookingIndex(null);
        }}
        title={
          mode === "manage"
            ? "Lançamento de Performance Modal"
            : "Resultado lançado"
        }
        description={
          mode === "manage"
            ? `Avaliado: ${currentResultBooking?.war_name ?? currentResultBooking?.full_name ?? "Não informado"}`
            : "Consulta somente leitura do lançamento realizado."
        }
        widthClassName="max-w-xl"
        footer={
          mode === "manage" && resultDraft ? (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setResultDraft(null);
                  setCurrentBookingIndex(null);
                }}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveResult(hasNextBooking)}
                disabled={savingResult}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingResult ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {hasNextBooking ? "Salvar e Próximo" : "Salvar"}
              </button>
            </div>
          ) : undefined
        }
      >
        {resultDraft ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Corrida</span>
                <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-default px-3 py-1">
                  <span className="text-base text-text-muted">[</span>
                  <input
                    type="text"
                    value={resultDraft.corrida}
                    onChange={(event) =>
                      setResultDraft((current) =>
                        current
                          ? { ...current, corrida: event.target.value }
                          : current,
                      )
                    }
                    disabled={mode === "view"}
                    className="w-full border-none bg-transparent px-1 py-1 text-sm text-text-body focus:outline-none"
                  />
                  <span className="text-base text-text-muted">]</span>
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Flexao</span>
                <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-default px-3 py-1">
                  <span className="text-base text-text-muted">[</span>
                  <input
                    type="text"
                    value={resultDraft.flexao}
                    onChange={(event) =>
                      setResultDraft((current) =>
                        current
                          ? { ...current, flexao: event.target.value }
                          : current,
                      )
                    }
                    disabled={mode === "view"}
                    className="w-full border-none bg-transparent px-1 py-1 text-sm text-text-body focus:outline-none"
                  />
                  <span className="text-base text-text-muted">]</span>
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Abdominal</span>
                <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-default px-3 py-1">
                  <span className="text-base text-text-muted">[</span>
                  <input
                    type="text"
                    value={resultDraft.abdominal}
                    onChange={(event) =>
                      setResultDraft((current) =>
                        current
                          ? { ...current, abdominal: event.target.value }
                          : current,
                      )
                    }
                    disabled={mode === "view"}
                    className="w-full border-none bg-transparent px-1 py-1 text-sm text-text-body focus:outline-none"
                  />
                  <span className="text-base text-text-muted">]</span>
                </div>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  mode === "manage" &&
                  setResultDraft((current) =>
                    current ? { ...current, resultStatus: "apto" } : current,
                  )
                }
                disabled={mode === "view"}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-bold ${
                  resultDraft.resultStatus === "apto"
                    ? "border-success bg-success/10 text-success"
                    : "border-border-default text-text-muted"
                }`}
              >
                <CheckCircle2 size={18} />
                Apto
              </button>
              <button
                type="button"
                onClick={() =>
                  mode === "manage" &&
                  setResultDraft((current) =>
                    current ? { ...current, resultStatus: "inapto" } : current,
                  )
                }
                disabled={mode === "view"}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-bold ${
                  resultDraft.resultStatus === "inapto"
                    ? "border-error bg-error/10 text-error"
                    : "border-border-default text-text-muted"
                }`}
              >
                <XCircle size={18} />
                Inapto
              </button>
            </div>

            {typeof currentBookingIndex === "number" ? (
              <section className="space-y-2 rounded-xl border border-border-default bg-bg-default p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                  <span>Progresso da avaliação</span>
                  <span>
                    Variante{" "}
                    {Math.min(currentBookingIndex + 1, activeBookings.length)}{" "}
                    de {activeBookings.length}
                  </span>
                </div>
                <progress
                  className="h-2 w-full rounded-full overflow-hidden accent-primary"
                  value={Math.min(
                    currentBookingIndex + 1,
                    activeBookings.length,
                  )}
                  max={Math.max(activeBookings.length, 1)}
                  aria-label="Progresso de avaliados"
                />
              </section>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
