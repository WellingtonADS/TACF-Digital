/**
 * @page TicketModal
 * @description Modal para visualizar ou baixar bilhetes.
 * @path src/components/TicketModal.tsx
 */



import useTicket from "@/hooks/useTicket";
import { useCallback } from "react";
import { createPortal } from "react-dom";
import QR from "react-qr-code";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TicketModal({ open, onClose }: Props) {
  const { ticket: ticketData, loading } = useTicket();

  const copyValidationCode = useCallback(async () => {
    if (!ticketData?.code) return;
    try {
      await navigator.clipboard.writeText(ticketData.code);
    } catch {
      // ignore
    }
  }, [ticketData?.code]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(900px,95%)] max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">Bilhete Digital</h3>
          <button onClick={onClose} className="text-sm text-text-muted">
            Fechar
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-20 text-center">Carregando bilhete...</div>
          ) : !ticketData ? (
            <div className="py-10 text-center text-text-muted">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm p-4">
                <header className="bg-primary px-4 py-4 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/85">
                        Comprovante de Agendamento
                      </p>
                      <h1 className="mt-1 text-xl font-black tracking-tight">
                        {ticketData?.location}
                      </h1>
                    </div>
                    <div className="text-sm font-semibold">
                      {ticketData.confirmed ? "Confirmado" : "Agendado"}
                    </div>
                  </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-2 p-4">
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase">
                      Militar
                    </p>
                    <p className="text-xl font-black">{ticketData.name}</p>

                    <p className="mt-3 text-xs font-bold text-text-muted uppercase">
                      SARAM
                    </p>
                    <p className="font-mono text-lg font-bold">
                      {ticketData.saram}
                    </p>

                    <p className="mt-3 text-xs font-bold text-text-muted uppercase">
                      Data e Horário
                    </p>
                    <p className="font-semibold">
                      {ticketData.date} | {ticketData.time}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-44">
                      <QR
                        value={ticketData.code}
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
                          {ticketData.code}
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={copyValidationCode}
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
                        <button
                          onClick={() => {
                            /* gerar PDF pode ficar para depois */
                          }}
                          className="rounded-xl bg-primary text-white px-3 py-2 text-sm"
                        >
                          Salvar PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
