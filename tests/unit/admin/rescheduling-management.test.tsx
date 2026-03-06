import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReschedulingManagement from "../../../src/pages/ReschedulingManagement";

const { mockNavigate, fromMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  fromMock: vi.fn(),
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const bookingsMock = [
  {
    id: "b1",
    user_id: "u1",
    session_id: "s1",
    status: "pending_swap",
    swap_reason: "Motivo médico",
    test_date: null,
    created_at: "2026-02-01T10:00:00",
  },
];

const profilesMock = [
  { id: "u1", full_name: "Maj. Brito", war_name: "Brito", saram: "101010" },
];

const sessionsMock = [{ id: "s1", date: "2026-05-01" }];

vi.mock("@/services/supabase", () => {
  fromMock.mockImplementation((table: string) => {
    if (table === "bookings") {
      const updateChain = { eq: () => Promise.resolve({ error: null }) };
      return {
        select: () => ({
          not: () => Promise.resolve({ data: bookingsMock, error: null }),
        }),
        update: () => updateChain,
      };
    }
    if (table === "sessions") {
      return {
        select: () => ({ in: () => Promise.resolve({ data: sessionsMock }) }),
      };
    }
    if (table === "profiles") {
      return {
        select: () => ({ in: () => Promise.resolve({ data: profilesMock }) }),
      };
    }
    return { select: () => Promise.resolve({ data: [] }) };
  });
  return {
    __esModule: true,
    default: { from: fromMock },
  };
});

describe("ReschedulingManagement", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fromMock.mockClear();
  });

  it("renderiza a lista de solicitações com o nome do militar", async () => {
    render(
      <MemoryRouter>
        <ReschedulingManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText(/Maj\. Brito/i).length).toBeGreaterThan(0);
    });
  });

  it("botão Deferir está presente e é clicável", async () => {
    render(
      <MemoryRouter>
        <ReschedulingManagement />
      </MemoryRouter>,
    );
    const botoes = await screen.findAllByRole("button", { name: /deferir/i });
    expect(botoes.length).toBeGreaterThan(0);
    await userEvent.click(botoes[0]);
    // update should have been called
    expect(fromMock).toHaveBeenCalledWith("bookings");
  });

  it("botão Indeferir está presente e é clicável", async () => {
    render(
      <MemoryRouter>
        <ReschedulingManagement />
      </MemoryRouter>,
    );
    const botoes = await screen.findAllByRole("button", { name: /indeferir/i });
    expect(botoes.length).toBeGreaterThan(0);
    await userEvent.click(botoes[0]);
    expect(fromMock).toHaveBeenCalledWith("bookings");
  });
});
