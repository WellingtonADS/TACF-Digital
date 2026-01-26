import { cn } from "@/utils/cn";
import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string; // Adicionado para exibir mensagens de validação
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <label
          className="text-sm font-semibold text-slate-700 leading-none cursor-default ml-1"
          htmlFor={id}
        >
          {label}
        </label>

        <div className="relative flex items-center group">
          {icon && (
            <div
              className={cn(
                "absolute left-3 transition-colors",
                error
                  ? "text-error"
                  : "text-slate-400 group-focus-within:text-secondary",
              )}
            >
              {icon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            className={cn(
              // Base e Typography
              "flex h-12 w-full rounded-xl border px-3 py-2 text-sm transition-all outline-none",
              // Cores usando seus Tokens
              "bg-white border-slate-100 text-slate-800 placeholder:text-slate-400",
              // Estados de Foco (Usando seu token Secondary)
              "focus:ring-2 focus:ring-secondary/20 focus:border-secondary shadow-sm",
              // Estado de Erro
              error &&
                "border-error focus:border-error focus:ring-error/20 bg-error/5",
              // Ajuste de Padding se houver ícone
              icon && "pl-10",
              // Cursor e Opacidade para Disabled
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100",
              className,
            )}
            {...props}
          />
        </div>

        {/* Mensagem de Erro Dinâmica */}
        {error && (
          <span className="text-[10px] font-bold text-error uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
