import { getAuthErrorMessage } from "./getAuthErrorMessage";

describe("getAuthErrorMessage", () => {
  it("returns an explicit message for unconfirmed email errors", () => {
    expect(
      getAuthErrorMessage(
        { message: "email_not_confirmed" },
        "Erro na autenticação.",
      ),
    ).toBe("E-mail não confirmado. Verifique sua caixa de entrada ou peça um novo link de confirmação.");
  });
});
