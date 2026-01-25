import { Badge } from "@/components/ui";
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
          const available = Math.max(0, (s.max_capacity ?? 0) - booked);
          const label = s.period === "morning" ? "Manhã" : "Tarde";
          const variant =
            available === 0 ? "error" : available <= 3 ? "alert" : "default";
          return (
            <Badge key={s.id} variant={variant} className="mr-1">
              {label} ({booked}/{s.max_capacity})
            </Badge>
          );
        })}
      </div>

      <div className="mt-2">
        {isAdmin ? (
          <Button variant="ghost" onClick={() => onSelect?.(date)}>
            Editar
          </Button>
        ) : sessions.length > 0 ? (
          (() => {
            const anyAvailable = sessions.some((s) => {
              const booked = s.booking_count ?? s.bookings?.length ?? 0;
              return (s.max_capacity ?? 0) - booked > 0;
            });
            return (
              <Button
                variant="primary"
                onClick={() => onSelect?.(date)}
                disabled={!anyAvailable}
              >
                Agendar
              </Button>
            );
          })()
        ) : (
          <div className="text-xs text-slate-400">Sem sessão</div>
        )}
      </div>
    </div>
  );
}
