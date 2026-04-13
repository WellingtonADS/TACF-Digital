import AppIcon from "@/components/atomic/AppIcon";
import { Calendar, CheckCircle, Clock, Hash, MapPin } from "@/icons";
import { formatSessionPeriod } from "@/utils/booking";
import { formatDatePtBr } from "@/utils/date";
import type { ResultSummary } from "@/utils/results";
import type { ReactNode } from "react";
import ResultStatusBadge from "./ResultStatusBadge";

type ResultSummaryCardProps = {
  result: ResultSummary;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

type DetailItemProps = {
  label: string;
  value: string;
  icon: typeof Calendar;
};

function DetailItem({ label, value, icon }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-border-default bg-bg-default/60 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-card text-primary">
        <AppIcon icon={icon} size="md" tone="primary" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-text-body">{value}</p>
    </div>
  );
}

export default function ResultSummaryCard({
  result,
  eyebrow = "Resultado",
  title,
  description,
  actions,
}: ResultSummaryCardProps) {
  const dataAvaliacao = result.test_date ? formatDatePtBr(result.test_date) : "-";
  const turnoSessao = result.session_period
    ? formatSessionPeriod(result.session_period as "manha" | "tarde")
    : "-";
  const notaResultado = result.score ?? "--";
  const conceitoResultado = result.concept ? `Conceito ${result.concept}` : "-";
  const localResultado = result.location ?? "Local não informado";
  const presencaResultado = result.attendance_confirmed
    ? "Confirmada"
    : "Sem confirmação";
  const numeroOrdem = result.order_number ?? "Não informado";

  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
      <div className="border-b border-border-default bg-bg-default/40 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-text-body md:text-2xl">
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                {description}
              </p>
            )}
          </div>
          <ResultStatusBadge status={result.result_status ?? null} />
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem
          label="Data da avaliação"
          value={dataAvaliacao}
          icon={Calendar}
        />
        <DetailItem label="Turno" value={turnoSessao} icon={Clock} />
        <DetailItem label="Local" value={localResultado} icon={MapPin} />
        <DetailItem
          label="Média / conceito"
          value={`${notaResultado} ${result.concept ? `• ${conceitoResultado}` : ""}`.trim()}
          icon={CheckCircle}
        />
        <DetailItem label="Número de ordem" value={numeroOrdem} icon={Hash} />
        <DetailItem
          label="Presença"
          value={presencaResultado}
          icon={CheckCircle}
        />
      </div>

      {result.location_address && (
        <div className="border-t border-border-default px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Endereço do local
          </p>
          <p className="mt-2 text-sm text-text-body">
            {result.location_address}
          </p>
        </div>
      )}

      {result.notes && (
        <div className="border-t border-border-default px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Observações registradas
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-body">
            {result.notes}
          </p>
        </div>
      )}

      {actions && (
        <div className="border-t border-border-default bg-bg-default px-6 py-5">
          {actions}
        </div>
      )}
    </section>
  );
}
