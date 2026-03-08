import useAuth from "@/hooks/useAuth";
import { canAccessRoute, getDefaultHomeByRole } from "@/utils/routeAccess";
import { Navigate } from "react-router-dom";
import PageSkeleton from "./PageSkeleton";

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

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(profile?.role, "user")) {
    return <Navigate to={getDefaultHomeByRole(profile?.role)} replace />;
  }

  return children;
}
