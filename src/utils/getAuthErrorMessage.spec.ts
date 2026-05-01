import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./getAuthErrorMessage";

describe("getAuthErrorMessage", () => {
  it("retorna mensagem padrão quando err é null", () => {
    expect(getAuthErrorMessage(null)).toBe("Erro na autenticação.");
  });

  it("retorna mensagem customizada quando err é null", () => {
    expect(getAuthErrorMessage(null, "Falha!")).toBe("Falha!");
  });

  it("identifica credenciais inválidas por .message", () => {
    expect(getAuthErrorMessage({ message: "Invalid login credentials" })).toBe(
      "E-mail ou senha inválidos.",
    );
    expect(getAuthErrorMessage({ message: "invalid password" })).toBe(
      "E-mail ou senha inválidos.",
    );
  });

  it("identifica usuário não encontrado", () => {
    expect(getAuthErrorMessage({ message: "user not found" })).toBe(
      "Usuário não existe.",
    );
    expect(getAuthErrorMessage({ message: "no user with this email" })).toBe(
      "Usuário não existe.",
    );
  });

  it("identifica e-mail já cadastrado", () => {
    expect(getAuthErrorMessage({ message: "User already registered" })).toBe(
      "E-mail já cadastrado.",
    );
    expect(getAuthErrorMessage({ message: "duplicate key" })).toBe(
      "E-mail já cadastrado.",
    );
  });

  it("identifica senha fraca", () => {
    expect(
      getAuthErrorMessage({ message: "password should be at least 8 chars" }),
    ).toBe("Senha fraca: verifique os requisitos de senha.");
  });

  it("identifica erro de servidor/rede", () => {
    expect(getAuthErrorMessage({ message: "internal server error" })).toBe(
      "Erro de servidor. Tente novamente mais tarde.",
    );
    expect(getAuthErrorMessage({ message: "network error" })).toBe(
      "Erro de servidor. Tente novamente mais tarde.",
    );
  });

  it("identifica falha no envio de e-mail de recuperação", () => {
    const result = getAuthErrorMessage({
      message: "error sending recovery email",
    });
    expect(result).toMatch(/recuperação/i);
  });

  it("extrai mensagem de error_description", () => {
    const err = { error_description: "invalid login credentials" };
    expect(getAuthErrorMessage(err)).toBe("E-mail ou senha inválidos.");
  });

  it("extrai mensagem de Error nativo", () => {
    const err = new Error("invalid login credentials");
    expect(getAuthErrorMessage(err)).toBe("E-mail ou senha inválidos.");
  });

  it("retorna a própria mensagem quando não reconhece o erro", () => {
    const result = getAuthErrorMessage({ message: "Algum erro inesperado" });
    expect(result).toBe("Algum erro inesperado");
  });
});
