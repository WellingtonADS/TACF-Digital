/**
 * @page UserRoute
 * @description Guard de rota para usuários comuns.
 * @path src/components/UserRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import { canAccessRoute, getDefaultHomeByRole } from "@/router/routeAccess";
import { Navigate } from "react-router-dom";
import FullPageLoading from "./FullPageLoading";

/**
 * Protege rotas exclusivas do usuário comum (militar).
 * - Sem autenticação: redireciona para login.
 * - Admin/coordinator: redireciona para o dashboard administrativo.
 */
export default function UserRoute({
  children,
}: {
  children: JSX.Element | null;
}) {
  const { user, profile, loading } = useAuth();
  const hasCachedProfile = Boolean(profile);

  if (loading && !hasCachedProfile) {
    return <FullPageLoading />;
  }

  if (!user && !hasCachedProfile) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(profile?.role, "user")) {
    return (
      <Navigate
        to={getDefaultHomeByRole(profile?.role, profile?.metadata ?? null)}
        replace
      />
    );
  }

  return children;
}
