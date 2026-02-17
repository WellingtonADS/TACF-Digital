import { cn } from "@/utils/cn";
import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "alert" | "error" | "neutral" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className = "",
  children,
  ...rest
}) => {
  const variantClasses = {
    default: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-green-50 text-green-700 border border-green-200",
    alert: "bg-orange-50 text-orange-700 border border-orange-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
    outline: "bg-transparent border border-slate-300 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-colors",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
