/**
 * @page ProtectedRoute
 * @description Guard de rota para usuários autenticados.
 * @path src/components/ProtectedRoute.tsx
 */



import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import PageSkeleton from "./PageSkeleton";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element | null;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton fullPage rows={6} />;
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
