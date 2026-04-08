import AppIcon from "@/components/atomic/AppIcon";
import type { LucideIcon } from "lucide-react";

export type KpiAccent = "primary" | "secondary" | "success" | "error";

interface KpiCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
  icon: LucideIcon;
  accent: KpiAccent;
  className?: string;
}

const borderMap: Record<KpiAccent, string> = {
  primary: "border-primary/30",
  secondary: "border-secondary/30",
  success: "border-success/30",
  error: "border-error/30",
};

const bgMap: Record<KpiAccent, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
};

export default function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  className,
}: KpiCardProps) {
  return (
    <div
      className={`flex w-full flex-col gap-3 overflow-hidden rounded-2xl border-b-4 bg-bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 ${borderMap[accent]} ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </p>
        <p
          className={`mt-2 text-2xl font-bold sm:text-3xl ${value === null ? "animate-pulse text-text-muted" : "text-text-body"}`}
        >
          {value ?? "—"}
        </p>
        {sub !== undefined && (
          <p className="mt-1 text-xs text-text-muted">{sub}</p>
        )}
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${bgMap[accent]}`}
      >
        <AppIcon icon={icon} size="md" decorative />
      </div>
    </div>
  );
}
