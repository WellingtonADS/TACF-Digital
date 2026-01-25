import React from "react";

type Variant = "primary" | "ghost" | "success" | "alert" | "error";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  block?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary/95",
  ghost: "bg-transparent border border-primary text-primary hover:bg-primary/5",
  success: "bg-success text-white hover:bg-success/95",
  alert: "bg-alert text-white hover:bg-alert/95",
  error: "bg-error text-white hover:bg-error/95",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  block = false,
  className = "",
  disabled = false,
  children,
  ...rest
}) => {
  const classes = [
    "inline-flex items-center justify-center gap-2",
    sizeClasses[size],
    variantClasses[variant],
    "rounded",
    "font-medium",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
    block ? "w-full" : "",
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <span
          className="animate-spin inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
