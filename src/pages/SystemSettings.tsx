/**
 * @page SystemSettings
 * @description Configuracoes centrais do sistema em arquitetura modal-centric.
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
} from "@/hooks/useSystemSettings";
import {
  BarChart2,
  Clock3,
  Edit2,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  UserCircle2,
  X,
  type LucideIcon,
} from "@/icons";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
} from "@/types";
import { formatDateTimePtBr } from "@/utils/date";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
type SystemSettingsRow = DBSystemSettingsRow;
type AuditLogRow = DBAuditLogRow;

type TabKey = "general" | "evaluation" | "locations" | "profiles" | "audit";
type Level2Modal = "index" | "om" | "permissions" | null;

type EvaluationRow = {
  id: string;
  faixa: string;
  corrida: string;
  flexao: string;
  abdominal: string;
  conceito: string;
};

type OmCard = {
  id: string;
  nome: string;
  endereco: string;
  capacidade: number;
};

type ProfileCard = {
  id: string;
  nome: string;
  descricao: string;
  usuarios: number;
  modulos: string[];
};

type PermissionState = Record<string, boolean>;

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "general", label: "Geral", icon: Settings },
  { key: "evaluation", label: "Tabelas", icon: BarChart2 },
  { key: "locations", label: "Locais / OM", icon: MapPin },
  { key: "profiles", label: "Perfis", icon: ShieldCheck },
  { key: "audit", label: "Logs", icon: Clock3 },
];

const INITIAL_EVALUATION_ROWS: EvaluationRow[] = [
  {
    id: "24",
    faixa: "Ate 24 anos",
    corrida: "12:00",
    flexao: "30",
    abdominal: "35",
    conceito: "EXCELENTE",
  },
  {
    id: "29",
    faixa: "25 a 29 anos",
    corrida: "12:30",
    flexao: "28",
    abdominal: "33",
    conceito: "MUITO BOM",
  },
  {
    id: "35",
    faixa: "30 a 35 anos",
    corrida: "13:00",
    flexao: "25",
    abdominal: "30",
    conceito: "BOM",
  },
];

const INITIAL_OMS: OmCard[] = [
  {
    id: "1gac",
    nome: "1 GAC",
    endereco: "Av. Brig. Lima e Silva, 1000",
    capacidade: 45,
  },
  {
    id: "3cia",
    nome: "3 Cia Int",
    endereco: "Rua do Arsenal, 245",
    capacidade: 32,
  },
  {
    id: "12bda",
    nome: "12 Bda Inf Leve",
    endereco: "QG Setorial, Bloco B",
    capacidade: 58,
  },
];

const INITIAL_PROFILES: ProfileCard[] = [
  {
    id: "admin",
    nome: "Administrador",
    descricao: "Controle completo da plataforma",
    usuarios: 4,
    modulos: ["Visao Geral", "Relatorios", "Auditoria", "Configuracoes"],
  },
  {
    id: "coord",
    nome: "Coordenador",
    descricao: "Gestao operacional de sessoes e resultados",
    usuarios: 12,
    modulos: ["Visao Geral", "Sessoes", "Lancamento"],
  },
  {
    id: "aplic",
    nome: "Aplicador",
    descricao: "Execucao de provas e lancamento de desempenho",
    usuarios: 27,
    modulos: ["Sessoes", "Lancamento"],
  },
];

const MODULES = [
  "Visao Geral",
  "Sessoes",
  "Relatorios",
  "Configuracoes",
  "Auditoria",
  "Gestao de Efetivo",
];

export default function SystemSettings() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const canView = profile?.role === "admin";

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [settings, setSettings] = useState<SystemSettingsRow | null>(null);
  const [formState, setFormState] = useState<Partial<SystemSettingsRow>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [evaluationRows, setEvaluationRows] = useState(INITIAL_EVALUATION_ROWS);
  const [oms, setOms] = useState(INITIAL_OMS);
  const [permissions, setPermissions] = useState<PermissionState>({
    "Visao Geral": true,
    Sessoes: true,
    Relatorios: true,
    Configuracoes: false,
    Auditoria: false,
    "Gestao de Efetivo": true,
  });

  const [level2Modal, setLevel2Modal] = useState<Level2Modal>(null);
  const [editingEvaluation, setEditingEvaluation] =
    useState<EvaluationRow | null>(null);
  const [editingOm, setEditingOm] = useState<OmCard | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileCard | null>(
    null,
  );

  const pageLoading = authLoading || settingsLoading;

  useEffect(() => {
    if (!canView) {
      setSettingsLoading(false);
      return;
    }

    async function loadSettings() {
      setSettingsLoading(true);
      try {
        const data = await fetchSystemSettings();
        setSettings(data);
        setFormState(data ?? {});
      } catch (error) {
        console.error(error);
        const authMessage = getAuthorizationErrorMessage(
          error,
          "visualizar configuracoes do sistema",
        );
        toast.error(authMessage ?? "Falha ao carregar configuracoes.");
      } finally {
        setSettingsLoading(false);
      }
    }

    void loadSettings();
  }, [canView]);

  useEffect(() => {
    if (activeTab !== "audit" || !canView) {
      return;
    }

    async function loadAudit() {
      setAuditLoading(true);
      try {
        const data = await fetchAuditLogs();
        setAuditLogs(data);
      } catch (error) {
        console.error(error);
        const authMessage = getAuthorizationErrorMessage(
          error,
          "visualizar logs de auditoria",
        );
        toast.error(authMessage ?? "Falha ao carregar logs.");
      } finally {
        setAuditLoading(false);
      }
    }

    void loadAudit();
  }, [activeTab, canView]);

  const profileUsers = useMemo(
    () => [
      {
        id: "u1",
        nome: "Maj Alencar",
        perfil: "Administrador",
        modulo: "Configuracoes",
      },
      {
        id: "u2",
        nome: "Cap Ribeiro",
        perfil: "Coordenador",
        modulo: "Sessoes",
      },
      {
        id: "u3",
        nome: "Ten Matos",
        perfil: "Aplicador",
        modulo: "Lancamento",
      },
    ],
    [],
  );

  const closeLevel2 = () => {
    setLevel2Modal(null);
    setEditingEvaluation(null);
    setEditingOm(null);
    setSelectedProfile(null);
  };

  const saveGeneral = async () => {
    if (!settings) return;

    setSavingGeneral(true);
    try {
      const updated = await saveSystemSettings(settings.id, formState);
      setSettings(updated);
      setFormState(updated ?? {});
      toast.success("Configuracoes gerais salvas.");
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "salvar configuracoes do sistema",
      );
      toast.error(authMessage ?? "Falha ao salvar configuracoes.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveEvaluationRow = () => {
    if (!editingEvaluation) return;

    setEvaluationRows((previous) =>
      previous.map((row) =>
        row.id === editingEvaluation.id ? editingEvaluation : row,
      ),
    );
    toast.success("Indice atualizado com sucesso.");
    closeLevel2();
  };

  const saveOm = () => {
    if (!editingOm) return;

    setOms((previous) => {
      const exists = previous.some((row) => row.id === editingOm.id);
      if (exists) {
        return previous.map((row) =>
          row.id === editingOm.id ? editingOm : row,
        );
      }
      return [...previous, editingOm];
    });

    toast.success("Cadastro de OM salvo.");
    closeLevel2();
  };

  const savePermissions = () => {
    toast.success("Permissoes atualizadas.");
    closeLevel2();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Nome do Sistema
                </span>
                <input
                  type="text"
                  value={formState.system_name ?? ""}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      system_name: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Organizacao
                </span>
                <input
                  type="text"
                  value={formState.organization_name ?? ""}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      organization_name: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Capacidade Minima
                </span>
                <input
                  type="number"
                  value={formState.min_capacity ?? 0}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      min_capacity: Number(event.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Capacidade Maxima
                </span>
                <input
                  type="number"
                  value={formState.max_capacity ?? 0}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      max_capacity: Number(event.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </label>
            </div>

            <footer className="flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => void saveGeneral()}
                disabled={savingGeneral}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingGeneral ? "Salvando..." : "Salvar"}
              </button>
            </footer>
          </div>
        );

      case "evaluation":
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-900 text-xs font-bold uppercase tracking-[0.08em] text-white">
                  <tr>
                    <th className="px-4 py-3">Faixa</th>
                    <th className="px-4 py-3 text-center">Corrida</th>
                    <th className="px-4 py-3 text-center">Flexao</th>
                    <th className="px-4 py-3 text-center">Abdominal</th>
                    <th className="px-4 py-3">Conceito</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {evaluationRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.faixa}
                      </td>
                      <td className="px-4 py-3 text-center">{row.corrida}</td>
                      <td className="px-4 py-3 text-center">{row.flexao}</td>
                      <td className="px-4 py-3 text-center">{row.abdominal}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {row.conceito}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvaluation(row);
                            setLevel2Modal("index");
                          }}
                          className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:border-slate-400"
                          title="Editar indice"
                        >
                          <AppIcon icon={Edit2} size="sm" decorative />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "locations":
        return (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingOm({
                    id: `om-${Date.now()}`,
                    nome: "",
                    endereco: "",
                    capacidade: 21,
                  });
                  setLevel2Modal("om");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                <AppIcon icon={Plus} size="sm" decorative />
                Nova OM
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {oms.map((om) => (
                <article
                  key={om.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {om.nome}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {om.endereco}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {om.capacidade} vagas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingOm(om);
                      setLevel2Modal("om");
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <AppIcon icon={Edit2} size="sm" decorative />
                    Editar
                  </button>
                </article>
              ))}
            </div>
          </div>
        );

      case "profiles":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {INITIAL_PROFILES.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-lg font-bold text-slate-900">
                    {card.nome}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {card.descricao}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {card.usuarios} usuarios
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(card);
                      setLevel2Modal("permissions");
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <AppIcon icon={ShieldCheck} size="sm" decorative />
                    Gerenciar Modulos
                  </button>
                </article>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Modulo Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {profileUsers.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.nome}
                      </td>
                      <td className="px-4 py-3">{row.perfil}</td>
                      <td className="px-4 py-3">{row.modulo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "audit":
        return auditLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                <tr>
                  <th className="px-4 py-3">Acao</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Horario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3">{log.entity}</td>
                    <td className="px-4 py-3">{log.user_name}</td>
                    <td className="px-4 py-3">
                      {formatDateTimePtBr(log.created_at ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  if (pageLoading) {
    return <FullPageLoading message="Carregando configuracoes" />;
  }

  if (!canView) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-sm font-semibold">Acesso nao autorizado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px]" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
        <section className="relative flex h-[min(90vh,940px)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <AppIcon icon={Settings} size="md" decorative />
              </span>
              <div>
                <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight md:text-3xl">
                  Configuracoes do Sistema
                </h1>
                <p className="text-xs text-white/75 md:text-sm">
                  Gestao central em fluxo modal padronizado
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold md:inline-flex">
                <AppIcon icon={UserCircle2} size="sm" decorative />
                {profile?.full_name ?? "Administrador"}
              </span>
              <button
                type="button"
                onClick={() => navigate("/app/admin")}
                className="rounded-xl border border-white/20 p-2 text-white/90 hover:bg-white/10"
                aria-label="Fechar configuracoes"
              >
                <AppIcon icon={X} size="sm" decorative />
              </button>
            </div>
          </header>

          <nav className="border-b border-slate-200 bg-slate-50 px-4 py-3 md:px-6">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => {
                const active = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <AppIcon icon={tab.icon} size="sm" decorative />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-h-0 flex-1 overflow-auto px-4 py-5 md:px-6">
            {renderTabContent()}
          </div>
        </section>
      </div>

      {level2Modal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          {level2Modal === "index" && editingEvaluation && (
            <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Edicao de Indice
                </h2>
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <AppIcon icon={X} size="sm" decorative />
                </button>
              </header>

              <div className="space-y-4 px-5 py-5">
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Corrida
                  </span>
                  <input
                    type="text"
                    value={editingEvaluation.corrida}
                    onChange={(event) =>
                      setEditingEvaluation((previous) =>
                        previous
                          ? { ...previous, corrida: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Flexao
                  </span>
                  <input
                    type="text"
                    value={editingEvaluation.flexao}
                    onChange={(event) =>
                      setEditingEvaluation((previous) =>
                        previous
                          ? { ...previous, flexao: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Abdominal
                  </span>
                  <input
                    type="text"
                    value={editingEvaluation.abdominal}
                    onChange={(event) =>
                      setEditingEvaluation((previous) =>
                        previous
                          ? { ...previous, abdominal: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveEvaluationRow}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Salvar
                </button>
              </footer>
            </section>
          )}

          {level2Modal === "om" && editingOm && (
            <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Cadastro de OM
                </h2>
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <AppIcon icon={X} size="sm" decorative />
                </button>
              </header>

              <div className="space-y-4 px-5 py-5">
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Nome
                  </span>
                  <input
                    type="text"
                    value={editingOm.nome}
                    onChange={(event) =>
                      setEditingOm((previous) =>
                        previous
                          ? { ...previous, nome: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Endereco
                  </span>
                  <input
                    type="text"
                    value={editingOm.endereco}
                    onChange={(event) =>
                      setEditingOm((previous) =>
                        previous
                          ? { ...previous, endereco: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Capacidade Padrao
                  </span>
                  <input
                    type="number"
                    value={editingOm.capacidade}
                    onChange={(event) =>
                      setEditingOm((previous) =>
                        previous
                          ? {
                              ...previous,
                              capacidade: Number(event.target.value),
                            }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveOm}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Salvar
                </button>
              </footer>
            </section>
          )}

          {level2Modal === "permissions" && selectedProfile && (
            <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Permissoes de Modulos - {selectedProfile.nome}
                </h2>
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <AppIcon icon={X} size="sm" decorative />
                </button>
              </header>

              <div className="space-y-3 px-5 py-5">
                {MODULES.map((moduleName) => (
                  <label
                    key={moduleName}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {moduleName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPermissions((previous) => ({
                          ...previous,
                          [moduleName]: !previous[moduleName],
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        permissions[moduleName]
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {permissions[moduleName] ? "ATIVO" : "INATIVO"}
                    </button>
                  </label>
                ))}
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePermissions}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Salvar
                </button>
              </footer>
            </section>
          )}
        </div>
      )}
    </Layout>
  );
}
