/**
 * @page ReschedulingManagement
 * @description Gestão de pedidos de reagendamento.
 * @path src/pages/ReschedulingManagement.tsx
 */

import StatCard from "@/components/atomic/StatCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useReschedulingManagement, {
  type SwapStatus,
} from "@/hooks/useReschedulingManagement";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle,
  Eye,
  GitMerge,
  Search,
  X,
  XCircle,
} from "@/icons";

const STATUS_META: Record<SwapStatus, { label: string; badgeClass: string }> = {
  solicitado: {
    label: "Pendente",
    badgeClass: "bg-secondary/10 text-secondary border-secondary/20",
  },
  aprovado: {
    label: "Aprovado",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  cancelado: {
    label: "Recusado",
    badgeClass: "bg-error/10 text-error border-error/20",
  },
};

const FILTER_OPTIONS: Array<{ value: SwapStatus; label: string }> = [
  { value: "solicitado", label: "Pendentes" },
  { value: "aprovado", label: "Aprovados" },
  { value: "cancelado", label: "Recusados" },
];

function PageHero({ total: _total }: { total: number }) {
  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Gestão de Reagendamento
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Analise, defira ou indefira pedidos de reagendamento
            </p>
          </div>
          {/* hero intentionally kept minimal: only title + subtitle per project standard */}
        </div>
      </div>
    </section>
  );
}

function Toolbar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: SwapStatus;
  setStatusFilter: (value: SwapStatus) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm">
      <div className="flex flex-col items-stretch justify-between gap-3 border-b border-border-default p-3 md:flex-row md:items-center md:p-5">
        <div className="relative w-full md:min-w-0 md:flex-1">
          <input
            className="w-full rounded-xl border-none bg-bg-default py-2 pl-10 pr-4 text-sm text-text-body placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
            placeholder="Buscar por SARAM, nome ou nome de guerra..."
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Search
            size={16}
            className="absolute left-3 top-2.5 text-text-muted"
          />
        </div>

        <div className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-bg-default p-1 md:w-auto">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors md:px-3 ${
                statusFilter === option.value
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SwapStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_META[status].badgeClass}`}
    >
      {STATUS_META[status].label}
    </span>
  );
}

function ReasonButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold uppercase tracking-tight text-primary hover:underline"
    >
      <Eye size={12} />
      Ver justificativa
    </button>
  );
}

function EmptyRequestsState() {
  return (
    <div className="rounded-2xl border border-dashed border-border-default bg-bg-default/70 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-text-body">
        Nenhuma solicitacao encontrada.
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Ajuste os filtros ou aguarde novas solicitacoes de reagendamento.
      </p>
    </div>
  );
}

function ActionButtons({
  canAct,
  onApprove,
  onReject,
  orientation = "stacked",
}: {
  canAct: boolean;
  onApprove: () => void;
  onReject: () => void;
  orientation?: "stacked" | "inline";
}) {
  const isInline = orientation === "inline";
  return (
    <div
      className={
        isInline
          ? "flex items-center justify-end gap-3"
          : "grid grid-cols-1 gap-2 sm:grid-cols-2"
      }
    >
      <button
        type="button"
        onClick={onApprove}
        disabled={!canAct}
        className={`flex items-center justify-center gap-1 rounded-lg bg-success text-[10px] font-bold text-success-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
          isInline ? "px-4 py-1.5" : "min-h-9 px-3 py-2"
        }`}
      >
        <CheckCircle size={12} />
        Deferir
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={!canAct}
        className={`flex items-center justify-center gap-1 rounded-lg border border-error text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
          isInline ? "px-4 py-1.5" : "min-h-9 px-3 py-2"
        }`}
      >
        <XCircle size={12} />
        Indeferir
      </button>
    </div>
  );
}

export default function ReschedulingManagement() {
  const {
    rows,
    loading,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    selected,
    setSelected,
    counts,
    visibleRows,
    changeStatus,
  } = useReschedulingManagement();

  if (loading) {
    return (
      <FullPageLoading
        message="Carregando reagendamentos"
        description="Aguarde enquanto consolidamos as solicitações pendentes e concluídas."
      />
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PageHero total={rows.length} />

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total" value={rows.length} icon={GitMerge} />
          <StatCard
            title="Pendentes"
            value={counts.solicitado}
            icon={AlertTriangle}
            className="border-b-4 border-secondary/30"
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
          />
          <StatCard
            title="Aprovados"
            value={counts.aprovado}
            icon={CheckCircle}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
          <StatCard
            title="Recusados"
            value={counts.cancelado}
            icon={XCircle}
            className="border-b-4 border-error/30"
            iconBg="bg-error/10"
            iconColor="text-error"
          />
        </div>

        <Toolbar
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <p className="mt-3 px-1 text-xs text-text-muted">
          Exibindo {visibleRows.length} de {rows.length} solicitacoes no filtro
          atual.
        </p>

        <section className="mt-4 overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
          <div className="space-y-3 p-4 md:hidden">
            {visibleRows.length === 0 ? (
              <EmptyRequestsState />
            ) : (
              visibleRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-border-default bg-bg-card p-4 transition-colors hover:bg-bg-default/40"
                >
                  <p className="text-[13px] font-bold uppercase text-text-body">
                    {row.fullName || "(desconhecido)"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-text-muted">
                    SARAM: {row.saram || "----"}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                    <p className="flex items-center gap-2 text-text-muted">
                      <Calendar size={12} />
                      Data original: {row.originalDate ?? "--"}
                    </p>
                    <p className="flex items-center gap-2 text-primary">
                      <CalendarClock size={12} />
                      Nova data: {row.newDate ?? "--"}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusBadge status={row.status} />
                    <ReasonButton onClick={() => setSelected(row)} />
                  </div>
                  <div className="mt-3">
                    <ActionButtons
                      canAct={row.status === "solicitado"}
                      onApprove={() =>
                        changeStatus(row.id, row.bookingId, "aprovado")
                      }
                      onReject={() =>
                        changeStatus(row.id, row.bookingId, "cancelado")
                      }
                    />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden w-full overflow-x-auto lg:block">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-border-default bg-bg-default/60">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Militar
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    SARAM
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Data Original
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Nova Data
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Motivo
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Status
                  </th>
                  <th className="px-6 py-4 pr-12 text-right text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8" colSpan={7}>
                      <EmptyRequestsState />
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      key={row.id}
                      className="group transition-colors hover:bg-bg-default/70"
                    >
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold uppercase text-text-body">
                          {row.fullName || "(desconhecido)"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-semibold text-text-muted">
                          {row.saram || "----"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                          <Calendar size={14} />
                          {row.originalDate ?? "--"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <CalendarClock size={14} />
                          {row.newDate ?? "--"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <ReasonButton onClick={() => setSelected(row)} />
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionButtons
                          orientation="inline"
                          canAct={row.status === "solicitado"}
                          onApprove={() =>
                            changeStatus(row.id, row.bookingId, "aprovado")
                          }
                          onReject={() =>
                            changeStatus(row.id, row.bookingId, "cancelado")
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-4 left-4 right-4 z-40 rounded-xl border-2 border-primary bg-bg-card p-5 shadow-2xl ring-4 ring-primary/5 sm:bottom-8 sm:left-auto sm:right-8 sm:w-80">
            <div className="mb-3 flex items-center justify-between border-b border-border-default pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Justificativa Selecionada
              </span>
              <button
                type="button"
                className="text-text-muted transition-colors hover:text-text-body"
                onClick={() => setSelected(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Militar
                </span>
                <span className="text-xs font-bold uppercase text-text-body">
                  {selected.fullName || "(desconhecido)"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Motivo
                </span>
                <span className="text-xs italic font-semibold text-text-body">
                  {selected.reasonText}
                </span>
              </div>
              {selected.attachmentUrl && (
                <div className="pt-2">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Anexo
                  </span>
                  <a
                    className="text-xs font-semibold text-primary hover:underline"
                    href={selected.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir comprovativo
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
