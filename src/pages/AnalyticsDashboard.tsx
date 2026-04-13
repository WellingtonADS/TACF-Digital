/**
 * @page AnalyticsDashboard
 * @description Visualização analítica de indicadores e relatórios.
 * @path src/pages/AnalyticsDashboard.tsx
 */

import {
  CardExportacao,
  CardIndicador,
  Esqueleto,
  EstadoVazio,
  SeletorFiltro,
} from "@/components/Analytics/DashboardWidgets";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  AlertTriangle,
  BarChart2,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
} from "@/icons";
import {
  fetchAnalyticsData,
  type AnalyticsBookingRow,
  type AnalyticsProfileRow,
} from "@/services/bookings";
import { downloadCSV } from "@/utils/csv";
import { isAdminLike } from "@/router/routeAccess";
import {
  addDays,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isBefore,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PerfilAnaliticoRow = AnalyticsProfileRow;

type AgendamentoAnaliticoRow = AnalyticsBookingRow;

type MetricaUnidade = {
  unit: string;
  total: number;
  apt: number;
  inapt: number;
  pending: number;
  percent: number;
};

type PontoTendencia = {
  key: string;
  label: string;
  apt: number;
  inapt: number;
  total: number;
  percent: number;
};

type LinhaPendente = {
  id: string;
  priority: "ALTA" | "MEDIA" | "BAIXA";
  militaryName: string;
  warName: string | null;
  identity: string;
  rank: string | null;
  unit: string;
  expiration: string;
  status: "Expirado" | "Pendente" | "Agendado";
  lastResult: "apto" | "inapto" | null;
};

type AbaRelatorio = "overview" | "pending" | "units" | "export";
type PeriodoPredefinido = "month" | "quarter" | "year" | "custom";

// ─── Auxiliares ───────────────────────────────────────────────────────────────

function obterDataReferencia(agendamento: AgendamentoAnaliticoRow) {
  return agendamento.test_date ?? agendamento.created_at ?? null;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ordemPrioridade(p: LinhaPendente["priority"]) {
  return p === "ALTA" ? 0 : p === "MEDIA" ? 1 : 2;
}

function obterIntervaloPredefinido(
  preset: PeriodoPredefinido,
): { from: string; to: string } {
  const now = new Date();
  switch (preset) {
    case "month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "quarter": {
      const start = subMonths(startOfMonth(now), 2);
      return {
        from: format(start, "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    }
    case "year":
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      };
    default:
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      };
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { profile, loading: autenticacaoCarregando } = useAuth();
  const podeGerenciar = isAdminLike(profile?.role);

  // Estado do período
  const [periodoPredefinido, setPeriodoPredefinido] =
    useState<PeriodoPredefinido>("year");
  const intervaloInicial = obterIntervaloPredefinido("year");
  const [dataInicial, setDataInicial] = useState<string>(intervaloInicial.from);
  const [dataFinal, setDataFinal] = useState<string>(intervaloInicial.to);

  function aplicarPreset(preset: PeriodoPredefinido) {
    setPeriodoPredefinido(preset);
    if (preset !== "custom") {
      const intervalo = obterIntervaloPredefinido(preset);
      setDataInicial(intervalo.from);
      setDataFinal(intervalo.to);
    }
  }

  // Estado da interface
  const [abaSelecionada, setAbaSelecionada] = useState<AbaRelatorio>("overview");
  const [buscaPendencias, setBuscaPendencias] = useState<string>("");
  const [filtroUnidade, setFiltroUnidade] = useState<string>("");
  const [filtroPostoGraduacao, setFiltroPostoGraduacao] =
    useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estado dos dados
  const [perfisAnaliticos, setPerfisAnaliticos] = useState<PerfilAnaliticoRow[]>(
    [],
  );
  const [agendamentosPeriodo, setAgendamentosPeriodo] = useState<
    AgendamentoAnaliticoRow[]
  >([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState<
    AgendamentoAnaliticoRow[]
  >([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);

  useEffect(() => {
    async function carregarDadosAnaliticos() {
      if (!podeGerenciar) return;
      setCarregandoDados(true);
      try {
        const fromTs = `${dataInicial}T00:00:00`;
        const toTs = `${dataFinal}T23:59:59`;

        const data = await fetchAnalyticsData(fromTs, toTs);

        setPerfisAnaliticos(data.profiles as PerfilAnaliticoRow[]);
        setAgendamentosPeriodo(data.bookings as AgendamentoAnaliticoRow[]);
        setTodosAgendamentos(data.allBookings as AgendamentoAnaliticoRow[]);
      } catch (error) {
        console.error(error);
        setPerfisAnaliticos([]);
        setAgendamentosPeriodo([]);
        setTodosAgendamentos([]);
        toast.error("Nao foi possivel carregar os dados analiticos.");
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarDadosAnaliticos();
  }, [dataInicial, dataFinal, podeGerenciar]);

  // Último agendamento por usuário (histórico completo)
  const ultimoAgendamentoPorUsuario = useMemo(() => {
    const mapaAgendamentos = new Map<string, AgendamentoAnaliticoRow>();
    for (const booking of todosAgendamentos) {
      if (!booking.user_id) continue;
      const agendamentoAtual = mapaAgendamentos.get(booking.user_id);
      const dataAgendamento = obterDataReferencia(booking);
      const dataAtual = agendamentoAtual
        ? obterDataReferencia(agendamentoAtual)
        : null;
      if (
        !agendamentoAtual ||
        (dataAgendamento && (!dataAtual || dataAgendamento > dataAtual))
      ) {
        mapaAgendamentos.set(booking.user_id, booking);
      }
    }
    return mapaAgendamentos;
  }, [todosAgendamentos]);

  const perfisAtivos = useMemo(
    () =>
      perfisAnaliticos.filter(
        (p) => p.active && p.full_name?.trim() && p.saram?.trim(),
      ),
    [perfisAnaliticos],
  );

  // Indicadores com base no resultado mais recente por militar
  const kpiApt = useMemo(
    () =>
      perfisAtivos.filter(
        (p) => ultimoAgendamentoPorUsuario.get(p.id)?.result_details === "apto",
      ).length,
    [perfisAtivos, ultimoAgendamentoPorUsuario],
  );
  const kpiInapt = useMemo(
    () =>
      perfisAtivos.filter(
        (p) =>
          ultimoAgendamentoPorUsuario.get(p.id)?.result_details === "inapto",
      ).length,
    [perfisAtivos, ultimoAgendamentoPorUsuario],
  );
  const kpiEvaluated = useMemo(
    () => perfisAtivos.filter((p) => ultimoAgendamentoPorUsuario.has(p.id)).length,
    [perfisAtivos, ultimoAgendamentoPorUsuario],
  );
  const kpiNotEvaluated = useMemo(
    () => perfisAtivos.filter((p) => !ultimoAgendamentoPorUsuario.has(p.id)).length,
    [perfisAtivos, ultimoAgendamentoPorUsuario],
  );
  const percentualAptidao = useMemo(
    () => clampPercent(kpiEvaluated > 0 ? (kpiApt / kpiEvaluated) * 100 : 0),
    [kpiApt, kpiEvaluated],
  );

  // Avaliações do período para a série de tendência
  const avaliacoesNoPeriodo = useMemo(
    () => agendamentosPeriodo.filter((b) => b.result_details !== null),
    [agendamentosPeriodo],
  );

  // Série de tendência
  const serieTendencia = useMemo<PontoTendencia[]>(() => {
    const start = new Date(`${dataInicial}T00:00:00`);
    const end = new Date(`${dataFinal}T23:59:59`);
    const monthKeys: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (isBefore(cursor, addDays(end, 1))) {
      monthKeys.push(format(cursor, "yyyy-MM"));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const bucket = new Map<
      string,
      { apt: number; inapt: number; total: number }
    >();
    monthKeys.forEach((k) => bucket.set(k, { apt: 0, inapt: 0, total: 0 }));
    avaliacoesNoPeriodo.forEach((b) => {
      const ref = obterDataReferencia(b);
      if (!ref) return;
      const key = format(new Date(ref), "yyyy-MM");
      const cur = bucket.get(key);
      if (!cur) return;
      cur.total += 1;
      if (b.result_details === "apto") cur.apt += 1;
      if (b.result_details === "inapto") cur.inapt += 1;
      bucket.set(key, cur);
    });
    return monthKeys.map((key) => {
      const m = bucket.get(key) ?? { apt: 0, inapt: 0, total: 0 };
      const percent = m.total > 0 ? clampPercent((m.apt / m.total) * 100) : 0;
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return { key, label: format(date, "MMM"), percent, ...m };
    });
  }, [dataInicial, dataFinal, avaliacoesNoPeriodo]);

  const pontosLinha = useMemo(() => {
    if (serieTendencia.length === 0) return "";
    if (serieTendencia.length === 1) {
      return `0,${200 - serieTendencia[0].percent * 2}`;
    }
    return serieTendencia
      .map(
        (pt, i) =>
          `${(i / (serieTendencia.length - 1)) * 500},${200 - pt.percent * 2}`,
      )
      .join(" ");
  }, [serieTendencia]);

  // Métricas por unidade
  const metricasPorUnidade = useMemo<MetricaUnidade[]>(() => {
    const map = new Map<
      string,
      { total: number; apt: number; inapt: number }
    >();
    perfisAtivos.forEach((item) => {
      const booking = ultimoAgendamentoPorUsuario.get(item.id);
      const unit = item.sector?.trim() || "--";
      const cur = map.get(unit) ?? { total: 0, apt: 0, inapt: 0 };
      cur.total += 1;
      if (booking?.result_details === "apto") cur.apt += 1;
      if (booking?.result_details === "inapto") cur.inapt += 1;
      map.set(unit, cur);
    });
    return Array.from(map.entries())
      .map(([unit, m]) => ({
        unit,
        total: m.total,
        apt: m.apt,
        inapt: m.inapt,
        pending: m.total - m.apt - m.inapt,
        percent: clampPercent(m.total > 0 ? (m.apt / m.total) * 100 : 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [perfisAtivos, ultimoAgendamentoPorUsuario]);

  // Linhas com revalidação pendente
  const linhasPendentes = useMemo<LinhaPendente[]>(() => {
    const now = new Date();
    const q = buscaPendencias.trim().toLowerCase();

    return perfisAtivos
      .map((item) => {
        const latest = ultimoAgendamentoPorUsuario.get(item.id);
        const latestDateRaw = latest
          ? (latest.test_date ?? latest.created_at ?? null)
          : null;
        const latestDate = latestDateRaw ? new Date(latestDateRaw) : null;
        const expirationDate = latestDate ? addYears(latestDate, 1) : null;

        const status: LinhaPendente["status"] = !expirationDate
          ? "Pendente"
          : isBefore(expirationDate, now)
            ? "Expirado"
            : isBefore(expirationDate, addDays(now, 60))
              ? "Pendente"
              : "Agendado";

        const priority: LinhaPendente["priority"] =
          status === "Expirado"
            ? "ALTA"
            : status === "Pendente"
              ? "MEDIA"
              : "BAIXA";

        return {
          id: item.id,
          priority,
          militaryName: item.full_name ?? "Sem nome",
          warName: item.war_name ?? null,
          identity: item.saram ?? "--",
          rank: item.rank ?? null,
          unit: item.sector?.trim() || "--",
          expiration: expirationDate
            ? format(expirationDate, "dd/MM/yyyy")
            : "--",
          status,
          lastResult:
            latest?.result_details === "apto" ||
            latest?.result_details === "inapto"
              ? (latest.result_details as "apto" | "inapto")
              : null,
        } satisfies LinhaPendente;
      })
      .filter((row) => row.status !== "Agendado")
      .filter(
        (row) =>
          !filtroUnidade ||
          row.unit.toLowerCase().includes(filtroUnidade.toLowerCase()),
      )
      .filter(
        (row) =>
          !filtroPostoGraduacao ||
          (row.rank ?? "")
            .toLowerCase()
            .includes(filtroPostoGraduacao.toLowerCase()),
      )
      .filter((row) => !filtroStatus || row.status === filtroStatus)
      .filter((row) => {
        if (!q) return true;
        return (
          (row.warName ?? row.militaryName).toLowerCase().includes(q) ||
          row.identity.toLowerCase().includes(q) ||
          row.unit.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const diff = ordemPrioridade(a.priority) - ordemPrioridade(b.priority);
        return diff !== 0 ? diff : a.militaryName.localeCompare(b.militaryName);
      });
  }, [
    perfisAtivos,
    ultimoAgendamentoPorUsuario,
    buscaPendencias,
    filtroUnidade,
    filtroPostoGraduacao,
    filtroStatus,
  ]);

  const opcoesUnidade = useMemo(
    () =>
      [
        ...new Set(
          perfisAtivos.map((p) => p.sector?.trim() || "--").filter(Boolean),
        ),
      ].sort(),
    [perfisAtivos],
  );
  const opcoesPostoGraduacao = useMemo(
    () =>
      [
        ...new Set(perfisAtivos.map((p) => p.rank).filter(Boolean)),
      ].sort() as string[],
    [perfisAtivos],
  );

  // Exportações CSV
  function exportPendingCSV() {
    const headers = [
      "Prioridade",
      "Nome de Guerra",
      "Nome Completo",
      "SARAM",
      "Graduacao",
      "Unidade",
      "Ultimo Resultado",
      "Validade",
      "Status",
    ];
    const rows = linhasPendentes.map((r) => [
      r.priority,
      r.warName ?? r.militaryName,
      r.militaryName,
      r.identity,
      r.rank ?? "--",
      r.unit,
      r.lastResult ?? "sem avaliacao",
      r.expiration,
      r.status,
    ]);
    downloadCSV(
      `revalidacao_pendente_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio exportado com sucesso.");
  }

  function exportUnitsCSV() {
    const headers = [
      "Unidade",
      "Total",
      "Aptos",
      "Inaptos",
      "Pendentes",
      "% Aptidao",
    ];
    const rows = metricasPorUnidade.map((u) => [
      u.unit,
      String(u.total),
      String(u.apt),
      String(u.inapt),
      String(u.pending),
      `${u.percent.toFixed(1)}%`,
    ]);
    downloadCSV(
      `desempenho_por_unidade_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio de unidades exportado.");
  }

  function exportFullCSV() {
    const now = new Date();
    const headers = [
      "Nome de Guerra",
      "Nome Completo",
      "SARAM",
      "Graduacao",
      "Unidade",
      "Ultimo Resultado",
      "Validade",
      "Status",
    ];
    const rows = perfisAtivos.map((p) => {
      const latest = ultimoAgendamentoPorUsuario.get(p.id);
      const latestDateRaw = latest
        ? (latest.test_date ?? latest.created_at ?? null)
        : null;
      const latestDate = latestDateRaw ? new Date(latestDateRaw) : null;
      const expiration = latestDate ? addYears(latestDate, 1) : null;
      const status = !expiration
        ? "Pendente"
        : isBefore(expiration, now)
          ? "Expirado"
          : isBefore(expiration, addDays(now, 60))
            ? "Pendente"
            : "Regular";
      return [
        p.war_name ?? p.full_name ?? "--",
        p.full_name ?? "--",
        p.saram ?? "--",
        p.rank ?? "--",
        p.sector?.trim() || "--",
        latest?.result_details ?? "sem avaliacao",
        expiration ? format(expiration, "dd/MM/yyyy") : "--",
        status,
      ];
    });
    downloadCSV(
      `efetivo_completo_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio completo exportado.");
  }

  // Mantém o loader após os hooks para preservar a ordem de execução.
  const carregandoPagina = autenticacaoCarregando || carregandoDados;

  if (carregandoPagina) {
    return <FullPageLoading message="Carregando painéis analíticos" />;
  }

  if (!podeGerenciar) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-error/30 bg-error/10 p-6 text-error">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5" size={20} />
            <div>
              <h1 className="text-lg font-bold">Acesso restrito</h1>
              <p className="mt-1 text-sm">
                Esta area de analytics esta disponivel apenas para
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
      <div
        className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="analytics-dashboard-page"
      >
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-2xl shadow-primary/20 md:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Operações Inteligência
                </h1>
                <p className="mt-2 text-sm font-normal text-white/80 md:text-base max-w-2xl">
                  Análise consolidada de prontidão operacional, avaliação de
                  pessoal e efetivo estratégico. Monitore índices de aptidão,
                  revalidações pendentes e desempenho por unidade.
                </p>
              </div>

              <div />
            </div>
          </div>
        </section>

        {/* Cabeçalho de filtros */}
        <header className="mb-6 rounded-3xl border border-border-default bg-bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-body uppercase tracking-widest">
                Período de Análise
              </h2>
              <p className="text-xs text-text-muted sm:text-sm">
                Defina o recorte temporal para leitura dos indicadores.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              {(
                ["month", "quarter", "year", "custom"] as PeriodoPredefinido[]
              ).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => aplicarPreset(p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors text-center ${
                      periodoPredefinido === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-default bg-bg-default text-text-muted hover:border-primary/40 hover:text-text-body"
                    }`}
                  >
                    {p === "month"
                      ? "Este mes"
                      : p === "quarter"
                        ? "Trimestre"
                        : p === "year"
                          ? "Este ano"
                          : "Personalizado"}
                  </button>
                ),
              )}
              {periodoPredefinido === "custom" && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-default bg-bg-default px-3 py-1.5 text-xs">
                  <CalendarDays size={12} className="text-text-muted" />
                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    className="bg-transparent text-text-body outline-none"
                  />
                  <span className="text-text-muted">—</span>
                  <input
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    className="bg-transparent text-text-body outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Abas */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-border-default pt-4 pb-1">
            {[
              {
                id: "overview" as AbaRelatorio,
                label: "Visao Geral",
                icon: BarChart2,
                badge: undefined as number | undefined,
              },
              {
                id: "pending" as AbaRelatorio,
                label: "Revalidacao Pendente",
                icon: ShieldAlert,
                badge: linhasPendentes.length,
              },
              {
                id: "units" as AbaRelatorio,
                label: "Por Unidade",
                icon: Users,
                badge: undefined as number | undefined,
              },
              {
                id: "export" as AbaRelatorio,
                label: "Exportar",
                icon: Download,
                badge: undefined as number | undefined,
              },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAbaSelecionada(id)}
                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  abaSelecionada === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border-default text-text-muted hover:border-primary/40 hover:text-text-body"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Aba: Visão geral */}
        {abaSelecionada === "overview" && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <CardIndicador
                label="Índice de Aptidão"
                value={carregandoDados ? null : `${percentualAptidao.toFixed(1)}%`}
                sub={
                  carregandoDados
                    ? ""
                    : `${kpiApt} aptos de ${kpiEvaluated} avaliados`
                }
                icon={<TrendingUp size={22} />}
                accent="success"
              />
              <CardIndicador
                label="Inaptidões Atuais"
                value={carregandoDados ? null : String(kpiInapt)}
                sub="última verificação registrada"
                icon={<AlertTriangle size={22} />}
                accent="error"
              />
              <CardIndicador
                label="Efetivo Ativo"
                value={carregandoDados ? null : String(perfisAtivos.length)}
                sub={
                  carregandoDados ? "" : `${kpiNotEvaluated} sem avaliação`
                }
                icon={<Users size={22} />}
                accent="primary"
              />
              <CardIndicador
                label="Avaliações no Período"
                value={carregandoDados ? null : String(avaliacoesNoPeriodo.length)}
                sub={
                  carregandoDados
                    ? ""
                    : `${agendamentosPeriodo.length} confirmadas`
                }
                icon={<TrendingUp size={22} />}
                accent="secondary"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-3xl border border-border-default bg-bg-card p-5 shadow-sm sm:p-6">
                <h3 className="text-xl font-bold text-text-body mb-6">
                  Aptidão por Unidade
                </h3>
                <div className="mt-4 space-y-5">
                  {carregandoDados ? (
                    <Esqueleto rows={4} />
                  ) : metricasPorUnidade.length === 0 ? (
                    <EstadoVazio text="Sem dados de unidade." />
                  ) : (
                    metricasPorUnidade.slice(0, 6).map((u) => (
                      <div key={u.unit} className="space-y-1.5">
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="font-medium text-text-body">
                            {u.unit}
                          </span>
                          <span className="text-xl font-bold text-primary">
                            {u.percent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border-default">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-secondary" : "bg-error"}`}
                            style={{ width: `${u.percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-muted">
                          {u.apt} aptos de {u.total} · {u.pending} pendentes
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-border-default bg-bg-card p-5 shadow-sm sm:p-6">
                <h3 className="text-xl font-bold text-text-body mb-6">
                  Evolução de Aptidão
                </h3>
                <div className="mt-4 h-[220px] w-full">
                  {carregandoDados ? (
                    <div className="h-full w-full animate-pulse rounded-xl bg-border-default" />
                  ) : serieTendencia.length === 0 ? (
                    <EstadoVazio text="Sem dados no período." />
                  ) : (
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 500 200"
                      preserveAspectRatio="none"
                    >
                      {[25, 50, 75].map((v) => (
                        <line
                          key={v}
                          x1="0"
                          y1={200 - v * 2}
                          x2="500"
                          y2={200 - v * 2}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-border-default"
                          strokeDasharray="4,6"
                        />
                      ))}
                      {pontosLinha && (
                        <polygon
                          points={`0,200 ${pontosLinha} 500,200`}
                          fill="currentColor"
                          className="text-primary/5"
                        />
                      )}
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="text-primary"
                        points={pontosLinha}
                      />
                      {serieTendencia.map((pt, i) => {
                        const x =
                          serieTendencia.length === 1
                            ? 250
                            : (i / (serieTendencia.length - 1)) * 500;
                        return (
                          <circle
                            key={pt.key}
                            cx={x}
                            cy={200 - pt.percent * 2}
                            r="4"
                            fill="currentColor"
                            className="text-primary"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
                <div className="mt-4 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {serieTendencia.map((pt) => (
                    <span key={pt.key}>{pt.label}</span>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {/* Aba: Revalidação pendente */}
        {abaSelecionada === "pending" && (
          <section className="rounded-lg border border-border-default bg-bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-6 py-4">
              <div className="flex items-center gap-3">
                <ShieldAlert size={16} className="text-secondary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-body">
                  Revalidação Pendente
                </h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {linhasPendentes.length} avaliando
                </span>
              </div>
              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start md:w-auto md:justify-end">
                <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    size={13}
                  />
                  <input
                    value={buscaPendencias}
                    onChange={(e) => setBuscaPendencias(e.target.value)}
                    placeholder="Buscar nome ou SARAM..."
                    className="w-full rounded-lg border border-border-default bg-bg-card py-1.5 pl-7 pr-3 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarFiltros((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${mostrarFiltros || filtroUnidade || filtroPostoGraduacao || filtroStatus ? "border-primary bg-primary/5 text-primary" : "border-border-default text-text-muted hover:border-text-body"}`}
                >
                  <Filter size={12} />
                  Filtros
                  {(filtroUnidade || filtroPostoGraduacao || filtroStatus) && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      {
                        [filtroUnidade, filtroPostoGraduacao, filtroStatus].filter(
                          Boolean,
                        ).length
                      }
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={exportPendingCSV}
                  className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>
            </div>

            {mostrarFiltros && (
              <div className="flex flex-col items-stretch gap-3 border-b border-border-default bg-bg-card px-5 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
                <SeletorFiltro
                  label="Unidade"
                  value={filtroUnidade}
                  onChange={setFiltroUnidade}
                  options={opcoesUnidade}
                  placeholder="Todas"
                />
                <SeletorFiltro
                  label="Graduacao"
                  value={filtroPostoGraduacao}
                  onChange={setFiltroPostoGraduacao}
                  options={opcoesPostoGraduacao}
                  placeholder="Todas"
                />
                <SeletorFiltro
                  label="Status"
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  options={["Expirado", "Pendente"]}
                  placeholder="Todos"
                />
                {(filtroUnidade || filtroPostoGraduacao || filtroStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroUnidade("");
                      setFiltroPostoGraduacao("");
                      setFiltroStatus("");
                    }}
                    className="mb-0.5 text-xs font-semibold text-error hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2 px-4 py-3 md:hidden">
              {carregandoDados ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Carregando dados...
                </p>
              ) : linhasPendentes.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Nenhuma revalidação pendente.
                </p>
              ) : (
                linhasPendentes.map((row) => {
                  const priorityColor =
                    row.priority === "ALTA"
                      ? "bg-error/10 text-error"
                      : row.priority === "MEDIA"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-secondary/10 text-secondary";
                  const statusColor =
                    row.status === "Expirado"
                      ? "text-error font-bold"
                      : "text-secondary font-bold";

                  return (
                    <article
                      key={row.id}
                      className="rounded-lg border border-border-default bg-bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${priorityColor}`}
                        >
                          {row.priority}
                        </span>
                        <span className={statusColor}>{row.status}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-body">
                          {row.warName ?? row.militaryName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {row.rank ? `${row.rank} · ` : ""}
                          {row.identity}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p className="text-text-muted">Unidade: {row.unit}</p>
                        <p className="text-text-muted">
                          Validade: {row.expiration}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border-default">
                        {row.lastResult ? (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${row.lastResult === "apto" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                          >
                            {row.lastResult}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Sem resultado
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Notificar
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-default text-xs font-bold uppercase tracking-wider text-text-muted">
                    {[
                      "Prioridade",
                      "Militar",
                      "Unidade",
                      "Último Resultado",
                      "Validade",
                      "Status",
                      "",
                    ].map((h) => (
                      <th key={h} className="px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {carregandoDados ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-text-muted"
                      >
                        Carregando dados...
                      </td>
                    </tr>
                  ) : linhasPendentes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-text-muted"
                      >
                        Nenhuma revalidação pendente.
                      </td>
                    </tr>
                  ) : (
                    linhasPendentes.map((row) => {
                      const priorityColor =
                        row.priority === "ALTA"
                          ? "bg-error/10 text-error"
                          : row.priority === "MEDIA"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-secondary/10 text-secondary";
                      const statusColor =
                        row.status === "Expirado"
                          ? "text-error font-bold"
                          : "text-secondary font-bold";
                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-bg-card"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${priorityColor}`}
                            >
                              {row.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-text-body">
                              {row.warName ?? row.militaryName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {row.rank ? `${row.rank} · ` : ""}
                              {row.identity}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {row.unit}
                          </td>
                          <td className="px-6 py-4">
                            {row.lastResult ? (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${row.lastResult === "apto" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                              >
                                {row.lastResult}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-text-muted">
                            {row.expiration}
                          </td>
                          <td className="px-6 py-4">
                            <span className={statusColor}>{row.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Notificar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border-default px-6 py-3 text-xs text-text-muted">
              {linhasPendentes.length} registro(s) exibido(s)
            </div>
          </section>
        )}

        {/* Aba: Por unidade */}
        {abaSelecionada === "units" && (
          <section className="rounded-lg border border-border-default bg-bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-6 py-4">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-body">
                  Desempenho por Unidade
                </h3>
              </div>
              <button
                type="button"
                onClick={exportUnitsCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <Download size={12} />
                CSV
              </button>
            </div>
            <div className="space-y-3 px-4 py-4 md:hidden">
              {carregandoDados ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Carregando...
                </p>
              ) : metricasPorUnidade.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Sem dados.
                </p>
              ) : (
                metricasPorUnidade.map((u) => (
                  <article
                    key={u.unit}
                    className="rounded-lg border border-border-default bg-bg-card p-4 space-y-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="font-semibold text-text-body">{u.unit}</h4>
                      <span className="text-lg font-bold text-primary">
                        {u.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-text-muted">Total</p>
                        <p className="font-semibold text-text-body">
                          {u.total}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted">Aptos</p>
                        <p className="font-semibold text-success">{u.apt}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Inaptos</p>
                        <p className="font-semibold text-error">{u.inapt}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Pendentes</p>
                        <p className="font-semibold text-text-body">
                          {u.pending}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border-default">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-secondary" : "bg-error"}`}
                        style={{ width: `${u.percent}%` }}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-default text-xs font-bold uppercase tracking-wider text-text-muted">
                    {[
                      "Unidade",
                      "Total",
                      "Aptos",
                      "Inaptos",
                      "Pendentes",
                      "% Aptidão",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-4 ${i > 0 && i < 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {carregandoDados ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-text-muted"
                      >
                        Carregando...
                      </td>
                    </tr>
                  ) : metricasPorUnidade.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-text-muted"
                      >
                        Sem dados.
                      </td>
                    </tr>
                  ) : (
                    metricasPorUnidade.map((u) => (
                      <tr
                        key={u.unit}
                        className="hover:bg-bg-card transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-text-body">
                          {u.unit}
                        </td>
                        <td className="px-6 py-4 text-right text-text-muted">
                          {u.total}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-success">
                          {u.apt}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-error">
                          {u.inapt}
                        </td>
                        <td className="px-6 py-4 text-right text-text-muted">
                          {u.pending}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-default min-w-[80px]">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-secondary" : "bg-error"}`}
                                style={{ width: `${u.percent}%` }}
                              />
                            </div>
                            <span className="w-12 text-right font-bold text-text-body">
                              {u.percent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Aba: Exportar */}
        {abaSelecionada === "export" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardExportacao
              title="Revalidação Pendente"
              description={`${linhasPendentes.length} militares com expiração próxima ou vencida para priorização de revalidação.`}
              format="CSV"
              icon={<ShieldAlert size={20} className="text-secondary" />}
              onExport={exportPendingCSV}
            />
            <CardExportacao
              title="Desempenho por Unidade"
              description={`${metricasPorUnidade.length} unidades com resumo de aptidão, inaptos, pendentes e métricas operacionais.`}
              format="CSV"
              icon={<BarChart2 size={20} className="text-primary" />}
              onExport={exportUnitsCSV}
            />
            <CardExportacao
              title="Efetivo Completo"
              description={`${perfisAtivos.length} militares ativos com status de avaliação e validade total registrada.`}
              format="CSV"
              icon={<FileText size={20} className="text-success" />}
              onExport={exportFullCSV}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
