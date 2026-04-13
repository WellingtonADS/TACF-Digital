/**
 * @page PersonnelManagement
 * @description Listagem e gestão de pessoal.
 * @path src/pages/PersonnelManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import {
  fetchPersonnelList,
  getProfileWithHistory,
  updateProfile,
} from "@/services/personnel";
import {
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Mail,
  Phone,
  Search,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  View,
  X,
  XCircle,
} from "@/icons";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LinhaMilitar = {
  id: string;
  fullName: string;
  warName: string | null;
  rank: string | null;
  sector: string | null;
  saram: string | null;
  active: boolean;
  lastTestDate: string | null;
  lastScore: number | null;
  status: "APTO" | "INAPTO" | "VENCIDO";
};

const RANK_OPTIONS = [
  "Todos",
  "Soldado",
  "Cabo",
  "3º Sargento",
  "2º Sargento",
  "1º Sargento",
  "Subtenente",
  "Aspirante",
  "2º Tenente",
  "1º Tenente",
  "Capitão",
  "Major",
  "Coronel",
  "General",
] as const;

const STATUS_OPTIONS = ["Todos", "APTO", "INAPTO", "VENCIDO"] as const;

const STATUS_BADGE_CLASS: Record<LinhaMilitar["status"], string> = {
  APTO: "bg-success/10 text-success",
  VENCIDO: "bg-alert/10 text-alert",
  INAPTO: "bg-error/10 text-error",
};

const DETAIL_STATUS_BADGE_CLASS: Record<LinhaMilitar["status"], string> = {
  APTO: "bg-success/10 text-success",
  INAPTO: "bg-error/10 text-error",
  VENCIDO: "bg-alert/10 text-alert",
};

function derivarStatus(
  active: boolean,
  lastTestDate: string | null,
  lastScore: number | null,
  resultDetails: unknown,
): LinhaMilitar["status"] {
  if (!active) return "INAPTO";
  if (!lastTestDate) return "INAPTO";

  const explicitResult = normalizarResultadoAptidao(resultDetails);
  const testDate = parsearData(lastTestDate);
  if (!testDate) return "INAPTO";
  const daysSinceTest =
    (Date.now() - testDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceTest > 365) return "VENCIDO";
  if (explicitResult === "inapto") return "INAPTO";
  if (explicitResult === "apto") return "APTO";
  if (lastScore === null) return "INAPTO";

  return "APTO";
}

function parsearData(value: string | null): Date | null {
  if (!value) return null;

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const parsed = dateOnlyPattern.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizarResultadoAptidao(raw: unknown): "apto" | "inapto" | null {
  if (raw == null) return null;

  if (raw === "apto" || raw === "inapto") return raw;

  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "apto" || normalized === "inapto") return normalized;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed === "apto" || parsed === "inapto") return parsed;
      if (
        parsed &&
        typeof parsed === "object" &&
        "result_status" in parsed &&
        ((parsed as { result_status?: unknown }).result_status === "apto" ||
          (parsed as { result_status?: unknown }).result_status === "inapto")
      ) {
        return (parsed as { result_status: "apto" | "inapto" }).result_status;
      }
    } catch {
      return null;
    }
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    "result_status" in raw &&
    ((raw as { result_status?: unknown }).result_status === "apto" ||
      (raw as { result_status?: unknown }).result_status === "inapto")
  ) {
    return (raw as { result_status: "apto" | "inapto" }).result_status;
  }

  return null;
}

function iniciaisNome(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function rotuloData(value: string | null) {
  const parsed = parsearData(value);
  if (!parsed) return "--";
  return format(parsed, "dd/MM/yyyy");
}

type RegistroTeste = {
  id: string;
  date: string | null;
  score: number | null;
  status: string;
};

type DetalheMilitar = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  rank: string | null;
  sector: string | null;
  saram: string | null;
  email: string | null;
  phone_number: string | null;
  role: string | null;
  active: boolean;
  birth_date: string | null;
  physical_group: string | null;
  inspsau_valid_until: string | null;
  inspsau_last_inspection: string | null;
  created_at: string | null;
  lastTestDate: string | null;
  lastScore: number | null;
  status: LinhaMilitar["status"];
  testHistory: RegistroTeste[];
};

export default function PersonnelManagement() {
  const [linhas, setLinhas] = useState<LinhaMilitar[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>("");
  const [filtroPosto, setFiltroPosto] =
    useState<(typeof RANK_OPTIONS)[number]>("Todos");
  const [filtroStatus, setFiltroStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos");

  // Drawer de detalhe
  const [militarSelecionado, setMilitarSelecionado] =
    useState<LinhaMilitar | null>(null);
  const [detalheMilitar, setDetalheMilitar] = useState<DetalheMilitar | null>(
    null,
  );
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [salvandoAtivacao, setSalvandoAtivacao] = useState(false);

  async function alternarAtivacao(novoAtivo: boolean) {
    if (!detalheMilitar || !militarSelecionado) return;
    setSalvandoAtivacao(true);
    try {
      await updateProfile(militarSelecionado.id, { active: novoAtivo });
      setDetalheMilitar((estadoAtual) =>
        estadoAtual ? { ...estadoAtual, active: novoAtivo } : estadoAtual,
      );
      setLinhas((estadoAtual) =>
        estadoAtual.map((linha) =>
          linha.id === militarSelecionado.id
            ? { ...linha, active: novoAtivo }
            : linha,
        ),
      );
      toast.success(novoAtivo ? "Militar ativado." : "Militar inativado.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setSalvandoAtivacao(false);
    }
  }

  async function abrirPerfil(linha: LinhaMilitar) {
    setMilitarSelecionado(linha);
    // Popula imediatamente com os dados que já temos; o drawer não fica vazio
    setDetalheMilitar({
      id: linha.id,
      full_name: linha.fullName,
      war_name: linha.warName,
      rank: linha.rank,
      sector: linha.sector,
      saram: linha.saram,
      email: null,
      phone_number: null,
      role: null,
      active: linha.active,
      birth_date: null,
      physical_group: null,
      inspsau_valid_until: null,
      inspsau_last_inspection: null,
      created_at: null,
      lastTestDate: linha.lastTestDate,
      lastScore: linha.lastScore,
      status: linha.status,
      testHistory: [],
    });
    setCarregandoDetalhe(true);
    try {
      const detail = await getProfileWithHistory(linha.id);
      setDetalheMilitar((estadoAtual) => ({
        ...(estadoAtual ?? {}),
        id: linha.id,
        full_name: detail?.full_name ?? linha.fullName,
        war_name: detail?.war_name ?? linha.warName,
        rank: detail?.rank ?? linha.rank,
        sector: detail?.sector ?? linha.sector,
        saram: detail?.saram ?? linha.saram,
        email: detail?.email ?? null,
        phone_number: detail?.phone_number ?? null,
        role: detail?.role ?? null,
        active: detail != null ? detail.active : linha.active,
        birth_date: detail?.birth_date ?? null,
        physical_group: detail?.physical_group ?? null,
        inspsau_valid_until: detail?.inspsau_valid_until ?? null,
        inspsau_last_inspection: detail?.inspsau_last_inspection ?? null,
        created_at: detail?.created_at ?? null,
        lastTestDate: linha.lastTestDate,
        lastScore: linha.lastScore,
        status: linha.status,
        testHistory: detail?.testHistory ?? [],
      }));
    } catch (err) {
      console.error("[abrirPerfil] unexpected error:", err);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharPainel() {
    setMilitarSelecionado(null);
    setDetalheMilitar(null);
  }

  useEffect(() => {
    setCarregando(true);
    fetchPersonnelList()
      .then(({ profiles, latestBookings }) => {
        const linhasMapeadas: LinhaMilitar[] = profiles.map((profile) => {
          const latest = latestBookings.get(profile.id);
          const lastDate = latest?.test_date ?? latest?.created_at ?? null;
          const status = derivarStatus(
            Boolean(profile.active),
            lastDate,
            latest?.score ?? null,
            latest?.result_details ?? null,
          );
          return {
            id: profile.id,
            fullName: profile.full_name ?? "Sem nome",
            warName: profile.war_name ?? null,
            rank: profile.rank ?? null,
            sector: profile.sector ?? null,
            saram: profile.saram ?? null,
            active: Boolean(profile.active),
            lastTestDate: lastDate,
            lastScore: latest?.score ?? null,
            status,
          };
        });
        setLinhas(linhasMapeadas);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  const linhasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return linhas.filter((linha) => {
      const correspondeBusca =
        buscaNormalizada.length === 0 ||
        linha.fullName.toLowerCase().includes(buscaNormalizada) ||
        (linha.warName ?? "").toLowerCase().includes(buscaNormalizada) ||
        (linha.saram ?? "").includes(buscaNormalizada);
      const correspondePosto =
        filtroPosto === "Todos" || linha.rank === filtroPosto;
      const correspondeStatus =
        filtroStatus === "Todos" || linha.status === filtroStatus;
      return correspondeBusca && correspondePosto && correspondeStatus;
    });
  }, [linhas, busca, filtroPosto, filtroStatus]);

  const resumo = useMemo(() => {
    const apto = linhas.filter((linha) => linha.status === "APTO").length;
    const vencido = linhas.filter((linha) => linha.status === "VENCIDO").length;
    const inapto = linhas.filter((linha) => linha.status === "INAPTO").length;
    const agora = new Date();
    const testesNoMes = linhas.filter((linha) => {
      if (!linha.lastTestDate) return false;
      const date = parsearData(linha.lastTestDate);
      if (!date) return false;
      return (
        date.getMonth() === agora.getMonth() &&
        date.getFullYear() === agora.getFullYear()
      );
    }).length;
    const percentualApto =
      linhas.length > 0 ? Math.round((apto / linhas.length) * 100) : 0;
    return { apto, vencido, inapto, testesNoMes, percentualApto };
  }, [linhas]);

  if (carregando) {
    return <FullPageLoading message="Carregando efetivo" />;
  }

  return (
    <Layout>
      <div
        className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="personnel-management-page"
      >
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-2xl shadow-primary/20 md:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Gestão de Efetivo
                </h1>
                <p className="mt-2 text-sm font-normal text-white/80 md:text-base">
                  Controle operacional de militares, aptidão e prontidão para
                  sessão TACF.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 rounded-3xl border border-border-default bg-bg-card p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-center">
            <div className="relative min-w-0">
              <AppIcon
                icon={Search}
                size="sm"
                decorative
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border-default bg-bg-default pl-11 pr-11 text-sm text-text-body placeholder:text-text-muted focus-ring"
                placeholder="Buscar por nome, nome de guerra ou SARAM"
                type="text"
              />
              {busca.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-card hover:text-text-body"
                  title="Limpar busca"
                  aria-label="Limpar busca"
                >
                  <AppIcon icon={X} size="xs" decorative />
                </button>
              )}
            </div>

            <select
              value={filtroPosto}
              onChange={(event) =>
                setFiltroPosto(
                  event.target.value as (typeof RANK_OPTIONS)[number],
                )
              }
              className="h-12 w-full rounded-2xl border border-border-default bg-bg-default px-4 text-sm font-medium text-text-muted focus-ring"
              aria-label="Filtrar por posto ou graduação"
            >
              <option value="Todos">Posto/Graduação</option>
              {RANK_OPTIONS.filter((item) => item !== "Todos").map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(
                  event.target.value as (typeof STATUS_OPTIONS)[number],
                )
              }
              className="h-12 w-full rounded-2xl border border-border-default bg-bg-default px-4 text-sm font-medium text-text-muted focus-ring"
              aria-label="Filtrar por status de aptidão"
            >
              <option value="Todos">Status de Aptidão</option>
              {STATUS_OPTIONS.filter((item) => item !== "Todos").map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Aptidão Geral"
            value={`${resumo.percentualApto}%`}
            icon={Shield}
          />

          <StatCard title="Total do Efetivo" value={linhas.length} icon={Users} />

          <StatCard
            title="Testes no Mês"
            value={resumo.testesNoMes}
            icon={TrendingUp}
          />

          <StatCard
            title="Militares Aptos"
            value={resumo.apto}
            icon={CheckCircle2}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
        </section>

        <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
          <div className="space-y-2 p-3 md:hidden">
            {linhasFiltradas.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text-muted">
                Nenhum militar encontrado para os filtros selecionados.
              </p>
            ) : (
              linhasFiltradas.map((linha) => {
                const statusClass = STATUS_BADGE_CLASS[linha.status];

                return (
                  <article
                    key={linha.id}
                    className="rounded-xl border border-border-default bg-bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-text-body">
                          {linha.rank
                            ? `${linha.rank} ${linha.warName || linha.fullName}`
                            : linha.fullName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {linha.sector || "Sem setor"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirPerfil(linha)}
                        className="p-2 text-text-muted transition-colors hover:text-primary"
                        title="Ver perfil"
                      >
                        <AppIcon icon={View} size="sm" decorative />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-text-muted">
                        SARAM: {linha.saram || "--"}
                      </p>
                      <p className="text-text-muted">
                        Último Teste: {rotuloData(linha.lastTestDate)}
                      </p>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {linha.status}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-bg-default/60">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Militar
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-text-muted">
                    SARAM
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-text-muted">
                    Último Teste
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-text-muted">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-default">
                {linhasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-text-muted"
                      colSpan={5}
                    >
                      Nenhum militar encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  linhasFiltradas.map((linha) => {
                    const statusClass = STATUS_BADGE_CLASS[linha.status];

                    return (
                      <tr
                        key={linha.id}
                        className="transition-colors hover:bg-bg-default/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {iniciaisNome(linha.warName || linha.fullName)}
                            </div>
                            <div>
                              <div className="font-bold text-text-body">
                                {linha.rank
                                  ? `${linha.rank} ${linha.warName || linha.fullName}`
                                  : linha.fullName}
                              </div>
                              <div className="text-xs text-text-muted">
                                {linha.sector || "Sem setor"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center font-mono text-sm text-text-muted">
                          {linha.saram || "--"}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-text-muted">
                          {rotuloData(linha.lastTestDate)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {linha.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => abrirPerfil(linha)}
                            className="p-2 text-text-muted transition-colors hover:text-primary"
                            title="Ver perfil"
                          >
                            <AppIcon icon={View} size="sm" decorative />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-bg-default p-6">
            <span className="text-sm font-medium text-text-muted">
              Mostrando {linhasFiltradas.length} de {linhas.length} militares
            </span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-border-default bg-bg-card text-xs font-bold text-text-muted">
                1
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Drawer de perfil ───────────────────────────────────────── */}
      {militarSelecionado && (
        <>
          {/* Overlay — acima da sidebar (z-50) */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={fecharPainel}
          />

          {/* Painel */}
          <aside className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-bg-card shadow-2xl">
            {/* Header do drawer */}
            <div className="flex items-center justify-between border-b border-border-default px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {iniciaisNome(militarSelecionado.fullName)}
                </div>
                <div>
                  <p className="font-bold text-text-body">
                    {militarSelecionado.fullName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {militarSelecionado.rank ?? "Sem posto"} ·{" "}
                    {militarSelecionado.warName ?? "--"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharPainel}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-default hover:text-text-body"
              >
                <AppIcon icon={X} size="sm" decorative />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {detalheMilitar ? (
                <div className="space-y-6">
                  {/* Status badge + toggle ativo/inativo */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(
                        Object.keys(
                          DETAIL_STATUS_BADGE_CLASS,
                        ) as LinhaMilitar["status"][]
                      ).map((s) =>
                        detalheMilitar.status === s ? (
                          <span
                            key={s}
                            className={`rounded-full px-3 py-1 text-xs font-bold ${DETAIL_STATUS_BADGE_CLASS[s]}`}
                          >
                            {s}
                          </span>
                        ) : null,
                      )}
                    </div>

                    {/* Toggle conta ativa/inativa */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={salvandoAtivacao || detalheMilitar.active}
                        onClick={() => alternarAtivacao(true)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                          detalheMilitar.active
                            ? "border-success bg-success/10 text-success"
                            : "border-border-default text-text-muted hover:border-success/40 disabled:opacity-100"
                        }`}
                      >
                        {salvandoAtivacao && !detalheMilitar.active ? (
                          <AppIcon
                            icon={Loader2}
                            size="xs"
                            decorative
                            className="animate-spin"
                          />
                        ) : (
                          <AppIcon icon={UserCheck} size="xs" decorative />
                        )}
                        Ativo
                      </button>
                      <button
                        type="button"
                        disabled={salvandoAtivacao || !detalheMilitar.active}
                        onClick={() => alternarAtivacao(false)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                          !detalheMilitar.active
                            ? "border-error bg-error/10 text-error"
                            : "border-border-default text-text-muted hover:border-error/40 disabled:opacity-100"
                        }`}
                      >
                        {salvandoAtivacao && detalheMilitar.active ? (
                          <AppIcon
                            icon={Loader2}
                            size="xs"
                            decorative
                            className="animate-spin"
                          />
                        ) : (
                          <AppIcon icon={UserX} size="xs" decorative />
                        )}
                        Inativo
                      </button>
                    </div>
                  </div>

                  {/* Dados pessoais */}
                  <section className="space-y-3 rounded-xl border border-border-default p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <AppIcon icon={Shield} size="xs" decorative />{" "}
                      Identificação
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-text-muted">SARAM</dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.saram ?? "--"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Posto/Graduação</dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.rank ?? "--"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Nome de Guerra</dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.war_name ?? "--"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Setor</dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.sector ?? "--"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Grupo Físico</dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.physical_group ?? "--"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Data de Nascimento</dt>
                        <dd className="font-semibold text-text-body">
                          {rotuloData(detalheMilitar.birth_date)}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* Contacto */}
                  <section className="space-y-3 rounded-xl border border-border-default p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <AppIcon icon={Mail} size="xs" decorative /> Contato
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-1.5 text-text-muted">
                          <AppIcon icon={Mail} size="xs" decorative /> E-mail
                        </dt>
                        <dd className="truncate font-semibold text-text-body">
                          {detalheMilitar.email ?? "--"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-text-muted">
                          <AppIcon icon={Phone} size="xs" decorative /> Telefone
                        </dt>
                        <dd className="font-semibold text-text-body">
                          {detalheMilitar.phone_number ?? "--"}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* INSPSAU */}
                  <section className="space-y-3 rounded-xl border border-border-default p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <AppIcon icon={Award} size="xs" decorative /> Inspeção de
                      Saúde (INSPSAU)
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Última Inspeção</dt>
                        <dd className="font-semibold text-text-body">
                          {rotuloData(detalheMilitar.inspsau_last_inspection)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Válida até</dt>
                        <dd className="font-semibold text-text-body">
                          {rotuloData(detalheMilitar.inspsau_valid_until)}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* Histórico de testes TACF */}
                  <section className="space-y-3 rounded-xl border border-border-default p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <AppIcon icon={ClipboardList} size="xs" decorative />{" "}
                      Histórico TACF
                    </h3>

                    {detalheMilitar.testHistory.length === 0 ? (
                      <p className="text-xs text-text-muted py-1">
                        Nenhum teste registrado.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {detalheMilitar.testHistory.map((t, idx) => {
                          const isFirst = idx === 0;
                          const hasScore = t.score !== null;
                          const scoreColor =
                            t.score !== null && t.score >= 70
                              ? "text-success"
                              : t.score !== null
                                ? "text-error"
                                : "text-text-muted";
                          return (
                            <li
                              key={t.id}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                isFirst
                                  ? "bg-primary/5 border border-primary/20"
                                  : "bg-bg-default"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {hasScore ? (
                                  t.score! >= 70 ? (
                                    <AppIcon
                                      icon={CheckCircle2}
                                      size="xs"
                                      decorative
                                      className="shrink-0 text-success"
                                    />
                                  ) : (
                                    <AppIcon
                                      icon={XCircle}
                                      size="xs"
                                      decorative
                                      className="shrink-0 text-error"
                                    />
                                  )
                                ) : (
                                  <AppIcon
                                    icon={FileText}
                                    size="xs"
                                    decorative
                                    className="shrink-0 text-text-muted"
                                  />
                                )}
                                <span className="text-text-muted">
                                  {rotuloData(t.date)}
                                </span>
                                {isFirst && (
                                  <span className="text-[10px] font-bold text-primary uppercase">
                                    Último
                                  </span>
                                )}
                              </div>
                              <span
                                className={`font-bold tabular-nums ${scoreColor}`}
                              >
                                {t.score !== null ? t.score : "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>

                  {/* Cadastro */}
                  <p className="flex items-center gap-1.5 text-xs text-text-muted">
                    <AppIcon icon={Calendar} size="xs" decorative />
                    Cadastrado em {rotuloData(detalheMilitar.created_at)}
                  </p>

                  {/* Indicador de carregamento de dados extras */}
                  {carregandoDetalhe && (
                    <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
                      <AppIcon
                        icon={Loader2}
                        size="xs"
                        decorative
                        className="animate-spin"
                      />
                      Carregando informações adicionais...
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </aside>
        </>
      )}
    </Layout>
  );
}
