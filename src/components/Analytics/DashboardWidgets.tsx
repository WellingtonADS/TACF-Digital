import type { ReactNode } from "react";
import { Download } from "@/icons";

export function EstadoVazio({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-text-muted">{text}</p>;
}

export function Esqueleto({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-1.5">
          <div className="h-3 w-32 rounded bg-border-default" />
          <div className="h-2 w-full rounded-full bg-border-default" />
        </div>
      ))}
    </>
  );
}

type CorDestaque = "primary" | "secondary" | "success" | "error";

export function CardIndicador({
  label,
  value,
  sub,
  icon,
  accent,
  className,
}: {
  label: string;
  value: string | null;
  sub: string;
  icon: ReactNode;
  accent: CorDestaque;
  className?: string;
}) {
  const borderMap: Record<CorDestaque, string> = {
    primary: "border-primary/30",
    secondary: "border-secondary/30",
    success: "border-success/30",
    error: "border-error/30",
  };
  const bgMap: Record<CorDestaque, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    error: "bg-error/10 text-error",
  };

  return (
    <div
      className={`flex w-full flex-col gap-3 overflow-hidden rounded-2xl border-b-4 bg-bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 ${borderMap[accent]} ${className || ""}`}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </p>
        <p
          className={`mt-2 text-2xl font-bold text-text-body sm:text-3xl ${value === null ? "animate-pulse text-text-muted" : ""}`}
        >
          {value ?? "—"}
        </p>
        <p className="mt-1 text-xs text-text-muted">{sub}</p>
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${bgMap[accent]}`}
      >
        {icon}
      </div>
    </div>
  );
}

export function SeletorFiltro({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-border-default bg-bg-card py-2 pl-3 pr-3 text-sm text-text-body"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CardExportacao({
  title,
  description,
  format,
  icon,
  onExport,
}: {
  title: string;
  description: string;
  format: string;
  icon: ReactNode;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border-default bg-bg-card p-5 shadow-sm sm:p-6">
      <div>
        <div className="mb-4 flex items-start gap-4">
          <div className="flex-shrink-0">{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-text-body">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="rounded-md bg-border-default px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-text-muted">
          {format}
        </span>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download size={13} />
          Baixar
        </button>
      </div>
    </div>
  );
}
