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

/**
 * Formata uma string de data `YYYY-MM-DD` retornando apenas o nome do dia da semana
 * em pt-BR (ex.: "quarta-feira").
 * Usa T12:00:00 para evitar deslocamento UTC em fusos negativos.
 */
export const formatDateWeekdayOnlyPtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      weekday: "long",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formata uma string de data `YYYY-MM-DD` com dia da semana e data curta
 * em pt-BR (ex.: "quarta-feira, 18 de março").
 * Usa T12:00:00 para evitar deslocamento UTC em fusos negativos.
 */
export const formatDateWeekdayPtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formata uma string de data `YYYY-MM-DD` com dia e mês em pt-BR
 * sem o ano (ex.: "18 de março").
 * Usa T12:00:00 para evitar deslocamento UTC em fusos negativos.
 */
export const formatDateMonthDayPtBr = (dateStr: string) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      day: "2-digit",
      month: "long",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Compara se uma string de data `YYYY-MM-DD` representa uma data após `now`.
 * Usa T12:00:00 para evitar deslocamento UTC em fusos negativos.
 */
export const isDateAfter = (dateStr: string, now: Date = new Date()) => {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    return d > now;
  } catch {
    return false;
  }
};
