import AppIcon from "@/components/atomic/AppIcon";
import { CARD_INTERACTIVE_CLASS } from "@/components/atomic/Card";
import type { LucideIcon } from "@/icons";

export type AcaoRapidaAdmin = {
  icon: LucideIcon;
  label: string;
  description: string;
  path: string;
  accent?: string;
};

export default function QuickAccessCard({
  action,
  onClick,
}: {
  action: AcaoRapidaAdmin;
  onClick: () => void;
}) {
  const actionTestId = `admin-quick-action-${
    action.path.replace(/^\/app\/?/, "").replace(/[:/]+/g, "-") || "dashboard"
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={actionTestId}
      className={`${CARD_INTERACTIVE_CLASS} group flex h-full min-h-[156px] w-full flex-col items-start justify-start gap-3 rounded-2xl p-4 text-left md:min-h-[168px] md:p-5`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.accent}`}
      >
        <AppIcon icon={action.icon} size="sm" ariaLabel={action.label} />
      </div>
      <div className="flex w-full flex-1 flex-col text-left">
        <p className="line-clamp-2 text-left text-base font-semibold leading-tight text-text-body">
          {action.label}
        </p>
        <p className="mt-1 line-clamp-2 text-left text-xs leading-snug text-text-muted">
          {action.description}
        </p>
      </div>
    </button>
  );
}
