import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="w-8 h-8 flex-shrink-0 text-primary">{icon}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {description && <p className="text-gray-600 text-sm">{description}</p>}
    </div>
  );
}

export default PageHeader;
