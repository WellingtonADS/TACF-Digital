/**
 * @page PersonnelManagement
 * @description Listagem e gestão de pessoal.
 * @path src/pages/PersonnelManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import Dialog from "@/components/Dialog";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit2,
  FileText,
  Loader2,
  Mail,
  Phone,
  Save,
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
import {
  fetchPersonnelList,
  getProfileWithHistory,
  updateBookingEvaluation,
  updateProfile,
  type ProfileWithHistory,
} from "@/services/personnel";
import {
  buildBookingResultPayload,
  getBookingResultStatus,
  parseBookingResult,
  type BookingResultStatus,
} from "@/utils/bookingResults";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PersonnelRow = {
  id: string;
  fullName: string;
  warName: string | null;
  rank: string | null;
  sector: string | null;
  saram: string | null;
  active: boolean;
  lastTestDate: string | null;
  lastScore: string | null;
  status: "APTO" | "INAPTO" | "VENCIDO";
};

const PERSONNEL_REQUEST_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Personnel request timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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

const STATUS_BADGE_CLASS: Record<PersonnelRow["status"], string> = {
  APTO: "bg-success/10 text-success",
  VENCIDO: "bg-alert/10 text-alert",
  INAPTO: "bg-error/10 text-error",
};

const DETAIL_STATUS_BADGE_CLASS: Record<PersonnelRow["status"], string> = {
  APTO: "bg-success/10 text-success",
  INAPTO: "bg-error/10 text-error",
  VENCIDO: "bg-alert/10 text-alert",
};

function deriveStatus(
  active: boolean,
  lastTestDate: string | null,
  lastScore: string | null,
  resultDetails: unknown,
): PersonnelRow["status"] {
  if (!active) return "INAPTO";
  if (!lastTestDate) return "INAPTO";

  const explicitResult = getBookingResultStatus(resultDetails);
  const testDate = parseDateValue(lastTestDate);
  if (!testDate) return "INAPTO";
  const daysSinceTest =
    (Date.now() - testDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceTest > 365) return "VENCIDO";
  if (explicitResult === "inapto") return "INAPTO";
  if (explicitResult === "apto") return "APTO";
  if (lastScore === null) return "INAPTO";

  return "APTO";
}

function parseDateValue(value: string | null): Date | null {
  if (!value) return null;

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const parsed = dateOnlyPattern.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function dateLabel(value: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return "--";
  return format(parsed, "dd/MM/yyyy");
}

type TestRecord = {
  id: string;
  date: string | null;
  score: string | null;
  status: string;
  resultDetails: unknown;
};

type TAFEditDraft = {
  bookingId: string;
  testDate: string;
  score: string;
  corrida: string;
  flexao: string;
  abdominal: string;
  notes: string;
  resultStatus: BookingResultStatus;
};

type UserDetail = {
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
  lastScore: string | null;
  status: PersonnelRow["status"];
  testHistory: TestRecord[];
};

function buildUserDetail(
  row: PersonnelRow,
  detail?: ProfileWithHistory | null,
): UserDetail {
  const latestHistory = detail?.testHistory[0];
  const lastTestDate = latestHistory?.date ?? row.lastTestDate;
  const lastScore = latestHistory?.score ?? row.lastScore;
  const active = detail != null ? detail.active : row.active;

  return {
    id: row.id,
    full_name: detail?.full_name ?? row.fullName,
    war_name: detail?.war_name ?? row.warName,
    rank: detail?.rank ?? row.rank,
    sector: detail?.sector ?? row.sector,
    saram: detail?.saram ?? row.saram,
    email: detail?.email ?? null,
    phone_number: detail?.phone_number ?? null,
    role: detail?.role ?? null,
    active,
    birth_date: detail?.birth_date ?? null,
    physical_group: detail?.physical_group ?? null,
    inspsau_valid_until: detail?.inspsau_valid_until ?? null,
    inspsau_last_inspection: detail?.inspsau_last_inspection ?? null,
    created_at: detail?.created_at ?? null,
    lastTestDate,
    lastScore,
    status: deriveStatus(
      active,
      lastTestDate,
      lastScore,
      latestHistory?.resultDetails ?? null,
    ),
    testHistory: detail?.testHistory ?? [],
  };
}

function buildTafEditDraft(record: TestRecord): TAFEditDraft {
  const parsed = parseBookingResult(record.resultDetails);

  return {
    bookingId: record.id,
    testDate: record.date ? record.date.slice(0, 10) : "",
    score: record.score ?? "",
    corrida: parsed?.corrida ?? "",
    flexao: parsed?.flexao ?? "",
    abdominal: parsed?.abdominal ?? "",
    notes: parsed?.notes ?? "",
    resultStatus: parsed?.result_status ?? "apto",
  };
}

export default function PersonnelManagement() {
  const { loading: authLoading, profile: authProfile } = useAuth();
  const [rows, setRows] = useState<PersonnelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [rankFilter, setRankFilter] =
    useState<(typeof RANK_OPTIONS)[number]>("Todos");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos");

  // Drawer de detalhe
  const [selectedUser, setSelectedUser] = useState<PersonnelRow | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingActive, setSavingActive] = useState(false);
  const [tafDraft, setTafDraft] = useState<TAFEditDraft | null>(null);
  const [savingTaf, setSavingTaf] = useState(false);
  const canEditPersonnel = authProfile?.role === "admin";

  const loadPersonnelRows = useCallback(async () => {
    setLoading(true);
    try {
      const { profiles, latestBookings } = await withTimeout(
        fetchPersonnelList(),
        PERSONNEL_REQUEST_TIMEOUT_MS,
      );

      const mapped: PersonnelRow[] = profiles.map((profile) => {
        const latest = latestBookings.get(profile.id);
        const lastDate = latest?.test_date ?? latest?.created_at ?? null;
        const status = deriveStatus(
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

      setRows(mapped);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleToggleActive(newActive: boolean) {
    if (!userDetail || !selectedUser) return;
    if (!canEditPersonnel) {
      toast.error(
        "Apenas administradores podem alterar o status operacional do efetivo.",
      );
      return;
    }
    setSavingActive(true);
    try {
      await updateProfile(selectedUser.id, { active: newActive });
      setUserDetail((prev) => (prev ? { ...prev, active: newActive } : prev));
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedUser.id ? { ...r, active: newActive } : r,
        ),
      );
      toast.success(newActive ? "Militar ativado." : "Militar inativado.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setSavingActive(false);
    }
  }

  async function openProfile(row: PersonnelRow) {
    setSelectedUser(row);
    setTafDraft(null);
    // Popula imediatamente com os dados que já temos; o drawer não fica vazio
    setUserDetail(buildUserDetail(row));
    setLoadingDetail(true);
    try {
      const detail = await getProfileWithHistory(row.id);
      setUserDetail(buildUserDetail(row, detail));
    } catch (err) {
      console.error("[openProfile] unexpected error:", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDrawer() {
    setSelectedUser(null);
    setUserDetail(null);
    setTafDraft(null);
  }

  function startTafEdit(record: TestRecord) {
    if (!canEditPersonnel) {
      toast.error(
        "Apenas administradores podem editar dados operacionais do TACF.",
      );
      return;
    }

    setTafDraft(buildTafEditDraft(record));
  }

  function cancelTafEdit() {
    setTafDraft(null);
  }

  async function handleSaveTaf() {
    if (!tafDraft || !selectedUser) return;
    if (!canEditPersonnel) {
      toast.error(
        "Apenas administradores podem editar dados operacionais do TACF.",
      );
      return;
    }

    setSavingTaf(true);
    try {
      const resultDetails = buildBookingResultPayload({
        result_status: tafDraft.resultStatus,
        corrida: tafDraft.corrida,
        flexao: tafDraft.flexao,
        abdominal: tafDraft.abdominal,
        notes: tafDraft.notes,
      });

      await updateBookingEvaluation(tafDraft.bookingId, {
        test_date: tafDraft.testDate.trim() || null,
        score: tafDraft.score.trim() || null,
        result_details: resultDetails,
      });

      const updatedDetail = await getProfileWithHistory(selectedUser.id);
      setUserDetail(buildUserDetail(selectedUser, updatedDetail));
      await loadPersonnelRows();
      setTafDraft(null);
      toast.success("Lançamento TACF atualizado.");
    } catch (err: unknown) {
      const authMessage = getAuthorizationErrorMessage(
        err,
        "editar dados operacionais do TACF",
      );
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(authMessage ?? `Erro ao salvar lançamento TACF: ${msg}`);
    } finally {
      setSavingTaf(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    void loadPersonnelRows();
  }, [authLoading, loadPersonnelRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.fullName.toLowerCase().includes(normalizedQuery) ||
        (row.warName ?? "").toLowerCase().includes(normalizedQuery) ||
        (row.saram ?? "").includes(normalizedQuery);
      const matchesRank = rankFilter === "Todos" || row.rank === rankFilter;
      const matchesStatus =
        statusFilter === "Todos" || row.status === statusFilter;
      return matchesQuery && matchesRank && matchesStatus;
    });
  }, [rows, query, rankFilter, statusFilter]);

  const summary = useMemo(() => {
    const apto = rows.filter((row) => row.status === "APTO").length;
    const vencido = rows.filter((row) => row.status === "VENCIDO").length;
    const inapto = rows.filter((row) => row.status === "INAPTO").length;
    const now = new Date();
    const testsThisMonth = rows.filter((row) => {
      if (!row.lastTestDate) return false;
      const date = parseDateValue(row.lastTestDate);
      if (!date) return false;
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
    const aptoPercent =
      rows.length > 0 ? Math.round((apto / rows.length) * 100) : 0;
    return { apto, vencido, inapto, testsThisMonth, aptoPercent };
  }, [rows]);

  if (authLoading || loading) {
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

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Aptidão Geral"
            value={`${summary.aptoPercent}%`}
            icon={Shield}
          />

          <StatCard title="Total do Efetivo" value={rows.length} icon={Users} />

          <StatCard
            title="Testes no Mês"
            value={summary.testsThisMonth}
            icon={TrendingUp}
          />

          <StatCard
            title="Militares Aptos"
            value={summary.apto}
            icon={CheckCircle2}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
        </section>

        <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
          <div className="border-b border-border-default p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-center">
              <div className="relative min-w-0">
                <AppIcon
                  icon={Search}
                  size="sm"
                  decorative
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-border-default bg-bg-default pl-11 pr-11 text-sm text-text-body placeholder:text-text-muted focus-ring"
                  placeholder="Buscar por nome, nome de guerra ou SARAM"
                  type="text"
                />
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-card hover:text-text-body"
                    title="Limpar busca"
                    aria-label="Limpar busca"
                  >
                    <AppIcon icon={X} size="xs" decorative />
                  </button>
                )}
              </div>

              <select
                value={rankFilter}
                onChange={(event) =>
                  setRankFilter(
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
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as (typeof STATUS_OPTIONS)[number],
                  )
                }
                className="h-12 w-full rounded-2xl border border-border-default bg-bg-default px-4 text-sm font-medium text-text-muted focus-ring"
                aria-label="Filtrar por status de aptidão"
              >
                <option value="Todos">Status de Aptidão</option>
                {STATUS_OPTIONS.filter((item) => item !== "Todos").map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {filteredRows.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text-muted">
                Nenhum militar encontrado para os filtros selecionados.
              </p>
            ) : (
              filteredRows.map((row) => {
                const statusClass = STATUS_BADGE_CLASS[row.status];

                return (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border-default bg-bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-text-body">
                          {row.rank
                            ? `${row.rank} ${row.warName || row.fullName}`
                            : row.fullName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {row.sector || "Sem setor"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfile(row)}
                        className="p-2 text-text-muted transition-colors hover:text-primary"
                        title="Ver perfil"
                      >
                        <AppIcon icon={View} size="sm" decorative />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-text-muted">
                        SARAM: {row.saram || "--"}
                      </p>
                      <p className="text-text-muted">
                        Último Teste: {dateLabel(row.lastTestDate)}
                      </p>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-center">
              <thead className="bg-bg-default/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
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
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-text-muted">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-default">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-sm text-text-muted"
                      colSpan={5}
                    >
                      Nenhum militar encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const statusClass = STATUS_BADGE_CLASS[row.status];

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-bg-default/70"
                      >
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {initialsFromName(row.warName || row.fullName)}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-text-body">
                                {row.rank
                                  ? `${row.rank} ${row.warName || row.fullName}`
                                  : row.fullName}
                              </div>
                              <div className="text-xs text-text-muted">
                                {row.sector || "Sem setor"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center font-mono text-sm text-text-muted">
                          {row.saram || "--"}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-text-muted">
                          {dateLabel(row.lastTestDate)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {row.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => openProfile(row)}
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
              Mostrando {filteredRows.length} de {rows.length} militares
            </span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-border-default bg-bg-card text-xs font-bold text-text-muted">
                1
              </button>
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={Boolean(selectedUser)}
        onClose={closeDrawer}
        title={selectedUser?.fullName ?? "Perfil do militar"}
        description={
          selectedUser
            ? `${selectedUser.rank ?? "Sem posto"} · ${selectedUser.warName ?? "--"}`
            : undefined
        }
        widthClassName="max-w-3xl"
      >
        {selectedUser && userDetail ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-default p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {initialsFromName(selectedUser.fullName)}
              </div>
              <div>
                <p className="font-bold text-text-body">
                  {selectedUser.fullName}
                </p>
                <p className="text-xs text-text-muted">
                  {selectedUser.rank ?? "Sem posto"} ·{" "}
                  {selectedUser.warName ?? "--"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  Object.keys(
                    DETAIL_STATUS_BADGE_CLASS,
                  ) as PersonnelRow["status"][]
                ).map((s) =>
                  userDetail.status === s ? (
                    <span
                      key={s}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${DETAIL_STATUS_BADGE_CLASS[s]}`}
                    >
                      {s}
                    </span>
                  ) : null,
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    savingActive || userDetail.active || !canEditPersonnel
                  }
                  onClick={() => handleToggleActive(true)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                    userDetail.active
                      ? "border-success bg-success/10 text-success"
                      : "border-border-default text-text-muted hover:border-success/40"
                  }`}
                >
                  {savingActive && !userDetail.active ? (
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
                  disabled={
                    savingActive || !userDetail.active || !canEditPersonnel
                  }
                  onClick={() => handleToggleActive(false)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                    !userDetail.active
                      ? "border-error bg-error/10 text-error"
                      : "border-border-default text-text-muted hover:border-error/40"
                  }`}
                >
                  {savingActive && userDetail.active ? (
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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="space-y-3 rounded-xl border border-border-default p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                  <AppIcon icon={Shield} size="xs" decorative /> Identificação
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">SARAM</dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.saram ?? "--"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Posto/Graduação</dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.rank ?? "--"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Nome de Guerra</dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.war_name ?? "--"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Setor</dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.sector ?? "--"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Grupo Físico</dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.physical_group ?? "--"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Data de Nascimento</dt>
                    <dd className="font-semibold text-text-body">
                      {dateLabel(userDetail.birth_date)}
                    </dd>
                  </div>
                </dl>
              </section>

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
                      {userDetail.email ?? "--"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-text-muted">
                      <AppIcon icon={Phone} size="xs" decorative /> Telefone
                    </dt>
                    <dd className="font-semibold text-text-body">
                      {userDetail.phone_number ?? "--"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3 rounded-xl border border-border-default p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                  <AppIcon icon={Award} size="xs" decorative /> Inspeção de
                  Saúde (INSPSAU)
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Última Inspeção</dt>
                    <dd className="font-semibold text-text-body">
                      {dateLabel(userDetail.inspsau_last_inspection)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Válida até</dt>
                    <dd className="font-semibold text-text-body">
                      {dateLabel(userDetail.inspsau_valid_until)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3 rounded-xl border border-border-default p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                    <AppIcon icon={ClipboardList} size="xs" decorative />{" "}
                    Histórico TACF
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    {canEditPersonnel
                      ? "Apenas dados operacionais do TACF podem ser editados aqui."
                      : "Consulta somente para perfis sem administração plena."}
                  </span>
                </div>

                {userDetail.testHistory.length === 0 ? (
                  <p className="py-1 text-xs text-text-muted">
                    Nenhum teste registrado.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {userDetail.testHistory.map((t, idx) => {
                      const isFirst = idx === 0;
                      const parsedResult = parseBookingResult(t.resultDetails);
                      const explicitStatus =
                        parsedResult?.result_status ?? null;
                      const numericScore =
                        t.score !== null && t.score.trim()
                          ? Number(t.score)
                          : null;
                      const hasNumericScore =
                        numericScore !== null && !Number.isNaN(numericScore);
                      const isApto =
                        explicitStatus === "apto" ||
                        (explicitStatus == null &&
                          hasNumericScore &&
                          numericScore >= 70);
                      const isInapto =
                        explicitStatus === "inapto" ||
                        (explicitStatus == null &&
                          hasNumericScore &&
                          numericScore < 70);
                      const scoreColor = isApto
                        ? "text-success"
                        : isInapto
                          ? "text-error"
                          : "text-text-muted";
                      return (
                        <li
                          key={t.id}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                            isFirst
                              ? "border border-primary/20 bg-primary/5"
                              : "bg-bg-default"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isApto ? (
                              <AppIcon
                                icon={CheckCircle2}
                                size="xs"
                                decorative
                                className="shrink-0 text-success"
                              />
                            ) : isInapto ? (
                              <AppIcon
                                icon={XCircle}
                                size="xs"
                                decorative
                                className="shrink-0 text-error"
                              />
                            ) : (
                              <AppIcon
                                icon={FileText}
                                size="xs"
                                decorative
                                className="shrink-0 text-text-muted"
                              />
                            )}
                            <span className="text-text-muted">
                              {dateLabel(t.date)}
                            </span>
                            {isFirst && (
                              <span className="text-[10px] font-bold uppercase text-primary">
                                Último
                              </span>
                            )}
                            {explicitStatus && (
                              <span className="rounded-full bg-bg-card px-2 py-0.5 text-[10px] font-bold uppercase text-text-muted">
                                {explicitStatus}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold tabular-nums ${scoreColor}`}
                            >
                              {t.score !== null ? t.score : "—"}
                            </span>
                            {canEditPersonnel && (
                              <button
                                type="button"
                                onClick={() => startTafEdit(t)}
                                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-card hover:text-primary"
                                title="Editar lançamento TACF"
                              >
                                <AppIcon icon={Edit2} size="xs" decorative />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {tafDraft && (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">
                          Editar lançamento TACF
                        </p>
                        <p className="text-xs text-text-muted">
                          Ajuste somente resultado, data, média e índices do
                          teste.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={cancelTafEdit}
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-card hover:text-text-body"
                        title="Cancelar edição"
                      >
                        <AppIcon icon={X} size="xs" decorative />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Data do teste</span>
                        <input
                          type="date"
                          value={tafDraft.testDate}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    testDate: event.target.value,
                                  }
                                : current,
                            )
                          }
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        />
                      </label>

                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Média</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tafDraft.score}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? { ...current, score: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Ex: 72"
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        />
                      </label>

                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Corrida</span>
                        <input
                          type="text"
                          value={tafDraft.corrida}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? { ...current, corrida: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Ex: 3200m"
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        />
                      </label>

                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Flexão</span>
                        <input
                          type="text"
                          value={tafDraft.flexao}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? { ...current, flexao: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Ex: 38"
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        />
                      </label>

                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Abdominal</span>
                        <input
                          type="text"
                          value={tafDraft.abdominal}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? { ...current, abdominal: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Ex: 42"
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        />
                      </label>

                      <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                        <span>Resultado final</span>
                        <select
                          value={tafDraft.resultStatus}
                          onChange={(event) =>
                            setTafDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    resultStatus: event.target
                                      .value as BookingResultStatus,
                                  }
                                : current,
                            )
                          }
                          className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm font-medium text-text-body focus-ring"
                        >
                          <option value="apto">Apto</option>
                          <option value="inapto">Inapto</option>
                          <option value="pendente">Pendente</option>
                        </select>
                      </label>
                    </div>

                    <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <span>Observações operacionais</span>
                      <textarea
                        value={tafDraft.notes}
                        onChange={(event) =>
                          setTafDraft((current) =>
                            current
                              ? { ...current, notes: event.target.value }
                              : current,
                          )
                        }
                        rows={3}
                        placeholder="Registro administrativo do lançamento TACF."
                        className="w-full rounded-xl border border-border-default bg-bg-card px-3 py-2 text-sm text-text-body focus-ring"
                      />
                    </label>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelTafEdit}
                        className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-card"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={savingTaf}
                        onClick={() => void handleSaveTaf()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        <AppIcon
                          icon={savingTaf ? Loader2 : Save}
                          size="xs"
                          decorative
                          className={savingTaf ? "animate-spin" : undefined}
                        />
                        Salvar dados TACF
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <AppIcon icon={Calendar} size="xs" decorative />
              Cadastrado em {dateLabel(userDetail.created_at)}
            </p>

            {loadingDetail && (
              <div className="flex items-center gap-2 pt-1 text-xs text-text-muted">
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
      </Dialog>
    </Layout>
  );
}
