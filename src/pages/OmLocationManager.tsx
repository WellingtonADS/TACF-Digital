import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_OPTIONS = ["all", "active", "maintenance", "inactive"] as const;

const STATUS_META = {
  active: {
    label: "ATIVO",
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    accent: "border-l-emerald-500",
  },
  maintenance: {
    label: "MANUT",
    bar: "bg-amber-400",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
    accent: "border-l-amber-400",
  },
  inactive: {
    label: "INATIVO",
    bar: "bg-slate-400",
    badge:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    accent: "border-l-slate-400",
  },
} as const;

export default function OmLocationManager() {
  const navigate = useNavigate();
  const { locations, total, loading, error, fetch } = useLocations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetch({
      search,
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      limit: pageSize,
    });
  }, [search, statusFilter, page, fetch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <Layout>
      {/* ── Header ───────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary dark:text-white">
            Gestão de OMs e Locais
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Organizações Militares e infraestrutura cadastrada.{" "}
            <span className="font-semibold text-primary dark:text-sky-400">
              {loading ? "—" : total} registros
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/om/new")}
          className="flex items-center gap-2 bg-primary hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow font-bold text-sm transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          Nova OM
        </button>
      </header>

      {/* ── Toolbar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar organização militar ou localidade..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition"
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>

        {/* status filter tabs */}
        <div
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1"
          role="group"
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setStatusFilter(opt);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === opt
                  ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {opt === "all"
                ? "Todos"
                : STATUS_META[opt as keyof typeof STATUS_META].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl h-52 animate-pulse border border-slate-100 dark:border-slate-700"
            />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-slate-700">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">
            Nenhuma OM encontrada{search ? ` para "${search}"` : ""}.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/om/new")}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Cadastrar primeira OM →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => {
            const meta = STATUS_META[loc.status] ?? STATUS_META.inactive;
            return (
              <article
                key={loc.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4 ${meta.accent} flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all`}
              >
                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <Building2 size={18} />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* name + address */}
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-snug">
                      {loc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} />
                      {loc.address || "Endereço não informado"}
                    </p>
                  </div>

                  {/* capacity */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={12} />
                    <span>
                      Capacidade:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {loc.max_capacity} vagas
                      </strong>
                    </span>
                  </div>

                  {/* facilities */}
                  {loc.facilities && loc.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {loc.facilities.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] bg-primary/5 text-primary dark:bg-primary/10 px-2 py-0.5 rounded-full font-medium border border-primary/10"
                        >
                          {f}
                        </span>
                      ))}
                      {loc.facilities.length > 3 && (
                        <span className="text-[10px] text-slate-400 px-1">
                          +{loc.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="flex border-t border-slate-100 dark:border-slate-700 divide-x divide-slate-100 dark:divide-slate-700">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/om/${loc.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Edit size={13} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/om/${loc.id}/schedules`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Clock size={13} /> Horários
                  </button>
                </div>
              </article>
            );
          })}

          {/* add new card */}
          <button
            type="button"
            onClick={() => navigate("/app/om/new")}
            className="group bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/5 flex flex-col items-center justify-center gap-2 py-10 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-primary transition-colors">
              Cadastrar nova OM
            </span>
          </button>
        </div>
      )}

      {/* ── Pagination ────────────────────────────── */}
      {!loading && total > pageSize && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Exibindo {locations.length} de {total} OMs
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
              {page}
            </span>
            <button
              type="button"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
