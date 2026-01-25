import {
  supabase,
  signIn as svcSignIn,
  signUp as svcSignUp,
} from "@/services/supabase";
import type { Profile } from "@/types/database.types";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthResponse = { error?: { message?: string } | null };

type UpsertProfileResponse = {
  data?: Profile;
  error?: { message?: string } | null;
};

type AuthContextValue = {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  upsertProfile: (p: Partial<Profile>) => Promise<UpsertProfileResponse>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função centralizada para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
      return { data, error: null };
    } catch (error) {
      console.warn("Perfil não encontrado ou erro na busca:", error);
      setProfile(null);
      return { data: null, error };
    }
  };

  useEffect(() => {
    // 1. Inicialização da sessão
    const bootstrap = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    bootstrap();

    // 2. Ouvinte de mudanças de Auth (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;

      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email });
        await fetchProfile(currentUser.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await svcSignIn(email, password);
    // O onAuthStateChange cuidará de atualizar o estado do profile
    return res;
  };

  const signUp = async (email: string, password: string) => {
    const res = await svcSignUp(email, password);
    // No signUp, o Supabase geralmente loga o usuário automaticamente se a confirmação de e-mail estiver off
    return res;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const upsertProfile = async (p: Partial<Profile>) => {
    if (!user) return { error: { message: "Não autenticado" } };

    setLoading(true);
    try {
      const payload = { ...p, id: user.id };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload as any)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile = data as Profile;
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error: any) {
      return {
        data: undefined,
        error: { message: error.message || "Erro ao atualizar perfil" },
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        upsertProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
