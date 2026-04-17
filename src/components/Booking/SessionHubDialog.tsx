import Dialog from "@/components/Dialog";
import AppIcon from "@/components/atomic/AppIcon";
import useAuth from "@/hooks/useAuth";
import {
  CheckCircle2,
  Edit2,
  FileDown,
  Loader2,
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
  type SessionClosureChecklist,
  type SessionInfo,
  updateBookingAttendance,
  updateBookingResult,
  updateSession,
} from "@/services/sessions";
import type { BookingRow, Profile } from "@/types";
import {
  buildBookingResultPayload,
  getBookingResultStatus,
  parseBookingResult,
  type BookingResultStatus,
} from "@/utils/bookingResults";
import { formatSessionPeriod } from "@/utils/booking";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
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
    return "bg-success/10 text-success";
  }

  if (status === "inapto") {
    return "bg-error/10 text-error";
  }

  return "bg-alert/10 text-alert";
}

export default function SessionHubDialog({
  open,
  sessionId,
  onClose,
  onSessionUpdated,
  onEditRequested,
}: {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  onSessionUpdated: () => Promise<void> | void;
  onEditRequested: (sessionId: string) => void;
}) {
  const { profile } = useAuth();
  const canManage = profile?.role === "admin" || profile?.role === "coordinator";

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [checklist, setChecklist] = useState<SessionClosureChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [reopeningSession, setReopeningSession] = useState(false);
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null);
  const [resultDraft, setResultDraft] = useState<ResultDraft | null>(null);

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

  async function refreshAll() {
    await loadSession();
    await onSessionUpdated();
  }

  async function handleAttendanceChange(bookingId: string, next: boolean) {
    if (!canManage || mode !== "manage") {
      return;
    }

    setUpdatingAttendance(bookingId);
    try {
      await updateBookingAttendance(bookingId, next);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? { ...booking, attendance_confirmed: next }
            : booking,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel atualizar a presenca.");
    } finally {
      setUpdatingAttendance(null);
    }
  }

  async function handleSaveResult() {
    if (!resultDraft) {
      return;
    }

    setSavingResult(true);
    try {
      await updateBookingResult(
        resultDraft.bookingId,
        buildBookingResultPayload({
          result_status: resultDraft.resultStatus,
          corrida: resultDraft.corrida,
          flexao: resultDraft.flexao,
          abdominal: resultDraft.abdominal,
        }),
      );

      toast.success("Lançamento salvo.");
      setResultDraft(null);
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
      await closeSessionWithChecklist(sessionId);
      toast.success("Sessao concluida com sucesso.");
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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={mode === "manage" ? "Hub de sessao" : "Consulta de sessao"}
        description={
          mode === "manage"
            ? "Operacao central da sessao. Pendencias sem lancamento serao tratadas como inapto ao concluir."
            : "Consulta somente leitura para sessoes fechadas ou concluidas."
        }
        widthClassName="max-w-6xl"
      >
        {loading || !session ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Carregando sessao...
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-5">
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Data
                </p>
                <p className="mt-1 text-sm font-semibold text-text-body">
                  {format(parseISO(session.date), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Turno
                </p>
                <p className="mt-1 text-sm font-semibold text-text-body">
                  {formatSessionPeriod(session.period)}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-text-body">
                  {session.status === "open"
                    ? "Aberta"
                    : session.status === "closed"
                      ? "Fechada"
                      : "Concluida"}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Local
                </p>
                <p className="mt-1 text-sm font-semibold text-text-body">
                  {session.location_name ?? "Nao informado"}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Capacidades
                </p>
                <p className="mt-1 text-sm font-semibold text-text-body">
                  {session.capacity ?? 0} min / {session.max_capacity ?? 0} max
                </p>
              </article>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Apto
                </p>
                <p className="mt-1 text-lg font-bold text-success">
                  {summary.apto}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Inapto
                </p>
                <p className="mt-1 text-lg font-bold text-error">
                  {summary.inapto}
                </p>
              </article>
              <article className="rounded-xl border border-border-default bg-bg-default p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Pendentes
                </p>
                <p className="mt-1 text-lg font-bold text-alert">
                  {summary.pendente}
                </p>
              </article>
            </section>

            {mode === "manage" && checklist ? (
              <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-text-body">
                <p className="font-semibold text-primary">
                  Conclusao operacional
                </p>
                <p className="mt-1 text-text-muted">
                  {checklist.results_pending} pendencia(s) sem lancamento serao
                  convertidas para inapto ao concluir. Reagendamentos pendentes
                  continuam bloqueando a conclusao.
                </p>
              </section>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-border-default">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-default">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                      Militar
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                      Agendamento
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                      Presenca
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                      Resultado
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted text-right">
                      Acao
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {bookings.map((booking) => {
                    const resultStatus = getBookingResultStatus(
                      booking.result_details,
                    );

                    return (
                      <tr key={booking.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-body">
                            {booking.war_name || booking.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {booking.rank ?? "--"} • {booking.saram ?? "--"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-text-body">
                          {booking.status === "agendado"
                            ? "Agendado"
                            : booking.status === "remarcado"
                              ? "Reagendado"
                              : "Cancelado"}
                        </td>
                        <td className="px-4 py-3">
                          {mode === "manage" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAttendanceChange(booking.id, true)
                                }
                                disabled={
                                  updatingAttendance === booking.id || !canManage
                                }
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                  booking.attendance_confirmed
                                    ? "bg-primary text-white"
                                    : "bg-bg-default text-text-muted"
                                }`}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAttendanceChange(booking.id, false)
                                }
                                disabled={
                                  updatingAttendance === booking.id || !canManage
                                }
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                  !booking.attendance_confirmed
                                    ? "bg-primary text-white"
                                    : "bg-bg-default text-text-muted"
                                }`}
                              >
                                Nao
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-body">
                              {booking.attendance_confirmed ? "Confirmada" : "Nao confirmada"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${resultBadgeClass(resultStatus)}`}
                          >
                            {resultLabel(resultStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setResultDraft(buildDraft(booking))}
                            className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-xs font-semibold text-text-body hover:border-primary/30 hover:text-primary"
                          >
                            <AppIcon
                              icon={mode === "manage" ? Edit2 : UserCheck}
                              size="xs"
                              decorative
                            />
                            {mode === "manage" ? "Lancar resultado" : "Ver resultado"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrintList}
                disabled={printing}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body hover:border-primary/30 hover:text-primary"
              >
                {printing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileDown size={16} />
                )}
                Imprimir lista
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {mode === "manage" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditRequested(session.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body hover:border-primary/30 hover:text-primary"
                    >
                      <Edit2 size={16} />
                      Editar sessao
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizeSession}
                      disabled={closingSession || !canManage}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {closingSession ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Concluir sessao
                    </button>
                  </>
                ) : session.status === "closed" ? (
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
                    Reabrir sessao
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={resultDraft !== null}
        onClose={() => setResultDraft(null)}
        title={mode === "manage" ? "Lançamento de performance" : "Resultado lançado"}
        description={
          mode === "manage"
            ? "Salve corrida, flexao, abdominal e o resultado final."
            : "Consulta somente leitura do lançamento realizado."
        }
        widthClassName="max-w-xl"
        footer={
          mode === "manage" && resultDraft ? (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResultDraft(null)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                disabled={savingResult}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingResult ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salvar lançamento
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
                  className="w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Flexao</span>
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
                  className="w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Abdominal</span>
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
                  className="w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  mode === "manage" &&
                  setResultDraft((current) =>
                    current
                      ? { ...current, resultStatus: "apto" }
                      : current,
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
                    current
                      ? { ...current, resultStatus: "inapto" }
                      : current,
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
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
