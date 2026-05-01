import { describe, expect, it, vi } from "vitest";
import { formatSessionPeriod, translateBookingError } from "./booking";

// Mocking supabase para evitar chamadas reais
vi.mock("@/services/supabase", () => ({
  default: {
    rpc: vi.fn(),
  },
}));

describe("formatSessionPeriod", () => {
  it("formata 'manha' como 'Manhã'", () => {
    expect(formatSessionPeriod("manha")).toBe("Manhã");
  });

  it("formata 'tarde' como 'Tarde'", () => {
    expect(formatSessionPeriod("tarde")).toBe("Tarde");
  });

  it("formata legado 'morning' como 'Manhã'", () => {
    expect(formatSessionPeriod("morning")).toBe("Manhã");
  });

  it("formata legado 'afternoon' como 'Tarde'", () => {
    expect(formatSessionPeriod("afternoon")).toBe("Tarde");
  });

  it("ignora capitalização", () => {
    expect(formatSessionPeriod("MANHA")).toBe("Manhã");
    expect(formatSessionPeriod("Tarde")).toBe("Tarde");
  });

  it("retorna valor original para período desconhecido", () => {
    expect(formatSessionPeriod("noturno")).toBe("noturno");
  });

  it("lida com string vazia", () => {
    expect(formatSessionPeriod("")).toBe("");
  });
});

describe("translateBookingError", () => {
  it("retorna null para erro undefined", () => {
    expect(translateBookingError(undefined)).toBeNull();
  });

  it("retorna null para string vazia", () => {
    expect(translateBookingError("")).toBeNull();
  });

  it("traduz 'user already has booking this semester'", () => {
    const result = translateBookingError(
      "user already has booking this semester",
    );
    expect(result).toMatch(/agendamento neste semestre/i);
  });

  it("traduz 'session full'", () => {
    expect(translateBookingError("session full")).toBe("Sessão cheia.");
  });

  it("traduz 'session not found'", () => {
    expect(translateBookingError("session not found")).toBe(
      "Sessão não encontrada.",
    );
  });

  it("traduz 'profile inactive'", () => {
    expect(translateBookingError("profile inactive")).toBe("Perfil inativo.");
  });

  it("traduz 'role not allowed to book'", () => {
    expect(translateBookingError("role not allowed to book")).toBe(
      "Papel não permitido para agendamento.",
    );
  });

  it("traduz 'weekend sessions are not allowed'", () => {
    const result = translateBookingError("weekend sessions are not allowed");
    expect(result).toMatch(/sábados e domingos/i);
  });

  it("traduz 'military booking requires at least 2 days of lead time'", () => {
    const result = translateBookingError(
      "military booking requires at least 2 days of lead time",
    );
    expect(result).toMatch(/antecedência mínima de 2 dias/i);
  });

  it("retorna null para erro desconhecido", () => {
    expect(translateBookingError("some unknown error")).toBeNull();
  });

  it("traduz erro mesmo quando está embutido em mensagem maior", () => {
    const result = translateBookingError(
      "Error: session full — try another date",
    );
    expect(result).toBe("Sessão cheia.");
  });
});
