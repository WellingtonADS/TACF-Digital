/**
 * @page AppIcon
 * @description Wrapper de ícones do design system.
 * @path src/components/atomic/AppIcon.tsx
 */



import type { LucideIcon, LucideProps } from "@/icons";
import clsx from "clsx";

type SizeKey = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<SizeKey, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
};

// optional semantic tone that maps to a Tailwind text color class like
// "text-primary" or "text-muted". This keeps callers from having to repeat
// the same `className` logic everywhere.
export interface AppIconProps extends Omit<LucideProps, "size"> {
  icon: LucideIcon;
  size?: SizeKey | number;
  className?: string;
  ariaLabel?: string;
  decorative?: boolean;
  tone?: string;
}

export default function AppIcon({
  icon: Icon,
  size = "md",
  className,
  ariaLabel,
  decorative = false,
  tone,
  strokeWidth,
  ...props
}: AppIconProps) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const toneClass = tone ? `text-${tone}` : "";

  return (
    <Icon
      size={px}
      strokeWidth={strokeWidth}
      className={clsx(toneClass, className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : ariaLabel}
      {...props}
    />
  );
}
