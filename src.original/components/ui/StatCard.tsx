import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
  variant?: "default" | "success" | "alert" | "error";
}

const variantStyles = {
  default: "bg-white border-l-4 border-primary",
  success: "bg-white border-l-4 border-success",
  alert: "bg-white border-l-4 border-alert",
  error: "bg-white border-l-4 border-error",
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-3xl shadow-md transition-all hover:shadow-lg",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <span className="w-12 h-12 flex-shrink-0 text-primary/20">
            {icon}
          </span>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.direction === "up" ? "text-success" : "text-error",
          )}
        >
          <span>{trend.direction === "up" ? "↑" : "↓"}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
