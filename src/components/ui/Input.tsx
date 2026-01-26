import { cn } from "@/utils/cn";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    // Gerar ID aleatório para acessibilidade do label
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            className="text-sm font-semibold text-slate-700 ml-1 block"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {icon && (
            <div
              className={cn(
                "absolute left-4 transition-colors z-10 pointer-events-none",
                error
                  ? "text-error"
                  : "text-slate-400 group-focus-within:text-primary",
              )}
            >
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              // Base Layout
              "flex h-12 w-full rounded-xl px-4 py-3 text-sm transition-all outline-none",
              // Estilo Visual (Filled Style - Igual Login)
              "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400",
              // Hover
              "hover:bg-slate-100 hover:border-slate-300",
              // Focus
              "focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10",
              // Error State
              error &&
                "border-error focus:border-error focus:ring-error/10 bg-error/5",
              // Padding extra para ícone
              icon && "pl-11",
              // Disabled
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-100",
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <span className="text-[11px] font-bold text-error uppercase tracking-wide ml-1 animate-in slide-in-from-top-1 fade-in">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
