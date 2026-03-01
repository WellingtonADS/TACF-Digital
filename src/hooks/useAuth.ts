import { supabase, upsertProfile } from "@/services/supabase";
import type { Database } from "@/types/database.types";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // hydrate profile from sessionStorage to reduce UI flicker on navigation
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      if (typeof window === "undefined") return null;
      const raw = sessionStorage.getItem("tacf_profile");
      return raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        // no logged user; in development allow a preview profile fallback
        setUser(null);
        if (import.meta.env.MODE !== "production") {
          const { data: p } = await supabase
            .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
            .select("*")
            .limit(1)
            .maybeSingle();

          const val = (p as Profile) ?? null;
          setProfile(val);
          try {
            if (typeof window !== "undefined")
              sessionStorage.setItem("tacf_profile", JSON.stringify(val));
          } catch {}
          return;
        }

        setProfile(null);
        return;
      }

      setUser(userData?.user ?? null);

      const { data: p } = await supabase
        .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (!p && import.meta.env.MODE !== "production") {
        // user has no profile in DB — fallback to first profile in dev for easier testing
        const { data: fallback } = await supabase
          .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
          .select("*")
          .limit(1)
          .maybeSingle();

        const val = (fallback as Profile) ?? null;
        setProfile(val);
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem("tacf_profile", JSON.stringify(val));
        } catch {}
      } else {
        const val = (p as Profile) ?? null;
        setProfile(val);
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem("tacf_profile", JSON.stringify(val));
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega o perfil sem chamar getUser() — usado no onAuthStateChange
  // para evitar o loop infinito (getUser() dispara novo evento de auth no Supabase v2)
  const loadProfileFromSession = useCallback(
    async (session: Session | null) => {
      const uid = session?.user?.id;
      if (!uid) {
        setUser(null);
        setProfile(null);
        try {
          if (typeof window !== "undefined")
            sessionStorage.removeItem("tacf_profile");
        } catch {}
        return;
      }

      setUser(session!.user as User);

      const { data: p } = await supabase
        .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      const val = (p as Profile) ?? null;
      setProfile(val);
      try {
        if (typeof window !== "undefined")
          sessionStorage.setItem("tacf_profile", JSON.stringify(val));
      } catch {}
    },
    [],
  );

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Usa a sessão do evento diretamente — NÃO chama getUser() aqui para
        // evitar loop infinito: getUser() → dispara novo onAuthStateChange no Supabase v2
        loadProfileFromSession(session);
      },
    );
    return () => {
      // unsubscribe
      // @ts-expect-error listener typing in supabase-js
      listener?.subscription?.unsubscribe?.();
    };
  }, [load, loadProfileFromSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    try {
      if (typeof window !== "undefined")
        sessionStorage.removeItem("tacf_profile");
    } catch {}
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Profile>) => {
    try {
      const up = await upsertProfile(
        payload as unknown as Database["public"]["Tables"]["profiles"]["Insert"],
      );
      try {
        const val = up?.data ?? null;
        if (typeof window !== "undefined")
          sessionStorage.setItem("tacf_profile", JSON.stringify(val));
      } catch {}
      return up;
    } catch {
      return null;
    }
  }, []);

  return { user, profile, loading, error, signOut, updateProfile } as const;
}
