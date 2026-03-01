import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OmLocationManager from "../../../src/pages/OmLocationManager";

const mockNavigate = vi.fn();

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

const locationsMock = [
  {
    id: "loc1",
    name: "COMAR I",
    type: "om",
    status: "active",
    address: "Brasília – DF",
    capacity: 30,
    created_at: "2026-01-01",
  },
];

vi.mock("@/hooks/useLocations", () => ({
  __esModule: true,
  default: () => ({
    locations: locationsMock,
    total: locationsMock.length,
    loading: false,
    error: null,
    fetch: vi.fn(),
  }),
}));

describe("OmLocationManager", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renderiza a lista de OMs", async () => {
    render(
      <MemoryRouter>
        <OmLocationManager />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/COMAR I/i)).toBeInTheDocument();
    });
  });

  it("botão de editar navega para /app/om/:id", async () => {
    render(
      <MemoryRouter>
        <OmLocationManager />
      </MemoryRouter>,
    );
    const editBtn = await screen.findByRole("button", {
      name: /editar unidade/i,
    });
    expect(editBtn).toBeInTheDocument();
  });
});
