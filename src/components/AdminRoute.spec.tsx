import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  default: useAuthMock,
}));

vi.mock("./FullPageLoading", () => ({
  default: () => <div>Carregando</div>,
}));

import AdminRoute from "./AdminRoute";

describe("AdminRoute", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("permite coordinator em rotas de session_manager", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "coord-1" },
      profile: { id: "coord-1", role: "coordinator" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/app/turmas"]}>
        <Routes>
          <Route
            path="/app/turmas"
            element={
              <AdminRoute access="session_manager">
                <div>Turmas</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Turmas")).toBeInTheDocument();
  });

  it("bloqueia coordinator em rotas de platform_admin", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "coord-1" },
      profile: { id: "coord-1", role: "coordinator" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/app/admin"]}>
        <Routes>
          <Route
            path="/app/admin"
            element={
              <AdminRoute access="platform_admin">
                <div>Admin</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Area administrativa restrita")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("permite admin em rotas de platform_admin", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "admin-1" },
      profile: { id: "admin-1", role: "admin" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/app/admin"]}>
        <Routes>
          <Route
            path="/app/admin"
            element={
              <AdminRoute access="platform_admin">
                <div>Painel Admin</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Painel Admin")).toBeInTheDocument();
  });
});
