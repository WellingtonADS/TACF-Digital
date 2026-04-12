/**
 * @page AdminRoute
 * @description Guard de rota para acessos administrativos.
 * @path src/components/AdminRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import type { RouteAccess } from "@/types";
import { canAccessRoute } from "@/utils/routeAccess";
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
  access = "session_manager",
}: {
  children: JSX.Element | null;
  access?: Extract<RouteAccess, "platform_admin" | "session_manager">;
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (canAccessRoute(profile?.role, access)) {
    return children;
  }

  const isPlatformAdminRoute = access === "platform_admin";

  return (
    <ForbiddenState
      title={
        isPlatformAdminRoute
          ? "Area administrativa restrita"
          : "Area operacional restrita"
      }
      description={
        isPlatformAdminRoute
          ? "Seu perfil nao possui permissao para acessar funcionalidades administrativas."
          : "Seu perfil nao possui permissao para acessar funcionalidades operacionais de sessoes."
      }
      actionTo="/app"
    />
  );
}
