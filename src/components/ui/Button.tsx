import React from "react";

export type ButtonVariant = "primary" | "outline" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  block?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-900 text-white hover:bg-blue-800",
  outline:
    "bg-transparent border border-slate-300 text-slate-800 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export default function Button({
  variant = "primary",
  isLoading = false,
  block = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium";
  const classes = `${base} ${variantClasses[variant]} ${block ? "w-full" : ""} ${className}`;

  return (
    <button className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading && (
        <span className="animate-spin inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full" />
      )}
      <span>{children}</span>
    </button>
  );
}
