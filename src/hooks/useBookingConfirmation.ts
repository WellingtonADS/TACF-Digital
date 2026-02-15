import type { SessionWithBookings } from "@/types/database.types";
import { useEffect, useState } from "react";

type UseBookingConfirmationProps = {
  isOpen: boolean;
  date: string | null;
  availableSessions: SessionWithBookings[];
};

export default function useBookingConfirmation({
  isOpen,
  date,
  availableSessions,
}: UseBookingConfirmationProps) {
  const [selectedTaf, setSelectedTaf] = useState<"1" | "2">("1");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "morning" | "afternoon" | null
  >(null);

  useEffect(() => {
    if (!isOpen) return;
    // Schedule reset on next tick to avoid synchronous setState in effect body
    const id = window.setTimeout(() => {
      setSelectedTaf("1");
      // Auto-select the only available period for convenience/tests
      const hasMorning = availableSessions.some((s) => s.period === "morning");
      const hasAfternoon = availableSessions.some(
        (s) => s.period === "afternoon",
      );
      if (hasMorning && !hasAfternoon) setSelectedPeriod("morning");
      else if (!hasMorning && hasAfternoon) setSelectedPeriod("afternoon");
      else setSelectedPeriod(null);
    }, 0);

    return () => window.clearTimeout(id);
  }, [isOpen, date, availableSessions]);

  const hasMorning = availableSessions.some((s) => s.period === "morning");
  const hasAfternoon = availableSessions.some((s) => s.period === "afternoon");

  const getSelectedSession = () => {
    if (!selectedPeriod) return null;
    return availableSessions.find((s) => s.period === selectedPeriod);
  };

  return {
    selectedTaf,
    setSelectedTaf,
    selectedPeriod,
    setSelectedPeriod,
    hasMorning,
    hasAfternoon,
    getSelectedSession,
  };
}
