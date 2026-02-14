import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface SidebarItemProps {
  children: ReactNode;
  href?: string;
  active?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

export function SidebarItem({
  children,
  href,
  active = false,
  icon,
  badge,
  onClick,
  className,
}: SidebarItemProps) {
  const Element = href ? "a" : "button";

  return (
    <Element
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors",
        "text-white hover:bg-white/10",
        active && "bg-white/20 border-r-4 border-military-gold",
        className,
      )}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="bg-military-gold text-primary px-2.5 py-0.5 rounded text-xs font-semibold">
          {badge}
        </span>
      )}
    </Element>
  );
}

export default SidebarItem;
