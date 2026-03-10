import type { LucideIcon, LucideProps } from "lucide-react";

type AppIconSize = "xs" | "sm" | "md" | "lg";
type AppIconTone = "default" | "muted" | "primary" | "inverse" | "danger";

const SIZE_MAP: Record<AppIconSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
};

const TONE_CLASS_MAP: Record<AppIconTone, string> = {
  default: "text-text-body",
  muted: "text-text-muted",
  primary: "text-primary",
  inverse: "text-text-inverted",
  danger: "text-error",
};

export type AppIconProps = Omit<LucideProps, "size"> & {
  icon: LucideIcon;
  size?: AppIconSize;
  tone?: AppIconTone;
};

export default function AppIcon({
  icon: IconComponent,
  size = "md",
  tone = "default",
  className,
  strokeWidth = 2,
  ...props
}: AppIconProps) {
  const resolvedClassName = `${TONE_CLASS_MAP[tone]} ${className ?? ""}`.trim();

  return (
    <IconComponent
      size={SIZE_MAP[size]}
      strokeWidth={strokeWidth}
      className={resolvedClassName}
      {...props}
    />
  );
}
