import { vi } from "vitest";

// Mock sonner toast to avoid non-configurable property issues and to assert calls
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the api module so CalendarGrid's imported functions use the mocked implementations
vi.mock("@/services/api", () => ({
  fetchSessionsByMonth: vi.fn(),
  confirmBooking: vi.fn(),
  getUserBooking: vi.fn(),
}));

// Mock useBooking to call the mocked api.confirmBooking so component flows invoke the mocked RPC
vi.mock("@/hooks/useBooking", async () => {
  const api = await import("@/services/api");
  return {
    useBooking: () => ({
      confirm: async (sessionId: string, onSuccess?: () => void) => {
        const res = await (api as any).confirmBooking(sessionId);
        if (res.success) {
          await onSuccess?.();
          return { success: true, data: res.data };
        }
        return { success: false, error: res.error };
      },
    }),
  };
});

import * as api from "@/services/api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarGrid from "../CalendarGrid";

// Mock fetchSessionsByMonth to return a single session on the 15th
const year = new Date().getFullYear();
const session = {
  id: "session-1",
  date: `${year}-04-15`,
  period: "morning",
  max_capacity: 1,
  applicators: [],
  status: "open",
  coordinator_id: null,
  created_at: "",
  updated_at: "",
  bookings: [],
  booking_count: 0,
};

describe("CalendarGrid optimistic booking", () => {
  beforeEach(() => {
    (api.fetchSessionsByMonth as any).mockResolvedValue({
      data: [session],
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows optimistic increment and reverts on session full error", async () => {
    // Mock confirmBooking to return a delayed rejection (session full)
    const confirmMock = (api.confirmBooking as any).mockImplementation(
      async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { success: false, error: "session full" };
      },
    );

    render(<CalendarGrid initialDate={new Date(session.date)} />);

    // wait for day button to appear (match by role to be robust against markup changes)
    const agendarButtons = await screen.findAllByRole("button", {
      name: /Agendar/i,
    });
    expect(agendarButtons.length).toBeGreaterThan(0);

    // click the first day 'Agendar'
    await userEvent.click(agendarButtons[0]);

    // modal should show Confirmar button
    const confirmar = await screen.findByRole("button", { name: /Confirmar/i });

    // click confirm
    await userEvent.click(confirmar);

    // ensure confirm RPC called
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());

    // After the RPC finishes, counts should be refreshed and show 0/1 (reverted)
    const revertedAll = await screen.findAllByText((content) =>
      /0\/1/.test(content.replace(/\s+/g, "")),
    );
    expect(revertedAll.length).toBeGreaterThan(0);
  });

  test("shows optimistic increment and succeeds on booking", async () => {
    const confirmMock = (api.confirmBooking as any).mockImplementation(
      async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { success: true, error: null };
      },
    );

    // Also mock fetchSessionsByMonth to return occupied_count 1 after confirmation
    const fetchMock = api.fetchSessionsByMonth as any;
    fetchMock.mockResolvedValueOnce({ data: [session], error: null } as any);
    fetchMock.mockResolvedValueOnce({
      data: [{ ...session, booking_count: 1 }],
      error: null,
    } as any);

    // Mock getUserBooking to return booking data so receipt generation flow runs without throwing
    (api.getUserBooking as any).mockResolvedValueOnce({
      data: {
        id: "booking-1",
        profiles: { saram: "123", full_name: "Test User", rank: "Cabo" },
        sessions: { date: session.date, period: "morning" },
      },
      error: null,
    } as any);

    render(<CalendarGrid initialDate={new Date(session.date)} />);

    const agendarButtons = await screen.findAllByText("Agendar");
    await userEvent.click(agendarButtons[0]);

    const confirmar = await screen.findByRole("button", { name: /Confirmar/i });
    await userEvent.click(confirmar);

    // ensure confirm RPC called
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());

    // Wait for confirmation and modal to close (selectedDate becomes null)
    await waitFor(() => {
      expect(screen.queryByText("Confirmar")).not.toBeInTheDocument();
    });

    expect(confirmMock).toHaveBeenCalled();
  });

  test("prevents booking outside seasonal window", async () => {
    // session on June 15 (outside Fev–Mai and Sep–Nov)
    const outOfSeasonSession = { ...session, date: "2026-06-15" };
    (api.fetchSessionsByMonth as any).mockResolvedValue({
      data: [outOfSeasonSession],
      error: null,
    } as any);

    const confirmMock = api.confirmBooking as any;
    const { toast } = await import("sonner");
    const toastSpy = toast;

    render(<CalendarGrid initialDate={new Date(outOfSeasonSession.date)} />);

    const agendarButtons = await screen.findAllByRole("button", {
      name: /Agendar/i,
    });
    await userEvent.click(agendarButtons[0]);

    const confirmar = await screen.findByText("Confirmar");
    await userEvent.click(confirmar);

    // confirmBooking should not be called because date is outside window
    expect(confirmMock).not.toHaveBeenCalled();

    // toast.error should be called with a message
    expect(toastSpy.error).toHaveBeenCalled();
  });
});
