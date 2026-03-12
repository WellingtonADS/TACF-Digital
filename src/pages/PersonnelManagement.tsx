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
import supabase from "@/services/supabase";
import type { Profile as DBProfile } from "@/types";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProfileRow = DBProfile;
type BookingQueryRow = {
  user_id: string;
  test_date: string | null;
  score: number | null;
  created_at: string | null;
};

type PersonnelRow = {
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

const STATUS_BADGE_CLASS: Record<PersonnelRow["status"], string> = {
  APTO: "bg-success/10 text-success",
  VENCIDO: "bg-error/10 text-error",
  INAPTO: "bg-primary/10 text-primary",
};

const DETAIL_STATUS_BADGE_CLASS: Record<PersonnelRow["status"], string> = {
  APTO: "bg-success/10 text-success",
  INAPTO: "bg-error/10 text-error",
  VENCIDO: "bg-primary/10 text-primary",
};

function deriveStatus(
  active: boolean,
  lastTestDate: string | null,
  lastScore: number | null,
): PersonnelRow["status"] {
  if (!active) return "INAPTO";
  if (!lastTestDate) return "INAPTO";

  const testDate = new Date(lastTestDate);
  const daysSinceTest =
    (Date.now() - testDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceTest > 365) return "VENCIDO";
  if (lastScore === null) return "INAPTO";

  return "APTO";
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function dateLabel(value: string | null) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return format(parsed, "dd/MM/yyyy");
}

type TestRecord = {
  id: string;
  date: string | null;
  score: number | null;
  status: string;
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
  lastScore: number | null;
  status: PersonnelRow["status"];
  testHistory: TestRecord[];
};

export default function PersonnelManagement() {
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

  async function handleToggleActive(newActive: boolean) {
    if (!userDetail || !selectedUser) return;
    setSavingActive(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: newActive })
        .eq("id", selectedUser.id);
      if (error) throw error;
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
    // Popula imediatamente com os dados que já temos; o drawer não fica vazio
    setUserDetail({
      id: row.id,
      full_name: row.fullName,
      war_name: row.warName,
      rank: row.rank,
      sector: row.sector,
      saram: row.saram,
      email: null,
      phone_number: null,
      role: null,
      active: row.active,
      birth_date: null,
      physical_group: null,
      inspsau_valid_until: null,
      inspsau_last_inspection: null,
      created_at: null,
      lastTestDate: row.lastTestDate,
      lastScore: row.lastScore,
      status: row.status,
      testHistory: [],
    });
    setLoadingDetail(true);
    try {
      const [{ data, error }, { data: bookings, error: bookingError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, war_name, rank, sector, saram, email, phone_number, role, active, created_at",
            )
            .eq("id", row.id)
            .maybeSingle(),
          supabase
            .from("bookings")
            .select("id, test_date, score, status, created_at")
            .eq("user_id", row.id)
            .neq("status", "cancelled")
            .order("test_date", { ascending: false, nullsFirst: false })
            .limit(10),
        ]);

      if (error) {
        console.warn("[openProfile] profiles query error:", error);
      }
      if (bookingError) {
        console.warn("[openProfile] bookings query error:", bookingError);
      }

      const history: TestRecord[] = (
        (bookings ?? []) as {
          id: string;
          test_date?: string | null;
          score?: number | null;
          status: string;
          created_at?: string | null;
        }[]
      ).map((b) => ({
        id: b.id,
        date: b.test_date ?? b.created_at ?? null,
        score: b.score ?? null,
        status: b.status,
      }));

      // Mescla com os dados extras do banco, se disponíveis
      setUserDetail((prev) => ({
        ...(prev ?? {}),
        id: row.id,
        full_name:
          (data as { full_name?: string | null } | null)?.full_name ??
          row.fullName,
        war_name:
          (data as { war_name?: string | null } | null)?.war_name ??
          row.warName,
        rank: (data as { rank?: string | null } | null)?.rank ?? row.rank,
        sector:
          (data as { sector?: string | null } | null)?.sector ?? row.sector,
        saram: (data as { saram?: string | null } | null)?.saram ?? row.saram,
        email: (data as { email?: string | null } | null)?.email ?? null,
        phone_number:
          (data as { phone_number?: string | null } | null)?.phone_number ??
          null,
        role: (data as { role?: string | null } | null)?.role ?? null,
        active:
          data !== null
            ? Boolean((data as { active?: boolean }).active)
            : row.active,
        birth_date:
          (data as { birth_date?: string | null } | null)?.birth_date ?? null,
        physical_group:
          (data as { physical_group?: string | null } | null)?.physical_group ??
          null,
        inspsau_valid_until:
          (data as { inspsau_valid_until?: string | null } | null)
            ?.inspsau_valid_until ?? null,
        inspsau_last_inspection:
          (data as { inspsau_last_inspection?: string | null } | null)
            ?.inspsau_last_inspection ?? null,
        created_at:
          (data as { created_at?: string | null } | null)?.created_at ?? null,
        lastTestDate: row.lastTestDate,
        lastScore: row.lastScore,
        status: row.status,
        testHistory: history,
      }));
    } catch (err) {
      console.error("[openProfile] unexpected error:", err);
      // userDetail já foi populado com dados básicos acima; não limpa
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDrawer() {
    setSelectedUser(null);
    setUserDetail(null);
  }

  useEffect(() => {
    async function loadPersonnel() {
      setLoading(true);
      try {
        const profileSelect =
          "id, full_name, war_name, rank, sector, saram, active";

        const [
          { data: profileData, error: profileError },
          { data: bookingData, error: bookingError },
        ] = await Promise.all([
          supabase.from("profiles").select(profileSelect),
          supabase
            .from("bookings")
            .select("user_id, test_date, score, created_at")
            .order("test_date", { ascending: false, nullsFirst: false }),
        ]);

        if (profileError) {
          throw profileError;
        }

        if (bookingError) {
          throw bookingError;
        }

        const latestByUser = new Map<
          string,
          Pick<BookingQueryRow, "test_date" | "score" | "created_at">
        >();

        ((bookingData ?? []) as BookingQueryRow[]).forEach((booking) => {
          const userId = booking.user_id;
          const current = latestByUser.get(userId);
          const bookingDate = booking.test_date ?? booking.created_at;
          const currentDate = current?.test_date ?? current?.created_at ?? null;

          if (
            !current ||
            (bookingDate && (!currentDate || bookingDate > currentDate))
          ) {
            latestByUser.set(userId, {
              test_date: booking.test_date,
              score: booking.score,
              created_at: booking.created_at,
            });
          }
        });

        const mapped: PersonnelRow[] = (profileData as ProfileRow[]).map(
          (profile) => {
            const latest = latestByUser.get(profile.id);
            const lastDate = latest?.test_date ?? latest?.created_at ?? null;
            const status = deriveStatus(
              Boolean(profile.active),
              lastDate,
              latest?.score ?? null,
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
          },
        );

        setRows(mapped);
      } catch (error) {
        console.error(error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadPersonnel();
  }, []);

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
      const date = new Date(row.lastTestDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    const aptoPercent =
      rows.length > 0 ? Math.round((apto / rows.length) * 100) : 0;

    return { apto, vencido, inapto, testsThisMonth, aptoPercent };
  }, [rows]);

  if (loading) {
    return <FullPageLoading message="Carregando efetivo" />;
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-0">
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
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-text-muted"
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {initialsFromName(row.warName || row.fullName)}
                            </div>
                            <div>
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

                        <td className="px-6 py-4 text-right">
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

      {/* ── Drawer de perfil ───────────────────────────────────────── */}
      {selectedUser && (
        <>
          {/* Overlay — acima da sidebar (z-50) */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Painel */}
          <aside className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-bg-card shadow-2xl">
            {/* Header do drawer */}
            <div className="flex items-center justify-between border-b border-border-default px-6 py-5">
              <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-default hover:text-text-body"
              >
                <AppIcon icon={X} size="sm" decorative />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {userDetail ? (
                <div className="space-y-6">
                  {/* Status badge + toggle ativo/inativo */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Toggle conta ativa/inativa */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingActive || userDetail.active}
                        onClick={() => handleToggleActive(true)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                          userDetail.active
                            ? "border-success bg-success/10 text-success"
                            : "border-border-default text-text-muted hover:border-success/40 disabled:opacity-100"
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
                        disabled={savingActive || !userDetail.active}
                        onClick={() => handleToggleActive(false)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                          !userDetail.active
                            ? "border-error bg-error/10 text-error"
                            : "border-border-default text-text-muted hover:border-error/40 disabled:opacity-100"
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

                  {/* Histórico de testes TACF */}
                  <section className="space-y-3 rounded-xl border border-border-default p-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                      <AppIcon icon={ClipboardList} size="xs" decorative />{" "}
                      Histórico TACF
                    </h3>

                    {userDetail.testHistory.length === 0 ? (
                      <p className="text-xs text-text-muted py-1">
                        Nenhum teste registrado.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {userDetail.testHistory.map((t, idx) => {
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
                                  {dateLabel(t.date)}
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
                    Cadastrado em {dateLabel(userDetail.created_at)}
                  </p>

                  {/* Indicador de carregamento de dados extras */}
                  {loadingDetail && (
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
