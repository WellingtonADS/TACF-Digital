import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessProfilesManagement from "../../../src/pages/AccessProfilesManagement";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: { role: "admin" }, loading: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const profilesMock = [
  { id: "p1", name: "Administrador", description: "Acesso total ao sistema" },
  { id: "p2", name: "Coordenador", description: "Acesso parcial" },
];

const permissionsMock = [
  { id: "pm1", name: "view_reports", description: "Ver relatórios" },
];

vi.mock("@/services/supabase", () => {
  fromMock.mockImplementation((table: string) => {
    if (table === "access_profiles") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: profilesMock, error: null }),
        }),
      };
    }
    if (table === "permissions") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: permissionsMock, error: null }),
        }),
      };
    }
    if (table === "access_profile_permissions") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        delete: () => ({
          eq: () => ({ eq: () => Promise.resolve({ error: null }) }),
        }),
      };
    }
    return { select: () => Promise.resolve({ data: [] }) };
  });
  return {
    __esModule: true,
    default: { from: fromMock },
  };
});

describe("AccessProfilesManagement", () => {
  beforeEach(() => {
    fromMock.mockClear();
  });

  it("renderiza a lista de perfis de acesso", async () => {
    render(
      <MemoryRouter>
        <AccessProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Administrador/i)).toBeInTheDocument();
    });
  });

  it("exibe os nomes das permissões disponíveis", async () => {
    render(
      <MemoryRouter>
        <AccessProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText(/view_reports/i).length).toBeGreaterThan(0);
    });
  });
});
