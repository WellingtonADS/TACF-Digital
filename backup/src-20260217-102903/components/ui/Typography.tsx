import { cn } from "@/utils/cn";

export function H1({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
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
}

export function H2({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
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
}

export function Body({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return (
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
}

export function Caption({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return (
    <span
      className={cn("text-xs text-slate-500 font-medium", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
