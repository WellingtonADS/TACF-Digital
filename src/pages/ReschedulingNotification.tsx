/**
 * @page ReschedulingNotification
 * @description Notificações e detalhes de reagendamentos.
 * @path src/pages/ReschedulingNotification.tsx
 */

import PageSkeleton from "@/components/PageSkeleton";
import Layout from "@/components/layout/Layout";
import { ArrowRight } from "@/icons";
import {
  fetchPendingSwapBookings,
  type PendingSwapBooking,
} from "@/services/bookings";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReschedulingNotification() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PendingSwapBooking[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchPendingSwapBookings();
        if (mounted) setItems(data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar notificações");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function markAsRead(id: string) {
    // Descarta a notificação da UI — a gestão do status do reagendamento
    // é feita pela página /app/reagendamentos via useReschedulingManagement.
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Notificação descartada");
  }

  if (loading) return <PageSkeleton />;

  const first = items[0] ?? null;

  return (
    <Layout>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-default bg-bg-card px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-icons text-primary-foreground">
              notifications
            </span>
          </div>
          <h1 className="text-sm md:text-lg lg:text-2xl font-extrabold text-text-body tracking-tight uppercase">
            Notificações de Reagendamento
          </h1>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
        {first ? (
          <article className="rounded-xl border border-border-default bg-bg-card p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text-body">
                      Solicitação de Reagendamento Recebida
                    </h2>
                    <p className="text-sm text-text-muted">
                      Recebida em{" "}
                      {new Date(first.created_at ?? "").toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-600 uppercase">
                      Pendente
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-text-body">
                  <p className="font-semibold">Militar ID: {first.user_id}</p>
                  <p className="mt-2">
                    Motivo: <span className="italic">{first.swap_reason}</span>
                  </p>
                  <p className="mt-2">
                    Data solicitada:{" "}
                    <strong className="text-primary">
                      {first.test_date ?? "--"}
                    </strong>
                  </p>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-2 font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    href={`/app/reagendamentos?bookingId=${first.id}`}
                  >
                    Ir para Gestão
                    <ArrowRight size={16} />
                  </a>
                  <button
                    onClick={() => markAsRead(first.id)}
                    className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                  >
                    Marcar como lida
                  </button>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-border-default bg-bg-card p-6 text-center shadow">
            <h3 className="text-lg font-semibold">Nenhuma nova notificação</h3>
            <p className="mt-2 text-sm text-text-muted">
              Não há solicitações de reagendamento pendentes.
            </p>
          </div>
        )}

        {/* list summary */}
        <section className="grid grid-cols-1 gap-3">
          {items.slice(0, 6).map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between rounded-lg border border-border-default bg-bg-card p-3"
            >
              <div className="text-sm">
                <div className="font-bold">Militar ID: {it.user_id}</div>
                <div className="text-xs text-text-muted">
                  {it.swap_reason?.slice(0, 80)}
                  {it.swap_reason && it.swap_reason.length > 80 ? "..." : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => markAsRead(it.id)}
                  className="text-xs px-3 py-1 rounded border"
                >
                  Marcar
                </button>
                <a
                  className="text-xs text-primary"
                  href={`/app/reagendamentos?bookingId=${it.id}`}
                >
                  Abrir
                </a>
              </div>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
}
