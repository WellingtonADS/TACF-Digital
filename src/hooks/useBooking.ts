import { confirmBooking as confirmBookingService } from "@/services/api";
import { useState } from "react";

export function useBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(sessionId: string, onSuccess?: () => void) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await confirmBookingService(sessionId);
      if (res.success) {
        onSuccess?.();
        return { success: true, data: res };
      }
      setError(res.error ?? "Unknown error");
      return { success: false, error: res.error ?? "Unknown error" };
    } catch (err) {
      const e = err as { message?: string };
      const msg = e?.message ?? String(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }

  return { confirm, isLoading, error };
}
