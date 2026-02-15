import * as adminService from "@/services/admin";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAnalyticsDashboard from "../AdminAnalyticsDashboard";

vi.mock("@/services/admin", () => ({
  fetchAnalyticsSnapshot: vi.fn(),
}));

const fetchAnalyticsSnapshot = vi.mocked(adminService.fetchAnalyticsSnapshot);

describe("AdminAnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stats based on analytics snapshot", async () => {
    fetchAnalyticsSnapshot
      .mockResolvedValueOnce({
        data: {
          sessions: [
            { id: "s1", date: "2026-02-01", max_capacity: 10 },
            { id: "s2", date: "2026-02-02", max_capacity: 10 },
          ],
          bookings: [
            { session_id: "s1", status: "confirmed" },
            { session_id: "s1", status: "confirmed" },
            { session_id: "s2", status: "confirmed" },
            { session_id: "s2", status: "cancelled" },
          ],
          swapRequests: 2,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          sessions: [],
          bookings: [],
          swapRequests: 0,
        },
        error: null,
      });

    render(<AdminAnalyticsDashboard />);

    const totalSessionsLabel = await screen.findByText("Total de Sessoes");
    const totalSessionsSection = totalSessionsLabel.closest("div");
    expect(totalSessionsSection).toBeTruthy();
    expect(
      within(totalSessionsSection as HTMLElement).getByText("2"),
    ).toBeTruthy();

    const occupancyLabel = screen.getByText("Taxa de Ocupacao");
    const occupancySection = occupancyLabel.closest("div");
    expect(occupancySection).toBeTruthy();
    expect(
      within(occupancySection as HTMLElement).getByText("15%"),
    ).toBeTruthy();
  });
});
