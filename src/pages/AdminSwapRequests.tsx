import MainLayout from "@/components/Layout/MainLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { approveSwap, fetchPendingSwaps, rejectSwap } from "@/services/admin";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSwapRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<
    import("@/services/admin").PendingSwapView[]
  >([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchPendingSwaps();
      setRequests(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    try {
      const res = await approveSwap(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Aprovação realizada");
        await load();
      }
    } catch {
      toast.error("Erro ao aprovar");
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await rejectSwap(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Rejeição realizada");
        await load();
      }
    } catch {
      toast.error("Erro ao rejeitar");
    }
  }

  return (
    <MainLayout>
      <h1 className="text-2xl font-semibold mb-4">
        Pedidos de Troca Pendentes
      </h1>

      {loading && <div>Carregando...</div>}

      <div className="grid gap-4">
        {requests.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{r.full_name}</div>
                <div className="text-sm text-slate-600">{r.rank}</div>
                <div className="text-sm mt-2">Motivo: {r.reason}</div>
                <div className="text-sm mt-2">
                  De:{" "}
                  {r.from_date
                    ? format(new Date(r.from_date), "dd/LL/yyyy")
                    : "—"}{" "}
                  {r.from_period
                    ? `(${r.from_period === "morning" ? "Manhã" : "Tarde"})`
                    : ""}
                </div>
                <div className="text-sm">
                  Para:{" "}
                  {r.to_date ? format(new Date(r.to_date), "dd/LL/yyyy") : "—"}{" "}
                  {r.to_period
                    ? `(${r.to_period === "morning" ? "Manhã" : "Tarde"})`
                    : ""}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => handleReject(r.id)}>
                  Rejeitar
                </Button>
                <Button variant="primary" onClick={() => handleApprove(r.id)}>
                  Aprovar
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!loading && requests.length === 0 && <div>Nenhum pedido pendente</div>}
      </div>
    </MainLayout>
  );
}
