import { describe, expect, it } from "vitest";
import { canOpenAppeal, normalizeResultSummary } from "./results";

describe("canOpenAppeal", () => {
  it("retorna true para resultado apto", () => {
    expect(canOpenAppeal({ result_status: "apto" })).toBe(true);
  });

  it("retorna true para resultado inapto", () => {
    expect(canOpenAppeal({ result_status: "inapto" })).toBe(true);
  });

  it("retorna false para resultado pendente", () => {
    expect(canOpenAppeal({ result_status: "pendente" })).toBe(false);
  });

  it("retorna false para resultado null", () => {
    expect(canOpenAppeal({ result_status: null })).toBe(false);
  });

  it("retorna false para resultado indefinido", () => {
    expect(canOpenAppeal({ result_status: undefined })).toBe(false);
  });
});

describe("normalizeResultSummary", () => {
  const baseInput = {
    id: "booking-1",
  };

  it("preserva o id", () => {
    const result = normalizeResultSummary(baseInput);
    expect(result.id).toBe("booking-1");
  });

  it("extrai result_status de result_details", () => {
    const input = {
      ...baseInput,
      result_details: { result_status: "apto" },
    };
    const result = normalizeResultSummary(input);
    expect(result.result_status).toBe("apto");
  });

  it("usa input.result_status como fallback", () => {
    const input = {
      ...baseInput,
      result_status: "inapto" as const,
    };
    const result = normalizeResultSummary(input);
    expect(result.result_status).toBe("inapto");
  });

  it("usa input.status como booking_status", () => {
    const input = {
      ...baseInput,
      status: "confirmed",
    };
    const result = normalizeResultSummary(input);
    expect(result.booking_status).toBe("confirmed");
  });

  it("usa input.booking_status quando status ausente", () => {
    const input = {
      ...baseInput,
      booking_status: "cancelled",
    };
    const result = normalizeResultSummary(input);
    expect(result.booking_status).toBe("cancelled");
  });

  it("extrai notes de result_details.notes", () => {
    const input = {
      ...baseInput,
      result_details: { result_status: "apto", notes: "nota importante" },
    };
    const result = normalizeResultSummary(input);
    expect(result.notes).toBe("nota importante");
  });

  it("extrai notes de result_details.observacoes", () => {
    const input = {
      ...baseInput,
      result_details: { result_status: "apto", observacoes: "observação" },
    };
    const result = normalizeResultSummary(input);
    expect(result.notes).toBe("observação");
  });

  it("retorna null para campos não informados", () => {
    const result = normalizeResultSummary(baseInput);
    expect(result.test_date).toBeNull();
    expect(result.score).toBeNull();
    expect(result.location).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.result_status).toBeNull();
  });

  it("extrai concept de result_details", () => {
    const input = {
      ...baseInput,
      result_details: { result_status: "apto", concept: "Ótimo" },
    };
    const result = normalizeResultSummary(input);
    expect(result.concept).toBe("Ótimo");
  });
});
