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

import UserRoute from "./UserRoute";

describe("UserRoute", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("redirects incomplete users to the profile page", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1", email: "militar@fab.mil.br" },
      profile: {
        id: "user-1",
        full_name: "Fulano de Tal",
        email: "militar@fab.mil.br",
        role: "user",
        active: true,
        war_name: null,
        saram: null,
        rank: null,
        sector: null,
      },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <UserRoute>
                <div>Dashboard</div>
              </UserRoute>
            }
          />
          <Route path="/app/perfil" element={<div>Perfil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Perfil")).toBeInTheDocument();
  });

  it("allows incomplete users to access the profile page itself", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1", email: "militar@fab.mil.br" },
      profile: {
        id: "user-1",
        full_name: "Fulano de Tal",
        email: "militar@fab.mil.br",
        role: "user",
        active: true,
        war_name: null,
        saram: null,
        rank: null,
        sector: null,
      },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/app/perfil"]}>
        <Routes>
          <Route
            path="/app/perfil"
            element={
              <UserRoute>
                <div>Perfil</div>
              </UserRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Perfil")).toBeInTheDocument();
  });
});
