import { Loader2 } from "@/icons";
import AppIcon from "./atomic/AppIcon";

type FullPageLoadingProps = {
  message?: string;
  description?: string;
};

export default function FullPageLoading({
  message = "Carregando...",
  description = "Aguarde enquanto preparamos os dados.",
}: FullPageLoadingProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-default/90 px-4 backdrop-blur-sm"
    >
      <div className="card-surface-elevated w-full max-w-md rounded-3xl px-6 py-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <AppIcon
            icon={Loader2}
            size="lg"
            tone="primary"
            className="animate-spin"
            aria-hidden="true"
          />
        </div>

        <p className="text-base font-semibold text-text-body">{message}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </section>
  );
}
