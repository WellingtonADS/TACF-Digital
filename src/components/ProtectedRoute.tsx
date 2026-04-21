/**
 * @page ProtectedRoute
 * @description Guard de rota para usuários autenticados.
 * @path src/components/ProtectedRoute.tsx
 */

import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import FullPageLoading from "./FullPageLoading";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element | null;
}) {
  const { user, profile, loading } = useAuth();
  const hasCachedProfile = Boolean(profile);

  if (loading && !hasCachedProfile) {
    return <FullPageLoading />;
  }

  if (!user && !hasCachedProfile) return <Navigate to="/login" replace />;
  return children;
}
