import supabase from "@/services/supabase";

export const formatSessionPeriod = (period: string) => {
  const normalized = (period ?? "").toString().trim().toLowerCase();
  if (normalized === "manha") return "Manhã";
  if (normalized === "tarde") return "Tarde";
  // fallback para valores legados em inglês (dados ainda não migrados no banco)
  if (normalized === "morning") return "Manhã";
  if (normalized === "afternoon") return "Tarde";
  return period;
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
    "weekend sessions are not allowed":
      "Sábados e domingos não estão disponíveis para agendamento.",
    "cannot book weekend session":
      "Sábados e domingos não estão disponíveis para agendamento.",
    "military booking requires at least 2 days of lead time":
      "O militar só pode agendar com antecedência mínima de 2 dias.",
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
    const { data, error } = await supabase.rpc("get_booked_dates", {
      p_start: startStr,
      p_end: endStr,
    });

    if (error || !Array.isArray(data)) return new Set();

    const dates = data
      .filter(
        (r): r is { test_date: string } =>
          !!r &&
          typeof r === "object" &&
          "test_date" in r &&
          typeof (r as { test_date: unknown }).test_date === "string",
      )
      .map((r) => r.test_date);

    return new Set(dates);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("fetchBookedDatesForUser error:", error);
    }
    return new Set();
  }
}

export async function fetchExistingSemesterBooking(
  semester: string,
): Promise<{ id: string; test_date: string } | null> {
  try {
    const { data, error } = await supabase.rpc(
      "get_existing_semester_booking",
      { p_semester: semester },
    );

    if (error || !data) return null;
    return data[0] ?? null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("fetchExistingSemesterBooking error:", error);
    }
    return null;
  }
}
