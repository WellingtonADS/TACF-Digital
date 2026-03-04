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
    return <PageSkeleton rows={6} />;
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
