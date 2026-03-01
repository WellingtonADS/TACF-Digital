import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Scheduling } from "../../../src/pages/Scheduling";

const { mockNavigate, mockSessions } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSessions: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/hooks/useSessions", () => ({
  __esModule: true,
  default: () => mockSessions(),
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1" },
    profile: { role: "user" },
    loading: false,
  }),
}));

vi.mock("../../../src/components/PageSkeleton", () => ({
  default: () => <div data-testid="page-skeleton" />,
}));

const today = new Date().toISOString().split("T")[0];

const sessionFixture = [
  {
    session_id: "sess-1",
    date: today,
    period: "MANHÃ",
    max_capacity: 20,
    occupied_count: 5,
    available_count: 15,
  },
];

describe("Scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions.mockReturnValue({
      sessions: sessionFixture,
      loading: false,
      error: null,
    });
  });

  it("renderiza o título Novo Agendamento", async () => {
    render(
      <MemoryRouter>
        <Scheduling />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Novo Agendamento")).toBeInTheDocument();
    });
  });

  it("exibe turno disponível MANHÃ para o dia selecionado", async () => {
    render(
      <MemoryRouter>
        <Scheduling />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/MANHÃ/i)).toBeInTheDocument();
    });
  });

  it("exibe skeleton quando loading é true", () => {
    mockSessions.mockReturnValue({ sessions: [], loading: true, error: null });
    render(
      <MemoryRouter>
        <Scheduling />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("navega para confirmação ao selecionar sessão e confirmar", async () => {
    render(
      <MemoryRouter>
        <Scheduling />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/MANHÃ/i)).toBeInTheDocument();
    });

    // Seleciona o turno MANHÃ
    fireEvent.click(screen.getByText(/MANHÃ/i));

    // Botão agora habilitado
    const confirmBtn = screen.getByRole("button", {
      name: /continuar para confirmação/i,
    });
    fireEvent.click(confirmBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/app/agendamentos/confirmacao",
      expect.objectContaining({ state: { sessionId: "sess-1" } }),
    );
  });

  it("botão fica desabilitado quando nenhuma sessão está selecionada", async () => {
    render(
      <MemoryRouter>
        <Scheduling />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/MANHÃ/i)).toBeInTheDocument();
    });

    // Sem selecionar sessão, botão deve estar desabilitado
    const confirmBtn = screen.getByRole("button", {
      name: /continuar para confirmação/i,
    });
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);
  });
});
