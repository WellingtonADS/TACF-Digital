import { Badge } from "@/components/ui";
import Button from "@/components/ui/Button";
import type { SessionWithBookings } from "@/types/database.types";
import { cn } from "@/utils/cn";

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
  const hasSessions = sessions.length > 0;

  // Verifica disponibilidade
  const anyAvailable = sessions.some((s) => {
    const booked = s.booking_count ?? s.bookings?.length ?? 0;
    return (s.max_capacity ?? 0) - booked > 0;
  });

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-3 min-h-[110px] rounded-2xl transition-all border",
        hasSessions
          ? "bg-white border-slate-200 hover:border-primary/30 hover:shadow-md"
          : "bg-slate-50/50 border-transparent opacity-80",
      )}
    >
      {/* Cabeçalho do Dia */}
      <div className="flex items-start justify-between mb-2">
        <span
          className={cn(
            "text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full transition-colors",
            hasSessions ? "bg-primary/5 text-primary" : "text-slate-400",
          )}
        >
          {day}
        </span>
      </div>

      {/* Badges de Sessão */}
      <div className="flex flex-col gap-1.5 flex-1">
        {sessions.map((s) => {
          const booked = s.booking_count ?? s.bookings?.length ?? 0;
          const available = Math.max(0, (s.max_capacity ?? 0) - booked);
          const label = s.period === "morning" ? "Manhã" : "Tarde";

          let variant: "default" | "success" | "alert" | "error" = "success";
          if (available === 0) variant = "error";
          else if (available <= 5) variant = "alert";

          return (
            <div key={s.id} className="flex items-center justify-between">
              <Badge
                variant={variant}
                className="w-full justify-between font-medium px-2 py-1 text-[10px]"
              >
                <span>{label}</span>
                <span>
                  {booked}/{s.max_capacity}
                </span>
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Botão de Ação */}
      {hasSessions && (
        <div className="mt-2">
          <Button
            variant={isAdmin ? "ghost" : "primary"}
            size="sm"
            className="w-full h-8 text-xs rounded-lg"
            onClick={() => onSelect?.(date)}
            disabled={!isAdmin && !anyAvailable}
          >
            {isAdmin ? "Editar" : anyAvailable ? "Agendar" : "Lotado"}
          </Button>
        </div>
      )}
    </div>
  );
}
