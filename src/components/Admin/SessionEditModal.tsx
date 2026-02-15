import Button from "@/components/ui/Button";
import { Clock, Plus, Trash2, Users } from "@/components/ui/icons";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  createSession,
  deleteSession,
  fetchSessionsByMonth,
} from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import toastUi from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SessionEditModalProps {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
  onSaved?: () => void; // Tornado opcional para evitar erro de 'undefined'
}

export default function SessionEditModal({
  isOpen,
  date,
  onClose,
  onSaved,
}: SessionEditModalProps) {
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(false);

  // Form States para Nova Sessão
  const [newPeriod, setNewPeriod] = useState<"morning" | "afternoon" | "">("");
  const [newCapacity, setNewCapacity] = useState("30");
  const [creating, setCreating] = useState(false);

  // Carrega as sessões do dia selecionado
  useEffect(() => {
    if (!isOpen) return;

    const loadSessions = async () => {
      setLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await fetchSessionsByMonth(year, month);

      if (res.data) {
        const dateKey = format(date, "yyyy-MM-dd");
        const daysSessions = res.data.filter((s) => s.date === dateKey);
        setSessions(daysSessions);
      }
      setLoading(false);
    };

    loadSessions();
  }, [isOpen, date]);

  const handleCreate = async () => {
    if (!newPeriod) return toast.error("Selecione um turno.");
    if (!newCapacity || parseInt(newCapacity) <= 0)
      return toast.error("Capacidade inválida.");

    setCreating(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const res = await createSession({
        date: dateStr,
        period: newPeriod,
        max_capacity: parseInt(newCapacity),
      } as {
        date: string;
        period: "morning" | "afternoon";
        max_capacity: number;
      });

      if (res.error) {
        toastUi.genericError(res.error);
      } else {
        toast.success("Sessão criada com sucesso!");
        onSaved?.(); // Chamada segura
        setNewPeriod("");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (
      !confirm(
        "Tem certeza? Isso cancelará todos os agendamentos desta sessão.",
      )
    )
      return;

    try {
      const res = await deleteSession(sessionId);
      if (res.error) {
        toastUi.genericError(res.error);
      } else {
        toast.success("Sessão removida.");
        onSaved?.(); // Chamada segura
      }
    } catch {
      toastUi.genericError("Erro ao remover sessão");
    }
  };

  const formattedDate = format(date, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gerenciar: ${formattedDate}`}
      maxWidth="md"
    >
      <div className="space-y-6 pt-2">
        {/* Lista de Sessões Existentes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sessões Ativas
          </h4>

          {loading ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Carregando...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm text-slate-500">
              Nenhuma sessão aberta para este dia.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${session.period === "morning" ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}
                  >
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {session.period === "morning" ? "Manhã" : "Tarde"}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Users size={12} /> {session.max_capacity} Vagas Totais
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                    {session.bookings?.length || 0} inscritos
                  </div>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Sessão"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-px bg-slate-100 my-4" />

        {/* Formulário de Nova Sessão */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Plus size={16} className="text-primary" /> Nova Sessão
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                Turno
              </label>
              <Select
                value={newPeriod}
                onValueChange={(v) =>
                  setNewPeriod(v as "morning" | "afternoon" | "")
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã (08h-12h)</SelectItem>
                  <SelectItem value="afternoon">Tarde (13h-17h)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                Capacidade
              </label>
              {/* CORREÇÃO: onChange em vez de onValueChange */}
              <Input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="bg-white"
                min={1}
                label="" // label vazio pois já temos um label visual acima
              />
            </div>
          </div>

          <Button
            onClick={handleCreate}
            isLoading={creating}
            block
            variant="primary"
            disabled={!newPeriod || !newCapacity}
          >
            Abrir Vagas
          </Button>
        </div>
      </div>
    </Modal>
  );
}
