/**
 * @module Domínio
 * @page useAuth
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useAuth.ts
 */

import { SESSION_PROFILE_KEY } from "@/constants/storage";
import { supabase, upsertProfile } from "@/services/supabase";
import type { Profile as DBProfile, Database } from "@/types";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type Profile = DBProfile | null;
const AUTH_REQUEST_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Auth request timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getErrorMessage(err: unknown): string {
  const errObj = err as Record<string, unknown> | null | undefined;
  return (
    (errObj?.message as string) ||
    (errObj?.error_description as string) ||
    (err instanceof Error ? err.message : String(err ?? ""))
  ).toLowerCase();
}

function isInvalidRefreshTokenError(err: unknown): boolean {
  const message = getErrorMessage(err);
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}

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

  const clearLocalAuthState = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (_: unknown) {
      /* local signout may fail if there is no persisted session */
    }

    setUser(null);
    setProfile(null);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_PROFILE_KEY);
      }
    } catch (_: unknown) {
      /* sessionStorage can throw in restricted contexts */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // getSession() usa armazenamento local e evita bloquear a UI por falhas de rede
      // durante o bootstrap de autenticação no client.
      const {
        data: { session },
        error: authError,
      } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_REQUEST_TIMEOUT_MS,
      );

      if (authError) {
        if (isInvalidRefreshTokenError(authError)) {
          await clearLocalAuthState();
          return;
        }

        throw authError;
      }

      const uid = session?.user?.id;
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

      setUser(session?.user ?? null);

      const { data: p } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        AUTH_REQUEST_TIMEOUT_MS,
      );

      if (!p && import.meta.env.MODE !== "production") {
        // user has no profile in DB — fallback to first profile in dev for easier testing
        const { data: fallback } = await withTimeout(
          supabase.from("profiles").select("*").limit(1).maybeSingle(),
          AUTH_REQUEST_TIMEOUT_MS,
        );

        const val = (fallback as Profile) ?? null;
        setProfile(val);
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
        } catch (_: unknown) {
          /* sessionStorage can throw in restricted contexts */
        }
      } else {
        const val = (p as Profile) ?? null;
        setProfile(val);
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
        } catch (_: unknown) {
          /* sessionStorage can throw in restricted contexts */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [clearLocalAuthState]);

  // Carrega o perfil sem chamar getUser() — usado no onAuthStateChange
  // para evitar o loop infinito (getUser() dispara novo evento de auth no Supabase v2)
  const loadProfileFromSession = useCallback(
    async (session: Session | null) => {
      try {
        const uid = session?.user?.id;
        if (!uid) {
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

        setUser(session.user as User);

        const { data: p } = await withTimeout(
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          AUTH_REQUEST_TIMEOUT_MS,
        );

        const val = (p as Profile) ?? null;
        setProfile(val);
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(val));
        } catch (_: unknown) {
          /* sessionStorage can throw in restricted contexts */
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
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
        void loadProfileFromSession(session);
      },
    );
    return () => {
      // unsubscribe
      listener?.subscription?.unsubscribe();
    };
  }, [load, loadProfileFromSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await clearLocalAuthState();
  }, [clearLocalAuthState]);

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
