/**
 * @page SystemSettings
 * @description Configurações centrais do sistema.
 * @path src/pages/SystemSettings.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  fetchAuditLogs,
  fetchSystemSettings,
  saveSystemSettings,
} from "@/services/systemSettings";
import {
  BarChart2,
  Clock3,
  Download,
  Edit2,
  MapPin,
  Settings,
  ShieldCheck,
  UserCircle2,
  type LucideIcon,
} from "@/icons";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
} from "@/types";
import { formatDateTimePtBr } from "@/utils/date";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ConfiguracaoSistemaRow = DBSystemSettingsRow;
type RegistroAuditoriaRow = DBAuditLogRow;

const SECOES_CONFIGURACAO = [
  { key: "general", label: "Geral", icon: Settings },
  { key: "evaluation", label: "Tabelas de Avaliação", icon: BarChart2 },
  { key: "locations", label: "Locais / OM", icon: MapPin },
  { key: "profiles", label: "Perfis de Acesso", icon: ShieldCheck },
  { key: "audit", label: "Logs de Auditoria", icon: Clock3 },
] as const;

type ChaveSecao = (typeof SECOES_CONFIGURACAO)[number]["key"];
type ItemSecao = { key: ChaveSecao; label: string; icon: LucideIcon };

export default function SystemSettings() {
  const navigate = useNavigate();
  const { profile, loading: autenticacaoCarregando } = useAuth();
  const podeVisualizar = profile?.role === "admin";
  const [secaoAtiva, setSecaoAtiva] = useState<ChaveSecao>("evaluation");
  const [configuracoes, setConfiguracoes] =
    useState<ConfiguracaoSistemaRow | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoConfiguracoes, setCarregandoConfiguracoes] = useState(true);

  const [registrosAuditoria, setRegistrosAuditoria] = useState<
    RegistroAuditoriaRow[]
  >([]);
  const [carregandoAuditoria, setCarregandoAuditoria] = useState(false);

  // Estado da edição das tabelas de avaliação
  const [padraoEditandoId, setPadraoEditandoId] = useState<string | null>(
    null,
  );
  const [formularioEdicao, setFormularioEdicao] = useState({
    corrida: "",
    flexao: "",
    abdominal: "",
  });

  // Estado local do formulário da aba "Geral"
  const [formularioGeral, setFormularioGeral] = useState<
    Partial<ConfiguracaoSistemaRow>
  >({});

  useEffect(() => {
    if (!podeVisualizar) {
      setCarregandoConfiguracoes(false);
      return;
    }

    async function carregarConfiguracoes() {
      setCarregandoConfiguracoes(true);
      setCarregando(true);
      try {
        const data = await fetchSystemSettings();
        setConfiguracoes(data);
        setFormularioGeral(data ?? {});
      } catch (err) {
        console.error(err);
        const authMessage = getAuthorizationErrorMessage(
          err,
          "visualizar configurações do sistema",
        );
        toast.error(authMessage ?? "Falha ao carregar configurações");
      } finally {
        setCarregando(false);
        setCarregandoConfiguracoes(false);
      }
    }
    carregarConfiguracoes();
  }, [podeVisualizar]);

  useEffect(() => {
    if (secaoAtiva === "audit" && podeVisualizar) {
      const carregarLogs = async () => {
        setCarregandoAuditoria(true);
        try {
          const data = await fetchAuditLogs();
          setRegistrosAuditoria(data);
        } catch (err) {
          console.error(err);
          const authMessage = getAuthorizationErrorMessage(
            err,
            "visualizar logs de auditoria",
          );
          toast.error(authMessage ?? "Erro ao carregar logs de auditoria");
        } finally {
          setCarregandoAuditoria(false);
        }
      };

      carregarLogs();
    }
  }, [secaoAtiva, podeVisualizar]);

  async function salvarConfiguracoesGerais() {
    if (!configuracoes) return;
    setCarregando(true);
    try {
      const updated = await saveSystemSettings(
        configuracoes.id,
        formularioGeral,
      );
      toast.success("Configurações salvas");
      setConfiguracoes(updated);
      setFormularioGeral(updated ?? {});
    } catch (err) {
      console.error(err);
      const authMessage = getAuthorizationErrorMessage(
        err,
        "salvar configurações do sistema",
      );
      toast.error(authMessage ?? "Falha ao salvar configurações");
    } finally {
      setCarregando(false);
    }
  }

  function renderizarConteudo() {
    if (carregando && secaoAtiva === "general") {
      return (
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-border-default" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-border-default" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-border-default" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-border-default" />
        </div>
      );
    }

    switch (secaoAtiva) {
      case "general":
        return (
          <div>
            <h2 className="mb-4 text-lg font-bold text-text-body">
              Parâmetros Globais
            </h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-body">
                  Nome do Sistema
                </label>
                <input
                  type="text"
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body placeholder:text-text-muted focus-ring"
                  value={formularioGeral.system_name ?? ""}
                  onChange={(e) =>
                    setFormularioGeral((estadoAtual) => ({
                      ...estadoAtual,
                      system_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-body">
                  Organização
                </label>
                <input
                  type="text"
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body placeholder:text-text-muted focus-ring"
                  value={formularioGeral.organization_name ?? ""}
                  onChange={(e) =>
                    setFormularioGeral((estadoAtual) => ({
                      ...estadoAtual,
                      organization_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-body">
                    Capacidade mínima
                  </label>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body focus-ring"
                    value={formularioGeral.min_capacity ?? 0}
                    onChange={(e) =>
                      setFormularioGeral((estadoAtual) => ({
                        ...estadoAtual,
                        min_capacity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-body">
                    Capacidade máxima
                  </label>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body focus-ring"
                    value={formularioGeral.max_capacity ?? 0}
                    onChange={(e) =>
                      setFormularioGeral((estadoAtual) => ({
                        ...estadoAtual,
                        max_capacity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="allow_swaps"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-default text-primary focus-ring"
                  checked={Boolean(formularioGeral.allow_swaps)}
                  onChange={(e) =>
                    setFormularioGeral((estadoAtual) => ({
                      ...estadoAtual,
                      allow_swaps: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="allow_swaps" className="text-sm text-text-body">
                  Permitir trocas
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="require_quorum"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-default text-primary focus-ring"
                  checked={Boolean(formularioGeral.require_quorum)}
                  onChange={(e) =>
                    setFormularioGeral((estadoAtual) => ({
                      ...estadoAtual,
                      require_quorum: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="require_quorum"
                  className="text-sm text-text-body"
                >
                  Exigir quórum
                </label>
              </div>
              <div>
                <button
                  onClick={salvarConfiguracoesGerais}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                  disabled={carregando}
                  type="button"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        );
      case "evaluation":
        return (
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-6 border-b border-border-default">
              <div className="flex flex-wrap gap-4 sm:gap-8">
                <button className="border-b-2 border-primary pb-4 text-sm font-bold text-primary">
                  Masculino
                </button>
                <button className="pb-4 text-sm font-medium text-text-muted hover:text-primary transition-colors">
                  Feminino
                </button>
              </div>
              <div className="pb-4">
                <button className="flex items-center text-primary text-sm font-semibold hover:underline">
                  <AppIcon
                    icon={Download}
                    size="sm"
                    className="mr-1"
                    decorative
                  />
                  Exportar PDF
                </button>
              </div>
            </div>
            <p className="text-text-muted text-sm mb-6">
              Defina os requisitos mínimos de desempenho para cada categoria
              etária.
            </p>
            <div className="border border-border-default rounded-xl mb-10">
              <div className="space-y-2 p-3 md:hidden">
                <article className="rounded-lg border border-border-default bg-bg-card p-3">
                  <p className="text-sm font-semibold text-text-body">
                    Até 24 anos
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-muted">
                    <p>Corrida: 12:00</p>
                    <p>Flexão: 30</p>
                    <p>Abdominal: 35</p>
                    <p>Conceito: EXCELENTE</p>
                  </div>
                </article>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[480px] text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider">
                        Idade
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Corrida (Min)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Flexão (Rep)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Abdominal (Rep)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider">
                        Conceito
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {/* linhas de exemplo; em produção os dados virão da API */}
                    <tr className="hover:bg-bg-card transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-text-body">
                        Até 24 anos
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        12:00
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        30
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        35
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="rounded px-2 py-1 text-xs font-bold bg-success/10 text-success">
                          EXCELENTE
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setPadraoEditandoId("24");
                            setFormularioEdicao({
                              corrida: "12:00",
                              flexao: "30",
                              abdominal: "35",
                            });
                          }}
                          className="p-2 text-text-muted hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <AppIcon icon={Edit2} size="sm" decorative />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "locations":
        return (
          <div className="py-6">
            <p className="mb-4">
              A gestão de Locais / Organizações Militares foi movida para uma
              página dedicada. Utilize o botão abaixo para acessar a ferramenta
              completa.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/app/om-locations")}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
            >
              Ir para Gestão de Locais e OMs
            </button>
          </div>
        );
      case "profiles":
        return (
          <div className="py-6">
            <p className="mb-4">
              A gestão de Perfis de Acesso agora possui tela dedicada.
            </p>
            <button
              type="button"
              onClick={() => navigate("/app/configuracoes/perfis")}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
            >
              Ir para Gestão de Perfis de Acesso
            </button>
          </div>
        );
      case "audit":
        return (
          <div>
            <h2 className="mb-4 text-lg font-bold text-text-body">
              Logs de Auditoria
            </h2>
            {carregandoAuditoria ? (
              <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <div className="space-y-2 p-3 md:hidden">
                  {registrosAuditoria.map((log) => (
                    <article
                      key={log.id}
                      className="rounded-lg border border-border-default bg-bg-card p-3"
                    >
                      <p className="text-xs font-bold uppercase text-text-muted">
                        {log.action}
                      </p>
                      <p className="mt-1 text-sm text-text-body">
                        Entidade: {log.entity}
                      </p>
                      <p className="text-sm text-text-body">
                        Usuário: {log.user_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDateTimePtBr(log.created_at ?? "")}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="hidden md:block">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="px-4 py-2 text-xs font-bold uppercase">
                          Ação
                        </th>
                        <th className="px-4 py-2 text-xs font-bold uppercase">
                          Entidade
                        </th>
                        <th className="px-4 py-2 text-xs font-bold uppercase">
                          Usuário
                        </th>
                        <th className="px-4 py-2 text-xs font-bold uppercase">
                          Horário
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {registrosAuditoria.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-bg-card transition-colors"
                        >
                          <td className="px-4 py-2 text-sm">{log.action}</td>
                          <td className="px-4 py-2 text-sm">{log.entity}</td>
                          <td className="px-4 py-2 text-sm">{log.user_name}</td>
                          <td className="px-4 py-2 text-sm">
                            {formatDateTimePtBr(log.created_at ?? "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  const paginaCarregando =
    autenticacaoCarregando || carregandoConfiguracoes;

  if (paginaCarregando) {
    return <FullPageLoading message="Carregando configuracoes" />;
  }

  if (!podeVisualizar) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-error/30 bg-error/10 p-6 text-error">
          <p className="text-sm font-semibold">Acesso não autorizado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="system-settings-page"
      >
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-2xl shadow-primary/20 md:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Configurações do Sistema
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-normal text-white/80 md:text-base">
                  Ajuste parâmetros globais, perfis de acesso e auditoria em um
                  único painel administrativo.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                    Perfil Atual
                  </span>
                  <span className="text-sm font-bold text-white">
                    {profile?.full_name ?? "Administrador"}
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
                  <AppIcon icon={UserCircle2} size="md" decorative />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="bg-bg-card rounded-3xl border border-border-default shadow-sm">
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                  Seções
                </p>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
              <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {(SECOES_CONFIGURACAO as ReadonlyArray<ItemSecao>).map((tab) => {
                  const active = tab.key === secaoAtiva;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSecaoAtiva(tab.key)}
                      aria-current={active ? "page" : undefined}
                      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold focus-ring ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                          : "bg-bg-default border-transparent text-text-muted hover:bg-primary/5"
                      }`}
                    >
                      <AppIcon icon={tab.icon} size="sm" decorative />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="hidden md:flex items-center gap-3 text-xs text-text-muted border-t border-border-default pt-4">
                <span className="h-2 w-2 rounded-full bg-success"></span>
                Sistema Operacional
              </div>
            </div>
          </aside>

          <section className="bg-bg-card rounded-3xl border border-border-default shadow-sm min-h-[480px]">
            <div className="p-4 sm:p-6 lg:p-8">{renderizarConteudo()}</div>
          </section>
        </div>

        {/* Janela de edição das tabelas de avaliação */}
        {padraoEditandoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-default shadow-2xl">
              {/* Cabeçalho */}
              <div className="border-b border-border-default bg-bg-default/50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-body">
                  Editar Requisitos - Até 24 anos
                </h2>
                <button
                  type="button"
                  onClick={() => setPadraoEditandoId(null)}
                  className="text-text-muted hover:text-text-body transition-colors"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Corrida (minutos)
                  </label>
                  <input
                    type="text"
                    value={formularioEdicao.corrida}
                    onChange={(e) =>
                      setFormularioEdicao({
                        ...formularioEdicao,
                        corrida: e.target.value,
                      })
                    }
                    placeholder="Ex: 12:00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Flexão (repetições)
                  </label>
                  <input
                    type="text"
                    value={formularioEdicao.flexao}
                    onChange={(e) =>
                      setFormularioEdicao({
                        ...formularioEdicao,
                        flexao: e.target.value,
                      })
                    }
                    placeholder="Ex: 30"
                    className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Abdominal (repetições)
                  </label>
                  <input
                    type="text"
                    value={formularioEdicao.abdominal}
                    onChange={(e) =>
                      setFormularioEdicao({
                        ...formularioEdicao,
                        abdominal: e.target.value,
                      })
                    }
                    placeholder="Ex: 35"
                    className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Rodapé */}
              <div className="border-t border-border-default bg-bg-default/50 px-6 py-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPadraoEditandoId(null)}
                  className="px-4 py-2 text-sm font-semibold text-text-muted border border-border-default rounded-lg hover:bg-bg-card transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Requisitos de desempenho atualizados!");
                    setPadraoEditandoId(null);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
