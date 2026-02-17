import { Card } from "@/components/ui/Card";
import type { ElementType } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: StatsCardProps) {
  return (
    <Card className="p-6 flex items-start justify-between hover:shadow-lg transition-shadow border border-slate-100">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {Icon && (
        <div className="p-3 bg-primary/5 rounded-xl text-primary">
          <Icon style={{ fontSize: 24 }} />
        </div>
      )}
    </Card>
  );
}
