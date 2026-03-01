import useAuth from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function AutoRedirect() {
  const { profile } = useAuth();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setAuthenticated(!!data?.user?.id);
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setAuthenticated(!!session?.user?.id);
      },
    );

    return () => {
      // @ts-expect-error unsub typing
      listener?.subscription?.unsubscribe?.();
      mounted = false;
    };
  }, []);

  if (checking) return null;

  if (authenticated) {
    // redirect based on role fetched from profile
    const role = profile?.role;
    if (role === "admin" || role === "coordinator") {
      return <Navigate to="/app/admin" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/login" replace />;
}
