import supabase from "@/services/supabase";
import { useState } from "react";

type BookingResult = {
  success: boolean;
  booking_id: string | null;
  error: string | null;
};

export function useBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function book(sessionId: string): Promise<BookingResult> {
    setIsLoading(true);
    setError(null);
    try {
      const userResp = await supabase.auth.getUser();
      const userId = userResp.data.user?.id;
      if (!userId) {
        const err = "Usuário não autenticado.";
        setError(err);
        return { success: false, booking_id: null, error: err };
      }

      const { data, error: rpcError } = await supabase.rpc("book_session", {
        p_user_id: userId,
        p_session_id: sessionId,
      });

      if (rpcError) {
        setError(rpcError.message);
        return { success: false, booking_id: null, error: rpcError.message };
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result || !result.success) {
        const err = result?.error ?? "Erro desconhecido ao agendar.";
        setError(err);
        return { success: false, booking_id: null, error: err };
      }

      return { success: true, booking_id: result.booking_id, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return { success: false, booking_id: null, error: msg };
    } finally {
      setIsLoading(false);
    }
  }

  return { book, isLoading, error };
}

export default useBooking;


