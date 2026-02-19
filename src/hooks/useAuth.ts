import { supabase, upsertProfile } from "@/services/supabase";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
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

          setProfile((p as Profile) ?? null);
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

        setProfile((fallback as Profile) ?? null);
      } else {
        setProfile((p as Profile) ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // reload on auth change
      load();
    });
    return () => {
      // unsubscribe
      // @ts-expect-error listener typing in supabase-js
      listener?.subscription?.unsubscribe?.();
    };
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Profile>) => {
    try {
      const up = await upsertProfile(
        payload as unknown as Database["public"]["Tables"]["profiles"]["Insert"],
      );
      return up;
    } catch {
      return null;
    }
  }, []);

  return { user, profile, loading, error, signOut, updateProfile } as const;
}
