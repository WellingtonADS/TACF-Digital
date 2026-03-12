/**
 * @page ReschedulingManagement
 * @description Gestão de pedidos de reagendamento.
 * @path src/pages/ReschedulingManagement.tsx
 */

import StatCard from "@/components/atomic/StatCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
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
import {
  fetchSwapRequests,
  updateSwapRequestStatus,
} from "@/services/bookings";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SwapRequestRow = Database["public"]["Tables"]["swap_requests"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type SwapStatus = SwapRequestRow["status"];

type RequestRow = {
  id: string;
  bookingId: string;
  status: SwapStatus;
  reasonText: string;
  attachmentUrl: string | null;
  originalDate: string | null;
  newDate: string | null;
  fullName: string;
  warName: string;
  saram: string;
};

type FilterStatus = "pendentes" | "aprovados" | "recusados";

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

const FILTER_OPTIONS: Array<{ value: FilterStatus; label: string }> = [
  { value: "pendentes", label: "Pendentes" },
  { value: "aprovados", label: "Aprovados" },
  { value: "recusados", label: "Recusados" },
];

const FILTER_TO_STATUS: Record<FilterStatus, SwapStatus> = {
  pendentes: "solicitado",
  aprovados: "aprovado",
  recusados: "cancelado",
};

function parseSwapReason(reason: string): {
  text: string;
  newDate: string | null;
  attachmentUrl: string | null;
} {
  try {
    const parsed = JSON.parse(reason) as {
      text?: string;
      new_date?: string;
      attachment_url?: string;
    };
    return {
      text: parsed.text ?? reason,
      newDate: parsed.new_date ?? null,
      attachmentUrl: parsed.attachment_url ?? null,
    };
  } catch {
    return {
      text: reason,
      newDate: null,
      attachmentUrl: null,
    };
  }
}

function PageHero({ total }: { total: number }) {
  return (
    <section>
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
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/95">
            Total: {total}
          </div>
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
  statusFilter: FilterStatus;
  setStatusFilter: (value: FilterStatus) => void;
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
      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold uppercase tracking-tighter text-primary hover:underline"
    >
      <Eye size={12} />
      Ver justificativa
    </button>
  );
}

function ActionButtons({
  canAct,
  onApprove,
  onReject,
}: {
  canAct: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={!canAct}
        className="flex min-h-9 items-center justify-center gap-1 rounded-lg bg-success px-3 py-2 text-[10px] font-bold text-success-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle size={12} />
        Deferir
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={!canAct}
        className="flex min-h-9 items-center justify-center gap-1 rounded-lg border border-error px-3 py-2 text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XCircle size={12} />
        Indeferir
      </button>
    </div>
  );
}

export default function ReschedulingManagement() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("pendentes");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const swaps = (await fetchSwapRequests()) as SwapRequestRow[];

        if (swaps.length === 0) {
          setRows([]);
          return;
        }

        const bookingIds = Array.from(
          new Set(swaps.map((swap) => swap.booking_id)),
        ).filter((id): id is string => Boolean(id));

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("id,user_id,session_id")
          .in("id", bookingIds);

        if (bookingsError) throw bookingsError;

        const bookings = (bookingsData ?? []) as Pick<
          BookingRow,
          "id" | "user_id" | "session_id"
        >[];

        const bookingsById = new Map<string, (typeof bookings)[number]>();
        bookings.forEach((booking) => bookingsById.set(booking.id, booking));

        const sessionIds = Array.from(
          new Set([
            ...bookings.map((booking) => booking.session_id),
            ...swaps.map((swap) => swap.new_session_id),
          ]),
        ).filter((id): id is string => Boolean(id));

        const sessionsById = new Map<string, string>();
        if (sessionIds.length > 0) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from("sessions")
            .select("id,date")
            .in("id", sessionIds);

          if (sessionsError) throw sessionsError;

          sessionsData?.forEach((session) =>
            sessionsById.set(session.id, session.date),
          );
        }

        const userIds = Array.from(
          new Set(bookings.map((booking) => booking.user_id)),
        );

        const profilesByUser = new Map<
          string,
          { full_name: string; war_name: string; saram: string }
        >();
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id,full_name,war_name,saram")
            .in("id", userIds);

          if (profilesError) throw profilesError;

          profilesData?.forEach((profile) =>
            profilesByUser.set(profile.id, {
              full_name: profile.full_name ?? "",
              war_name: profile.war_name ?? "",
              saram: profile.saram ?? "",
            }),
          );
        }

        setRows(
          swaps.map((swap) => {
            const booking = bookingsById.get(swap.booking_id);
            const profile = booking
              ? profilesByUser.get(booking.user_id)
              : undefined;
            const parsedReason = parseSwapReason(swap.reason);

            return {
              id: swap.id,
              bookingId: swap.booking_id,
              status: swap.status,
              reasonText: parsedReason.text,
              attachmentUrl: parsedReason.attachmentUrl,
              originalDate: booking
                ? (sessionsById.get(booking.session_id) ?? null)
                : null,
              newDate:
                sessionsById.get(swap.new_session_id) ?? parsedReason.newDate,
              fullName: profile?.full_name ?? "",
              warName: profile?.war_name ?? "",
              saram: profile?.saram ?? "",
            };
          }),
        );
      } catch (err) {
        console.error(err);
        toast.error("Falha ao carregar solicitações");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.status === "solicitado") acc.pendentes += 1;
        if (row.status === "aprovado") acc.aprovados += 1;
        if (row.status === "cancelado") acc.recusados += 1;
        return acc;
      },
      { pendentes: 0, aprovados: 0, recusados: 0 },
    );
  }, [rows]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const statusToShow = FILTER_TO_STATUS[statusFilter];

    return rows.filter((row) => {
      if (row.status !== statusToShow) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const target =
        `${row.fullName} ${row.warName} ${row.saram}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [rows, query, statusFilter]);

  async function changeStatus(
    requestId: string,
    bookingId: string,
    status: Extract<SwapStatus, "aprovado" | "cancelado">,
  ) {
    try {
      const { data } = await supabase.auth.getUser();
      const adminId = data.user?.id;

      await updateSwapRequestStatus(requestId, status, adminId);

      if (status === "aprovado") {
        await supabase
          .from("bookings")
          .update({ status: "remarcado" })
          .eq("id", bookingId);
      }

      toast.success("Registro atualizado");
      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === requestId ? { ...row, status } : row,
        ),
      );
      setSelected((currentSelected) =>
        currentSelected?.id === requestId
          ? { ...currentSelected, status }
          : currentSelected,
      );
    } catch (err) {
      console.error(err);
      toast.error("Falha ao atualizar solicitação");
    }
  }

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
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-0">
        <PageHero total={rows.length} />

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total" value={rows.length} icon={GitMerge} />
          <StatCard
            title="Pendentes"
            value={counts.pendentes}
            icon={AlertTriangle}
            className="border-b-4 border-secondary/30"
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
          />
          <StatCard
            title="Aprovados"
            value={counts.aprovados}
            icon={CheckCircle}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
          <StatCard
            title="Recusados"
            value={counts.recusados}
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

        <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
          <div className="space-y-2 p-3 md:hidden">
            {visibleRows.length === 0 ? (
              <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-8 text-center">
                <p className="text-sm font-semibold text-text-body">
                  Nenhuma solicitação encontrada.
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Ajuste os filtros ou aguarde novas solicitações de
                  reagendamento.
                </p>
              </div>
            ) : (
              visibleRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-border-default bg-bg-card p-3"
                >
                  <p className="text-sm font-bold uppercase text-text-body">
                    {row.fullName || "(desconhecido)"}
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold text-text-muted">
                    SARAM: {row.saram || "----"}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
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

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left">
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
                    <td
                      className="px-6 py-10 text-sm text-text-muted"
                      colSpan={7}
                    >
                      Nenhuma solicitação encontrada para os filtros atuais.
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
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(row.id, row.bookingId, "aprovado")
                            }
                            disabled={row.status !== "solicitado"}
                            className="flex items-center gap-1 rounded-lg bg-success px-4 py-1.5 text-[10px] font-bold text-success-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Deferir
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(row.id, row.bookingId, "cancelado")
                            }
                            disabled={row.status !== "solicitado"}
                            className="flex items-center gap-1 rounded-lg border border-error px-4 py-1.5 text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Indeferir
                          </button>
                        </div>
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
