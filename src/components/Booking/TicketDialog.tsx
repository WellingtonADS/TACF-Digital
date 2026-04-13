/**
 * @page TicketDialog
 * @description Dialog para visualizar ou baixar bilhetes.
 * @path src/components/Booking/TicketDialog.tsx
 */

import useTicket from "@/hooks/useTicket";
import { useCallback } from "react";
import QR from "react-qr-code";
import Dialog from "@/components/Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TicketDialog({ open, onClose }: Props) {
  const { ticket: dadosBilhete, loading: carregando } = useTicket();

  const copiarCodigoValidacao = useCallback(async () => {
    if (!dadosBilhete?.code) return;
    try {
      await navigator.clipboard.writeText(dadosBilhete.code);
    } catch {
      // ignore
    }
  }, [dadosBilhete]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bilhete Digital"
      widthClassName="max-w-[900px]"
    >
      {carregando ? (
        <div className="py-20 text-center text-text-body">
          Carregando bilhete...
        </div>
      ) : !dadosBilhete ? (
        <div className="py-10 text-center text-text-muted">
          Nenhum agendamento encontrado.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-card p-4 shadow-sm">
            <header className="rounded-t-lg bg-primary px-4 py-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/85">
                    Comprovante de Agendamento
                  </p>
                  <h1 className="mt-1 text-xl font-black tracking-tight">
                    {dadosBilhete.location}
                  </h1>
                </div>
                <div className="text-sm font-semibold">
                  {dadosBilhete.confirmed ? "Confirmado" : "Agendado"}
                </div>
              </div>
            </header>

            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-text-muted">
                  Militar
                </p>
                <p className="text-xl font-black">{dadosBilhete.name}</p>

                <p className="mt-3 text-xs font-bold uppercase text-text-muted">
                  SARAM
                </p>
                <p className="font-mono text-lg font-bold">
                  {dadosBilhete.saram}
                </p>

                <p className="mt-3 text-xs font-bold uppercase text-text-muted">
                  Data e Horário
                </p>
                <p className="font-semibold">
                  {dadosBilhete.date} | {dadosBilhete.time}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-44">
                  <QR
                    value={dadosBilhete.code}
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
                      {dadosBilhete.code}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={copiarCodigoValidacao}
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
                    <button
                      onClick={() => {
                        /* gerar PDF pode ficar para depois */
                      }}
                      className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
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
    </Dialog>
  );
}
