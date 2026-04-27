/**
 * @page RescheduleDialog
 * @description Dialog para solicitar ou visualizar trocas de sessão.
 * @path src/components/RescheduleDialog.tsx
 */

import type { SessionAvailability } from "@/hooks/useSessions";
import { createSwapRequest } from "@/services/bookings";
import supabase from "@/services/supabase";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Dialog from "./Dialog";

function getSwapErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const message = raw.toLowerCase();

  if (message.includes("ja existe solicitacao pendente")) {
    return "Já existe uma solicitação pendente para este agendamento.";
  }
  if (message.includes("reagendamento disponivel ate 2 dias antes")) {
    return "Reagendamento disponível até 2 dias antes da sessão.";
  }
  if (message.includes("nova sessao exige antecedencia minima de 2 dias")) {
    return "A nova sessão também precisa respeitar antecedência mínima de 2 dias.";
  }
  if (message.includes("nova sessao sem vagas")) {
    return "A nova sessão não possui vagas disponíveis.";
  }
  if (
    message.includes("reagendamento disponivel apenas para inapto ou falta")
  ) {
    return "Reagendamento disponível apenas para militar inapto ou com falta registrada.";
  }
  if (message.includes("nova sessao nao encontrada")) {
    return "Sessão de destino inválida. Selecione outra opção.";
  }

  return "Falha ao enviar solicitação";
}

interface Props {
  bookingId: string;
  currentDate: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RescheduleDialog({
  bookingId,
  currentDate,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [novaData, setNovaData] = useState("");
  const [sessoesDisponiveis, setSessoesDisponiveis] = useState<
    SessionAvailability[]
  >([]);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);
  const [sessaoSelecionadaId, setSessaoSelecionadaId] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) {
      setNovaData("");
      setSessoesDisponiveis([]);
      setSessaoSelecionadaId("");
      setJustificativa("");
      setArquivoComprovante(null);
    }
  }, [open]);

  async function carregarSessoesPorData(dataSelecionada: string) {
    setSessoesDisponiveis([]);
    setSessaoSelecionadaId("");
    if (!dataSelecionada) return;
    setCarregandoSessoes(true);
    try {
      const { data, error } = await supabase.rpc("get_sessions_availability", {
        p_start: dataSelecionada,
        p_end: dataSelecionada,
      });
      if (error) throw error;
      const sessoes = ((data as SessionAvailability[] | null) ?? []).filter(
        (sessao) => sessao.available_count > 0,
      );
      setSessoesDisponiveis(sessoes);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar sessões disponíveis");
    } finally {
      setCarregandoSessoes(false);
    }
  }

  async function enviarSolicitacao() {
    if (!novaData || !sessaoSelecionadaId || !justificativa) {
      toast.error("Data, sessão e justificativa são obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Usuário não autenticado");

      await createSwapRequest({
        bookingId,
        requestedBy: user.id,
        newSessionId: sessaoSelecionadaId,
        newDate: novaData,
        reasonText: justificativa,
        attachment: arquivoComprovante ?? undefined,
      });

      toast.success("Solicitação enviada");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(getSwapErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeDisabled={salvando}
      title="Solicitar Reagendamento"
      description="Selecione uma nova sessão disponível e informe a justificativa."
      widthClassName="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={salvando}
            className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-body transition-colors hover:bg-bg-card disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={enviarSolicitacao}
            disabled={salvando || !sessaoSelecionadaId || !justificativa}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {salvando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="current-date"
            className="block text-sm font-medium text-text-body"
          >
            Data atual
          </label>
          <input
            id="current-date"
            type="text"
            readOnly
            value={currentDate}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-default text-sm text-text-body"
          />
        </div>

        <div>
          <label
            htmlFor="new-date"
            className="block text-sm font-medium text-text-body"
          >
            Nova data
          </label>
          <input
            id="new-date"
            type="date"
            value={novaData}
            onChange={(e) => {
              setNovaData(e.target.value);
              void carregarSessoesPorData(e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-card text-sm text-text-body focus-ring"
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="session-select"
          className="block text-sm font-medium text-text-body"
        >
          Sessão disponível
        </label>
        {!novaData ? (
          <p className="mt-1 text-sm text-text-muted">
            Escolha uma nova data para carregar as sessões.
          </p>
        ) : carregandoSessoes ? (
          <p className="mt-1 text-sm text-text-muted">
            Carregando sessões...
          </p>
        ) : sessoesDisponiveis.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-error">
            Nenhuma sessão disponível nessa data.
          </p>
        ) : (
          <select
            id="session-select"
            value={sessaoSelecionadaId}
            onChange={(e) => setSessaoSelecionadaId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-card text-sm text-text-body focus-ring"
          >
            <option value="">Selecione uma sessão</option>
            {sessoesDisponiveis.map((sessao) => (
              <option key={sessao.session_id} value={sessao.session_id}>
                {formatSessionPeriod(sessao.period)} — {sessao.available_count} vaga(s)
                disponível(is)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4">
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-text-body"
        >
          Justificativa
        </label>
        <textarea
          id="reason"
          rows={4}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border-default bg-bg-card text-sm text-text-body placeholder:text-text-muted focus-ring"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="attachment"
          className="block text-sm font-medium text-text-body"
        >
          Comprovativo (opcional)
        </label>
        <input
          id="attachment"
          type="file"
          onChange={(e) =>
            setArquivoComprovante(e.target.files?.[0] ?? null)
          }
          className="mt-1 block w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:font-semibold file:text-primary hover:file:bg-primary/20"
        />
      </div>
    </Dialog>
  );
}
