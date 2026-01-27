import { cn } from "@/utils/cn";
import React from "react";

export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...rest
}) => (
  <h1
    className={cn(
      "text-2xl md:text-3xl font-bold text-slate-900 tracking-tight",
      className,
    )}
    {...rest}
  >
    {children}
  </h1>
);

export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...rest
}) => (
  <h2
    className={cn(
      "text-xl font-semibold text-slate-800 tracking-tight",
      className,
    )}
    {...rest}
  >
    {children}
  </h2>
);

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...rest
}) => (
  <p
    className={cn(
      "text-sm md:text-base text-slate-600 leading-relaxed",
      className,
    )}
    {...rest}
  >
    {children}
  </p>
);

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className,
  ...rest
}) => (
  <span
    className={cn("text-xs text-slate-500 font-medium", className)}
    {...rest}
  >
    {children}
  </span>
);

export default { H1, H2, Body, Caption };
