export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full rounded-2xl border border-border-default/70 dark:border-border-default/60 p-4 sm:p-6 bg-bg-card/90 dark:bg-bg-card/60 shadow-sm">
      <div className="mb-5 space-y-2">
        <div className="h-5 w-40 rounded-md bg-border-default dark:bg-border-default animate-pulse" />
        <div className="h-3 w-56 rounded-md bg-bg-card dark:bg-bg-card animate-pulse" />
      </div>
      <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-md bg-bg-card dark:bg-bg-card animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
