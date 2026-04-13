/**
 * @page AdminRoute
 * @description Guard de rota para acessos administrativos.
 * @path src/components/AdminRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import { canAccessRoute } from "@/router/routeAccess";
import { Navigate } from "react-router-dom";
import ForbiddenState from "./ForbiddenState";
import FullPageLoading from "./FullPageLoading";

/**
 * Protects routes that require administrator or coordinator privileges.
 * If the user isn't logged in they will be redirected to the login page.
 * If logged in without the required role, they are redirected to `/app`.
 */
export default function AdminRoute({
  children,
}: {
  children: JSX.Element | null;
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (canAccessRoute(profile?.role, "admin")) {
    return children;
  }

  return (
    <ForbiddenState
      title="Area administrativa restrita"
      description="Seu perfil nao possui permissao para acessar funcionalidades administrativas."
      actionTo="/app"
    />
  );
}
