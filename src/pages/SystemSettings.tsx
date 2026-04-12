/**
 * @page SystemSettings
 * @description Configuracoes centrais do sistema em arquitetura modal-centric.
 * @path src/pages/SystemSettings.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useLocations from "@/hooks/useLocations";
import {
  createAccessProfile,
  fetchAllProfilesForAccess,
  updateProfile,
} from "@/hooks/usePersonnel";
import {
  fetchEvaluationIndexRows,
  saveEvaluationIndexRow,
  type EvaluationIndexRow,
} from "@/services/evaluationTables";
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
  LocationStatus,
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

type LocationCard = {
  id: string;
  nome: string;
  endereco: string;
  capacidade: number;
  status: LocationStatus;
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
  { key: "locations", label: "Locais", icon: MapPin },
  { key: "profiles", label: "Perfis", icon: ShieldCheck },
  { key: "audit", label: "Logs", icon: Clock3 },
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
  const {
    locations,
    loading: locationsLoading,
    fetch: fetchLocations,
    create: createLocation,
    update: updateLocation,
    remove: removeLocation,
  } = useLocations();

  const canView = profile?.role === "admin";

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [settings, setSettings] = useState<SystemSettingsRow | null>(null);
  const [formState, setFormState] = useState<Partial<SystemSettingsRow>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [evaluationRows, setEvaluationRows] = useState<EvaluationIndexRow[]>(
    [],
  );
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
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
    useState<EvaluationIndexRow | null>(null);
  const [editingOm, setEditingOm] = useState<LocationCard | null>(null);
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
    if (activeTab !== "evaluation" || !canView) {
      return;
    }

    async function loadEvaluationRows() {
      setEvaluationLoading(true);
      try {
        const data = await fetchEvaluationIndexRows();
        setEvaluationRows(data);
      } catch (error) {
        console.error(error);
        const authMessage = getAuthorizationErrorMessage(
          error,
          "visualizar tabelas de indices",
        );
        toast.error(authMessage ?? "Falha ao carregar tabelas de índices.");
      } finally {
        setEvaluationLoading(false);
      }
    }

    void loadEvaluationRows();
  }, [activeTab, canView]);

  useEffect(() => {
    if (activeTab !== "locations" || !canView) {
      return;
    }

    void fetchLocations({ limit: 100 });
  }, [activeTab, canView, fetchLocations]);

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
  const locationCards = useMemo<LocationCard[]>(
    () =>
      locations.map((location) => ({
        id: location.id,
        nome: location.name,
        endereco: location.address,
        capacidade: location.max_capacity,
        status: location.status,
      })),
    [locations],
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

  const getLocationStatusLabel = (status: LocationStatus) => {
    if (status === "active") return "Ativo";
    if (status === "maintenance") return "Manutenção";
    return "Inativo";
  };

  const getLocationStatusTone = (status: LocationStatus) => {
    if (status === "active") return "bg-emerald-100 text-emerald-700";
    if (status === "maintenance") return "bg-amber-100 text-amber-700";
    return "bg-slate-200 text-slate-700";
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

  const saveEvaluationRow = async () => {
    if (!editingEvaluation) return;

    setSavingEvaluation(true);
    try {
      const updatedRow = await saveEvaluationIndexRow(editingEvaluation);
      setEvaluationRows((previous) =>
        previous.map((row) => (row.id === updatedRow.id ? updatedRow : row)),
      );
      toast.success("Tabela de índices atualizada com sucesso.");
      closeLevel2();
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "salvar tabela de indices",
      );
      toast.error(authMessage ?? "Falha ao salvar tabela de índices.");
    } finally {
      setSavingEvaluation(false);
    }
  };

  const saveOm = async () => {
    if (!editingOm) return;

    if (!editingOm.nome.trim() || !editingOm.endereco.trim()) {
      toast.error("Nome e endereço do local são obrigatórios.");
      return;
    }

    if (editingOm.capacidade < 1) {
      toast.error("A capacidade máxima padrão deve ser maior que zero.");
      return;
    }

    setSavingLocation(true);
    try {
      const payload = {
        name: editingOm.nome.trim(),
        address: editingOm.endereco.trim(),
        max_capacity: editingOm.capacidade,
        status: editingOm.status,
        facilities: [],
        metadata: null,
      };

      const existing = locationCards.some((row) => row.id === editingOm.id);

      if (existing) {
        await updateLocation(editingOm.id, payload);
      } else {
        await createLocation(payload);
      }

      toast.success("Padrão global do local salvo.");
      closeLevel2();
      await fetchLocations({ limit: 100 });
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "salvar local de aplicacao",
      );
      toast.error(authMessage ?? "Falha ao salvar o local.");
    } finally {
      setSavingLocation(false);
    }
  };

  const inactivateLocation = async () => {
    if (!editingOm) return;

    setSavingLocation(true);
    try {
      await removeLocation(editingOm.id);
      toast.success("Local inativado.");
      closeLevel2();
      await fetchLocations({ limit: 100 });
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "inativar local de aplicacao",
      );
      toast.error(authMessage ?? "Falha ao inativar o local.");
    } finally {
      setSavingLocation(false);
    }
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Tabelas persistidas de índices usadas como referência
              administrativa global.
            </div>
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
                  {evaluationLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-slate-600"
                      >
                        Carregando tabelas de índices...
                      </td>
                    </tr>
                  ) : evaluationRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-slate-600"
                      >
                        Nenhuma tabela de índices cadastrada.
                      </td>
                    </tr>
                  ) : (
                    evaluationRows.map((row) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "locations":
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cadastre os padrões globais dos locais de aplicação. Alterações
              feitas no Hub afetam apenas a sessão selecionada.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingOm({
                    id: crypto.randomUUID(),
                    nome: "",
                    endereco: "",
                    capacidade: 21,
                    status: "active",
                  });
                  setLevel2Modal("om");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                <AppIcon icon={Plus} size="sm" decorative />
                Novo Local
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {locationsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Carregando locais...
                </div>
              ) : locationCards.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Nenhum local cadastrado.
                </div>
              ) : (
                locationCards.map((om) => (
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
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getLocationStatusTone(om.status)}`}
                      >
                        {getLocationStatusLabel(om.status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {om.capacidade} vagas
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Padrão global reutilizado ao criar ou editar sessões.
                  </p>

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
                ))
              )}
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
                  Edição de Tabela de Índices
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
                    Faixa
                  </span>
                  <input
                    type="text"
                    value={editingEvaluation.faixa}
                    onChange={(event) =>
                      setEditingEvaluation((previous) =>
                        previous
                          ? { ...previous, faixa: event.target.value }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </label>
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
                    Flexão
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
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Conceito
                  </span>
                  <input
                    type="text"
                    value={editingEvaluation.conceito}
                    onChange={(event) =>
                      setEditingEvaluation((previous) =>
                        previous
                          ? { ...previous, conceito: event.target.value }
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
                  onClick={() => void saveEvaluationRow()}
                  disabled={savingEvaluation}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {savingEvaluation ? "Salvando..." : "Salvar"}
                </button>
              </footer>
            </section>
          )}

          {level2Modal === "om" && editingOm && (
            <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                  Padrão Global do Local
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
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-slate-700">
                    Status
                  </span>
                  <select
                    value={editingOm.status}
                    onChange={(event) =>
                      setEditingOm((previous) =>
                        previous
                          ? {
                              ...previous,
                              status: event.target.value as LocationStatus,
                            }
                          : previous,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="maintenance">Manutenção</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </label>
              </div>

              <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-200 px-5 py-4">
                <div>
                  {locationCards.some((row) => row.id === editingOm.id) ? (
                    <button
                      type="button"
                      onClick={() => void inactivateLocation()}
                      disabled={savingLocation || editingOm.status === "inactive"}
                      className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
                    >
                      Inativar
                    </button>
                  ) : null}
                </div>
                <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeLevel2}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveOm()}
                  disabled={savingLocation}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {savingLocation ? "Salvando..." : "Salvar"}
                </button>
                </div>
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
