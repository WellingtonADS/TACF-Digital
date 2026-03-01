import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import PageSkeleton from "./PageSkeleton";

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
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role;
  if (role === "admin" || role === "coordinator") {
    return children;
  }

  // not authorized, send to the standard dashboard so we don't leak the UI
  return <Navigate to="/app" replace />;
}
