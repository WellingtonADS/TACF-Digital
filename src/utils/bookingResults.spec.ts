import { describe, expect, it } from "vitest";
import {
  buildBookingResultPayload,
  getBookingResultStatus,
  parseBookingResult,
} from "./bookingResults";

describe("parseBookingResult", () => {
  it("retorna null para entrada null/undefined", () => {
    expect(parseBookingResult(null)).toBeNull();
    expect(parseBookingResult(undefined)).toBeNull();
  });

  it("retorna null para objeto vazio", () => {
    expect(parseBookingResult({})).toBeNull();
  });

  it("reconhece result_status diretamente", () => {
    const result = parseBookingResult({ result_status: "apto" });
    expect(result?.result_status).toBe("apto");
  });

  it('reconhece result_status "inapto"', () => {
    const result = parseBookingResult({ result_status: "inapto" });
    expect(result?.result_status).toBe("inapto");
  });

  it('reconhece result_status "pendente"', () => {
    const result = parseBookingResult({ result_status: "pendente" });
    expect(result?.result_status).toBe("pendente");
  });

  it("usa campo .result como fallback", () => {
    const result = parseBookingResult({ result: "apto" });
    expect(result?.result_status).toBe("apto");
  });

  it("usa campo .status como fallback", () => {
    const result = parseBookingResult({ status: "inapto" });
    expect(result?.result_status).toBe("inapto");
  });

  it("pega notas de .note", () => {
    const result = parseBookingResult({
      result_status: "apto",
      note: "alguma nota",
    });
    expect(result?.notes).toBe("alguma nota");
  });

  it("pega notas de .observacoes", () => {
    const result = parseBookingResult({
      result_status: "apto",
      observacoes: "obs aqui",
    });
    expect(result?.notes).toBe("obs aqui");
  });

  it("pega notas de .observacao", () => {
    const result = parseBookingResult({
      result_status: "inapto",
      observacao: "obs única",
    });
    expect(result?.notes).toBe("obs única");
  });

  it("retorna null para status desconhecido", () => {
    expect(parseBookingResult({ result_status: "invalido" })).toBeNull();
  });
});

describe("getBookingResultStatus", () => {
  it("retorna status válido", () => {
    expect(getBookingResultStatus({ result_status: "apto" })).toBe("apto");
  });

  it("retorna null para entrada sem status válido", () => {
    expect(getBookingResultStatus(null)).toBeNull();
    expect(getBookingResultStatus({})).toBeNull();
  });
});

describe("buildBookingResultPayload", () => {
  it("inclui updated_at como ISO string", () => {
    const payload = buildBookingResultPayload({
      corrida: null,
      flexao: null,
      abdominal: null,
      concept: null,
      notes: null,
    });
    expect(payload.updated_at).toBeDefined();
    expect(() => new Date(payload.updated_at as string)).not.toThrow();
  });

  it("faz trim nos campos de string", () => {
    const payload = buildBookingResultPayload({
      corrida: "  12:30  ",
      flexao: "  20  ",
      abdominal: "  30  ",
      concept: "  Bom  ",
      notes: "  sem notas  ",
    });
    expect(payload.corrida).toBe("12:30");
    expect(payload.flexao).toBe("20");
    expect(payload.abdominal).toBe("30");
    expect(payload.concept).toBe("Bom");
    expect(payload.notes).toBe("sem notas");
  });

  it("retorna null para strings vazias após trim", () => {
    const payload = buildBookingResultPayload({
      corrida: "   ",
      flexao: "",
      abdominal: null,
      concept: null,
      notes: null,
    });
    expect(payload.corrida).toBeNull();
    expect(payload.flexao).toBeNull();
  });

  it("preserva campos extras via spread", () => {
    const payload = buildBookingResultPayload({
      corrida: "10:00",
      flexao: "15",
      abdominal: "20",
      concept: "Bom",
      notes: null,
    });
    expect(payload.corrida).toBe("10:00");
  });
});
