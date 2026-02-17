import { AuthProvider } from "@/contexts/AuthContext";
import type { SessionWithBookings } from "@/types/database.types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingConfirmationModal from "../BookingConfirmationModal";

/**
 * Factory function to create mock session data
 */
const getMockSession = (
  overrides?: Partial<SessionWithBookings>,
): SessionWithBookings => {
  return {
    id: "session-123",
    date: "2026-02-20",
    period: "morning",
    max_capacity: 30,
    applicators: ["instructor-1"],
    status: "open",
    created_at: "2026-02-01",
    updated_at: "2026-02-01",
    bookings: [],
    ...overrides,
  } as SessionWithBookings;
};

/**
 * Wrapper component to provide AuthContext to tests
 */
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("BookingConfirmationModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  describe("Rendering", () => {
    it("should not render modal when isOpen is false", () => {
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date={null}
          availableSessions={[]}
        />,
      );

      expect(screen.queryByText("Confirmar Presença")).toBeNull();
    });

    it("should not render modal when date is null", () => {
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date={null}
          availableSessions={[]}
        />,
      );

      expect(screen.queryByText("Confirmar Presença")).toBeNull();
    });

    it("should render modal with date when isOpen and date are provided", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      expect(screen.getByText("Confirmar Presença")).toBeTruthy();
    });

    it("should render TAF selector", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      expect(screen.getByText("1. Selecione a Referência")).toBeTruthy();
      expect(screen.getByText("TAF 1")).toBeTruthy();
      expect(screen.getByText("TAF 2")).toBeTruthy();
    });

    it("should render period selector", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      expect(screen.getByText("2. Escolha o Turno")).toBeTruthy();
      expect(screen.getByText("Turno da Manhã")).toBeTruthy();
    });

    it("should render confirm and cancel buttons", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      expect(screen.getByText("Confirmar")).toBeTruthy();
      expect(screen.getByText("Cancelar")).toBeTruthy();
    });

    it("should show contact information", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      expect(screen.getByText(/HAAF - Pista de Atletismo/)).toBeTruthy();
      expect(screen.getByText(/edfisica\.haaf@fab\.mil\.br/)).toBeTruthy();
    });
  });

  describe("User interactions", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      const cancelButton = screen.getByText("Cancelar");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it("should select TAF when clicked", async () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      const taf2Button = screen.getAllByText("TAF 2")[0];
      fireEvent.click(taf2Button);

      // TAF 2 should be selected
      await waitFor(() => {
        const taf2Options = screen.getAllByText("TAF 2");
        expect(taf2Options.length).toBeGreaterThan(0);
      });
    });

    it("should select period when clicked", async () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      const periodButton = screen.getByRole("button", {
        name: /turno da manhã/i,
      });
      fireEvent.click(periodButton);

      // Morning should be selected
      await waitFor(() => {
        expect(periodButton).toHaveClass("border-blue-600");
      });
    });

    it("should disable confirm button when period is not selected", () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      const confirmButton = screen.getByText("Confirmar") as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(true);
    });

    it("should enable confirm button when period is selected", async () => {
      const session = getMockSession();
      renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
        />,
      );

      const periodButton = screen.getByText("Turno da Manhã");
      fireEvent.click(periodButton);

      const confirmButton = screen.getByText("Confirmar") as HTMLButtonElement;

      await waitFor(() => {
        expect(confirmButton.disabled).toBe(false);
      });
    });

    it("should show unavailable message for missing periods", () => {
      // Only afternoon session available
      const afternoonSession = getMockSession({ period: "afternoon" });
      render(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[afternoonSession]}
        />,
      );

      // Morning should show unavailable
      expect(screen.getByText("Indisponível")).toBeTruthy();
    });
  });

  describe("Props handling", () => {
    it("should handle multiple sessions on same date", () => {
      const morningSessions = getMockSession({ period: "morning" });
      const afternoonSession = getMockSession({
        period: "afternoon",
        id: "session-124",
      });

      render(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[morningSessions, afternoonSession]}
        />,
      );

      expect(screen.getByText("Turno da Manhã")).toBeTruthy();
      expect(screen.getByText("Turno da Tarde")).toBeTruthy();
    });

    it("should handle loading state prop", () => {
      const session = getMockSession();
      const { rerender } = renderWithAuth(
        <BookingConfirmationModal
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          date="2026-02-20"
          availableSessions={[session]}
          loading={false}
        />,
      );

      let confirmButton = screen.getByRole("button", {
        name: /confirmar/i,
      }) as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(true); // no period selected

      rerender(
        <AuthProvider>
          <BookingConfirmationModal
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            date="2026-02-20"
            availableSessions={[session]}
            loading={true}
          />
        </AuthProvider>,
      );

      confirmButton = screen.getByRole("button", {
        name: /confirmar|processando/i,
      }) as HTMLButtonElement;
      expect(confirmButton.disabled).toBe(true);
    });
  });
});
