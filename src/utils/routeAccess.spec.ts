import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  getDefaultHomeByRole,
  isPlatformAdmin,
  isSessionManager,
} from "./routeAccess";

describe("routeAccess", () => {
  it("resolve as homes padrão por papel", () => {
    expect(getDefaultHomeByRole("admin")).toBe("/app/admin");
    expect(getDefaultHomeByRole("coordinator")).toBe("/app/turmas");
    expect(getDefaultHomeByRole("user")).toBe("/app");
    expect(getDefaultHomeByRole(null)).toBe("/app");
  });

  it("distingue platform admin de gestor de sessão", () => {
    expect(isPlatformAdmin("admin")).toBe(true);
    expect(isPlatformAdmin("coordinator")).toBe(false);
    expect(isSessionManager("admin")).toBe(true);
    expect(isSessionManager("coordinator")).toBe(true);
    expect(isSessionManager("user")).toBe(false);
  });

  it("autoriza rotas conforme a nova semântica", () => {
    expect(canAccessRoute("admin", "platform_admin")).toBe(true);
    expect(canAccessRoute("coordinator", "platform_admin")).toBe(false);
    expect(canAccessRoute("admin", "session_manager")).toBe(true);
    expect(canAccessRoute("coordinator", "session_manager")).toBe(true);
    expect(canAccessRoute("user", "session_manager")).toBe(false);
    expect(canAccessRoute("user", "user")).toBe(true);
    expect(canAccessRoute("admin", "user")).toBe(false);
    expect(canAccessRoute("coordinator", "user")).toBe(false);
    expect(canAccessRoute("user", "authenticated")).toBe(true);
    expect(canAccessRoute(null, "authenticated")).toBe(true);
  });
});
