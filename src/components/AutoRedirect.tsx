import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import PageSkeleton from "./PageSkeleton";

export default function AutoRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  if (user) {
    // redirect based on role fetched from profile
    const role = profile?.role;
    if (role === "admin" || role === "coordinator") {
      return <Navigate to="/app/admin" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/login" replace />;
}
