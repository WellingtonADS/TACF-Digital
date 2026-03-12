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
import supabase from "@/services/supabase";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
} from "@/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type SystemSettingsRow = DBSystemSettingsRow;
type AuditLogRow = DBAuditLogRow;

const TABS = [
  { key: "general", label: "Geral", icon: Settings },
  { key: "evaluation", label: "Tabelas de Avaliação", icon: BarChart2 },
  { key: "locations", label: "Locais / OM", icon: MapPin },
  { key: "profiles", label: "Perfis de Acesso", icon: ShieldCheck },
  { key: "audit", label: "Logs de Auditoria", icon: Clock3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type TabItem = { key: TabKey; label: string; icon: LucideIcon };

export default function SystemSettings() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const canView = profile?.role === "admin";
  const [activeTab, setActiveTab] = useState<TabKey>("evaluation");
  const [settings, setSettings] = useState<SystemSettingsRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // local form state for "general" tab
  const [formState, setFormState] = useState<Partial<SystemSettingsRow>>({});

  useEffect(() => {
    if (!canView) {
      setSettingsLoading(false);
      return;
    }

    async function load() {
      setSettingsLoading(true);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error(error);
          toast.error("Falha ao carregar configurações");
        } else {
          setSettings(data);
          setFormState(data ?? {});
        }
      } finally {
        setLoading(false);
        setSettingsLoading(false);
      }
    }
    load();
  }, [canView]);

  useEffect(() => {
    if (activeTab === "audit" && canView) {
      const loadLogs = async () => {
        setAuditLoading(true);
        const { data, error } = await supabase.rpc("get_audit_logs");
        if (error) {
          console.error(error);
          toast.error("Erro ao carregar logs de auditoria");
        } else {
          setAuditLogs((data as AuditLogRow[] | null) ?? []);
        }
        setAuditLoading(false);
      };

      loadLogs();
    }
  }, [activeTab, canView]);

  async function saveGeneral() {
    if (!settings) return;
    setLoading(true);
    const { error } = await supabase
      .from("system_settings")
      .update(formState)
      .eq("id", settings.id);
    if (error) {
      console.error(error);
      toast.error("Falha ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
      // reload
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      setSettings(data);
      setFormState(data ?? {});
    }
    setLoading(false);
  }

  function renderContent() {
    if (loading && activeTab === "general") {
      return (
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-border-default" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-border-default" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-border-default" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-border-default" />
        </div>
      );
    }

    switch (activeTab) {
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
                  value={formState.system_name ?? ""}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, system_name: e.target.value }))
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
                  value={formState.organization_name ?? ""}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
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
                    value={formState.min_capacity ?? 0}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
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
                    value={formState.max_capacity ?? 0}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
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
                  checked={Boolean(formState.allow_swaps)}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
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
                  checked={Boolean(formState.require_quorum)}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
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
                  onClick={saveGeneral}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                  disabled={loading}
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
                    {/* sample rows, real data would come from API */}
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
                        <button className="p-2 text-text-muted hover:text-primary transition-colors">
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
            {auditLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-border-default" />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <div className="space-y-2 p-3 md:hidden">
                  {auditLogs.map((log) => (
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
                        {new Date(log.created_at ?? "").toLocaleString()}
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
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-bg-card transition-colors"
                        >
                          <td className="px-4 py-2 text-sm">{log.action}</td>
                          <td className="px-4 py-2 text-sm">{log.entity}</td>
                          <td className="px-4 py-2 text-sm">{log.user_name}</td>
                          <td className="px-4 py-2 text-sm">
                            {new Date(log.created_at ?? "").toLocaleString()}
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

  const pageLoading = authLoading || settingsLoading;

  if (pageLoading) {
    return <FullPageLoading message="Carregando configuracoes" />;
  }

  if (!canView) {
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
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0">
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
                {(TABS as ReadonlyArray<TabItem>).map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
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
            <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
