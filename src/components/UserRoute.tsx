import useAuth from "@/hooks/useAuth";
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

  const role = profile?.role;
  if (role === "admin" || role === "coordinator") {
    return <Navigate to="/app/admin" replace />;
  }

  return children;
}
