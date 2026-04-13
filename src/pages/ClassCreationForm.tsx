/**
 * @page ClassCreationForm
 * @description Formulário para criação de turmas/sessões.
 * @path src/pages/ClassCreationForm.tsx
 */

import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useLocations from "@/hooks/useLocations";
import { fetchCoordinators, type Coordinator } from "@/services/personnel";
import { AlertCircle, CalendarDays, Clock3, Save, XCircle } from "@/icons";
import { createSessions } from "@/services/bookings";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { PT_MONTHS } from "@/utils/ptMonths";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ModoData = "single" | "week" | "month";

type EstadoFormulario = {
  nomeTurma: string;
  location_id: string;
  instructor_id: string;
  modoData: ModoData;
  date: string;
  semanaSelecionada: string;
  mesSelecionado: string;
  horarioInicio: string;
  capacidadeMaxima: number;
  permiteListaEspera: boolean;
  observacoes: string;
};

const ESTADO_INICIAL: EstadoFormulario = {
  nomeTurma: "",
  location_id: "",
  instructor_id: "",
  modoData: "single",
  date: "",
  semanaSelecionada: "",
  mesSelecionado: "",
  horarioInicio: "",
  capacidadeMaxima: 8,
  permiteListaEspera: false,
  observacoes: "",
};

// ─── Helpers de calendário ───────────────────────────────────────────────────
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

/** Retorna todos os dias úteis (seg–sex) de um mês no formato YYYY-MM. */
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

function derivarTurno(horarioInicio: string): "manha" | "tarde" {
  const [hoursRaw] = horarioInicio.split(":");
  const hours = Number(hoursRaw || 0);
  return hours < 12 ? "manha" : "tarde";
}

export default function ClassCreationForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [instrutores, setInstrutores] = useState<Coordinator[]>([]);
  const [carregandoInstrutores, setCarregandoInstrutores] = useState(false);
  const {
    locations,
    fetch: fetchLocations,
    loading: carregandoLocais,
  } = useLocations();

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

  async function publicarTurmas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!podeAlterar) {
      toast.error("Acesso negado: você não tem permissão para criar turmas.");
      return;
    }

    let datasParaCriar: string[];

    if (formulario.modoData === "single") {
      if (!formulario.date) {
        toast.error("Informe a data do teste.");
        return;
      }
      if (ehFimDeSemana(formulario.date)) {
        toast.error("Sábados e domingos não estão disponíveis.");
        return;
      }
      datasParaCriar = [formulario.date];
    } else if (formulario.modoData === "week") {
      if (!formulario.semanaSelecionada) {
        toast.error("Selecione uma semana.");
        return;
      }
      datasParaCriar = obterDatasSemana(formulario.semanaSelecionada);
    } else {
      const dias = obterDiasUteisMes(formulario.mesSelecionado);
      if (dias.length === 0) {
        toast.error("Selecione um mês válido.");
        return;
      }
      datasParaCriar = dias;
    }

    if (!formulario.horarioInicio) {
      toast.error("Informe o horário de início.");
      return;
    }

    if (!formulario.location_id) {
      toast.error("Selecione o local do teste.");
      return;
    }

    if (!formulario.instructor_id) {
      toast.error("Selecione quem vai aplicar o teste.");
      return;
    }

    if (!capacidadeValida) {
      toast.error("A capacidade deve estar entre 8 e 21 vagas.");
      return;
    }

    setSalvando(true);
    try {
      const turno = derivarTurno(formulario.horarioInicio);
      const rows = datasParaCriar.map((date) => ({
        date,
        period: turno,
        max_capacity: formulario.capacidadeMaxima,
        location_id: formulario.location_id,
        applicators: [formulario.instructor_id],
      }));

      await createSessions(rows);

      const quantidadeTurmas = datasParaCriar.length;
      toast.success(
        quantidadeTurmas === 1
          ? "Turma publicada com sucesso."
          : `${quantidadeTurmas} turmas publicadas com sucesso.`,
      );
      navigate("/app/agendamentos");
    } catch (error: unknown) {
      const pg = error as { code?: string; message?: string };
      if (pg.code === "23505") {
        toast.error("Já existe turma no mesmo dia e turno.");
      } else {
        const authMessage = getAuthorizationErrorMessage(error, "criar turmas");
        console.error(error);
        toast.error(
          (authMessage ?? pg.message) || "Erro inesperado ao publicar turma.",
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl pb-16 px-4 sm:px-6 xl:px-0">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarDays className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-body">
                Criar Nova Turma
              </h1>
              <p className="text-sm text-text-muted">
                Preencha os dados abaixo para configurar a nova turma de teste
                físico.
              </p>
            </div>
          </div>
        </header>

        {!podeAlterar && (
          <div className="mb-4 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
            Seu perfil está em modo somente leitura. Apenas administradores
            podem publicar novas turmas.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-border-default/50 bg-bg-card shadow-2xl">
          <form className="flex flex-col" onSubmit={publicarTurmas}>
            <div className="space-y-8 sm:space-y-10 p-5 sm:p-8 md:p-12">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-default pb-3">
                  <AlertCircle className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                    Informações Básicas
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Nome da Turma
                    </label>
                    <input
                      value={formulario.nomeTurma}
                      onChange={(event) =>
                        atualizarCampo("nomeTurma", event.target.value)
                      }
                      className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Ex: TAF 2º Semestre"
                      type="text"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Local do Teste
                    </label>
                    <select
                      required
                      value={formulario.location_id}
                      onChange={(event) =>
                        atualizarCampo("location_id", event.target.value)
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

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Quem vai aplicar
                    </label>
                    <select
                      required
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

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-default pb-3">
                  <CalendarDays className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                    Calendário e Horário
                  </h2>
                </div>

                {/* Seletor de modo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Data do Teste
                  </label>
                  <div className="inline-flex rounded-xl border border-border-default bg-bg-default p-1">
                    {(
                      [
                        { mode: "single", label: "Um dia" },
                        { mode: "week", label: "Uma semana" },
                        { mode: "month", label: "Um mês" },
                      ] as { mode: ModoData; label: string }[]
                    ).map(({ mode, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => atualizarCampo("modoData", mode)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                          formulario.modoData === mode
                            ? "bg-bg-default text-primary shadow-sm"
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

                {/* Uma semana */}
                {formulario.modoData === "week" && (
                  <div className="space-y-3">
                    <input
                      type="week"
                      value={formulario.semanaSelecionada}
                      onChange={(e) =>
                        atualizarCampo("semanaSelecionada", e.target.value)
                      }
                      className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {formulario.semanaSelecionada && (
                      <div className="flex flex-wrap gap-2">
                        {obterDatasSemana(formulario.semanaSelecionada).map((d) => (
                          <span
                            key={d}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary"
                          >
                            {formatarChipData(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-text-muted">
                      Cria uma turma por dia (seg–sex) para a semana
                      selecionada.
                    </p>
                  </div>
                )}

                {/* Um mês inteiro */}
                {formulario.modoData === "month" &&
                  (() => {
                    const dias = obterDiasUteisMes(formulario.mesSelecionado);
                    return (
                      <div className="space-y-3">
                        <input
                          type="month"
                          value={formulario.mesSelecionado}
                          onChange={(e) =>
                            atualizarCampo("mesSelecionado", e.target.value)
                          }
                          className="w-full max-w-xs rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {formulario.mesSelecionado && (
                          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                            <CalendarDays
                              size={18}
                              className="shrink-0 text-primary"
                            />
                            <p className="text-sm text-text-body">
                                <span className="font-bold text-primary">
                                {dias.length} turmas
                              </span>{" "}
                              serão criadas (
                              {
                                PT_MONTHS[
                                  Number(formulario.mesSelecionado.split("-")[1]) - 1
                                ]
                              }{" "}
                              {formulario.mesSelecionado.split("-")[0]}), seg–sex, sem
                              fins de semana.
                            </p>
                          </div>
                        )}
                        <p className="text-[11px] text-text-muted">
                          Cria uma turma por dia útil (seg–sex) do mês
                          selecionado.
                        </p>
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
                      value={formulario.horarioInicio}
                      onChange={(event) =>
                        atualizarCampo("horarioInicio", event.target.value)
                      }
                      className="w-full rounded-lg border border-border-default bg-bg-default py-3 pl-10 pr-4 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      type="time"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-default pb-3">
                  <AlertCircle className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-body">
                    Configuração de Capacidade
                  </h2>
                </div>

                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Limite de Vagas (8 a 21)
                    </label>
                    <input
                      required
                      min={8}
                      max={21}
                      value={formulario.capacidadeMaxima}
                      onChange={(event) =>
                        atualizarCampo(
                          "capacidadeMaxima",
                          Number(event.target.value || 0),
                        )
                      }
                      className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      type="number"
                    />
                    {!capacidadeValida && (
                      <p className="text-xs text-error">
                        Capacidade fora do intervalo permitido.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-primary">
                        Lista de Espera
                      </span>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Permitir inscrições excedentes
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={formulario.permiteListaEspera}
                        onChange={(event) =>
                          atualizarCampo("permiteListaEspera", event.target.checked)
                        }
                      />
                      <div className="h-6 w-12 rounded-full bg-border-default transition peer-checked:bg-primary" />
                      <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-bg-card transition peer-checked:translate-x-6" />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Instruções Adicionais
                </label>
                <textarea
                  value={formulario.observacoes}
                  onChange={(event) =>
                    atualizarCampo("observacoes", event.target.value)
                  }
                  className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Traje específico, documento oficial com foto e garrafa de água."
                  rows={4}
                />
              </section>
            </div>

            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-border-default bg-bg-default px-5 py-5 sm:px-8 sm:py-8 md:flex-row md:px-12">
              <button
                type="button"
                onClick={() => navigate("/app/turmas")}
                className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-text-body md:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  salvando ||
                  !formulario.location_id ||
                  !formulario.instructor_id
                }
                title={
                  podeAlterar
                    ? "Publicar turma"
                    : "Apenas administradores podem publicar turmas"
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
              >
                {salvando ? <Save size={18} /> : <XCircle size={18} />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {salvando ? "Publicando..." : "Publicar Turma"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
