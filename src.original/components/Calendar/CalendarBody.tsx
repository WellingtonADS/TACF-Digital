import type { SessionWithBookings } from "@/types/database.types";
import { format, isSameMonth } from "date-fns";
import CalendarDay from "./CalendarDay";

export default function CalendarBody({
  days,
  current,
  displayedSessions,
  isAdmin,
  onSelect,
}: {
  days: Date[];
  current: Date;
  displayedSessions: SessionWithBookings[];
  isAdmin?: boolean;
  onSelect: (date: Date) => void;
}) {
  function sessionsForDay(d: Date) {
    const key = format(d, "yyyy-LL-dd");
    return displayedSessions.filter((s) => s.date === key);
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}

        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={
              !isSameMonth(d, current) ? "opacity-30 pointer-events-none" : ""
            }
          >
            <CalendarDay
              date={d}
              sessions={sessionsForDay(d)}
              isAdmin={isAdmin}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </>
  );
}
