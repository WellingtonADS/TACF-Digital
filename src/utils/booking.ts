import supabase from "@/services/supabase";

export const formatDatePtBr = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatSessionPeriod = (period: string) => {
  const normalized = (period ?? "").toString().trim().toLowerCase();
  if (normalized === "morning") return "Manhã";
  if (normalized === "afternoon") return "Tarde";
  return period;
};

export const getSemesterFromDate = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const month = d.getMonth() + 1;
    return month <= 6 ? "1" : "2";
  } catch {
    return null;
  }
};

export const translateBookingError = (err?: string | null) => {
  if (!err) return null;
  const key = err.toString().trim().toLowerCase();

  const map: Record<string, string> = {
    "user already has booking this semester":
      "Você já possui um agendamento neste semestre. Cancele o agendamento existente para marcar outro.",
    "session full": "Sessão cheia.",
    "session not found": "Sessão não encontrada.",
    "unauthorized: user mismatch": "Usuário não autorizado para esta ação.",
    "profile inactive": "Perfil inativo.",
    "role not allowed to book": "Papel não permitido para agendamento.",
    "session date unknown": "Data da sessão desconhecida.",
    "duplicate booking": "Agendamento duplicado.",
    "booking semester missing": "Semestre do agendamento ausente.",
  };

  for (const [k, v] of Object.entries(map)) {
    if (key === k || key.includes(k)) return v;
  }

  return null;
};

export async function fetchBookedDatesForUser(
  startStr: string,
  endStr: string,
): Promise<Set<string>> {
  try {
    const userResp = await supabase.auth.getUser();
    const userId = userResp.data.user?.id ?? null;

    if (!userId) return new Set();

    const { data, error } = await supabase
      .from("bookings")
      .select("test_date")
      .eq("user_id", userId)
      .gte("test_date", startStr)
      .lte("test_date", endStr);

    if (error || !data) return new Set();

    return new Set((data as { test_date: string }[]).map((r) => r.test_date));
  } catch {
    return new Set();
  }
}

export async function fetchExistingSemesterBooking(
  userId: string,
  semester: string,
): Promise<{ id: string; test_date: string } | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, test_date")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .eq("semester", semester)
      .maybeSingle<{ id: string; test_date: string }>();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
