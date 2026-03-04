export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 sm:p-6 bg-white/90 dark:bg-slate-900/60 shadow-sm">
      <div className="mb-5 space-y-2">
        <div className="h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-3 w-56 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
