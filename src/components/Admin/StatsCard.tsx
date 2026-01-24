export interface StatsCardProps {
  title: string;
  value: string | number;
  color?: "blue" | "green" | "yellow";
  sub?: string;
}

export default function StatsCard({
  title,
  value,
  color = "blue",
  sub,
}: StatsCardProps) {
  const bg =
    color === "blue"
      ? "bg-blue-50"
      : color === "green"
        ? "bg-emerald-50"
        : "bg-yellow-50";
  const txt =
    color === "blue"
      ? "text-blue-700"
      : color === "green"
        ? "text-emerald-700"
        : "text-yellow-700";
  return (
    <div className={`${bg} p-4 rounded-lg border`}>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      <div className={`text-2xl font-bold ${txt}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
