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
  const [carregando, setCarregando] = useState(true);
  const [notificacoes, setNotificacoes] = useState<PendingSwapBooking[]>([]);

  useEffect(() => {
    let mounted = true;
    async function carregarNotificacoes() {
      setCarregando(true);
      try {
        const data = await fetchPendingSwapBookings();
        if (mounted) setNotificacoes(data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar notificações");
        setNotificacoes([]);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarNotificacoes();
    return () => {
      mounted = false;
    };
  }, []);

  function descartarNotificacao(id: string) {
    // Descarta a notificação da UI — a gestão do status do reagendamento
    // é feita pela página /app/reagendamentos via useReschedulingManagement.
    setNotificacoes((anteriores) =>
      anteriores.filter((notificacao) => notificacao.id !== id),
    );
    toast.success("Notificação descartada");
  }

  if (carregando) return <PageSkeleton />;

  const primeiraNotificacao = notificacoes[0] ?? null;

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
        {primeiraNotificacao ? (
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
                      {new Date(
                        primeiraNotificacao.created_at ?? "",
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase text-alert">
                      Pendente
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-text-body">
                  <p className="font-semibold">
                    Militar ID: {primeiraNotificacao.user_id}
                  </p>
                  <p className="mt-2">
                    Motivo:{" "}
                    <span className="italic">
                      {primeiraNotificacao.swap_reason}
                    </span>
                  </p>
                  <p className="mt-2">
                    Data solicitada:{" "}
                    <strong className="text-primary">
                      {primeiraNotificacao.test_date ?? "--"}
                    </strong>
                  </p>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-2 font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    href={`/app/reagendamentos?bookingId=${primeiraNotificacao.id}`}
                  >
                    Ir para Gestão
                    <ArrowRight size={16} />
                  </a>
                  <button
                    onClick={() =>
                      descartarNotificacao(primeiraNotificacao.id)
                    }
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
          {notificacoes.slice(0, 6).map((notificacao) => (
            <div
              key={notificacao.id}
              className="flex items-center justify-between rounded-lg border border-border-default bg-bg-card p-3"
            >
              <div className="text-sm">
                <div className="font-bold">
                  Militar ID: {notificacao.user_id}
                </div>
                <div className="text-xs text-text-muted">
                  {notificacao.swap_reason?.slice(0, 80)}
                  {notificacao.swap_reason &&
                  notificacao.swap_reason.length > 80
                    ? "..."
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => descartarNotificacao(notificacao.id)}
                  className="text-xs px-3 py-1 rounded border"
                >
                  Marcar
                </button>
                <a
                  className="text-xs text-primary"
                  href={`/app/reagendamentos?bookingId=${notificacao.id}`}
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
