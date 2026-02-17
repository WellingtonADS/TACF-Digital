import { Loader2 } from "@/components/ui/icons";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center text-primary/50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se não estiver logado ou não for admin, redireciona para Home
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
