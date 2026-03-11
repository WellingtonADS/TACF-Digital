import type { LucideIcon } from "@/icons";
import AppIcon from "./AppIcon";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
  iconBg?: string;
  iconColor?: string;
  className?: string;
  valueClassName?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  loading = false,
  iconBg,
  iconColor,
  className = "",
  valueClassName = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-3xl border border-border-default bg-bg-card p-4 md:p-6 ${className}`}
    >
      <div className="grid grid-cols-[auto,1fr] items-center gap-3 md:gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl md:h-14 md:w-14 ${iconBg ?? "bg-primary/10"} ${iconColor ?? "text-primary"}`}
        >
          <AppIcon
            icon={icon}
            size="sm"
            className="md:hidden"
            ariaLabel={title}
          />
          <AppIcon
            icon={icon}
            size="lg"
            className="hidden md:block"
            ariaLabel={title}
          />
        </div>
        <div className="min-w-0 w-full">
          <p className="text-sm font-medium leading-tight text-text-muted">
            {title}
          </p>
          <h3
            className={`mt-1 text-right text-2xl font-bold leading-none text-text-body md:text-[1.75rem] ${loading ? "animate-pulse text-text-muted" : ""} ${valueClassName}`}
          >
            {loading ? "—" : value}
          </h3>
        </div>
      </div>
    </div>
  );
}
