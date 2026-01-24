import Button from "@/components/ui/Button";
import type { SessionWithBookings } from "@/types/database.types";

export interface CalendarDayProps {
  date: Date;
  sessions: SessionWithBookings[];
  onSelect?: (date: Date) => void;
  isAdmin?: boolean;
}

export default function CalendarDay({
  date,
  sessions,
  onSelect,
  isAdmin,
}: CalendarDayProps) {
  const day = date.getDate();

  return (
    <div className="border rounded-md p-2 min-h-[72px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-slate-700">{day}</div>
        {sessions.length === 0 && (
          <div className="text-xs text-slate-400">—</div>
        )}
      </div>

      <div className="mt-2 flex gap-2 flex-wrap">
        {sessions.map((s) => {
          const booked = s.booking_count ?? s.bookings?.length ?? 0;
          const label = s.period === "morning" ? "Manhã" : "Tarde";
          return (
            <span
              key={s.id}
              className={`text-xs px-2 py-1 rounded-full bg-[#1B365D] text-white`}
            >
              {label} ({booked}/{s.max_capacity})
            </span>
          );
        })}
      </div>

      <div className="mt-2">
        {isAdmin ? (
          <Button variant="outline" onClick={() => onSelect?.(date)}>
            Editar
          </Button>
        ) : sessions.length > 0 ? (
          <Button variant="outline" onClick={() => onSelect?.(date)}>
            Agendar
          </Button>
        ) : (
          <div className="text-xs text-slate-400">Sem sessão</div>
        )}
      </div>
    </div>
  );
}
