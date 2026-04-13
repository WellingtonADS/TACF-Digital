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

type ModoData = "single" | "week" | "month";

type EstadoFormulario = {
  date: string;
  modoData: ModoData;
  semanaSelecionada: string;
  mesSelecionado: string;
  horarioInicio: string;
  location_id: string;
  instructor_id: string;
  capacidadeMaxima: number;
  status: SessionStatus;
};

const ESTADO_INICIAL: EstadoFormulario = {
  date: "",
  modoData: "single",
  semanaSelecionada: "",
  mesSelecionado: "",
  horarioInicio: "",
  location_id: "",
  instructor_id: "",
  capacidadeMaxima: 15,
  status: "open",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatarDataIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ehFimDeSemana(dateStr: string): boolean {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return dow === 0 || dow === 6;
}

function obterDatasSemana(semanaSelecionada: string): string[] {
  const match = semanaSelecionada.match(/^(\d{4})-W(\d{2})$/);
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
    return formatarDataIso(d);
  });
}

function obterDiasUteisMes(mesSelecionado: string): string[] {
  const match = mesSelecionado.match(/^(\d{4})-(\d{2})$/);
  if (!match) return [];
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) result.push(formatarDataIso(date));
  }
  return result;
}

function formatarChipData(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function derivarTurno(horarioInicio: string): SessionPeriod {
  const hours = Number(horarioInicio.split(":")[0] ?? 0);
  return hours < 12 ? "manha" : "tarde";
}

function turnoParaHorarioPadrao(turno: string): string {
  return turno === "manha" ? "08:00" : "14:00";
}

/**
 * Deriva o status efetivo da turma.
 * Se o banco retorna 'open' mas a data já passou, reclassifica como 'completed'.
 * Isso corrige turmas antigas criadas sem status explícito.
 */
function derivarStatus(dateStr: string, statusBanco: SessionStatus): SessionStatus {
  if (statusBanco !== "open") return statusBanco;
  const dataSessao = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dataSessao < today ? "completed" : "open";
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

  const [formulario, setFormulario] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [confirmacaoCancelamentoAberta, setConfirmacaoCancelamentoAberta] =
    useState(false);
  const [totalOcupado, setTotalOcupado] = useState<number | null>(null);

  const [instrutores, setInstrutores] = useState<Coordinator[]>([]);
  const [carregandoInstrutores, setCarregandoInstrutores] = useState(false);

  const {
    locations,
    fetch: fetchLocations,
    loading: carregandoLocais,
  } = useLocations();

  const capacidadeValida = useMemo(
    () =>
      formulario.capacidadeMaxima >= 8 && formulario.capacidadeMaxima <= 21,
    [formulario.capacidadeMaxima],
  );
  const podeAlterar = profile?.role === "admin";

  function atualizarCampo<K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K],
  ) {
    setFormulario((estadoAtual) => ({ ...estadoAtual, [campo]: valor }));
  }

  // ── Carregamentos ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchLocations({ status: "active", limit: 100 });
  }, [fetchLocations]);

  useEffect(() => {
    async function carregarInstrutores() {
      setCarregandoInstrutores(true);
      try {
        const data = await fetchCoordinators();
        setInstrutores(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregandoInstrutores(false);
      }
    }
    carregarInstrutores();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setCarregando(true);

    fetchSessionForEdit(sessionId)
      .then(({ session, bookedCount }) => {
        const s = session as DBSessionRow;
        const statusEfetivo = derivarStatus(
          s.date ?? "",
          (s.status as SessionStatus) ?? "open",
        );

        setFormulario({
          date: s.date ?? "",
          modoData: "single",
          semanaSelecionada: "",
          mesSelecionado: "",
          horarioInicio: turnoParaHorarioPadrao(s.period ?? "manha"),
          location_id: s.location_id ?? "",
          instructor_id:
            Array.isArray(s.applicators) && s.applicators.length > 0
              ? s.applicators[0]
              : "",
          capacidadeMaxima: s.max_capacity ?? 15,
          status: statusEfetivo,
        });
        setTotalOcupado(bookedCount);
      })
      .catch(() => {
        toast.error("Turma não encontrada.");
        navigate("/app/turmas");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [sessionId, navigate]);

  // ── Salvar ───────────────────────────────────────────────────────────────

  async function salvarTurma(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!podeAlterar) {
      toast.error("Acesso negado: você não tem permissão para editar turmas.");
      return;
    }

    if (!formulario.date) {
      toast.error("Informe a data da turma.");
      return;
    }
    if (ehFimDeSemana(formulario.date)) {
      toast.error("Sábados e domingos não estão disponíveis.");
      return;
    }
    if (!formulario.horarioInicio) {
      toast.error("Informe o horário de início.");
      return;
    }
    if (!capacidadeValida) {
      toast.error("A capacidade deve estar entre 8 e 21 vagas.");
      return;
    }

    setSalvando(true);
    try {
      const turno = derivarTurno(formulario.horarioInicio);
      await updateSession(sessionId!, {
        date: formulario.date,
        period: turno,
        max_capacity: formulario.capacidadeMaxima,
        status: formulario.status,
        ...(formulario.location_id
          ? { location_id: formulario.location_id }
          : {}),
        applicators: formulario.instructor_id ? [formulario.instructor_id] : [],
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
      setSalvando(false);
    }
  }

  async function cancelarTurma() {
    if (!sessionId) return;

    if (!podeAlterar) {
      toast.error(
        "Acesso negado: você não tem permissão para cancelar turmas.",
      );
      return;
    }

    setSalvando(true);
    setConfirmacaoCancelamentoAberta(false);
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
      setSalvando(false);
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
              {!carregando && !carregandoLocais && (
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

        {!podeAlterar && (
          <div className="mb-4 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
            Seu perfil está em modo somente leitura. Apenas administradores
            podem editar ou cancelar turmas.
          </div>
        )}

        {carregando || carregandoLocais ? (
          <div className="flex items-center justify-center gap-2 py-20 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Carregando turma...
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-2xl">
            <form className="flex flex-col" onSubmit={salvarTurma}>
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
                        value={formulario.location_id}
                        onChange={(e) =>
                          atualizarCampo("location_id", e.target.value)
                        }
                        disabled={carregandoLocais}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        <option value="">
                          {carregandoLocais
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

                    {/* Quem vai aplicar */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Quem vai aplicar
                      </label>
                      <select
                        value={formulario.instructor_id}
                        onChange={(e) =>
                          atualizarCampo("instructor_id", e.target.value)
                        }
                        disabled={carregandoInstrutores}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        <option value="">
                          {carregandoInstrutores
                            ? "Carregando instrutores..."
                            : "Selecione um instrutor"}
                        </option>
                        {instrutores.map((ins) => (
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
                        { mode: "single" as ModoData, label: "Um dia" },
                        { mode: "week" as ModoData, label: "Semana" },
                        { mode: "month" as ModoData, label: "Mês" },
                      ].map(({ mode, label }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            atualizarCampo("modoData", mode);
                            atualizarCampo("date", "");
                          }}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            formulario.modoData === mode
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
                  {formulario.modoData === "single" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Data da Turma
                      </label>
                      <input
                        type="date"
                        value={formulario.date}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && ehFimDeSemana(v)) {
                            toast.error(
                              "Sábados e domingos não estão disponíveis.",
                            );
                            atualizarCampo("date", "");
                          } else {
                            atualizarCampo("date", v);
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
                  {formulario.modoData === "week" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Selecione a semana
                      </label>
                      <input
                        type="week"
                        value={formulario.semanaSelecionada}
                        onChange={(e) => {
                          atualizarCampo("semanaSelecionada", e.target.value);
                          atualizarCampo("date", "");
                        }}
                        className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {formulario.semanaSelecionada && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-text-muted">
                            Clique no dia para definir a nova data da turma.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {obterDatasSemana(formulario.semanaSelecionada).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => atualizarCampo("date", d)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                                  formulario.date === d
                                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                }`}
                              >
                                {formatarChipData(d)}
                              </button>
                            ))}
                          </div>
                          {formulario.date && (
                            <p className="text-xs font-semibold text-success">
                              ✓ Nova data selecionada: {formatarChipData(formulario.date)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mês */}
                  {formulario.modoData === "month" &&
                    (() => {
                      const dias = obterDiasUteisMes(formulario.mesSelecionado);
                      return (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                            Selecione o mês
                          </label>
                          <input
                            type="month"
                            value={formulario.mesSelecionado}
                            onChange={(e) => {
                              atualizarCampo("mesSelecionado", e.target.value);
                              atualizarCampo("date", "");
                            }}
                            className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {formulario.mesSelecionado && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                                <CalendarDays
                                  size={18}
                                  className="shrink-0 text-primary"
                                />
                                <p className="text-sm text-text-body">
                                  <span className="font-bold text-primary">
                                    {dias.length} dias úteis
                                  </span>{" "}
                                  em{" "}
                                  {
                                    PT_MONTHS[
                                      Number(formulario.mesSelecionado.split("-")[1]) - 1
                                    ]
                                  }{" "}
                                  {formulario.mesSelecionado.split("-")[0]}. Clique num
                                  dia para selecionar.
                                </p>
                              </div>
                              <p className="text-[11px] text-text-muted">
                                Clique no dia desejado para definir a nova data
                                da turma.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {dias.map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => atualizarCampo("date", d)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                                      formulario.date === d
                                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                    }`}
                                  >
                                    {formatarChipData(d)}
                                  </button>
                                ))}
                              </div>
                              {formulario.date && (
                                <p className="text-xs font-semibold text-success">
                                  ✓ Nova data selecionada:{" "}
                                  {formatarChipData(formulario.date)}
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
                        value={formulario.horarioInicio}
                        onChange={(e) =>
                          atualizarCampo("horarioInicio", e.target.value)
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
                        value={formulario.capacidadeMaxima}
                        onChange={(e) =>
                          atualizarCampo(
                            "capacidadeMaxima",
                            Number(e.target.value || 0),
                          )
                        }
                        className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {!capacidadeValida && (
                        <p className="text-xs text-error">
                          Capacidade fora do intervalo permitido.
                        </p>
                      )}
                      {totalOcupado !== null &&
                        formulario.capacidadeMaxima < totalOcupado && (
                          <div className="flex items-center gap-2 rounded-lg bg-alert/10 px-3 py-2 text-xs text-alert">
                            <AlertTriangle size={14} />
                            Capacidade menor que os inscritos atuais (
                            {totalOcupado}).
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
                            onClick={() => atualizarCampo("status", opt.value)}
                            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                              formulario.status === opt.value
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
                            {formulario.status === opt.value && (
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
                  onClick={() => setConfirmacaoCancelamentoAberta(true)}
                  disabled={
                    salvando ||
                    formulario.status === "closed" ||
                    formulario.status === "completed"
                  }
                  title={
                    podeAlterar
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
                    disabled={
                      salvando || formulario.status === "completed"
                    }
                    title={
                      formulario.status === "completed"
                        ? "Turmas concluídas não podem ser editadas"
                        : podeAlterar
                          ? "Salvar alterações"
                          : "Apenas administradores podem editar turmas"
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
                  >
                    {salvando ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {salvando ? "Salvando..." : "Salvar Alterações"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Dialog de confirmação de cancelamento */}
      {confirmacaoCancelamentoAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmacaoCancelamentoAberta(false)}
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
                onClick={cancelarTurma}
                title={
                  podeAlterar
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
