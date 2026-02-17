import { cn } from "@/utils/cn"; // Nossa utilidade para merge de classes
import React from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "alert"
  | "error"
  | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  block?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  block = false,
  className = "",
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  // Mapeamento de variantes usando seus Design Tokens
  const variantStyles: Record<Variant, string> = {
    primary:
      "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20",
    secondary:
      "bg-secondary text-white hover:bg-secondary/90 shadow-md shadow-secondary/20",
    success: "bg-success text-white hover:bg-success/90",
    alert: "bg-alert text-white hover:bg-alert/90",
    error: "bg-error text-white hover:bg-error/90",
    ghost:
      "bg-transparent text-primary border border-primary hover:bg-primary/5",
    outline:
      "bg-transparent border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
  };

  const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  };

  return (
    <button
      className={cn(
        // Base: Flexbox, Alinhamento, Fonte e Transição
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98]",
        // Estilos de Tamanho e Variante
        sizeStyles[size],
        variantStyles[variant],
        // Estados de Bloqueio/Carregamento
        block && "w-full",
        (disabled || isLoading) &&
          "opacity-60 cursor-not-allowed active:scale-100",
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="opacity-80">Processando...</span>
        </div>
      ) : (
        <>{children}</>
      )}
    </button>
  );
}
