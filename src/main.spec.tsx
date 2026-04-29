import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: "user-1" },
  profile: {
    role: "user",
    full_name: "Joao da Silva",
    email: "joao.silva@fab.mil.br",
    war_name: "Silva",
    saram: "1234567",
    rank: "3S",
    sector: "HACO",
    metadata: null,
  },
  loading: false,
}));

vi.mock("./hooks/useAuth", () => ({
  default: () => authState,
}));

vi.mock("./router/prefetchRoutes", () => ({
  prefetchCriticalRoutes: vi.fn(),
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
}));

vi.mock("react-dom/client", async () => {
  const actual =
    await vi.importActual<typeof import("react-dom/client")>(
      "react-dom/client",
    );
  return {
    createRoot: vi.fn((container: Element) => ({
      render: vi.fn((element: React.ReactNode) => {
        actual.createRoot(container).render(element);
      }),
    })),
  };
});

vi.mock("./pages/OperationalDashboard", () => ({
  default: () => <div>Dashboard operacional mock</div>,
}));

vi.mock("./router/routeRegistry", () => ({
  getRoutableAppRoutes: () => [],
}));

vi.mock("@/router/routeAccess", () => ({
  getDefaultHomeByRole: () => "/app",
}));

describe("main routing", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.pushState({}, "", "/app/rota-inexistente");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("exibe estado de rota nao encontrada para caminhos invalidos em /app", async () => {
    await import("./main");

    expect(
      await screen.findByRole("heading", { name: /pagina nao encontrada/i }),
    ).toBeInTheDocument();
  }, 10000);
});
