import { describe, expect, it } from "vitest";

import { getRoutableAppRoutes, getSidebarRoutesForRole } from "./routeRegistry";

describe("routeRegistry", () => {
  it("expõe /app/sessoes como entrada principal do hub admin na sidebar", () => {
    const routes = getSidebarRoutesForRole("admin");

    expect(routes.some((route) => route.path === "/app/sessoes")).toBe(true);
    expect(routes.some((route) => route.path === "/app/turmas")).toBe(false);
    expect(
      routes.find((route) => route.path === "/app/sessoes")?.sidebarLabel,
    ).toBe("Hub de Sessões");
  });

  it("mantém /app/turmas como rota legada roteável por compatibilidade", () => {
    const routes = getRoutableAppRoutes();

    expect(routes.some((route) => route.path === "/app/sessoes")).toBe(true);
    expect(routes.some((route) => route.path === "/app/turmas")).toBe(true);
  });
});
