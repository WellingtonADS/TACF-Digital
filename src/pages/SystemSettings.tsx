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
  createAccessProfile,
  fetchAllProfilesForAccess,
  updateProfile,
} from "@/hooks/usePersonnel";
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
  X,
  type LucideIcon,
} from "@/icons";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
  ProfileRole,
  Profile as UserProfile,
} from "@/types";
import { formatDateTimePtBr } from "@/utils/date";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { getSidebarRoutesForRole } from "@/utils/routeRegistry";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
type SystemSettingsRow = DBSystemSettingsRow;
type AuditLogRow = DBAuditLogRow;

type TabKey = "general" | "evaluation" | "locations" | "profiles" | "audit";
type Level2Modal = "index" | "om" | "permissions" | "newCoordinator" | null;

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
  role: Extract<ProfileRole, "admin" | "coordinator">;
  nome: string;
  descricao: string;
};

type NewCoordinatorForm = {
  fullName: string;
  email: string;
  rank: string;
};

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
    role: "admin",
    nome: "Administrador",
    descricao: "Controle completo da plataforma",
  },
  {
    role: "coordinator",
    nome: "Coordenador",
    descricao: "Gestao operacional de sessoes e resultados",
  },
];

export default function SystemSettings() {
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
  const [accessProfiles, setAccessProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [savingCoordinator, setSavingCoordinator] = useState(false);
  const [newCoordinatorForm, setNewCoordinatorForm] =
    useState<NewCoordinatorForm>({
      fullName: "",
      email: "",
      rank: "",
    });

  const [level2Modal, setLevel2Modal] = useState<Level2Modal>(null);
  const [editingEvaluation, setEditingEvaluation] =
    useState<EvaluationRow | null>(null);
  const [editingOm, setEditingOm] = useState<OmCard | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProfileRole | null>(null);

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

  useEffect(() => {
    if (activeTab !== "profiles" || !canView) {
      return;
    }

    async function loadAccessProfiles() {
      setProfilesLoading(true);
      try {
        const data = await fetchAllProfilesForAccess();
        setAccessProfiles(data);
      } catch (error) {
        console.error(error);
        const authMessage = getAuthorizationErrorMessage(
          error,
          "visualizar perfis de usuarios",
        );
        toast.error(authMessage ?? "Falha ao carregar perfis reais.");
      } finally {
        setProfilesLoading(false);
      }
    }

    void loadAccessProfiles();
  }, [activeTab, canView]);

  const profileUsers = useMemo(
    () =>
      accessProfiles.filter(
        (row) => row.role === "admin" || row.role === "coordinator",
      ),
    [accessProfiles],
  );

  const getRoleLabel = (role: ProfileRole) => {
    if (role === "admin") return "Administrador";
    if (role === "coordinator") return "Coordenador";
    return "Coordenador";
  };

  const getRoleMainModule = (role: ProfileRole) => {
    const routes = getSidebarRoutesForRole(role);
    return routes[0]?.sidebarLabel ?? "--";
  };

  const closeLevel2 = () => {
    setLevel2Modal(null);
    setEditingEvaluation(null);
    setEditingOm(null);
    setSelectedRole(null);
    setNewCoordinatorForm({ fullName: "", email: "", rank: "" });
  };

  const openPermissionsModal = (role: ProfileRole) => {
    setSelectedRole(role);
    setLevel2Modal("permissions");
  };

  const openNewCoordinatorModal = () => {
    setLevel2Modal("newCoordinator");
  };

  const saveNewCoordinator = async () => {
    const fullName = newCoordinatorForm.fullName.trim();
    const email = newCoordinatorForm.email.trim().toLowerCase();
    const rank = newCoordinatorForm.rank.trim();

    if (!fullName || !email) {
      toast.error("Nome completo e e-mail são obrigatórios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    if (profileUsers.some((row) => (row.email ?? "").toLowerCase() === email)) {
      toast.error("Já existe um usuário com este e-mail.");
      return;
    }

    setSavingCoordinator(true);
    try {
      const created = await createAccessProfile({
        id: crypto.randomUUID(),
        full_name: fullName,
        email,
        rank: rank || null,
        role: "coordinator",
        active: true,
      });

      setAccessProfiles((previous) => {
        const next = [...previous, created];
        return next.sort((a, b) => {
          if (a.role !== b.role) return a.role.localeCompare(b.role);
          return (a.full_name ?? "").localeCompare(b.full_name ?? "");
        });
      });

      toast.success("Novo coordenador inserido com sucesso.");
      closeLevel2();
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "inserir novo coordenador",
      );
      toast.error(authMessage ?? "Falha ao inserir coordenador.");
    } finally {
      setSavingCoordinator(false);
    }
  };

  const updateAccessUser = async (
    profileId: string,
    payload: Partial<UserProfile>,
    successMessage: string,
  ) => {
    setSavingProfileId(profileId);
    try {
      await updateProfile(profileId, payload);
      setAccessProfiles((previous) =>
        previous.map((row) =>
          row.id === profileId ? { ...row, ...payload } : row,
        ),
      );
      toast.success(successMessage);
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "atualizar perfil do usuario",
      );
      toast.error(authMessage ?? "Falha ao atualizar o usuario.");
    } finally {
      setSavingProfileId(null);
    }
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
              {INITIAL_PROFILES.map((card) => {
                const roleUsers = profileUsers.filter(
                  (row) => row.role === card.role,
                );

                return (
                  <article
                    key={card.role}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-lg font-bold text-slate-900">
                      {card.nome}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {card.descricao}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {roleUsers.length} usuarios
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.role === "coordinator" ? (
                        <button
                          type="button"
                          onClick={openNewCoordinatorModal}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          <AppIcon icon={Plus} size="sm" decorative />
                          Inserir Coordenador
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => openPermissionsModal(card.role)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        <AppIcon icon={ShieldCheck} size="sm" decorative />
                        Gerenciar Modulos
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Modulo Principal</th>
                    <th className="px-4 py-3">Situacao</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {profileUsers.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.full_name || row.email || row.id}
                      </td>
                      <td className="px-4 py-3">{row.email || "--"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={row.role}
                          disabled={savingProfileId === row.id}
                          onChange={(event) =>
                            void updateAccessUser(
                              row.id,
                              { role: event.target.value as ProfileRole },
                              "Perfil do usuario atualizado.",
                            )
                          }
                          className="min-w-[170px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="admin">Administrador</option>
                          <option value="coordinator">Coordenador</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {getRoleMainModule(row.role)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {row.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={savingProfileId === row.id}
                          onClick={() =>
                            void updateAccessUser(
                              row.id,
                              { active: !row.active },
                              row.active
                                ? "Usuario inativado."
                                : "Usuario ativado.",
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          {row.active ? "Inativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {profilesLoading ? (
              <p className="text-sm text-slate-600">
                Carregando dados reais...
              </p>
            ) : null}
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
      <div className="mx-auto w-full max-w-[1360px] space-y-5 px-4 py-6 md:px-6 md:py-8">
        <section className="mb-8">
          <header className="relative overflow-hidden bg-primary rounded-3xl p-5 md:p-8 lg:p-10 text-white shadow-2xl shadow-primary/20">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  Configuracoes do Sistema
                </h1>
                <p className="text-white/80 mt-2 text-sm md:text-lg font-normal">
                  Gestao central por abas, sem menu lateral
                </p>
              </div>
            </div>
          </header>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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

          <div className="min-h-[420px] px-4 py-5 md:px-6">
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

          {level2Modal === "permissions" && selectedRole && (
            <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Modulos do Perfil - {getRoleLabel(selectedRole)}
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
                {getSidebarRoutesForRole(selectedRole)
                  .filter((route) => route.sidebarLabel)
                  .map((route) => (
                    <div
                      key={route.path}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-slate-800">
                        {route.sidebarLabel}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        ATIVO
                      </span>
                    </div>
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

          {level2Modal === "newCoordinator" && (
            <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Inserir Novo Coordenador
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
                    Nome Completo
                  </span>
                  <input
                    type="text"
                    value={newCoordinatorForm.fullName}
                    onChange={(event) =>
                      setNewCoordinatorForm((previous) => ({
                        ...previous,
                        fullName: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    placeholder="Ex.: Cap João Ribeiro"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={newCoordinatorForm.email}
                    onChange={(event) =>
                      setNewCoordinatorForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    placeholder="Ex.: joao.ribeiro@fab.mil.br"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Posto/Graduação
                  </span>
                  <input
                    type="text"
                    value={newCoordinatorForm.rank}
                    onChange={(event) =>
                      setNewCoordinatorForm((previous) => ({
                        ...previous,
                        rank: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                    placeholder="Ex.: Capitão"
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
                  onClick={() => void saveNewCoordinator()}
                  disabled={savingCoordinator}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingCoordinator ? "Salvando..." : "Inserir"}
                </button>
              </footer>
            </section>
          )}
        </div>
      )}
    </Layout>
  );
}
