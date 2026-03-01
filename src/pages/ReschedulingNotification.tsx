import PageSkeleton from "@/components/PageSkeleton";
import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export default function ReschedulingNotification() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BookingRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            "id,user_id,session_id,test_date,swap_reason,status,created_at",
          )
          .not("swap_reason", "is", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (mounted) setItems((data ?? []) as unknown as BookingRow[]);
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

  async function markAsRead(id: string) {
    try {
      // naive update: mark status as 'read' or 'notified' according to project convention
      // supabase typing is strict; cast to any as in other pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { status: "notified" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("bookings") as any)
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      toast.success("Notificação marcada como lida");
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Falha ao atualizar notificação");
    }
  }

  if (loading) return <PageSkeleton />;

  const first = items[0] ?? null;

  return (
    <Layout>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-icons text-white">notifications</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
            Notificações de Reagendamento
          </h1>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto p-8 space-y-6">
        {first ? (
          <article className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Solicitação de Reagendamento Recebida
                    </h2>
                    <p className="text-sm text-slate-500">
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

                <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-all"
                    href={`/app/reagendamentos?bookingId=${first.id}`}
                  >
                    Ir para Gestão
                    <ArrowRight size={16} />
                  </a>
                  <button
                    onClick={() => markAsRead(first.id)}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
                  >
                    Marcar como lida
                  </button>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 text-center border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Nenhuma nova notificação</h3>
            <p className="text-sm text-slate-500 mt-2">
              Não há solicitações de reagendamento pendentes.
            </p>
          </div>
        )}

        {/* list summary */}
        <section className="grid grid-cols-1 gap-3">
          {items.slice(0, 6).map((it) => (
            <div
              key={it.id}
              className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="text-sm">
                <div className="font-bold">Militar ID: {it.user_id}</div>
                <div className="text-xs text-slate-500">
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
