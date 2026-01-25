import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "alert" | "error";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-white",
  success: "bg-success text-white",
  alert: "bg-alert text-white",
  error: "bg-error text-white",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className = "",
  children,
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
