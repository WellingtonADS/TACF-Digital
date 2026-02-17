import { supabase } from "@/services/supabase";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useSessions from "../useSessions";

afterEach(() => {
  vi.restoreAllMocks();
});

function TestComp({ filters }: { filters?: any }) {
  const { sessions, loading, error } = useSessions(filters);
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "idle"}</div>
      <pre data-testid="sessions">{JSON.stringify(sessions)}</pre>
      <div data-testid="error">{error ?? ""}</div>
    </div>
  );
}

describe("useSessions", () => {
  it("fetches sessions and updates state", async () => {
    const mockData = [
      { id: "s1", date: "2026-02-14", period: "morning", bookings: [] },
    ];

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any;

    vi.spyOn(supabase, "from").mockReturnValue(builder);

    render(<TestComp />);

    await waitFor(() => {
      expect(screen.getByTestId("sessions").textContent).toContain("s1");
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });
  });

  it("applies filters to query", async () => {
    const mockData = [
      { id: "s2", date: "2026-02-15", period: "afternoon", bookings: [] },
    ];

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any;

    vi.spyOn(supabase, "from").mockReturnValue(builder);

    render(<TestComp filters={{ date: "2026-02-15", period: "afternoon" }} />);

    await waitFor(() =>
      expect(screen.getByTestId("sessions").textContent).toContain("s2"),
    );

    expect(builder.eq).toHaveBeenCalledWith("date", "2026-02-15");
    expect(builder.eq).toHaveBeenCalledWith("period", "afternoon");
  });
});
