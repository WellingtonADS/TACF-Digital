import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { format } from "date-fns";
import {
  Download,
  Edit,
  Search,
  TrendingUp,
  UserCircle2,
  Users,
  View,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
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

export default function PersonnelManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PersonnelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [rankFilter, setRankFilter] =
    useState<(typeof RANK_OPTIONS)[number]>("Todos");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos");

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

  function exportCsv() {
    const header = [
      "nome",
      "nome_guerra",
      "posto_graduacao",
      "setor",
      "saram",
      "ultimo_teste",
      "score",
      "status",
    ];

    const body = filteredRows.map((row) => [
      row.fullName,
      row.warName ?? "",
      row.rank ?? "",
      row.sector ?? "",
      row.saram ?? "",
      dateLabel(row.lastTestDate),
      row.lastScore ?? "",
      row.status,
    ]);

    const csv = [header, ...body]
      .map((line) =>
        line
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "efetivo-tacf.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <div className="w-full">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Gestão de Efetivo
            </h1>
            <p className="text-slate-500 text-sm">
              Painel Administrativo TACF-Digital (FAB)
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white"
          >
            <Download size={16} />
            EXPORTAR RELATÓRIO
          </button>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative min-w-[260px] flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border-none bg-slate-50 py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/40 dark:bg-slate-800"
              placeholder="Buscar por SARAM ou Nome..."
              type="text"
            />
          </div>

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(event.target.value as (typeof RANK_OPTIONS)[number])
            }
            className="rounded-full border-none bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/40 dark:bg-slate-800 dark:text-slate-300"
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
            className="rounded-full border-none bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/40 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="Todos">Status de Aptidão</option>
            {STATUS_OPTIONS.filter((item) => item !== "Todos").map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 xl:col-span-9">
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Militar
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      SARAM
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Último Teste
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-sm text-slate-500"
                        colSpan={5}
                      >
                        Carregando efetivo...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-sm text-slate-500"
                        colSpan={5}
                      >
                        Nenhum militar encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const statusClass =
                        row.status === "APTO"
                          ? "bg-success/10 text-success"
                          : row.status === "VENCIDO"
                            ? "bg-error/10 text-error"
                            : "bg-primary/10 text-primary";

                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {initialsFromName(row.warName || row.fullName)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {row.rank
                                    ? `${row.rank} ${row.warName || row.fullName}`
                                    : row.fullName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {row.sector || "Sem setor"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">
                            {row.saram || "--"}
                          </td>

                          <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
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
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate("/app/perfil")}
                                className="p-2 text-slate-400 transition-colors hover:text-primary"
                              >
                                <View size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate("/app/perfil")}
                                className="p-2 text-slate-400 transition-colors hover:text-primary"
                              >
                                <Edit size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between bg-slate-50 p-6 dark:bg-slate-800/30">
                <span className="text-sm font-medium text-slate-500">
                  Mostrando {filteredRows.length} de {rows.length} militares
                </span>
                <div className="flex items-center gap-2">
                  <button className="h-8 w-8 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    1
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="col-span-12 space-y-6 xl:col-span-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
                Aptidão Geral
              </h3>

              <div className="mb-6 flex items-center justify-center">
                <div className="relative h-44 w-44">
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      background: `conic-gradient(rgb(45 90 39) ${summary.aptoPercent * 3.6}deg, rgb(192 57 43) ${summary.aptoPercent * 3.6}deg 360deg)`,
                    }}
                  />
                  <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {summary.aptoPercent}%
                    </span>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Aptos
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-success" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      Apto
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.apto}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-error" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      Vencido
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.vencido}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary/50" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      Inapto
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.inapto}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-primary p-6 text-white shadow-lg shadow-primary/20">
              <div className="mb-4 flex items-center justify-between">
                <Users className="opacity-80" size={18} />
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                  ESTE MÊS
                </span>
              </div>
              <h4 className="text-sm font-medium opacity-80">
                Testes Realizados
              </h4>
              <div className="mt-1 text-3xl font-bold">
                {summary.testsThisMonth}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                <TrendingUp size={14} />
                <span>Monitoramento contínuo do efetivo</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <UserCircle2 className="text-primary" size={18} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total do Efetivo
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {rows.length}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
