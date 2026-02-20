import useAuth from "@/hooks/useAuth";
import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import {
  ArrowRight,
  CheckCircle2,
  ListChecks,
  Search,
  ShieldAlert,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SessionRow = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "date" | "period"
>;

type BookingRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "session_id" | "user_id" | "score"
>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "war_name" | "saram" | "rank"
>;

type ScoreEntryRow = {
  bookingId: string;
  userId: string;
  fullName: string;
  warName: string | null;
  saram: string | null;
  rank: string | null;
  score: number | null;
};

function periodLabel(period: string) {
  if (period === "morning") return "Manhã";
  if (period === "afternoon") return "Tarde";
  return period;
}

export default function ScoreEntry() {
  const { profile, loading: authLoading } = useAuth();
  const role = profile?.role;
  const canManage = role === "admin" || role === "coordinator";

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [rows, setRows] = useState<ScoreEntryRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [scoreInput, setScoreInput] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingRows, setLoadingRows] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, date, period")
          .order("date", { ascending: false })
          .limit(50);

        if (error) throw error;

        const typed = (data ?? []) as SessionRow[];
        setSessions(typed);

        if (typed.length > 0) {
          setSelectedSessionId(typed[0].id);
        }
      } catch (error) {
        console.error(error);
        setSessions([]);
        toast.error("Não foi possível carregar as turmas.");
      } finally {
        setLoadingSessions(false);
      }
    }

    if (canManage) {
      loadSessions();
    }
  }, [canManage]);

  useEffect(() => {
    async function loadSessionRows() {
      if (!selectedSessionId) {
        setRows([]);
        setSelectedUserId("");
        setScoreInput("");
        return;
      }

      setLoadingRows(true);
      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("id, session_id, user_id, score")
          .eq("session_id", selectedSessionId)
          .order("created_at", { ascending: true });

        if (bookingError) throw bookingError;

        const bookings = (bookingData ?? []) as BookingRow[];
        const userIds = [
          ...new Set(bookings.map((booking) => booking.user_id)),
        ];

        if (userIds.length === 0) {
          setRows([]);
          setSelectedUserId("");
          setScoreInput("");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, war_name, saram, rank")
          .in("id", userIds);

        if (profileError) throw profileError;

        const profileMap = new Map(
          ((profileData ?? []) as ProfileRow[]).map((item) => [item.id, item]),
        );

        const mapped = bookings.map((booking) => {
          const p = profileMap.get(booking.user_id);
          return {
            bookingId: booking.id,
            userId: booking.user_id,
            fullName: p?.full_name ?? "Sem nome",
            warName: p?.war_name ?? null,
            saram: p?.saram ?? null,
            rank: p?.rank ?? null,
            score: booking.score ?? null,
          } satisfies ScoreEntryRow;
        });

        setRows(mapped);

        const firstPending = mapped.find((item) => item.score === null);
        const fallback = mapped[0];
        const selected = firstPending ?? fallback;

        if (selected) {
          setSelectedUserId(selected.userId);
          setScoreInput(selected.score === null ? "" : String(selected.score));
        } else {
          setSelectedUserId("");
          setScoreInput("");
        }
      } catch (error) {
        console.error(error);
        setRows([]);
        setSelectedUserId("");
        setScoreInput("");
        toast.error("Não foi possível carregar os militares da turma.");
      } finally {
        setLoadingRows(false);
      }
    }

    if (canManage) {
      loadSessionRows();
    }
  }, [selectedSessionId, canManage]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) => {
      return (
        row.fullName.toLowerCase().includes(normalized) ||
        (row.warName ?? "").toLowerCase().includes(normalized) ||
        (row.saram ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [rows, query]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.userId === selectedUserId) ?? null,
    [rows, selectedUserId],
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const launchedCount = useMemo(
    () => rows.filter((row) => row.score !== null).length,
    [rows],
  );

  async function saveScore(goToNext: boolean) {
    if (!selectedRow) {
      toast.error("Selecione um militar para lançar a nota.");
      return;
    }

    const parsedScore = Number(scoreInput);
    if (!Number.isFinite(parsedScore)) {
      toast.error("Informe uma nota válida.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ score: parsedScore })
        .eq("id", selectedRow.bookingId);

      if (error) throw error;

      const updatedRows = rows.map((row) =>
        row.bookingId === selectedRow.bookingId
          ? { ...row, score: parsedScore }
          : row,
      );

      setRows(updatedRows);

      toast.success("Nota salva com sucesso.");

      if (goToNext) {
        const currentIndex = updatedRows.findIndex(
          (row) => row.bookingId === selectedRow.bookingId,
        );
        const next = updatedRows
          .slice(currentIndex + 1)
          .find((row) => row.score === null);

        if (next) {
          setSelectedUserId(next.userId);
          setScoreInput(next.score === null ? "" : String(next.score));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar nota.");
    } finally {
      setSaving(false);
    }
  }

  function clearFields() {
    setScoreInput("");
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="text-sm text-slate-500">Carregando...</div>
      </Layout>
    );
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-300/30 bg-amber-50 p-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5" size={20} />
            <div>
              <h1 className="text-lg font-bold">Acesso restrito</h1>
              <p className="mt-1 text-sm">
                Esta área de lançamento de índices está disponível apenas para
                administradores e coordenadores.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-[#4a2b7a] p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Lançamento de Índices
            </h1>
            <p className="mt-1 text-sm text-white/75">
              Painel administrativo de lançamento de nota final TACF-Digital
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Turma Selecionada
            </p>
            <p className="font-semibold">
              {selectedSession
                ? `${selectedSession.date} • ${periodLabel(selectedSession.period)}`
                : "Sem turma selecionada"}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {launchedCount}/{rows.length} lançamentos concluídos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="xl:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-primary/5 px-5 py-4 dark:border-slate-800 dark:bg-primary/10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                  Efetivo da Turma
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {launchedCount}/{rows.length}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seleção de Turma
                </h1>
              </div>

              <select
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                className="mb-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {loadingSessions && <option>Carregando turmas...</option>}
                {!loadingSessions && sessions.length === 0 && (
                  <option value="">Sem turmas disponíveis</option>
                )}
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.date} • {periodLabel(session.period)}
                  </option>
                ))}
              </select>

              <div className="relative mb-4">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome ou SARAM..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {loadingRows && (
                  <p className="text-sm text-slate-500">
                    Carregando efetivo...
                  </p>
                )}

                {!loadingRows && filteredRows.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Nenhum militar encontrado para a turma selecionada.
                  </p>
                )}

                {filteredRows.map((row) => {
                  const active = selectedUserId === row.userId;
                  const launched = row.score !== null;

                  return (
                    <button
                      key={row.bookingId}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(row.userId);
                        setScoreInput(
                          row.score === null ? "" : String(row.score),
                        );
                      }}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {row.warName || row.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            SARAM: {row.saram ?? "--"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                            launched
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          }`}
                        >
                          {launched ? "Lançado" : "Pendente"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <section className="xl:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {!selectedRow ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                Selecione um militar para iniciar o lançamento.
              </div>
            ) : (
              <>
                <header className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-[#4a2b7a] p-6 text-white">
                  <p className="text-[10px] uppercase tracking-widest text-white/70">
                    Militar selecionado
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">
                    {selectedRow.warName || selectedRow.fullName}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/90">
                    <span>SARAM {selectedRow.saram ?? "--"}</span>
                    <span>Posto/Graduação: {selectedRow.rank ?? "--"}</span>
                  </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Trophy size={14} className="text-primary" />
                      Nota Final
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type="number"
                        value={scoreInput}
                        onChange={(event) => setScoreInput(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 pr-14 text-3xl font-bold text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="0"
                        step="0.1"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        pts
                      </span>
                    </div>
                  </div>

                  <aside className="rounded-xl border border-primary/15 bg-primary/5 p-5 text-center dark:bg-primary/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Resultado Parcial
                    </p>
                    <p className="mt-3 text-5xl font-black text-primary">
                      {scoreInput.trim() === "" ? "-" : scoreInput}
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <ListChecks size={14} />
                      Lançamento manual da nota final
                    </div>
                  </aside>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary"
                  >
                    <CheckCircle2 size={16} />
                    Finalizar lançamentos
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={clearFields}
                      className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      Limpar campo
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveScore(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60 dark:bg-slate-700"
                    >
                      <CheckCircle2 size={16} />
                      Salvar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveScore(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    >
                      Salvar e próximo
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              {rows.length} militar(es) na turma selecionada • {launchedCount}{" "}
              com nota lançada
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
