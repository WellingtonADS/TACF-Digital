import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

// Carrega credenciais de Vite (import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Credenciais do Supabase não encontradas no .env");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
export default supabase;

/** Tipagens e helpers auxiliares **/
export interface BookingResponse {
  success: boolean;
  booking_id: string | null;
  order_number?: string | null;
  error?: string | null;
}

export async function confirmarAgendamentoRPC(
  userId: string,
  sessionId: string,
): Promise<BookingResponse> {
  const { data, error } = await supabase.rpc<BookingResponse[]>(
    "confirmar_agendamento",
    {
      p_user_id: userId,
      p_session_id: sessionId,
    },
  );

  if (error) {
    return {
      success: false,
      booking_id: null,
      error: error.message,
    };
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    success: !!result?.success,
    booking_id: result?.booking_id ?? null,
    order_number: result?.order_number ?? null,
    error: result?.error ?? null,
  };
}

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export async function upsertProfile(
  profile: Partial<Database["public"]["Tables"]["profiles"]["Row"]>,
) {
  return supabase.from("profiles").upsert(profile).select().maybeSingle();
}

export function table<Table extends keyof Database["public"]["Tables"]>(
  name: Table,
) {
  return supabase.from(String(name));
}
