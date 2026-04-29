import Dialog from "@/components/Dialog";
import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import useAuth from "@/hooks/useAuth";
import useReschedulingManagement, {
  type RequestRow,
  type SwapStatus,
} from "@/hooks/useReschedulingManagement";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  GitMerge,
  Search,
  XCircle,
} from "@/icons";
import { toast } from "sonner";

const TABLE_CELL_CLASS =
  "border-y border-border-default/70 bg-bg-card/95 py-4 align-middle first:rounded-l-2xl first:border-l first:pl-5 last:rounded-r-2xl last:border-r last:pr-5";

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
            className="w-full rounded-xl border border-border-default bg-bg-default py-2 pl-10 pr-4 text-sm text-text-body placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
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
                  ? "bg-primary text-white shadow-sm"
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

function RequestListItem({
  row,
  onOpen,
}: {
  row: RequestRow;
  onOpen: () => void;
}) {
  const displayName = row.warName || row.fullName || "Sem identificação";
  const hasFullName =
    Boolean(row.fullName) &&
    row.fullName.toLowerCase() !== displayName.toLowerCase();

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="rescheduling-request-row-mobile"
      className="w-full px-4 py-3 text-left transition-colors hover:bg-bg-default/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 md:hidden"
    >
      <div className="grid grid-cols-1 gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Militar
          </span>
          <p className="truncate pt-0.5 text-sm font-bold uppercase tracking-[0.12em] text-text-body">
            {displayName}
          </p>
          {hasFullName ? (
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {row.fullName}
            </p>
          ) : null}
          <p className="mt-1 font-mono text-xs font-semibold text-text-muted">
            {row.saram || "--"}
          </p>
        </div>

        <div className="min-w-0 text-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Data Anterior
          </span>
          <p className="flex items-center gap-2 font-semibold text-text-body">
            <Calendar size={12} className="text-text-muted" />
            {row.originalDate ?? "--"}
          </p>
        </div>

        <div className="min-w-0 text-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Nova Data
          </span>
          <p className="flex items-center gap-2 font-semibold text-primary">
            <CalendarClock size={12} className="text-text-muted" />
            {row.newDate ?? "--"}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Status
          </span>
          <div className="pt-1">
            <StatusBadge status={row.status} />
          </div>
        </div>

        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Ações
          </span>
          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <AppIcon icon={ClipboardList} size="sm" decorative />
            Visualizar
          </span>
        </div>
      </div>
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
  canMutate,
  onApprove,
  onReject,
}: {
  canAct: boolean;
  canMutate: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isDisabled = !canAct || !canMutate;
  const title = canMutate
    ? undefined
    : "Perfil coordenador em modo leitura: ação indisponível.";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={isDisabled}
        title={title}
        className="flex min-h-9 items-center justify-center gap-1 rounded-lg bg-success px-3 py-2 text-[10px] font-bold text-success-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle size={12} />
        Deferir
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={isDisabled}
        title={title}
        className="flex min-h-9 items-center justify-center gap-1 rounded-lg border border-error px-3 py-2 text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XCircle size={12} />
        Indeferir
      </button>
    </div>
  );
}

export default function ReschedulingPanel() {
  const { profile } = useAuth();
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

  const canMutate = profile?.role === "admin";

  function handleUnauthorizedAction(action: "aprovar" | "indeferir") {
    toast.error(
      `Acesso negado: você não tem permissão para ${action} solicitações de reagendamento.`,
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-default bg-bg-card px-4 py-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-text-body">
          Carregando reagendamentos
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Aguarde enquanto consolidamos as solicitações pendentes e concluídas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      <p className="px-1 text-xs text-text-muted">
        Exibindo {visibleRows.length} de {rows.length} solicitacoes no filtro
        atual.
      </p>
      {!canMutate && (
        <div className="rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
          Seu perfil está em modo somente leitura. Solicitações podem ser
          visualizadas, mas apenas administradores podem deferir ou indeferir.
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
        {visibleRows.length === 0 ? (
          <div className="p-4">
            <EmptyRequestsState />
          </div>
        ) : (
          <div>
            <div className="divide-y divide-border-default md:hidden">
              {visibleRows.map((row) => (
                <RequestListItem
                  key={row.id}
                  row={row}
                  onOpen={() => setSelected(row)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto px-2 pb-2 md:block">
              <table className="w-full min-w-[760px] table-fixed border-separate [border-spacing:0_10px] text-center">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="whitespace-nowrap px-4 pb-2 pt-1 text-left text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Militar
                    </th>
                    <th className="whitespace-nowrap px-4 pb-2 pt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Data Anterior
                    </th>
                    <th className="whitespace-nowrap px-4 pb-2 pt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Nova Data
                    </th>
                    <th className="whitespace-nowrap px-4 pb-2 pt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 pb-2 pt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const displayName =
                      row.warName || row.fullName || "Sem identificação";
                    const hasFullName =
                      Boolean(row.fullName) &&
                      row.fullName.toLowerCase() !== displayName.toLowerCase();

                    return (
                      <tr
                        key={row.id}
                        data-testid="rescheduling-request-row"
                        className="group cursor-pointer"
                        onClick={() => setSelected(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(row);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Visualizar solicitação de ${displayName}`}
                      >
                        <td className={`${TABLE_CELL_CLASS} px-4 text-left`}>
                          <div className="flex flex-col items-start space-y-1">
                            <p className="truncate text-left text-sm font-bold uppercase tracking-[0.1em] text-text-body">
                              {displayName}
                            </p>
                            {hasFullName ? (
                              <p className="truncate text-left text-xs text-text-muted">
                                {row.fullName}
                              </p>
                            ) : null}
                            <p className="font-mono text-xs font-semibold text-text-muted">
                              {row.saram || "--"}
                            </p>
                          </div>
                        </td>

                        <td className={`${TABLE_CELL_CLASS} px-4`}>
                          <p className="flex items-center justify-center gap-2 text-sm font-semibold tabular-nums text-text-body">
                            <Calendar size={12} className="text-text-muted" />
                            {row.originalDate ?? "--"}
                          </p>
                        </td>

                        <td className={`${TABLE_CELL_CLASS} px-4`}>
                          <p className="flex items-center justify-center gap-2 text-sm font-semibold tabular-nums text-text-body">
                            <CalendarClock
                              size={12}
                              className="text-text-muted"
                            />
                            {row.newDate ?? "--"}
                          </p>
                        </td>

                        <td className={`${TABLE_CELL_CLASS} px-4 text-center`}>
                          <div className="flex justify-center">
                            <StatusBadge status={row.status} />
                          </div>
                        </td>

                        <td className={`${TABLE_CELL_CLASS} px-4 text-center`}>
                          <div className="mx-auto w-full max-w-[160px]">
                            <span className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:bg-primary/15 group-hover:shadow-sm">
                              <AppIcon
                                icon={ClipboardList}
                                size="sm"
                                decorative
                              />
                              Visualizar
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Solicitação de Reagendamento"
        description="Visualize os detalhes da solicitação e, quando aplicável, realize a decisão administrativa."
        widthClassName="max-w-xl"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Militar
                </span>
                <span className="mt-1 block text-sm font-bold uppercase text-text-body">
                  {selected.fullName || "(desconhecido)"}
                </span>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  SARAM
                </span>
                <span className="mt-1 block font-mono text-sm font-semibold text-text-body">
                  {selected.saram || "----"}
                </span>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Data Original
                </span>
                <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-body">
                  <Calendar size={14} />
                  {selected.originalDate ?? "--"}
                </span>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Nova Data
                </span>
                <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary">
                  <CalendarClock size={14} />
                  {selected.newDate ?? "--"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Status
              </span>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="rounded-xl border border-border-default bg-bg-default/50 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Motivo
              </span>
              <p className="mt-2 text-sm font-semibold italic text-text-body">
                {selected.reasonText}
              </p>
              {selected.attachmentUrl ? (
                <a
                  className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                  href={selected.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir comprovativo
                </a>
              ) : null}
            </div>

            {selected.status === "solicitado" ? (
              <ActionButtons
                canAct
                canMutate={canMutate}
                onApprove={() => {
                  if (!canMutate) {
                    handleUnauthorizedAction("aprovar");
                    return;
                  }
                  void changeStatus(
                    selected.id,
                    selected.bookingId,
                    "aprovado",
                  );
                }}
                onReject={() => {
                  if (!canMutate) {
                    handleUnauthorizedAction("indeferir");
                    return;
                  }
                  void changeStatus(
                    selected.id,
                    selected.bookingId,
                    "cancelado",
                  );
                }}
              />
            ) : (
              <p className="text-xs font-semibold text-text-muted">
                Solicitação já{" "}
                {STATUS_META[selected.status].label.toLowerCase()}.
              </p>
            )}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
