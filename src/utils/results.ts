import { getResultBookingStatus } from "@/utils/resultOperational";

export type ResultStatus = "apto" | "inapto" | "pendente" | null;
export type BookingResultStatus = Exclude<ResultStatus, "pendente" | null>;

export type StructuredBookingResultDetails = {
  result_status: BookingResultStatus;
  corrida: string | null;
  flexao: string | null;
  abdominal: string | null;
};

export type ResultSummary = {
  id: string;
  booking_status?: string | null;
  booking_metadata?: unknown;
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

function parseResultDetailsObject(raw: unknown): Record<string, unknown> | null {
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

function sanitizeMetric(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function extractResultStatus(
  raw: unknown,
): StructuredBookingResultDetails["result_status"] | null {
  const detail = parseResultDetailsObject(raw);
  const normalized =
    normalizeResultStatus(detail?.result_status) ??
    normalizeResultStatus(detail?.status) ??
    normalizeResultStatus(raw);

  return normalized === "apto" || normalized === "inapto" ? normalized : null;
}

export function parseStructuredBookingResultDetails(
  raw: unknown,
): StructuredBookingResultDetails | null {
  const detail = parseResultDetailsObject(raw);
  const resultStatus = extractResultStatus(raw);

  if (!resultStatus) {
    return null;
  }

  return {
    result_status: resultStatus,
    corrida: sanitizeMetric(detail?.corrida),
    flexao: sanitizeMetric(detail?.flexao),
    abdominal: sanitizeMetric(detail?.abdominal),
  };
}

export function buildStructuredBookingResultPayload(
  resultStatus: StructuredBookingResultDetails["result_status"],
  metrics?: Partial<
    Pick<StructuredBookingResultDetails, "corrida" | "flexao" | "abdominal">
  >,
): StructuredBookingResultDetails {
  return {
    result_status: resultStatus,
    corrida: sanitizeMetric(metrics?.corrida) ?? null,
    flexao: sanitizeMetric(metrics?.flexao) ?? null,
    abdominal: sanitizeMetric(metrics?.abdominal) ?? null,
  };
}

export function canOpenAppeal(result: Pick<ResultSummary, "result_status">) {
  return getAppealAvailability(result).allowed;
}

export function getAppealAvailability(
  result: Pick<ResultSummary, "result_status" | "booking_status">,
): { allowed: boolean; reason: string | null } {
  const bookingStatus = getResultBookingStatus(result);

  if (bookingStatus === "cancelado") {
    return {
      allowed: false,
      reason:
        "Este registro pertence a um agendamento cancelado e não aceita abertura de recurso.",
    };
  }

  if (bookingStatus === "remarcado") {
    return {
      allowed: false,
      reason:
        "Este registro pertence a um booking histórico remarcado. Abra o recurso apenas a partir do agendamento ativo correspondente, quando aplicável.",
    };
  }

  if (result.result_status !== "apto" && result.result_status !== "inapto") {
    return {
      allowed: false,
      reason:
        "A abertura de recurso fica disponível somente quando o resultado final estiver classificado como apto ou inapto.",
    };
  }

  return { allowed: true, reason: null };
}

export function normalizeResultSummary(
  input: ResultSummaryInput,
): ResultSummary {
  const detail = parseResultDetailsObject(input.result_details);
  const rawStatus = extractResultStatus(input.result_details);

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
    booking_metadata: input.booking_metadata ?? null,
    test_date: input.test_date ?? null,
    score: input.score ?? null,
    created_at: input.created_at ?? null,
    location: getStringField(detail, "location") ?? input.location ?? null,
    location_address: input.location_address ?? null,
    concept: getStringField(detail, "concept") ?? input.concept ?? null,
    result_status:
      normalizeResultStatus(getStringField(detail, "result_status")) ??
      normalizeResultStatus(getStringField(detail, "status")) ??
      normalizeResultStatus(input.result_status) ??
      rawStatus,
    order_number: input.order_number ?? null,
    attendance_confirmed: input.attendance_confirmed ?? null,
    session_period: input.session_period ?? null,
    notes,
  };
}
