/**
 * @module Domínio
 * @page useAuth
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useAuth.ts
 */

import { SESSION_PROFILE_KEY } from "@/constants/storage";
import { supabase, upsertProfile } from "@/services/supabase";
import type { Profile as DBProfile, Database } from "@/types";
import { buildProfileDraftFromUser } from "@/utils/profileCompletion";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type Profile = DBProfile | null;

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // hydrate profile from sessionStorage to reduce UI flicker on navigation
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      if (typeof window === "undefined") return null;
      const raw = sessionStorage.getItem(SESSION_PROFILE_KEY);
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
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData?.session?.user ?? null;
      const uid = authUser?.id;
      if (!uid) {
        // no logged user; in development allow a preview profile fallback
        setUser(null);
        if (import.meta.env.MODE !== "production") {
          const { data: p } = await supabase
            .from("profiles")
            .select("*")
            .limit(1)
            .maybeSingle();

          const val = (p as Profile) ?? null;
          setProfile(val);
          try {
            if (typeof window !== "undefined")
              sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
          } catch (_: unknown) {
            /* sessionStorage can throw in restricted contexts */
          }
          return;
        }

        setProfile(null);
        return;
      }

      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(authUser);

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      const val = buildProfileDraftFromUser(
        authUser,
        (p as Profile) ?? null,
      );
      setProfile(val);
      try {
        if (typeof window !== "undefined")
          sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
      } catch (_: unknown) {
        /* sessionStorage can throw in restricted contexts */
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
      const sessionUser = session?.user ?? null;
      const uid = sessionUser?.id;
      if (!uid || !sessionUser) {
        setUser(null);
        setProfile(null);
        try {
          if (typeof window !== "undefined")
            sessionStorage.removeItem(SESSION_PROFILE_KEY);
        } catch (_: unknown) {
          /* sessionStorage can throw in restricted contexts */
        }
        return;
      }

      setUser(sessionUser);

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      const val = buildProfileDraftFromUser(
        sessionUser,
        (p as Profile) ?? null,
      );
      setProfile(val);
      try {
        if (typeof window !== "undefined")
          sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
      } catch (_: unknown) {
        /* sessionStorage can throw in restricted contexts */
      }
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
      listener?.subscription?.unsubscribe();
    };
  }, [load, loadProfileFromSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    try {
      if (typeof window !== "undefined")
        sessionStorage.removeItem(SESSION_PROFILE_KEY);
    } catch (_: unknown) {
      /* sessionStorage can throw in restricted contexts */
    }
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Profile>) => {
    try {
      const up = await upsertProfile(
        payload as unknown as Database["public"]["Tables"]["profiles"]["Insert"],
      );
      try {
        const val = up?.data ?? null;
        if (typeof window !== "undefined")
          sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
      } catch (_: unknown) {
        /* sessionStorage can throw in restricted contexts */
      }
      return up;
    } catch {
      return null;
    }
  }, []);

  return { user, profile, loading, error, signOut, updateProfile } as const;
}
