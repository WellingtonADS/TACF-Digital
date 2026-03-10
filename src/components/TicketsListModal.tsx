import useAuth from "@/hooks/useAuth";
import supabase from "@/services/supabase";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QR from "react-qr-code";

type TicketRow = {
  id: string;
  order_number: string | null;
  status: string | null;
  session?: {
    date?: string | null;
    period?: string | null;
    location?: { name?: string | null } | null;
  } | null;
  profile?: {
    war_name?: string | null;
    full_name?: string | null;
    saram?: string | null;
  } | null;
};

export default function TicketsListModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open) return;
      setLoading(true);
      try {
        const uid = user?.id;
        if (!uid) {
          setTickets([]);
          return;
        }

        const { data, error } = await supabase
          .from("bookings")
          .select(
            "id, order_number, status, session: sessions(date, period, location:locations(name)), profile: profiles(war_name, full_name, saram)",
          )
          .eq("user_id", uid)
          .not("order_number", "is", null)
          .order("created_at", { ascending: false });

        if (error) console.error("Erro ao buscar bilhetes:", error);
        if (!mounted) return;
        setTickets(Array.isArray(data) ? (data as any) : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [open, user?.id]);

  if (!open) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(900px,95%)] max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Bilhetes ({tickets.length})</h3>
          <button onClick={onClose} className="text-sm text-text-muted">
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="py-10 text-center">Carregando bilhetes...</div>
          ) : tickets.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              Nenhum bilhete encontrado.
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="mx-auto max-w-3xl">
                <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm p-4">
                  <header className="bg-primary px-4 py-4 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/85">
                          Comprovante de Agendamento
                        </p>
                        <h1 className="mt-1 text-xl font-black tracking-tight">
                          {t.session?.location?.name ?? "Local"}
                        </h1>
                      </div>
                      <div className="text-sm font-semibold">
                        {t.status ?? "—"}
                      </div>
                    </div>
                  </header>

                  <div className="grid gap-4 lg:grid-cols-2 p-4">
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase">
                        Militar
                      </p>
                      <p className="text-xl font-black">
                        {t.profile?.war_name ?? t.profile?.full_name ?? "—"}
                      </p>

                      <p className="mt-3 text-xs font-bold text-text-muted uppercase">
                        SARAM
                      </p>
                      <p className="font-mono text-lg font-bold">
                        {t.profile?.saram ?? "—"}
                      </p>

                      <p className="mt-3 text-xs font-bold text-text-muted uppercase">
                        Data e Horário
                      </p>
                      <p className="font-semibold">
                        {t.session?.date
                          ? `${new Date(t.session.date).toLocaleDateString("pt-BR")} | ${t.session?.period ? formatSessionPeriod(t.session.period) : ""}`
                          : "—"}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="w-44">
                        <QR
                          value={t.order_number ?? ""}
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
                            {t.order_number}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  t.order_number ?? "",
                                );
                              } catch {}
                            }}
                            className="flex-1 rounded-xl border px-3 py-2 text-sm"
                          >
                            Copiar Código
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="rounded-xl border px-3 py-2 text-sm"
                          >
                            Imprimir
                          </button>
                          <button className="rounded-xl bg-primary text-white px-3 py-2 text-sm">
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
      </div>
    </div>,
    document.body,
  );
}
