import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionFormDialog from "./SessionFormDialog";

const mocks = vi.hoisted(() => ({
  useLocations: vi.fn(),
  createSessions: vi.fn(),
  fetchCoordinators: vi.fn(),
  fetchSessionForEdit: vi.fn(),
  updateSession: vi.fn(),
  fetchSystemSettings: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/components/Dialog", () => ({
  default: ({
    open,
    title,
    description,
    children,
    footer,
  }: {
    open: boolean;
    title?: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {title ? <h1>{title}</h1> : null}
        {description ? <p>{description}</p> : null}
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("@/hooks/useLocations", () => ({
  default: mocks.useLocations,
}));

vi.mock("@/services/bookings", () => ({
  createSessions: mocks.createSessions,
}));

vi.mock("@/services/personnel", () => ({
  fetchCoordinators: mocks.fetchCoordinators,
}));

vi.mock("@/services/sessions", () => ({
  fetchSessionForEdit: mocks.fetchSessionForEdit,
  updateSession: mocks.updateSession,
}));

vi.mock("@/services/systemSettings", () => ({
  fetchSystemSettings: mocks.fetchSystemSettings,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

function renderDialog(
  overrides: Partial<Parameters<typeof SessionFormDialog>[0]> = {},
) {
  const onClose = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);

  render(
    <SessionFormDialog
      open
      mode="create"
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />,
  );

  return { onClose, onSaved };
}

describe("SessionFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useLocations.mockReturnValue({
      locations: [
        {
          id: "loc-1",
          name: "Pista Central",
          address: "Base A",
          max_capacity: 21,
          status: "active",
        },
      ],
      loading: false,
      fetch: vi.fn().mockResolvedValue(undefined),
      total: 1,
      error: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    });

    mocks.fetchSystemSettings.mockResolvedValue({
      min_capacity: 8,
      max_capacity: 21,
      default_periods: ["manha", "tarde"],
    });

    mocks.fetchCoordinators.mockResolvedValue([
      {
        id: "coord-1",
        full_name: "Capitão Teste",
        war_name: "Cap Teste",
      },
    ]);

    mocks.createSessions.mockResolvedValue(undefined);
    mocks.updateSession.mockResolvedValue(undefined);
    mocks.fetchSessionForEdit.mockResolvedValue({
      session: {
        id: "session-1",
        date: "2026-04-25",
        period: "tarde",
        capacity: 10,
        max_capacity: 20,
        metadata: {
          evaluation_type: "especializada",
        },
        location_id: "loc-1",
        coordinator_id: "coord-1",
        applicators: ["coord-1"],
      },
    });
  });

  it("mantém o bloqueio de fim de semana ao criar sessão", async () => {
    renderDialog();

    const dateInput = await screen.findByLabelText(/^Data$/i);
    fireEvent.change(dateInput, { target: { value: "2026-04-25" } });

    await userEvent.click(
      screen.getByRole("button", { name: /Gerar Sessões/i }),
    );

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Sessoes nao podem ser criadas ou editadas aos fins de semana.",
      );
    });

    expect(mocks.createSessions).not.toHaveBeenCalled();
  });

  it("permite editar sessão sem reenviar data nem metadata", async () => {
    const { onClose, onSaved } = renderDialog({
      mode: "edit",
      sessionId: "session-1",
    });

    await screen.findByRole("heading", { name: /Editar Sessão/i });

    await waitFor(() => {
      expect(mocks.fetchSessionForEdit).toHaveBeenCalledWith("session-1");
    });

    expect(screen.queryByText(/Tipo de avaliação/i)).not.toBeInTheDocument();
    expect(screen.getByText("2026-04-25")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Salvar alteracoes/i }),
    );

    await waitFor(() => {
      expect(mocks.updateSession).toHaveBeenCalledWith("session-1", {
        period: "tarde",
        capacity: 10,
        max_capacity: 20,
        location_id: "loc-1",
        coordinator_id: "coord-1",
        applicators: ["coord-1"],
      });
    });

    expect(mocks.toastError).not.toHaveBeenCalledWith(
      "Sessoes nao podem ser criadas ou editadas aos fins de semana.",
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Sessao atualizada com sucesso.",
    );
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
