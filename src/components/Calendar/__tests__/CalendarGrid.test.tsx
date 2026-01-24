import * as api from "@/services/api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CalendarGrid from "../CalendarGrid";
// Mock sonner toast to avoid non-configurable property issues and to assert calls
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetchSessionsByMonth to return a single session on the 15th
const session = {
  id: "session-1",
  date: new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-\d{2}$/, "-15"),
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
    vi.spyOn(api, "fetchSessionsByMonth").mockResolvedValue({
      data: [session],
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows optimistic increment and reverts on session full error", async () => {
    // Mock confirmBooking to return a delayed rejection (session full)
    const confirmMock = vi
      .spyOn(api, "confirmBooking")
      .mockImplementation(async () => {
        // simulate network delay
        await new Promise((r) => setTimeout(r, 10));
        return { success: false, error: "session full" };
      });

    render(<CalendarGrid />);

    // wait for day button to appear
    const agendarButtons = await screen.findAllByText("Agendar");
    expect(agendarButtons.length).toBeGreaterThan(0);

    // click the first day 'Agendar'
    await userEvent.click(agendarButtons[0]);

    // modal should show Confirmar button
    const confirmar = await screen.findByText("Confirmar");

    // click confirm
    await userEvent.click(confirmar);

    // Immediately after click, optimistic count should show 1/1
    const bookedText = await screen.findByText((content) =>
      /1\/1/.test(content.replace(/\s+/g, "")),
    );
    expect(bookedText).toBeInTheDocument();

    // Wait for the mocked RPC to finish and for the UI to revert
    await waitFor(async () => {
      // After error, it should fetch sessions and revert to 0/1
      const reverted = await screen.findByText((content) =>
        /0\/1/.test(content.replace(/\s+/g, "")),
      );
      expect(reverted).toBeInTheDocument();
    });

    expect(confirmMock).toHaveBeenCalled();
  });

  test("shows optimistic increment and succeeds on booking", async () => {
    const confirmMock = vi
      .spyOn(api, "confirmBooking")
      .mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { success: true, error: null };
      });

    // Also mock fetchSessionsByMonth to return occupied_count 1 after confirmation
    const fetchMock = vi.spyOn(api, "fetchSessionsByMonth");
    fetchMock.mockResolvedValueOnce({ data: [session], error: null } as any); // initial
    fetchMock.mockResolvedValueOnce({
      data: [{ ...session, booking_count: 1 }],
      error: null,
    } as any); // after success

    render(<CalendarGrid />);

    const agendarButtons = await screen.findAllByText("Agendar");
    await userEvent.click(agendarButtons[0]);

    const confirmar = await screen.findByText("Confirmar");
    await userEvent.click(confirmar);

    // Check optimistic 1/1
    const optimistic = await screen.findByText((content) =>
      /1\/1/.test(content.replace(/\s+/g, "")),
    );
    expect(optimistic).toBeInTheDocument();

    // Wait for confirmation and modal to close (selectedDate becomes null)
    await waitFor(async () => {
      // After success, fetchSessions is called and modal closed; expect 'Sem sessão' or modal gone
      expect(screen.queryByText("Confirmar")).not.toBeInTheDocument();
    });

    expect(confirmMock).toHaveBeenCalled();
  });

  test("prevents booking outside seasonal window", async () => {
    // session on June 15 (outside Fev–Mai and Sep–Nov)
    const outOfSeasonSession = { ...session, date: "2026-06-15" };
    vi.spyOn(api, "fetchSessionsByMonth").mockResolvedValue({
      data: [outOfSeasonSession],
      error: null,
    } as any);

    const confirmMock = vi.spyOn(api, "confirmBooking");
    const { toast } = await import("sonner");
    const toastSpy = toast;

    render(<CalendarGrid />);

    const agendarButtons = await screen.findAllByText("Agendar");
    await userEvent.click(agendarButtons[0]);

    const confirmar = await screen.findByText("Confirmar");
    await userEvent.click(confirmar);

    // confirmBooking should not be called because date is outside window
    expect(confirmMock).not.toHaveBeenCalled();

    // toast.error should be called with a message
    expect(toastSpy.error).toHaveBeenCalled();
  });
});
