import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PersonnelManagement from "../../../src/pages/PersonnelManagement";

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

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const profilesMock = [
  {
    id: "u1",
    full_name: "Cabral Oliveira",
    war_name: "Cabral",
    rank: "Major",
    saram: "111222",
    sector: "G1",
    active: true,
  },
  {
    id: "u2",
    full_name: "Silva Santos",
    war_name: "Silva",
    rank: "Capitão",
    saram: "333444",
    sector: "G2",
    active: true,
  },
];

vi.mock("@/services/supabase", () => {
  fromMock.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: () => Promise.resolve({ data: profilesMock, error: null }),
      };
    }
    if (table === "bookings") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    }
    return { select: () => Promise.resolve({ data: [], error: null }) };
  });
  return {
    __esModule: true,
    default: { from: fromMock },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PersonnelManagement />
    </MemoryRouter>,
  );
}

describe("PersonnelManagement", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fromMock.mockClear();
  });

  it("renderiza a lista de militares", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Cabral/i)).toBeInTheDocument();
    });
  });

  it("campo de busca está presente e aceita texto", async () => {
    renderPage();
    const input = await screen.findByPlaceholderText(/Buscar/i);
    await userEvent.type(input, "Silva");
    expect(input).toHaveValue("Silva");
  });

  it("select de posto/graduação está presente", async () => {
    renderPage();
    // at least one combobox/select for rank filtering
    await waitFor(() => {
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});
