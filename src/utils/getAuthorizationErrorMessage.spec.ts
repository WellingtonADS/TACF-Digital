import { describe, expect, it } from "vitest";
import { getAuthorizationErrorMessage } from "./getAuthorizationErrorMessage";

describe("getAuthorizationErrorMessage", () => {
  it("retorna null para erro nulo", () => {
    expect(getAuthorizationErrorMessage(null)).toBeNull();
  });

  it("retorna null para erro sem relação a autorização", () => {
    expect(
      getAuthorizationErrorMessage({ message: "something failed" }),
    ).toBeNull();
  });

  it("detecta code 42501", () => {
    const result = getAuthorizationErrorMessage({
      code: "42501",
      message: "denied",
    });
    expect(result).toMatch(/Acesso negado/i);
  });

  it("detecta code 403", () => {
    const result = getAuthorizationErrorMessage({
      code: "403",
      message: "forbidden",
    });
    expect(result).toMatch(/Acesso negado/i);
  });

  it('detecta texto "not_authorized"', () => {
    const result = getAuthorizationErrorMessage({
      message: "not_authorized to perform",
    });
    expect(result).toMatch(/Acesso negado/i);
  });

  it('detecta texto "permission denied"', () => {
    const result = getAuthorizationErrorMessage({
      message: "permission denied for table",
    });
    expect(result).toMatch(/Acesso negado/i);
  });

  it('detecta texto "row-level security"', () => {
    const result = getAuthorizationErrorMessage({
      message: "new row violates row-level security",
    });
    expect(result).toMatch(/Acesso negado/i);
  });

  it('detecta texto "forbidden"', () => {
    const result = getAuthorizationErrorMessage({ message: "Forbidden" });
    expect(result).toMatch(/Acesso negado/i);
  });

  it("inclui actionContext na mensagem", () => {
    const result = getAuthorizationErrorMessage(
      { code: "403", message: "forbidden" },
      "cancelar agendamento",
    );
    expect(result).toMatch(/cancelar agendamento/);
  });

  it("retorna null quando message está ausente e code é genérico", () => {
    expect(getAuthorizationErrorMessage({ code: "500" })).toBeNull();
  });
});
