/**
 * @page TicketsListDialog
 * @description Dialog com lista de tickets vinculados ao usuário.
 * @path src/components/Booking/TicketsListDialog.tsx
 */

import useAuth from "@/hooks/useAuth";
import { fetchUserTickets, type TicketRow } from "@/services/bookings";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import QR from "react-qr-code";
import Dialog from "@/components/Dialog";

export default function TicketsListDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [bilhetes, setBilhetes] = useState<TicketRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function carregarBilhetes() {
      if (!open) return;
      setCarregando(true);
      try {
        const uid = user?.id;
        if (!uid) {
          setBilhetes([]);
          return;
        }

        const data = await fetchUserTickets(uid);
        if (!mounted) return;
        setBilhetes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarBilhetes();
    return () => {
      mounted = false;
    };
  }, [open, user?.id]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Bilhetes (${bilhetes.length})`}
      widthClassName="max-w-[900px]"
    >
      <div className="space-y-4">
        {carregando ? (
          <div className="py-10 text-center text-text-body">
            Carregando bilhetes...
          </div>
        ) : bilhetes.length === 0 ? (
          <div className="py-10 text-center text-text-muted">
            Nenhum bilhete encontrado.
          </div>
        ) : (
          bilhetes.map((bilhete) => (
            <div key={bilhete.id} className="mx-auto max-w-3xl">
              <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-card p-4 shadow-sm">
                <header className="rounded-t-lg bg-primary px-4 py-4 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/85">
                        Comprovante de Agendamento
                      </p>
                      <h1 className="mt-1 text-xl font-black tracking-tight">
                        {bilhete.session?.location?.name ?? "Local"}
                      </h1>
                    </div>
                    <div className="text-sm font-semibold">
                      {bilhete.status ?? "—"}
                    </div>
                  </div>
                </header>

                <div className="grid gap-4 p-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-text-muted">
                      Militar
                    </p>
                    <p className="text-xl font-black">
                      {bilhete.profile?.war_name ?? bilhete.profile?.full_name ?? "—"}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase text-text-muted">
                      SARAM
                    </p>
                    <p className="font-mono text-lg font-bold">
                      {bilhete.profile?.saram ?? "—"}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase text-text-muted">
                      Data e Horário
                    </p>
                    <p className="font-semibold">
                      {bilhete.session?.date
                        ? `${new Date(bilhete.session.date).toLocaleDateString("pt-BR")} | ${bilhete.session?.period ? formatSessionPeriod(bilhete.session.period) : ""}`
                        : "—"}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-44">
                      <QR
                        value={bilhete.order_number ?? ""}
                        size={256}
                        style={{ width: "100%", height: "auto" }}
                      />
                    </div>
                    <div className="w-full">
                      <div className="rounded-xl border border-primary/10 bg-bg-card p-3 text-center">
                        <p className="text-xs font-bold uppercase text-primary/70">
                          Código de Validação
                        </p>
                        <p className="mt-2 font-mono text-lg font-bold text-primary">
                          {bilhete.order_number}
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                bilhete.order_number ?? "",
                              );
                            } catch {
                              // ignore
                            }
                          }}
                          className="flex-1 rounded-xl border border-border-default px-3 py-2 text-sm text-text-body"
                        >
                          Copiar Código
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="rounded-xl border border-border-default px-3 py-2 text-sm text-text-body"
                        >
                          Imprimir
                        </button>
                        <button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                          Salvar PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}
