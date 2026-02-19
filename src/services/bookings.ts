import { confirmarAgendamentoRPC } from "./supabase";

export async function getSessions() {
  // placeholder: implement real call to supabase RPC or table
  return [] as unknown[];
}

export async function confirmBooking(userId: string, sessionId: string) {
  return confirmarAgendamentoRPC(userId, sessionId);
}

export default { getSessions, confirmBooking };
