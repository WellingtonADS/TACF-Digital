/**
 * @page UserRoute
 * @description Guard de rota para usuários comuns.
 * @path src/components/UserRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import {
  canAccessRoute,
  getDefaultHomeByRole,
  isMilitaryProfileComplete,
} from "@/router/routeAccess";
import { Navigate, useLocation } from "react-router-dom";
import FullPageLoading from "./FullPageLoading";

const INCOMPLETE_PROFILE_ALLOWED_PATHS = ["/app/perfil", "/app/documentos"];

function canAccessWithIncompleteProfile(pathname: string) {
  return INCOMPLETE_PROFILE_ALLOWED_PATHS.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );
}

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
    return (
      <Navigate
        to={getDefaultHomeByRole(profile?.role, profile?.metadata ?? null)}
        replace
      />
    );
  }

  if (
    !isMilitaryProfileComplete(profile) &&
    !canAccessWithIncompleteProfile(location.pathname)
  ) {
    return <Navigate to="/app/perfil" replace state={{ from: location }} />;
  }

  return children;
}
