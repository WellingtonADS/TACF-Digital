export type BookingResultStatus = "apto" | "inapto" | "pendente";

export type BookingResultPayload = {
  result_status: BookingResultStatus;
  corrida?: string | null;
  flexao?: string | null;
  abdominal?: string | null;
  concept?: string | null;
  notes?: string | null;
  auto_assigned?: boolean | null;
  updated_at?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStatus(value: unknown): BookingResultStatus | null {
  if (
    value === "apto" ||
    value === "inapto" ||
    value === "pendente"
  ) {
    return value;
  }

  return null;
}

function parseRawRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === "string") {
    const normalized = normalizeStatus(raw.trim().toLowerCase());
    if (normalized) {
      return { result_status: normalized };
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isRecord(raw) ? raw : null;
}

export function parseBookingResult(
  raw: unknown,
): BookingResultPayload | null {
  const record = parseRawRecord(raw);
  if (!record) {
    return null;
  }

  const result_status =
    normalizeStatus(record.result_status) ??
    normalizeStatus(record.result) ??
    normalizeStatus(record.status) ??
    null;

  if (!result_status) {
    return null;
  }

  return {
    result_status,
    corrida: toNonEmptyString(record.corrida),
    flexao: toNonEmptyString(record.flexao),
    abdominal: toNonEmptyString(record.abdominal),
    concept: toNonEmptyString(record.concept),
    notes:
      toNonEmptyString(record.notes) ??
      toNonEmptyString(record.note) ??
      toNonEmptyString(record.observacoes) ??
      toNonEmptyString(record.observacao),
    auto_assigned:
      typeof record.auto_assigned === "boolean"
        ? record.auto_assigned
        : null,
    updated_at: toNonEmptyString(record.updated_at),
  };
}

export function getBookingResultStatus(
  raw: unknown,
): BookingResultStatus | null {
  return parseBookingResult(raw)?.result_status ?? null;
}

export function buildBookingResultPayload(
  input: Omit<BookingResultPayload, "updated_at">,
): BookingResultPayload {
  return {
    ...input,
    corrida: input.corrida?.trim() || null,
    flexao: input.flexao?.trim() || null,
    abdominal: input.abdominal?.trim() || null,
    concept: input.concept?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}
