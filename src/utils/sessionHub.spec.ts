import { describe, expect, it } from "vitest";

import { buildSessionHubPath, parseSessionHubTab } from "./sessionHub";

describe("sessionHub", () => {
  it("parseSessionHubTab usa sessoes como fallback para valor ausente ou inválido", () => {
    expect(parseSessionHubTab(undefined)).toBe("sessoes");
    expect(parseSessionHubTab(null)).toBe("sessoes");
    expect(parseSessionHubTab("qualquer")).toBe("sessoes");
  });

  it("buildSessionHubPath gera URL com tab e contexto opcional", () => {
    expect(buildSessionHubPath("reagendamentos")).toBe(
      "/app/sessoes?tab=reagendamentos",
    );

    expect(
      buildSessionHubPath("indices", {
        sessionId: "session-123",
        mode: "review",
      }),
    ).toBe("/app/sessoes?tab=indices&sessionId=session-123&mode=review");
  });
});
