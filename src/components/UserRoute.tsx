/**
 * @page UserRoute
 * @description Guard de rota para usuários comuns.
 * @path src/components/UserRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import { isUserProfileComplete } from "@/utils/profileCompletion";
import { canAccessRoute, getDefaultHomeByRole } from "@/utils/routeAccess";
import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (loading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(profile?.role, "user")) {
    return <Navigate to={getDefaultHomeByRole(profile?.role)} replace />;
  }

  if (
    location.pathname !== "/app/perfil" &&
    !isUserProfileComplete(profile)
  ) {
    return <Navigate to="/app/perfil" replace />;
  }

  return children;
}
