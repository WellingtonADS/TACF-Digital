import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        // not logged in - redirect to home/dashboard
        window.location.href = "/";
      } else if (profile.role !== "admin") {
        // redirect ordinary users to dashboard
        window.location.href = "/";
      }
    }
  }, [loading, profile]);

  if (loading) return <div>Loading...</div>;
  if (!profile || profile.role !== "admin") return null;
  return <>{children}</>;
}
