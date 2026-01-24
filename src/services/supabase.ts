import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_SUPABASE_URL) ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;
const supabaseKey =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY) in environment",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Wrapper: Calls the `book_session` RPC with typed params and returns the RPC row.
 * Returns { success: boolean; booking_id?: string | null; error?: string | null }
 */
/**
 * Confirmar agendamento: chama o RPC `confirmar_agendamento` no banco.
 * A validação de vagas/quotas deve ser tratada EXCLUSIVAMENTE no backend.
 */
export async function confirmarAgendamentoRPC(
  userId: string,
  sessionId: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("confirmar_agendamento", {
    p_user_id: userId,
    p_session_id: sessionId,
  });

  if (error)
    return {
      success: false,
      booking_id: null,
      error: (error as { message?: string })?.message ?? "Unknown error",
    };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { success?: boolean; booking_id?: string | null; error?: string | null }
    | undefined;
  return {
    success: row?.success === true,
    booking_id: row?.booking_id ?? null,
    error: row?.error ?? null,
  };
}

// Backwards-compatible alias to avoid breaking imports elsewhere.
export const bookSessionRPC = async (userId: string, sessionId: string) => {
  // prefer explicit RPC name
  // eslint-disable-next-line no-console
  console.warn(
    "bookSessionRPC is deprecated — use confirmarAgendamentoRPC (calls confirmar_agendamento RPC)",
  );
  return confirmarAgendamentoRPC(userId, sessionId);
};

/**
 * Auth helpers
 */
export async function signUp(email: string, password: string) {
  const result = await supabase.auth.signUp({ email, password });
  return result;
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  return result;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  return { session: data.session ?? null, error: null };
}

export async function awaitSession(
  timeoutMs = 10000,
  intervalMs = 1000,
): Promise<import("@supabase/supabase-js").Session | null> {
  const start = Date.now();
  // Poll until session available or timeout
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { session } = await getSession();
    if (session) return session;
    if (Date.now() - start > timeoutMs) return null;
    // wait
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Upsert profile safely from client.
 * Ensures client cannot set sensitive fields like `role`.
 */
export async function upsertProfile(
  profile: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>,
) {
  // Create a shallow copy and remove sensitive fields the client must not set.
  // @ts-ignore - index signature for partial
  const payload = { ...profile } as Record<string, unknown>;
  delete payload.role;
  // Ensure id is present when provided; server-side triggers may also create.
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload)
    .select()
    .maybeSingle();
  return { data, error };
}