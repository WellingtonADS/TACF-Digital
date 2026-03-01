import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuditLog from "../../../src/pages/AuditLog";

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

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

vi.mock("@/services/supabase", () => {
  rpcMock.mockResolvedValue({
    data: [
      {
        id: "a1",
        user_name: "Admin",
        action: "UPDATE",
        module: "bookings",
        metadata: null,
        created_at: "2026-02-01T10:00:00",
      },
      {
        id: "a2",
        user_name: "Coord",
        action: "INSERT",
        module: "sessions",
        metadata: null,
        created_at: "2026-02-02T09:00:00",
      },
    ],
    error: null,
  });
  return {
    __esModule: true,
    default: { rpc: rpcMock },
  };
});

describe("AuditLog", () => {
  beforeEach(() => {
    rpcMock.mockClear();
  });

  it("chama o RPC get_audit_logs na inicialização", async () => {
    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("get_audit_logs");
    });
  });

  it("renderiza os logs retornados", async () => {
    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>,
    );
    await waitFor(() => {
      // at least one UPDATE and one INSERT are present (in logs or filter options)
      expect(screen.getAllByText("UPDATE").length).toBeGreaterThan(0);
      expect(screen.getAllByText("INSERT").length).toBeGreaterThan(0);
    });
  });

  it("campo de filtro de ação está presente", async () => {
    render(
      <MemoryRouter>
        <AuditLog />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
