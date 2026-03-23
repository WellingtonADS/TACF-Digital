/**
 * @page ForbiddenState
 * @description Tela/estado exibido quando acesso é proibido.
 * @path src/components/ForbiddenState.tsx
 */

import { Link } from "react-router-dom";

type ForbiddenStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
};

export default function ForbiddenState({
  title = "Acesso negado",
  description = "Seu perfil nao possui permissao para acessar esta area.",
  actionLabel = "Voltar para inicio",
  actionTo = "/app",
}: ForbiddenStateProps) {
  return (
    <section className="mx-auto mt-8 max-w-xl rounded-xl border border-error/30 bg-error/10 p-6 text-error">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{description}</p>
      <div className="mt-4">
        <Link
          to={actionTo}
          className="inline-flex items-center rounded-lg bg-error px-4 py-2 text-sm font-semibold text-error-foreground hover:bg-error/90"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
