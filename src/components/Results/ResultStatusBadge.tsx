import AppIcon from "@/components/atomic/AppIcon";
import { CalendarClock, CheckCircle, MinusCircle, XCircle } from "@/icons";
import type { ResultStatus } from "@/utils/results";

type ResultStatusBadgeProps = {
  status: ResultStatus;
};

export default function ResultStatusBadge({ status }: ResultStatusBadgeProps) {
  if (status === "apto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-inverted">
        <AppIcon icon={CheckCircle} size="xs" tone="inverse" /> APTO
      </span>
    );
  }

  if (status === "inapto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-inverted">
        <AppIcon icon={XCircle} size="xs" tone="inverse" /> INAPTO
      </span>
    );
  }

  if (status === "pendente") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-default px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-body">
        <AppIcon icon={CalendarClock} size="xs" tone="muted" /> PENDENTE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-default px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
      <AppIcon icon={MinusCircle} size="xs" tone="muted" /> SEM STATUS
    </span>
  );
}
