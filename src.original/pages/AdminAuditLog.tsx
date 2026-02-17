import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Download,
  History,
  Search_Icon as Search,
} from "@/components/ui/icons";
import type { AuditLogEntry } from "@/services/admin";
import { fetchAuditLogs } from "@/services/admin";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FilterState = {
  action: string;
  userQuery: string;
  startDate: string;
  endDate: string;
};

const actionOptions = [
  { value: "", label: "Todas as acoes" },
  { value: "create", label: "Criacao" },
  { value: "update", label: "Atualizacao" },
  { value: "delete", label: "Exclusao" },
  { value: "login", label: "Login" },
  { value: "swap", label: "Troca" },
];

const PAGE_SIZE = 10;

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    action: "",
    userQuery: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAuditLogs();
        if (res.error) {
          throw new Error(res.error);
        }
        if (mounted) {
          setLogs(res.data);
        }
      } catch (err) {
        if (mounted) {
          const message =
            err instanceof Error ? err.message : "Falha ao carregar logs";
          setError(message);
          toast.error("Nao foi possivel carregar os logs de auditoria");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction =
        !filters.action ||
        (log.action ?? "").toLowerCase() === filters.action.toLowerCase();
      const matchesUser =
        !filters.userQuery ||
        (log.user_name ?? "").toLowerCase().includes(filters.userQuery) ||
        (log.user_id ?? "").toLowerCase().includes(filters.userQuery);

      const logDate = log.created_at ? new Date(log.created_at) : null;
      const matchesStart = filters.startDate
        ? logDate && logDate >= new Date(filters.startDate)
        : true;
      const matchesEnd = filters.endDate
        ? logDate && logDate <= new Date(filters.endDate)
        : true;

      return matchesAction && matchesUser && matchesStart && matchesEnd;
    });
  }, [logs, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleExportCsv = () => {
    const rows = filteredLogs.map((log) => [
      log.created_at,
      log.action ?? "",
      log.entity ?? "",
      log.user_name ?? log.user_id ?? "",
      log.details ?? "",
    ]);

    const header = ["data", "acao", "entidade", "usuario", "detalhes"];
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-log.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Logs de Auditoria"
        description="Registro de eventos sensiveis e operacoes administrativas."
        icon={<History />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
          >
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      <Card className="border border-slate-200 shadow-sm" padding="md">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Input
            aria-label="Buscar por usuário"
            placeholder="Buscar por usuario"
            value={filters.userQuery}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                userQuery: e.target.value.toLowerCase(),
              }))
            }
            icon={<Search size={16} />}
          />
          <select
            aria-label="Filtrar por ação"
            value={filters.action}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, action: e.target.value }))
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            aria-label="Data inicial"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
          />
          <input
            aria-label="Data final"
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
          />
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-slate-500 animate-pulse">
            Carregando logs...
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-sm text-red-600 bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Data
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Acao
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Entidade
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Usuario
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Nenhum registro encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}

                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                        {log.action ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.entity ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.user_name ?? log.user_id ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.details ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
              >
                Proxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
