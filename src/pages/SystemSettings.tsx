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
  fetchEvaluationIndexRows,
  removeEvaluationIndexRow,
  saveEvaluationIndexRow,
  type EvaluationIndexCategory,
  type EvaluationIndexRow,
} from "@/services/evaluationTables";
import {
  fetchAuditLogs,
  fetchSystemSettings,
  saveSystemSettings,
} from "@/services/systemSettings";
import {
  BarChart2,
  Clock3,
  Edit2,
  MapPin,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle2,
  type LucideIcon,
} from "@/icons";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
} from "@/types";
import { formatDateTimePtBr } from "@/utils/date";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { OM_STATUS } from "@/utils/omStatus";
import type { Location } from "@/types/database.types";
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
  const [evaluationRows, setEvaluationRows] = useState<EvaluationIndexRow[]>([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

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
    if (!canView) {
      setSettingsLoading(false);
      return;
    }

    async function load() {
      setSettingsLoading(true);
      setLoading(true);
      try {
        const data = await fetchSystemSettings();
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
        id: editingStandardId === "new" ? undefined : editingStandardId ?? undefined,
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
        ? locations.find((location) => location.id === editingLocationId) ?? null
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
                      <tr key={row.id} className="hover:bg-bg-card transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-body">
                          {row.faixa}
                        </td>
                        <td className="px-4 py-3 text-center">{row.corrida}</td>
                        <td className="px-4 py-3 text-center">{row.flexao}</td>
                        <td className="px-4 py-3 text-center">{row.abdominal}</td>
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
                              onClick={() => void handleDeleteEvaluationRow(row.id)}
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
      </div>
    </Layout>
  );
}
