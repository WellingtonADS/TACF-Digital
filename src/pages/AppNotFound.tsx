/**
 * @page AppNotFound
 * @description Estado exibido para rotas autenticadas inexistentes sob /app.
 * @path src/pages/AppNotFound.tsx
 */

import useAuth from "@/hooks/useAuth";
import { getDefaultHomeByRole } from "@/router/routeAccess";
import { Link } from "react-router-dom";

export default function AppNotFound() {
  const { profile } = useAuth();
  const actionTo = getDefaultHomeByRole(
    profile?.role,
    profile?.metadata ?? null,
  );

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/60 bg-background px-6 py-8 shadow-sm">
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Navegacao invalida
      </span>
      <h1 className="mt-3 text-2xl font-bold text-foreground">
        Pagina nao encontrada
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        O caminho acessado nao pertence a superficie oficial da aplicacao. Use a
        navegacao principal para retornar a um modulo suportado.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={actionTo}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Voltar para o modulo inicial
        </Link>
        <Link
          to="/app"
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Ir para a area do usuario
        </Link>
      </div>
    </section>
  );
}
