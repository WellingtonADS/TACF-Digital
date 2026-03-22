export type ResultStatus = "apto" | "inapto" | "pendente" | null;

export type ResultSummary = {
  id: string;
  booking_status?: string | null;
  test_date?: string | null;
  score?: string | null;
  created_at?: string | null;
  location?: string | null;
  location_address?: string | null;
  concept?: string | null;
  result_status?: ResultStatus;
  order_number?: string | null;
  attendance_confirmed?: boolean | null;
  session_period?: string | null;
  notes?: string | null;
};

export type ResultSummaryInput = ResultSummary & {
  result_details?: unknown;
  status?: string | null;
};

const NOTE_KEYS = [
  "notes",
  "note",
  "observacoes",
  "observacao",
  "justificativa",
  "reason",
  "motivo",
] as const;

function parseResultDetails(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

function getStringField(
  source: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeResultStatus(value: unknown): ResultStatus {
  if (value === "apto" || value === "inapto" || value === "pendente") {
    return value;
  }

  return null;
}

export function canOpenAppeal(result: Pick<ResultSummary, "result_status">) {
  return result.result_status === "apto" || result.result_status === "inapto";
}

export function normalizeResultSummary(
  input: ResultSummaryInput,
): ResultSummary {
  const detail = parseResultDetails(input.result_details);
  const rawStatus = normalizeResultStatus(input.result_details);

  let notes: string | null = null;

  for (const key of NOTE_KEYS) {
    const value = getStringField(detail, key);
    if (value) {
      notes = value;
      break;
    }
  }

  return {
    id: input.id,
    booking_status: input.status ?? input.booking_status ?? null,
    test_date: input.test_date ?? null,
    score: input.score ?? null,
    created_at: input.created_at ?? null,
    location: getStringField(detail, "location") ?? input.location ?? null,
    location_address: input.location_address ?? null,
    concept: getStringField(detail, "concept") ?? input.concept ?? null,
    result_status:
      normalizeResultStatus(getStringField(detail, "result_status")) ??
      normalizeResultStatus(input.result_status) ??
      rawStatus,
    order_number: input.order_number ?? null,
    attendance_confirmed: input.attendance_confirmed ?? null,
    session_period: input.session_period ?? null,
    notes,
  };
}
