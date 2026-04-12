import { describe, expect, it } from "vitest";

import {
  appRouteRegistry,
  getRoutableAppRoutes,
  getSidebarRoutesForRole,
} from "./routeRegistry";

describe("routeRegistry", () => {
  it("expõe o hub de sessões para admin e coordinator", () => {
    const routes = getSidebarRoutesForRole("admin");
    const coordinatorRoutes = getSidebarRoutesForRole("coordinator");

    expect(routes.some((route) => route.path === "/app/sessoes")).toBe(true);
    expect(routes.some((route) => route.path === "/app/turmas")).toBe(false);
    expect(
      routes.find((route) => route.path === "/app/sessoes")?.sidebarLabel,
    ).toBe("Hub de Sessões");
    expect(
      coordinatorRoutes.some((route) => route.path === "/app/sessoes"),
    ).toBe(true);
  });

  it("remove coordinator da sidebar de governança", () => {
    const routes = getSidebarRoutesForRole("coordinator");

    expect(routes.some((route) => route.path === "/app/admin")).toBe(false);
    expect(routes.some((route) => route.path === "/app/efetivo")).toBe(false);
    expect(routes.some((route) => route.path === "/app/analytics")).toBe(false);
  });

  it("mantém /app/turmas como rota legada roteável por compatibilidade", () => {
    const routes = getRoutableAppRoutes();
    const classesRoute = appRouteRegistry.find(
      (route) => route.path === "/app/turmas",
    );
    const adminRoute = appRouteRegistry.find(
      (route) => route.path === "/app/admin",
    );

    expect(routes.some((route) => route.path === "/app/sessoes")).toBe(true);
    expect(routes.some((route) => route.path === "/app/turmas")).toBe(true);
    expect(classesRoute?.access).toBe("session_manager");
    expect(adminRoute?.access).toBe("platform_admin");
  });
});
