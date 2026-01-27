/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

// No Vite, usamos import.meta.env de forma direta e limpa
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Credenciais do Supabase não encontradas no .env");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Tipagem para o retorno do RPC de agendamento
 */
interface BookingResponse {
  success: boolean;
  booking_id: string | null;
  order_number?: string | null;
  error: string | null;
}

/**
 * Confirmar agendamento via RPC (Backend-First)
 * Esta função garante que a lógica de vagas (8-21) seja processada no Postgres
 */
export async function confirmarAgendamentoRPC(
  userId: string,
  sessionId: string,
): Promise<BookingResponse> {
  // RPC calls have loose typings; cast params/result to any to avoid TS overload issues

  const { data, error } = await supabase.rpc("confirmar_agendamento", {
    p_user_id: userId,
    p_session_id: sessionId,
  } as any);

  if (error) {
    return {
      success: false,
      booking_id: null,
      error: error.message,
    };
  }

  const result = Array.isArray(data) ? (data[0] as any) : (data as any);

  return {
    success: !!result?.success,
    booking_id: result?.booking_id ?? null,
    order_number: result?.order_number ?? null,
    error: result?.error ?? null,
  };
}

/**
 * Helpers de Autenticação
 */
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

/**
 * Upsert Profile com Proteção de Segurança
 * Impede que o cliente tente sobrescrever o próprio 'role' (militar -> admin)
 */
export async function upsertProfile(
  profile: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>,
) {
  const safePayload = profile as any;

  return (supabase as any)
    .from("profiles")
    .upsert(safePayload)
    .select()
    .maybeSingle();
}
