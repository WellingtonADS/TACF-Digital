export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
        />
      ))}
    </div>
  );
}
