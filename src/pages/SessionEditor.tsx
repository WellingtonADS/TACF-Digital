/**
 * @page SessionEditor
 * @description Edição de detalhes de sessão.
 * @path src/pages/SessionEditor.tsx
 */

import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useLocations from "@/hooks/useLocations";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Save,
  XCircle,
} from "@/icons";
import type { SessionRow as DBSessionRow } from "@/types";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { PT_MONTHS } from "@/utils/ptMonths";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Coordinator, fetchCoordinators } from "../services/personnel";
import { fetchSessionForEdit, updateSession } from "../services/sessions";
import type {
  Database,
  SessionPeriod,
  SessionStatus,
} from "../types/database.types";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DateMode = "single" | "week" | "month";

type FormState = {
  date: string;
  dateMode: DateMode;
  weekValue: string;
  monthValue: string;
  startTime: string;
  location_id: string;
  instructor_id: string;
  maxCapacity: number;
  status: SessionStatus;
};

const INITIAL_STATE: FormState = {
  date: "",
  dateMode: "single",
  weekValue: "",
  monthValue: "",
  startTime: "",
  location_id: "",
  instructor_id: "",
  maxCapacity: 15,
  status: "open",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return dow === 0 || dow === 6;
}

function getWeekDates(weekValue: string): string[] {
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return [];
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

function getMonthWeekdays(monthValue: string): string[] {
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return [];
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) result.push(toDateStr(date));
  }
  return result;
}

function fmtDateChip(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function derivePeriod(startTime: string): SessionPeriod {
  const hours = Number(startTime.split(":")[0] ?? 0);
  return hours < 12 ? "manha" : "tarde";
}

function periodToDefaultTime(period: string): string {
  return period === "manha" ? "08:00" : "14:00";
}

/**
 * Deriva o status efetivo da turma.
 * Se o banco retorna 'open' mas a data já passou, reclassifica como 'completed'.
 * Isso corrige turmas antigas criadas sem status explícito.
 */
function deriveStatus(dateStr: string, dbStatus: SessionStatus): SessionStatus {
  if (dbStatus !== "open") return dbStatus;
  const sessionDate = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessionDate < today ? "completed" : "open";
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: SessionStatus; label: string; desc: string }[] =
  [
    { value: "open", label: "Aberta", desc: "Aceita novos agendamentos" },
    { value: "closed", label: "Fechada", desc: "Sem novos agendamentos" },
    { value: "completed", label: "Concluída", desc: "TACF já realizado" },
  ];

const STATUS_STYLE: Record<SessionStatus, string> = {
  open: "border-success/40 bg-success/10 text-success",
  closed: "border-alert/40 bg-alert/10 text-alert",
  completed: "border-primary/40 bg-primary/10 text-primary",
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function SessionEditor() {
  const { profile } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [occupiedCount, setOccupiedCount] = useState<number | null>(null);

  const [instructors, setInstructors] = useState<Coordinator[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const {
    locations,
    fetch: fetchLocations,
    loading: loadingLocations,
  } = useLocations();

  const isValidCapacity = useMemo(
    () => form.maxCapacity >= 8 && form.maxCapacity <= 21,
    [form.maxCapacity],
  );
  const canMutate = profile?.role === "admin";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Carregamentos ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchLocations({ status: "active", limit: 100 });
  }, [fetchLocations]);

  useEffect(() => {
    async function loadInstructors() {
      setLoadingInstructors(true);
      try {
        const data = await fetchCoordinators();
        setInstructors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInstructors(false);
      }
    }
    loadInstructors();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    fetchSessionForEdit(sessionId)
      .then(({ session, bookedCount }) => {
        const s = session as DBSessionRow;
        const effectiveStatus = deriveStatus(
          s.date ?? "",
          (s.status as SessionStatus) ?? "open",
        );

        setForm({
          date: s.date ?? "",
          dateMode: "single",
          weekValue: "",
          monthValue: "",
          startTime: periodToDefaultTime(s.period ?? "manha"),
          location_id: s.location_id ?? "",
          instructor_id:
            Array.isArray(s.applicators) && s.applicators.length > 0
              ? s.applicators[0]
              : "",
          maxCapacity: s.max_capacity ?? 15,
          status: effectiveStatus,
        });
        setOccupiedCount(bookedCount);
      })
      .catch(() => {
        toast.error("Turma não encontrada.");
        navigate("/app/turmas");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId, navigate]);

  // ── Salvar ───────────────────────────────────────────────────────────────

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMutate) {
      toast.error("Acesso negado: você não tem permissão para editar turmas.");
      return;
    }

    if (!form.date) {
      toast.error("Informe a data da turma.");
      return;
    }
    if (isWeekend(form.date)) {
      toast.error("Sábados e domingos não estão disponíveis.");
      return;
    }
    if (!form.startTime) {
      toast.error("Informe o horário de início.");
      return;
    }
    if (!isValidCapacity) {
      toast.error("A capacidade deve estar entre 8 e 21 vagas.");
      return;
    }

    setSaving(true);
    try {
      const period = derivePeriod(form.startTime);
      await updateSession(sessionId!, {
        date: form.date,
        period,
        max_capacity: form.maxCapacity,
        status: form.status,
        ...(form.location_id ? { location_id: form.location_id } : {}),
        applicators: form.instructor_id ? [form.instructor_id] : [],
      } as Database["public"]["Tables"]["sessions"]["Update"]);
      toast.success("Turma atualizada com sucesso.");
      navigate("/app/turmas");
    } catch (err) {
      const pgErr = err as { code?: string; message?: string } | null;
      if (pgErr?.code === "23505") {
        toast.error("Já existe turma no mesmo dia e turno.");
      } else {
        const authMessage = getAuthorizationErrorMessage(err, "editar turmas");
        toast.error(
          (authMessage ?? pgErr?.message) || "Não foi possível salvar a turma.",
        );
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSession() {
    if (!sessionId) return;

    if (!canMutate) {
      toast.error(
        "Acesso negado: você não tem permissão para cancelar turmas.",
      );
      return;
    }

    setSaving(true);
    setShowCancelConfirm(false);
    try {
      await updateSession(sessionId, {
        status: "closed",
      } as Database["public"]["Tables"]["sessions"]["Update"]);
      toast.success("Turma cancelada (fechada).");
      navigate("/app/turmas");
    } catch (error) {
      const authMessage = getAuthorizationErrorMessage(
        error,
        "cancelar turmas",
      );
      toast.error(authMessage ?? "Erro ao cancelar a turma.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pb-16">
        {/* Hero */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Editar Turma
                </h1>
                <p className="mt-2 text-sm text-white/85 md:text-base">
                  Atualize os dados da turma e salve as alterações.
                </p>
              </div>
              {!loading && !loadingLocations && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/app/turmas/${sessionId}/agendamentos`)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-bg-card hover:text-primary"
                >
                  <ClipboardList size={14} />
                  Ver Agendamentos
                </button>
              )}
            </div>
          </div>
        </section>

        {!canMutate && (
          <div className="mb-4 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
            Seu perfil está em modo somente leitura. Apenas administradores
            podem editar ou cancelar turmas.
          </div>
        )}

        {loading || loadingLocations ? (
          <div className="flex items-center justify-center gap-2 py-20 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Carregando turma...
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-2xl">
            <form className="flex flex-col" onSubmit={handleSubmit}>
              <div className="space-y-10 p-8 md:p-12">
                {/* ── Seção 1: Informações Básicas ── */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <CalendarDays className="text-primary/60" size={18} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                      Informações Básicas
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Local */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Local do Teste
                      </label>
                      <select
                        value={form.location_id}
                        onChange={(e) =>
                          updateField("location_id", e.target.value)
                        }
                        disabled={loadingLocations}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        <option value="">
                          {loadingLocations
                            ? "Carregando locais..."
                            : "Selecione um local"}
                        </option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                            {loc.address ? ` — ${loc.address}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Coordenador aplicador */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Coordenador aplicador
                      </label>
                      <p className="text-xs text-text-muted">
                        Selecione quem coordenara a aplicacao do teste no dia.
                      </p>
                      <select
                        value={form.instructor_id}
                        onChange={(e) =>
                          updateField("instructor_id", e.target.value)
                        }
                        disabled={loadingInstructors}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        <option value="">
                          {loadingInstructors
                            ? "Carregando instrutores..."
                            : "Selecione um coordenador"}
                        </option>
                        {instructors.map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.full_name ?? ins.war_name ?? ins.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── Seção 2: Data e Horário ── */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <CalendarDays className="text-primary/60" size={18} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                      Data e Horário
                    </h2>
                  </div>

                  {/* Seletor de modo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Selecionar por
                    </label>
                    <div className="inline-flex rounded-xl border border-border-default bg-bg-default p-1">
                      {[
                        { mode: "single" as DateMode, label: "Um dia" },
                        { mode: "week" as DateMode, label: "Semana" },
                        { mode: "month" as DateMode, label: "Mês" },
                      ].map(({ mode, label }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            updateField("dateMode", mode);
                            updateField("date", "");
                          }}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            form.dateMode === mode
                              ? "bg-bg-card text-primary shadow-sm"
                              : "text-text-muted hover:text-text-body"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Um dia */}
                  {form.dateMode === "single" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Data da Turma
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && isWeekend(v)) {
                            toast.error(
                              "Sábados e domingos não estão disponíveis.",
                            );
                            updateField("date", "");
                          } else {
                            updateField("date", v);
                          }
                        }}
                        className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[11px] text-text-muted">
                        Sábados e domingos são bloqueados automaticamente.
                      </p>
                    </div>
                  )}

                  {/* Semana */}
                  {form.dateMode === "week" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Selecione a semana
                      </label>
                      <input
                        type="week"
                        value={form.weekValue}
                        onChange={(e) => {
                          updateField("weekValue", e.target.value);
                          updateField("date", "");
                        }}
                        className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {form.weekValue && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-text-muted">
                            Clique no dia para definir a nova data da turma.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getWeekDates(form.weekValue).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => updateField("date", d)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                                  form.date === d
                                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                }`}
                              >
                                {fmtDateChip(d)}
                              </button>
                            ))}
                          </div>
                          {form.date && (
                            <p className="text-xs font-semibold text-success">
                              ✓ Nova data selecionada: {fmtDateChip(form.date)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mês */}
                  {form.dateMode === "month" &&
                    (() => {
                      const days = getMonthWeekdays(form.monthValue);
                      return (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                            Selecione o mês
                          </label>
                          <input
                            type="month"
                            value={form.monthValue}
                            onChange={(e) => {
                              updateField("monthValue", e.target.value);
                              updateField("date", "");
                            }}
                            className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {form.monthValue && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                                <CalendarDays
                                  size={18}
                                  className="shrink-0 text-primary"
                                />
                                <p className="text-sm text-text-body">
                                  <span className="font-bold text-primary">
                                    {days.length} dias úteis
                                  </span>{" "}
                                  em{" "}
                                  {
                                    PT_MONTHS[
                                      Number(form.monthValue.split("-")[1]) - 1
                                    ]
                                  }{" "}
                                  {form.monthValue.split("-")[0]}. Clique num
                                  dia para selecionar.
                                </p>
                              </div>
                              <p className="text-[11px] text-text-muted">
                                Clique no dia desejado para definir a nova data
                                da turma.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {days.map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => updateField("date", d)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                                      form.date === d
                                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                    }`}
                                  >
                                    {fmtDateChip(d)}
                                  </button>
                                ))}
                              </div>
                              {form.date && (
                                <p className="text-xs font-semibold text-success">
                                  ✓ Nova data selecionada:{" "}
                                  {fmtDateChip(form.date)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Horário de Início */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Horário de Início
                    </label>
                    <div className="relative max-w-xs">
                      <Clock3
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        size={16}
                      />
                      <input
                        required
                        type="time"
                        value={form.startTime}
                        onChange={(e) =>
                          updateField("startTime", e.target.value)
                        }
                        className="w-full rounded-lg border border-border-default bg-bg-default py-3 pl-10 pr-4 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </section>

                {/* ── Seção 3: Capacidade e Status ── */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <AlertCircle className="text-primary/60" size={18} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                      Capacidade e Status
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                    {/* Vagas */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Limite de Vagas (8 a 21)
                      </label>
                      <input
                        required
                        type="number"
                        min={8}
                        max={21}
                        value={form.maxCapacity}
                        onChange={(e) =>
                          updateField(
                            "maxCapacity",
                            Number(e.target.value || 0),
                          )
                        }
                        className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {!isValidCapacity && (
                        <p className="text-xs text-error">
                          Capacidade fora do intervalo permitido.
                        </p>
                      )}
                      {occupiedCount !== null &&
                        form.maxCapacity < occupiedCount && (
                          <div className="flex items-center gap-2 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
                            <AlertTriangle size={14} />
                            Capacidade menor que os inscritos atuais (
                            {occupiedCount}).
                          </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Status da Turma
                      </label>
                      <div className="flex flex-col gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField("status", opt.value)}
                            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                              form.status === opt.value
                                ? STATUS_STYLE[opt.value]
                                : "border-border-default bg-bg-default text-text-muted hover:border-border-default"
                            }`}
                          >
                            {opt.value === "open" && (
                              <CheckCircle2 size={16} className="shrink-0" />
                            )}
                            {opt.value === "closed" && (
                              <XCircle size={16} className="shrink-0" />
                            )}
                            {opt.value === "completed" && (
                              <CalendarDays size={16} className="shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-semibold">
                                {opt.label}
                              </p>
                              <p className="text-xs opacity-70">{opt.desc}</p>
                            </div>
                            {form.status === opt.value && (
                              <span className="ml-auto text-xs font-bold uppercase tracking-wider opacity-70">
                                Selecionado
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Rodapé */}
              <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border-default bg-bg-default px-8 py-8 md:flex-row md:px-12">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={
                    saving ||
                    form.status === "closed" ||
                    form.status === "completed"
                  }
                  title={
                    canMutate
                      ? "Cancelar turma"
                      : "Apenas administradores podem cancelar turmas"
                  }
                  className="w-full text-xs font-bold uppercase tracking-widest text-error transition-colors hover:text-error/80 disabled:opacity-40 md:w-auto"
                >
                  Cancelar Turma
                </button>
                <div className="flex w-full flex-col-reverse gap-3 md:w-auto md:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/app/turmas")}
                    className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-text-body md:w-auto"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || form.status === "completed"}
                    title={
                      form.status === "completed"
                        ? "Turmas concluídas não podem ser editadas"
                        : canMutate
                          ? "Salvar alterações"
                          : "Apenas administradores podem editar turmas"
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal confirmação de cancelamento */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                  <AlertTriangle size={20} className="text-error" />
                </div>
                <h2 className="text-base font-bold text-text-body">
                  Cancelar turma?
                </h2>
              </div>
              <p className="text-sm text-text-muted">
                O status será alterado para <strong>Fechada</strong>. Nenhum
                novo agendamento será aceito. Os agendamentos existentes{" "}
                <em>não</em> serão removidos automaticamente.
              </p>
            </div>
            <div className="flex gap-3 border-t border-border-default bg-bg-default px-8 py-6">
              <button
                onClick={() => navigate("/app/turmas")}
                className="flex-1 rounded-lg border border-border-default py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:bg-bg-default"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelSession}
                title={
                  canMutate
                    ? "Confirmar cancelamento"
                    : "Apenas administradores podem cancelar turmas"
                }
                className="flex-1 rounded-lg bg-error py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-error/90"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
