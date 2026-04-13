/** Timezone padrão do sistema — America/Sao_Paulo (UTC-3 / Brasília). */
export const TZ = "America/Sao_Paulo" as const;

/**
 * Formata uma string de data no formato `YYYY-MM-DD` para exibição longa
 * em pt-BR (ex.: "18 de março de 2026").
 * Usa T12:00:00 para evitar deslocamento UTC em fusos negativos.
 */
export const formatDatePtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formata uma string de data no formato `YYYY-MM-DD` para exibição curta
 * em pt-BR (ex.: "18/03/2026").
 */
export const formatDateShortPtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formata um ISO datetime string (ex.: `created_at` do Supabase) para
 * exibição completa em pt-BR com horário no fuso de Brasília.
 * Ex.: "18/03/2026 15:30"
 */
export const formatDateTimePtBr = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString("pt-BR", {
      timeZone: TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

/**
 * Formata uma string de data `YYYY-MM-DD` para o formato abreviado maiúsculo
 * usado no bilhete digital (ex.: "18 MAR 2026").
 */
export const formatDateTicket = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d
      .toLocaleDateString("pt-BR", {
        timeZone: TZ,
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "")
      .toUpperCase();
  } catch {
    return dateStr;
  }
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

function parseDateOnly(dateInput: string | Date) {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return null;
    return new Date(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  const [year, month, day] = dateInput.split("-").map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const getMondayFirstWeekdayIndex = (dateInput: string | Date) => {
  const parsed = parseDateOnly(dateInput);
  if (!parsed) return 0;
  return (parsed.getDay() + 6) % 7;
};

export const isWeekendDate = (dateInput: string | Date) => {
  const parsed = parseDateOnly(dateInput);
  if (!parsed) return false;
  const weekday = parsed.getDay();
  return weekday === 0 || weekday === 6;
};

export const getCalendarDayDiff = (
  targetDate: string,
  baseDate: Date = new Date(),
) => {
  const target = parseDateOnly(targetDate);
  const base = parseDateOnly(baseDate);
  if (!target || !base) return null;

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - base.getTime()) / millisecondsPerDay);
};

export const getMilitaryBookingRuleMessage = (
  targetDate: string,
  baseDate: Date = new Date(),
) => {
  if (isWeekendDate(targetDate)) {
    return "Sábados e domingos não estão disponíveis para agendamento.";
  }

  const dayDiff = getCalendarDayDiff(targetDate, baseDate);
  if (dayDiff !== null && dayDiff < 2) {
    return "O militar só pode agendar com antecedência mínima de 2 dias.";
  }

  return null;
};

export const canMilitaryBookDate = (
  targetDate: string,
  baseDate: Date = new Date(),
) => getMilitaryBookingRuleMessage(targetDate, baseDate) === null;
