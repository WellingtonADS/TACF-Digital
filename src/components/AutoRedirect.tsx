import useAuth from "@/hooks/useAuth";
import { getDefaultHomeByRole } from "@/utils/routeAccess";
import { Navigate } from "react-router-dom";
import PageSkeleton from "./PageSkeleton";

export default function AutoRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PageSkeleton fullPage rows={6} />;
  }

  if (user) {
    return <Navigate to={getDefaultHomeByRole(profile?.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}
