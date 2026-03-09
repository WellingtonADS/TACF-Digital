type Props = {
  rows?: number;
  fullPage?: boolean;
  showAvatar?: boolean;
  titleWidth?: string; // Tailwind width classes like 'w-40' or percentage classes
  subtitleWidth?: string;
};

export default function PageSkeleton({
  rows = 4,
  fullPage = false,
  showAvatar = false,
  titleWidth = "w-40",
  subtitleWidth = "w-56",
}: Props) {
  const containerBase =
    "rounded-2xl border border-border-default/70 dark:border-border-default/60 p-4 sm:p-6 bg-bg-card/90 dark:bg-bg-card/60 shadow-sm w-full";

  const content = (
    <>
      <span className="sr-only">Carregando...</span>

      <div className="mb-6 flex items-center gap-4">
        {/* Spinner mais visível */}
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-border-default"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>

        {showAvatar ? (
          <div className="h-12 w-12 rounded-full bg-border-default dark:bg-border-default animate-pulse shrink-0" />
        ) : null}

        <div className="flex-1 space-y-2">
          <div
            className={`${titleWidth} h-5 rounded-md bg-border-default/90 dark:bg-border-default/80 animate-pulse`}
          />
          <div
            className={`${subtitleWidth} h-3 rounded-md bg-bg-card/90 dark:bg-bg-card/80 animate-pulse`}
          />
        </div>
      </div>

      <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={
              `h-4 rounded-md bg-bg-card dark:bg-bg-card animate-pulse ` +
              (i % 3 === 0 ? " w-3/4" : i % 2 === 0 ? " w-full" : " w-5/6")
            }
          />
        ))}
      </div>
    </>
  );

  return (
    <section role="status" aria-live="polite" aria-busy="true">
      {fullPage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className={containerBase}>{content}</div>
        </div>
      ) : (
        <div className={containerBase}>{content}</div>
      )}
    </section>
  );
}
