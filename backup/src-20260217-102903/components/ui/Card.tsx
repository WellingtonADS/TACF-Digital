import { cn } from "@/utils/cn";
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      shadow = "md",
      padding = "none",
      bordered = true,
      ...props
    },
    ref,
  ) => {
    const shadowVariants = {
      none: "",
      sm: "shadow-sm",
      md: "shadow-md shadow-slate-200/50", // Sombra colorida suave
      lg: "shadow-xl shadow-slate-200/60",
    };

    const paddingVariants = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-2xl transition-all duration-200",
          bordered && "border border-slate-100",
          shadowVariants[shadow],
          paddingVariants[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

// Sub-componentes para organização profissional
export const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("p-6 border-b border-slate-50", className)}>
    {children}
  </div>
);

export const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("p-6", className)}>{children}</div>;

export const CardFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "p-6 bg-slate-50/50 border-t border-slate-50 rounded-b-2xl",
      className,
    )}
  >
    {children}
  </div>
);

export default Card;
