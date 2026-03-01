import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SystemSettings from "../../../src/pages/SystemSettings";

const { mockNavigate, fromMock, rpcMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: { role: "admin" }, loading: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const settingsMock = {
  id: "cfg1",
  max_capacity: 20,
  current_year: 2026,
  current_semester: "1",
};

vi.mock("@/services/supabase", () => {
  fromMock.mockImplementation((table: string) => {
    if (table === "system_settings") {
      return {
        select: () => ({
          limit: () => ({
            single: () => Promise.resolve({ data: settingsMock, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    }
    return { select: () => Promise.resolve({ data: [] }) };
  });
  rpcMock.mockResolvedValue({ data: [], error: null });
  return {
    __esModule: true,
    default: { from: fromMock, rpc: rpcMock },
  };
});

describe("SystemSettings", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fromMock.mockClear();
  });

  it("renderiza as abas de configuração", async () => {
    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Tabelas de Avaliação/i)).toBeInTheDocument();
    });
  });

  it("link para perfis de acesso está presente", async () => {
    render(
      <MemoryRouter>
        <SystemSettings />
      </MemoryRouter>,
    );
    const perfisTab = await screen.findByText(/Perfis de Acesso/i);
    expect(perfisTab).toBeInTheDocument();
  });
});
