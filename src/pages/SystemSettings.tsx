/**
 * @page SystemSettings
 * @description Configurações centrais do sistema.
 * @path src/pages/SystemSettings.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import Dialog from "@/components/Dialog";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useLocations from "@/hooks/useLocations";
import {
  BarChart2,
  Clock3,
  Edit2,
  MapPin,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "@/icons";
import { ADMIN_MODULE_DEFINITIONS } from "@/router/adminModules";
import { getProfileAccessModules } from "@/router/routeAccess";
import { sidebarIconMap } from "@/router/sidebarIcons";
import {
  fetchEvaluationIndexRows,
  removeEvaluationIndexRow,
  saveEvaluationIndexRow,
  type EvaluationIndexCategory,
  type EvaluationIndexRow,
} from "@/services/evaluationTables";
import { fetchAllProfilesForAccess, updateProfile } from "@/services/personnel";
import {
  fetchAuditLogs,
  fetchSystemSettings,
  saveSystemSettings,
} from "@/services/systemSettings";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
  Json,
  ProfileRole,
  Profile as UserProfile,
} from "@/types";
import type { Location } from "@/types/database.types";
import { formatDateTimePtBr } from "@/utils/date";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { OM_STATUS } from "@/utils/omStatus";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type SystemSettingsRow = DBSystemSettingsRow;
type AuditLogRow = DBAuditLogRow;
const SETTINGS_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_COORDINATOR_MODULES = ["/app/admin", "/app/turmas"];

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Settings request timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const TABS = [
  { key: "general", label: "Geral", icon: Settings },
  { key: "evaluation", label: "Tabelas de Avaliação", icon: BarChart2 },
  { key: "locations", label: "Locais / OM", icon: MapPin },
  { key: "profiles", label: "Perfis de Acesso", icon: ShieldCheck },
  { key: "audit", label: "Logs de Auditoria", icon: Clock3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type TabItem = { key: TabKey; label: string; icon: LucideIcon };
const ACCESS_ROLE_OPTIONS: ProfileRole[] = ["user", "coordinator", "admin"];
const ACCESS_ROLE_LABEL: Record<ProfileRole, string> = {
  user: "Usuario",
  admin: "Administrador",
  coordinator: "Coordenador",
};

function isJsonRecord(
  value: Json | null | undefined,
): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildAccessMetadata(
  currentMetadata: Json | null | undefined,
  role: ProfileRole,
  modules: string[],
): Json | null {
  const nextMetadata = isJsonRecord(currentMetadata)
    ? { ...currentMetadata }
    : {};

  if (role === "coordinator") {
    nextMetadata.access_modules = modules;
  } else {
    delete nextMetadata.access_modules;
  }

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

function getProfileDisplayName(profile: UserProfile): string {
  return profile.full_name ?? profile.war_name ?? profile.email ?? profile.id;
}

function getNameInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isTabKey(value: string | null): value is TabKey {
  if (!value) return false;
  return TABS.some((tab) => tab.key === value);
}

export default function SystemSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const canView = profile?.role === "admin";
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = searchParams.get("tab");
    return isTabKey(tab) ? tab : "evaluation";
  });
  const [settings, setSettings] = useState<SystemSettingsRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
    fetch: fetchLocations,
    create: createLocation,
    update: updateLocation,
  } = useLocations();

  const [evaluationCategory, setEvaluationCategory] =
    useState<EvaluationIndexCategory>("masculino");
  const [evaluationRows, setEvaluationRows] = useState<EvaluationIndexRow[]>(
    [],
  );
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [accessProfiles, setAccessProfiles] = useState<UserProfile[]>([]);
  const [accessProfilesLoading, setAccessProfilesLoading] = useState(false);
  const [savingAccessProfileId, setSavingAccessProfileId] = useState<
    string | null
  >(null);
  const [accessProfileQuery, setAccessProfileQuery] = useState("");
  const [accessRoleFilter, setAccessRoleFilter] = useState<"all" | ProfileRole>(
    "all",
  );
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(
    null,
  );
  const [editRoleDraft, setEditRoleDraft] = useState<ProfileRole>("user");
  const [editModulesDraft, setEditModulesDraft] = useState<string[]>([]);

  const [editingStandardId, setEditingStandardId] = useState<string | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    faixa: "",
    corrida: "",
    flexao: "",
    abdominal: "",
    conceito: "",
    sort_order: "0",
  });

  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    address: "",
    max_capacity: "8",
    status: "active" as Location["status"],
  });

  // local form state for "general" tab
  const [formState, setFormState] = useState<Partial<SystemSettingsRow>>({});

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabKey(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  function handleSelectTab(tab: TabKey) {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "evaluation") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }
    setSearchParams(nextParams, { replace: true });
  }

  useEffect(() => {
    if (!canView) {
      setSettingsLoading(false);
      return;
    }

    async function load() {
      setSettingsLoading(true);
      setLoading(true);
      try {
        const data = await withTimeout(
          fetchSystemSettings(),
          SETTINGS_REQUEST_TIMEOUT_MS,
        );
        setSettings(data);
        setFormState(data ?? {});
      } catch (err) {
        console.error(err);
        const authMessage = getAuthorizationErrorMessage(
          err,
          "visualizar configurações do sistema",
        );
        toast.error(authMessage ?? "Falha ao carregar configurações");
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
        try {
          const data = await fetchAuditLogs();
          setAuditLogs(data);
        } catch (err) {
          console.error(err);
          const authMessage = getAuthorizationErrorMessage(
            err,
            "visualizar logs de auditoria",
          );
          toast.error(authMessage ?? "Erro ao carregar logs de auditoria");
        } finally {
          setAuditLoading(false);
        }
      };

      loadLogs();
    }
  }, [activeTab, canView]);

  useEffect(() => {
    if (activeTab === "locations" && canView) {
      void fetchLocations({ limit: 200 });
    }
  }, [activeTab, canView, fetchLocations]);

  useEffect(() => {
    if (activeTab !== "profiles" || !canView) {
      return;
    }

    async function loadAccessProfiles() {
      setAccessProfilesLoading(true);
      try {
        const profiles = await fetchAllProfilesForAccess();
        setAccessProfiles(profiles);
      } catch (err) {
        console.error(err);
        const authMessage = getAuthorizationErrorMessage(
          err,
          "visualizar perfis de acesso",
        );
        toast.error(authMessage ?? "Falha ao carregar perfis de acesso.");
      } finally {
        setAccessProfilesLoading(false);
      }
    }

    void loadAccessProfiles();
  }, [activeTab, canView]);

  useEffect(() => {
    if (activeTab !== "evaluation" || !canView) {
      return;
    }

    async function loadEvaluationRows() {
      setEvaluationLoading(true);
      try {
        const rows = await fetchEvaluationIndexRows(evaluationCategory);
        setEvaluationRows(rows);
      } catch (err) {
        console.error(err);
        toast.error("Falha ao carregar tabelas de indices.");
      } finally {
        setEvaluationLoading(false);
      }
    }

    void loadEvaluationRows();
  }, [activeTab, canView, evaluationCategory]);

  useEffect(() => {
    if (locationsError) {
      toast.error(locationsError);
    }
  }, [locationsError]);

  async function saveGeneral() {
    if (!settings) return;
    setLoading(true);
    try {
      const updated = await saveSystemSettings(settings.id, formState);
      toast.success("Configurações salvas");
      setSettings(updated);
      setFormState(updated ?? {});
    } catch (err) {
      console.error(err);
      const authMessage = getAuthorizationErrorMessage(
        err,
        "salvar configurações do sistema",
      );
      toast.error(authMessage ?? "Falha ao salvar configurações");
    } finally {
      setLoading(false);
    }
  }

  function openNewEvaluationRow() {
    setEditingStandardId("new");
    setEditFormData({
      faixa: "",
      corrida: "",
      flexao: "",
      abdominal: "",
      conceito: "",
      sort_order: String(evaluationRows.length + 1),
    });
  }

  function openEditEvaluationRow(row: EvaluationIndexRow) {
    setEditingStandardId(row.id);
    setEditFormData({
      faixa: row.faixa,
      corrida: row.corrida,
      flexao: row.flexao,
      abdominal: row.abdominal,
      conceito: row.conceito,
      sort_order: String(row.sort_order),
    });
  }

  async function handleSaveEvaluationRow() {
    setSavingEvaluation(true);
    try {
      await saveEvaluationIndexRow({
        id:
          editingStandardId === "new"
            ? undefined
            : (editingStandardId ?? undefined),
        category: evaluationCategory,
        faixa: editFormData.faixa,
        corrida: editFormData.corrida,
        flexao: editFormData.flexao,
        abdominal: editFormData.abdominal,
        conceito: editFormData.conceito,
        sort_order: Number(editFormData.sort_order || 0),
      });
      toast.success("Linha da tabela salva.");
      setEditingStandardId(null);
      const rows = await fetchEvaluationIndexRows(evaluationCategory);
      setEvaluationRows(rows);
    } catch (err) {
      console.error(err);
      toast.error("Nao foi possivel salvar a linha.");
    } finally {
      setSavingEvaluation(false);
    }
  }

  async function handleDeleteEvaluationRow(id: string) {
    try {
      await removeEvaluationIndexRow(id);
      setEvaluationRows((current) => current.filter((row) => row.id !== id));
      toast.success("Linha removida.");
    } catch (err) {
      console.error(err);
      toast.error("Nao foi possivel remover a linha.");
    }
  }

  function openNewLocationForm() {
    setEditingLocationId(null);
    setLocationFormData({
      name: "",
      address: "",
      max_capacity: "8",
      status: "active",
    });
    setLocationFormOpen(true);
  }

  function openEditLocationForm(location: Location) {
    setEditingLocationId(location.id);
    setLocationFormData({
      name: location.name,
      address: location.address,
      max_capacity: String(location.max_capacity),
      status: location.status,
    });
    setLocationFormOpen(true);
  }

  async function handleSaveLocation() {
    setSavingLocation(true);
    try {
      const existingLocation = editingLocationId
        ? (locations.find((location) => location.id === editingLocationId) ??
          null)
        : null;
      const payload = {
        name: locationFormData.name,
        address: locationFormData.address,
        max_capacity: Number(locationFormData.max_capacity || 0),
        status: locationFormData.status,
        facilities: existingLocation?.facilities ?? [],
        metadata: existingLocation?.metadata ?? null,
        created_by: existingLocation?.created_by ?? null,
      };

      if (editingLocationId) {
        await updateLocation(editingLocationId, payload);
      } else {
        await createLocation(payload);
      }

      toast.success("Local salvo.");
      setLocationFormOpen(false);
      await fetchLocations({ limit: 200 });
    } catch (err) {
      console.error(err);
      toast.error("Nao foi possivel salvar o local.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleInactivateLocation(locationId: string) {
    try {
      await updateLocation(locationId, { status: "inactive" });
      toast.success("Local inativado.");
      await fetchLocations({ limit: 200 });
    } catch (err) {
      console.error(err);
      toast.error("Nao foi possivel inativar o local.");
    }
  }

  async function handleUpdateAdministrativeRole(
    profileId: string,
    role: ProfileRole,
    modules?: string[],
  ) {
    setSavingAccessProfileId(profileId);
    try {
      const currentProfile =
        accessProfiles.find((item) => item.id === profileId) ?? null;
      const currentModules = getProfileAccessModules(currentProfile?.metadata);
      const nextModules =
        role === "coordinator"
          ? modules && modules.length > 0
            ? modules
            : currentModules.length > 0
              ? currentModules
              : DEFAULT_COORDINATOR_MODULES
          : [];
      const metadata = buildAccessMetadata(
        currentProfile?.metadata,
        role,
        nextModules,
      );

      await updateProfile(profileId, { role, metadata });
      setAccessProfiles((current) =>
        current.map((item) =>
          item.id === profileId
            ? {
                ...item,
                role,
                metadata,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast.success("Perfil administrativo atualizado.");
    } catch (err) {
      console.error(err);
      const authMessage = getAuthorizationErrorMessage(
        err,
        "atualizar perfis administrativos",
      );
      toast.error(authMessage ?? "Falha ao atualizar o perfil administrativo.");
    } finally {
      setSavingAccessProfileId(null);
    }
  }

  const ROLE_TIER_STYLES: Record<
    ProfileRole,
    { pill: string; avatar: string }
  > = {
    user: {
      pill: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      avatar:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    coordinator: {
      pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      avatar:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    admin: {
      pill: "bg-primary/10 text-primary",
      avatar: "bg-primary/10 text-primary",
    },
  };

  function openProfileEdit(profileItem: UserProfile) {
    setEditRoleDraft(profileItem.role ?? "user");
    setEditModulesDraft(getProfileAccessModules(profileItem.metadata));
    setEditingProfile(profileItem);
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
            <div className="mb-6 flex flex-col gap-3 border-b border-border-default sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-4 sm:gap-8">
                {(["masculino", "feminino"] as const).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setEvaluationCategory(category)}
                    className={`pb-4 text-sm font-semibold transition-colors ${
                      evaluationCategory === category
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-muted hover:text-primary"
                    }`}
                  >
                    {category === "masculino" ? "Masculino" : "Feminino"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-4">
                <button
                  type="button"
                  onClick={openNewEvaluationRow}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <AppIcon icon={Plus} size="sm" decorative />
                  Nova linha
                </button>
              </div>
            </div>
            <p className="mb-6 text-sm text-text-muted">
              Edite as tabelas persistidas de índices por faixa e conceito.
            </p>
            <div className="overflow-hidden rounded-xl border border-border-default">
              {evaluationLoading ? (
                <div className="p-6 text-sm text-text-muted">
                  Carregando tabelas...
                </div>
              ) : evaluationRows.length === 0 ? (
                <div className="p-6 text-sm text-text-muted">
                  Nenhuma linha cadastrada para esta categoria.
                </div>
              ) : (
                <table className="w-full min-w-[640px] text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                        Faixa
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                        Corrida
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                        Flexão
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                        Abdominal
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                        Conceito
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {evaluationRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-bg-card transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-text-body">
                          {row.faixa}
                        </td>
                        <td className="px-4 py-3 text-center">{row.corrida}</td>
                        <td className="px-4 py-3 text-center">{row.flexao}</td>
                        <td className="px-4 py-3 text-center">
                          {row.abdominal}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded px-2 py-1 text-xs font-bold bg-success/10 text-success">
                            {row.conceito}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditEvaluationRow(row)}
                              className="p-2 text-text-muted hover:text-primary transition-colors"
                              title="Editar linha"
                            >
                              <AppIcon icon={Edit2} size="sm" decorative />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteEvaluationRow(row.id)
                              }
                              className="p-2 text-text-muted hover:text-error transition-colors"
                              title="Remover linha"
                            >
                              <AppIcon icon={Trash2} size="sm" decorative />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      case "locations":
        return (
          <div className="space-y-6 py-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-body">
                  Locais de aplicação
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  CRUD oficial dos locais persistidos consumidos pelo Hub de
                  sessões.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewLocationForm}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <AppIcon icon={Plus} size="sm" decorative />
                Novo local
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-default">
              {locationsLoading ? (
                <div className="p-6 text-sm text-text-muted">
                  Carregando locais...
                </div>
              ) : locations.length === 0 ? (
                <div className="p-6 text-sm text-text-muted">
                  Nenhum local cadastrado.
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                        Local
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                        Endereço
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                        Capacidade
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {locations.map((location) => {
                      const meta =
                        OM_STATUS[location.status as keyof typeof OM_STATUS] ??
                        OM_STATUS.inactive;
                      return (
                        <tr
                          key={location.id}
                          className="hover:bg-bg-card transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-text-body">
                            {location.name}
                          </td>
                          <td className="px-4 py-3 text-text-body">
                            {location.address}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {location.max_capacity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}
                            >
                              {meta.labelLong}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditLocationForm(location)}
                                className="p-2 text-text-muted hover:text-primary transition-colors"
                                title="Editar local"
                              >
                                <AppIcon icon={Edit2} size="sm" decorative />
                              </button>
                              {location.status !== "inactive" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleInactivateLocation(location.id)
                                  }
                                  className="p-2 text-text-muted hover:text-error transition-colors"
                                  title="Inativar local"
                                >
                                  <AppIcon icon={Trash2} size="sm" decorative />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      case "profiles": {
        const allProfiles = accessProfiles;
        const adminCount = allProfiles.filter(
          (item) => item.role === "admin",
        ).length;
        const coordinatorCount = allProfiles.filter(
          (item) => item.role === "coordinator",
        ).length;
        const userCount = allProfiles.filter(
          (item) => item.role === "user",
        ).length;
        const normalizedProfileQuery = accessProfileQuery.trim().toLowerCase();
        const filteredProfiles = allProfiles.filter((item) => {
          const matchesRole =
            accessRoleFilter === "all" || item.role === accessRoleFilter;
          const displayName = getProfileDisplayName(item).toLowerCase();
          const matchesQuery =
            normalizedProfileQuery.length === 0 ||
            displayName.includes(normalizedProfileQuery) ||
            (item.email ?? "").toLowerCase().includes(normalizedProfileQuery) ||
            (item.rank ?? "").toLowerCase().includes(normalizedProfileQuery) ||
            (item.sector ?? "").toLowerCase().includes(normalizedProfileQuery);

          return matchesRole && matchesQuery;
        });
        const roleFilters: Array<{
          key: "all" | ProfileRole;
          label: string;
          count: number;
        }> = [
          {
            key: "all",
            label: "Todos",
            count: allProfiles.length,
          },
          {
            key: "user",
            label: "Usuarios",
            count: userCount,
          },
          {
            key: "coordinator",
            label: "Coordenadores",
            count: coordinatorCount,
          },
          {
            key: "admin",
            label: "Administradores",
            count: adminCount,
          },
        ];

        return (
          <div className="space-y-6">
            <section className="rounded-3xl border border-border-default bg-bg-card shadow-sm">
              <div className="border-b border-border-default px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-text-body sm:text-xl">
                  Gerenciamento de perfis de acesso
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Ajuste niveis de acesso e modulos de coordenadores pelo modal
                  de edicao.
                </p>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {roleFilters.map((filterItem) => {
                    const active = accessRoleFilter === filterItem.key;

                    return (
                      <button
                        key={filterItem.key}
                        type="button"
                        onClick={() => setAccessRoleFilter(filterItem.key)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border-default bg-bg-default hover:border-primary/30"
                        }`}
                      >
                        {filterItem.label}
                        <span className="ml-2 rounded-full bg-bg-card px-2 py-0.5 text-xs font-bold text-text-body">
                          {filterItem.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <label className="relative block">
                    <span className="sr-only">
                      Buscar perfil por nome ou e-mail
                    </span>
                    <AppIcon
                      icon={Search}
                      size="sm"
                      decorative
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="text"
                      value={accessProfileQuery}
                      onChange={(event) =>
                        setAccessProfileQuery(event.target.value)
                      }
                      placeholder="Buscar por nome, e-mail, posto ou setor"
                      className="h-11 w-full rounded-xl border border-border-default bg-bg-default pl-11 pr-4 text-sm text-text-body placeholder:text-text-muted focus-ring"
                    />
                  </label>

                  <div className="flex items-center rounded-xl border border-border-default bg-bg-default px-4 py-3 text-sm text-text-body">
                    <p className="text-sm font-semibold text-text-body">
                      {filteredProfiles.length} de {allProfiles.length}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {accessProfilesLoading ? (
              <div className="space-y-3 rounded-3xl border border-border-default bg-bg-card p-5">
                <div className="h-5 w-48 animate-pulse rounded bg-border-default" />
                <div className="h-24 w-full animate-pulse rounded-2xl bg-border-default" />
                <div className="h-24 w-full animate-pulse rounded-2xl bg-border-default" />
              </div>
            ) : allProfiles.length === 0 ? (
              <div className="rounded-3xl border border-border-default bg-bg-card p-6 text-sm text-text-muted">
                Nenhum perfil encontrado.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-body">
                      Perfis cadastrados
                    </h3>
                  </div>
                </div>

                {filteredProfiles.length === 0 ? (
                  <div className="px-5 py-10 text-sm text-text-muted">
                    Nenhum perfil encontrado com os filtros atuais.
                  </div>
                ) : (
                  <div className="divide-y divide-border-default">
                    {filteredProfiles.map((item) => {
                      const name = getProfileDisplayName(item);
                      const initials = getNameInitials(name);
                      const role: ProfileRole = item.role ?? "user";
                      const tierStyle =
                        ROLE_TIER_STYLES[role] ?? ROLE_TIER_STYLES.user;
                      const isCurrentUser = item.id === user?.id;
                      const isSaving = savingAccessProfileId === item.id;
                      const isActive = item.active !== false;

                      return (
                        <article
                          key={item.id}
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-default/60"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${tierStyle.avatar}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-text-body">
                              {name}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-xs font-normal text-text-muted">
                                  (voce)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs leading-tight text-text-muted">
                              {item.email ?? "Sem e-mail"}
                            </p>
                          </div>
                          <span
                            className={`hidden shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-bold sm:inline-block ${tierStyle.pill}`}
                          >
                            {ACCESS_ROLE_LABEL[role]}
                          </span>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isActive
                                ? "bg-emerald-400"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                            title={isActive ? "Ativo" : "Inativo"}
                          />
                          <button
                            type="button"
                            disabled={isCurrentUser || isSaving}
                            onClick={() => openProfileEdit(item)}
                            className="shrink-0 rounded-xl p-1.5 text-text-muted transition-colors hover:bg-bg-card hover:text-text-body disabled:opacity-30"
                            title={
                              isCurrentUser
                                ? "Nao e possivel editar o proprio perfil"
                                : "Editar perfil"
                            }
                          >
                            {isSaving ? (
                              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-transparent" />
                            ) : (
                              <AppIcon icon={Edit2} size="sm" decorative />
                            )}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
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
                      {auditLogs.map((log) => (
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
      <div
        className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="system-settings-page"
      >
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-2xl shadow-primary/20 md:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 max-w-3xl">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                Configurações do Sistema
              </h1>
              <p className="mt-2 text-sm font-normal text-white/80 md:text-base">
                Ajuste parâmetros globais, perfis de acesso e auditoria em um
                único painel administrativo.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <nav className="rounded-2xl border border-border-default bg-bg-card p-3 shadow-sm sm:p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(TABS as ReadonlyArray<TabItem>).map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleSelectTab(tab.key)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-ring ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border-default bg-bg-default text-text-muted hover:text-text-body"
                    }`}
                  >
                    <AppIcon icon={tab.icon} size="sm" decorative />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="rounded-2xl border border-border-default bg-bg-card shadow-sm">
            <div className="min-h-[480px] p-4 sm:p-6 lg:p-8">
              {renderContent()}
            </div>
          </div>
        </section>

        <Dialog
          open={editingStandardId !== null}
          onClose={() => setEditingStandardId(null)}
          title={
            editingStandardId === "new"
              ? "Nova linha de indice"
              : "Editar linha de indice"
          }
          widthClassName="max-w-lg"
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingStandardId(null)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEvaluationRow()}
                disabled={savingEvaluation}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <AppIcon icon={Save} size="sm" decorative />
                Salvar
              </button>
            </div>
          }
        >
          <div className="grid gap-4">
            <label className="text-sm font-medium text-text-body">
              Faixa
              <input
                type="text"
                value={editFormData.faixa}
                onChange={(event) =>
                  setEditFormData((current) => ({
                    ...current,
                    faixa: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-text-body">
                Corrida
                <input
                  type="text"
                  value={editFormData.corrida}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      corrida: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-text-body">
                Flexão
                <input
                  type="text"
                  value={editFormData.flexao}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      flexao: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-text-body">
                Abdominal
                <input
                  type="text"
                  value={editFormData.abdominal}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      abdominal: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text-body">
                Conceito
                <input
                  type="text"
                  value={editFormData.conceito}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      conceito: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-text-body">
                Ordem
                <input
                  type="number"
                  min={0}
                  value={editFormData.sort_order}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      sort_order: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </Dialog>

        <Dialog
          open={locationFormOpen}
          onClose={() => setLocationFormOpen(false)}
          title={editingLocationId ? "Editar local" : "Novo local"}
          widthClassName="max-w-xl"
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLocationFormOpen(false)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveLocation()}
                disabled={savingLocation}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <AppIcon icon={Save} size="sm" decorative />
                Salvar local
              </button>
            </div>
          }
        >
          <div className="grid gap-4">
            <label className="text-sm font-medium text-text-body">
              Nome do local
              <input
                type="text"
                value={locationFormData.name}
                onChange={(event) =>
                  setLocationFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-text-body">
              Endereço
              <input
                type="text"
                value={locationFormData.address}
                onChange={(event) =>
                  setLocationFormData((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text-body">
                Capacidade
                <input
                  type="number"
                  min={0}
                  value={locationFormData.max_capacity}
                  onChange={(event) =>
                    setLocationFormData((current) => ({
                      ...current,
                      max_capacity: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-text-body">
                Status
                <select
                  value={locationFormData.status}
                  onChange={(event) =>
                    setLocationFormData((current) => ({
                      ...current,
                      status: event.target.value as Location["status"],
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm"
                >
                  <option value="active">Ativo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="inactive">Inativo</option>
                </select>
              </label>
            </div>
          </div>
        </Dialog>

        <Dialog
          open={editingProfile !== null}
          onClose={() => setEditingProfile(null)}
          title="Editar perfil de acesso"
          widthClassName="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="rounded-xl border border-border-default px-4 py-2 text-sm font-medium text-text-body transition-colors hover:bg-bg-default"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingAccessProfileId === editingProfile?.id}
                onClick={() => {
                  if (!editingProfile) return;
                  void handleUpdateAdministrativeRole(
                    editingProfile.id,
                    editRoleDraft,
                    editModulesDraft,
                  ).then(() => setEditingProfile(null));
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <AppIcon icon={Save} size="sm" decorative />
                Salvar alteracoes
              </button>
            </div>
          }
        >
          <div className="grid gap-5">
            {editingProfile &&
              (() => {
                const name = getProfileDisplayName(editingProfile);
                const initials = getNameInitials(name);
                const tier: ProfileRole = editingProfile.role ?? "user";
                const tierStyle =
                  ROLE_TIER_STYLES[tier] ?? ROLE_TIER_STYLES.user;

                return (
                  <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-default px-4 py-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${tierStyle.avatar}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-body">
                        {name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {editingProfile.email ?? "Sem e-mail"}
                      </p>
                    </div>
                  </div>
                );
              })()}

            <label className="text-sm font-medium text-text-body">
              Nivel de acesso
              <select
                value={editRoleDraft}
                onChange={(event) => {
                  const role = event.target.value as ProfileRole;
                  setEditRoleDraft(role);
                  if (role !== "coordinator") {
                    setEditModulesDraft([]);
                  }
                }}
                className="mt-2 w-full rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm"
              >
                {ACCESS_ROLE_OPTIONS.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {ACCESS_ROLE_LABEL[roleOption]}
                  </option>
                ))}
              </select>
            </label>

            {editRoleDraft === "coordinator" && (
              <div className="rounded-2xl border border-border-default bg-bg-default/60 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Modulos liberados
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADMIN_MODULE_DEFINITIONS.map((module) => {
                    const Icon = sidebarIconMap[module.sidebarIcon];
                    const checked = editModulesDraft.includes(module.path);

                    return (
                      <label
                        key={module.path}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                          checked
                            ? "border-primary/40 bg-primary/5 text-text-body"
                            : "border-border-default bg-bg-default text-text-muted hover:bg-bg-card"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditModulesDraft((previous) =>
                              checked
                                ? previous.filter(
                                    (path) => path !== module.path,
                                  )
                                : [...previous, module.path],
                            )
                          }
                          className="accent-primary"
                        />
                        {Icon ? (
                          <AppIcon icon={Icon} size="sm" decorative />
                        ) : null}
                        {module.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      </div>
    </Layout>
  );
}
