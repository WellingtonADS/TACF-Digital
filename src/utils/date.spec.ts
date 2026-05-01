import { describe, expect, it } from "vitest";
import {
  canMilitaryBookDate,
  formatDatePtBr,
  formatDateShortPtBr,
  formatDateTicket,
  formatDateTimePtBr,
  getCalendarDayDiff,
  getMilitaryBookingRuleMessage,
  getMondayFirstWeekdayIndex,
  getSemesterFromDate,
  isWeekendDate,
} from "./date";

describe("formatDatePtBr", () => {
  it("formata data ISO no formato longo pt-BR", () => {
    const result = formatDatePtBr("2026-03-18");
    expect(result).toMatch(/18/);
    expect(result).toMatch(/março/i);
    expect(result).toMatch(/2026/);
  });

  it("retorna o input quando a string é inválida", () => {
    expect(formatDatePtBr("invalid")).toBe("invalid");
  });

  it("retorna o input quando a string está vazia", () => {
    expect(formatDatePtBr("")).toBe("");
  });
});

describe("formatDateShortPtBr", () => {
  it("formata data ISO no formato curto pt-BR", () => {
    const result = formatDateShortPtBr("2026-03-18");
    expect(result).toBe("18/03/2026");
  });

  it("retorna o input quando a string é inválida", () => {
    expect(formatDateShortPtBr("abc")).toBe("abc");
  });
});

describe("formatDateTimePtBr", () => {
  it("formata ISO datetime com horário", () => {
    const result = formatDateTimePtBr("2026-03-18T18:30:00Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/18/);
    expect(result).toMatch(/:/);
  });

  it("retorna o input quando a string é inválida", () => {
    expect(formatDateTimePtBr("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateTicket", () => {
  it("formata data no formato abreviado maiúsculo para bilhete", () => {
    const result = formatDateTicket("2026-03-18");
    expect(result).toContain("18");
    expect(result).toContain("MAR");
    expect(result).toContain("2026");
  });

  it("retorna o input quando a string é inválida", () => {
    expect(formatDateTicket("bad")).toBe("bad");
  });
});

describe("getSemesterFromDate", () => {
  it("retorna '1' para datas no primeiro semestre", () => {
    expect(getSemesterFromDate("2026-01-01")).toBe("1");
    expect(getSemesterFromDate("2026-06-30")).toBe("1");
  });

  it("retorna '2' para datas no segundo semestre", () => {
    expect(getSemesterFromDate("2026-07-01")).toBe("2");
    expect(getSemesterFromDate("2026-12-31")).toBe("2");
  });

  it("retorna null em caso de data inválida", () => {
    expect(getSemesterFromDate("invalid")).toBeNull();
  });
});

describe("getMondayFirstWeekdayIndex", () => {
  it("segunda-feira retorna índice 0", () => {
    // 2026-03-16 é segunda-feira
    expect(getMondayFirstWeekdayIndex("2026-03-16")).toBe(0);
  });

  it("domingo retorna índice 6", () => {
    // 2026-03-22 é domingo
    expect(getMondayFirstWeekdayIndex("2026-03-22")).toBe(6);
  });

  it("sábado retorna índice 5", () => {
    // 2026-03-21 é sábado
    expect(getMondayFirstWeekdayIndex("2026-03-21")).toBe(5);
  });
});

describe("isWeekendDate", () => {
  it("sábado é final de semana", () => {
    expect(isWeekendDate("2026-03-21")).toBe(true);
  });

  it("domingo é final de semana", () => {
    expect(isWeekendDate("2026-03-22")).toBe(true);
  });

  it("segunda-feira não é final de semana", () => {
    expect(isWeekendDate("2026-03-16")).toBe(false);
  });

  it("sexta-feira não é final de semana", () => {
    expect(isWeekendDate("2026-03-20")).toBe(false);
  });
});

describe("getCalendarDayDiff", () => {
  it("retorna diferença positiva para data futura", () => {
    const base = new Date("2026-03-18T12:00:00");
    const diff = getCalendarDayDiff("2026-03-20", base);
    expect(diff).toBe(2);
  });

  it("retorna diferença negativa para data passada", () => {
    const base = new Date("2026-03-18T12:00:00");
    const diff = getCalendarDayDiff("2026-03-16", base);
    expect(diff).toBe(-2);
  });

  it("retorna 0 para mesma data", () => {
    const base = new Date("2026-03-18T12:00:00");
    const diff = getCalendarDayDiff("2026-03-18", base);
    expect(diff).toBe(0);
  });
});

describe("getMilitaryBookingRuleMessage", () => {
  it("retorna mensagem para final de semana", () => {
    const msg = getMilitaryBookingRuleMessage(
      "2026-03-21",
      new Date("2026-03-16T12:00:00"),
    );
    expect(msg).toMatch(/sábados e domingos/i);
  });

  it("retorna mensagem para data sem antecedência mínima", () => {
    const base = new Date("2026-03-18T12:00:00");
    const msg = getMilitaryBookingRuleMessage("2026-03-18", base);
    expect(msg).toMatch(/2 dias/i);
  });

  it("retorna null para data válida com antecedência suficiente", () => {
    const base = new Date("2026-03-18T12:00:00");
    const msg = getMilitaryBookingRuleMessage("2026-03-23", base);
    expect(msg).toBeNull();
  });
});

describe("canMilitaryBookDate", () => {
  it("retorna true para data futura válida", () => {
    const base = new Date("2026-03-18T12:00:00");
    expect(canMilitaryBookDate("2026-03-24", base)).toBe(true);
  });

  it("retorna false para final de semana", () => {
    const base = new Date("2026-03-16T12:00:00");
    expect(canMilitaryBookDate("2026-03-21", base)).toBe(false);
  });

  it("retorna false para hoje", () => {
    const base = new Date("2026-03-18T12:00:00");
    expect(canMilitaryBookDate("2026-03-18", base)).toBe(false);
  });
});
