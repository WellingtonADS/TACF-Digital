import Button from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { H1, Body } from "@/components/ui/Typography";
import { Badge } from "@/components/ui";
import { approveSwap, fetchPendingSwaps, rejectSwap } from "@/services/admin";
import toastUi from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Check, X, RefreshCw, User, Calendar, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Definindo o tipo localmente caso não esteja exportado, ou inferindo do serviço
interface SwapRequest {
  id: string;
  user_id: string;
  full_name: string;
  rank: string;
  saram: string;
  current_session_date: string;
  current_session_period: string;
  target_session_date: string;
  target_session_period: string;
  reason: string;
  created_at: string;
}

export default function AdminSwapRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchPendingSwaps();
      // Casting para garantir tipagem se o retorno for genérico
      setRequests((res || []) as unknown as SwapRequest[]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    if (!confirm("Confirmar aprovação desta troca?")) return;
    setProcessingId(id);
    try {
      const res = await approveSwap(id);
      if (res.error) toastUi.genericError(res.error);
      else {
        toastUi.approvalSuccess();
        await load();
      }
    } catch {
      toastUi.genericError("Erro ao aprovar");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeitar esta solicitação?")) return;
    setProcessingId(id);
    try {
      const res = await rejectSwap(id);
      if (res.error) toastUi.genericError(res.error);
      else {
        toast.success("Solicitação rejeitada.");
        await load();
      }
    } catch {
      toastUi.genericError("Erro ao rejeitar");
    } finally {
      setProcessingId(null);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const translatePeriod = (p: string) => (p === "morning" ? "Manhã" : "Tarde");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl hidden sm:block">
          <RefreshCw size={28} />
        </div>
        <div>
          <H1>Solicitações de Troca</H1>
          <Body className="text-slate-500 text-sm mt-1">
            Analise e decida sobre os pedidos de mudança de data dos militares.
          </Body>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4">
            <Check size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tudo limpo!</h3>
          <p className="text-slate-500">Nenhuma solicitação pendente no momento.</p>
        </div>
      )}

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {requests.map((r) => (
          <Card key={r.id} className="flex flex-col border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header do Card: Dados do Militar */}
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {r.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{r.full_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <User size={10} /> {r.rank} • {r.saram}
                    </div>
                  </div>
                </div>
                <Badge variant="alert" className="text-[10px]">Pendente</Badge>
              </div>
            </CardHeader>

            {/* Corpo: Detalhes da Troca */}
            <CardContent className="flex-1 py-5 space-y-4">
              
              {/* Comparativo de Datas */}
              <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Atual</div>
                  <div className="font-semibold text-slate-700">{formatDate(r.current_session_date)}</div>
                  <div className="text-xs text-slate-500">{translatePeriod(r.current_session_period)}</div>
                </div>

                <ArrowRight className="text-slate-300" size={20} />

                <div className="text-center">
                  <div className="text-[10px] text-primary uppercase font-bold mb-1">Novo</div>
                  <div className="font-semibold text-primary">{formatDate(r.target_session_date)}</div>
                  <div className="text-xs text-primary/80">{translatePeriod(r.target_session_period)}</div>
                </div>
              </div>

              {/* Justificativa */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase">
                  <MessageSquare size={12} /> Motivo
                </div>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 italic">
                  "{r.reason}"
                </p>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                <Calendar size={10} /> Solicitado em {formatDate(r.created_at)}
              </div>
            </CardContent>

            {/* Ações */}
            <CardFooter className="grid grid-cols-2 gap-3 pt-0 pb-5 px-5 border-t-0">
              <Button 
                variant="outline" 
                className="border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => handleReject(r.id)}
                disabled={processingId === r.id}
              >
                <X size={16} className="mr-2" /> Rejeitar
              </Button>
              <Button 
                variant="success" 
                className="shadow-md shadow-green-200"
                onClick={() => handleApprove(r.id)}
                isLoading={processingId === r.id}
                disabled={processingId !== null && processingId !== r.id}
              >
                <Check size={16} className="mr-2" /> Aprovar
              </Button>
            </CardFooter>

          </Card>
        ))}
      </div>
    </div>
  );
}