import AppIcon from "@/components/atomic/AppIcon";
import type { SessionAvailability } from "@/hooks/useSessions";
import { ChevronLeft, ChevronRight } from "@/icons";
import {
  canMilitaryBookDate,
  getMondayFirstWeekdayIndex,
} from "@/utils/date";

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type SessionMonthCalendarProps = {
  viewDate: Date;
  sessionsByDate: Record<string, SessionAvailability[]>;
  bookedDates: Set<string>;
  selectedDate: string | null;
  loading?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
};

export default function SessionMonthCalendar({
  viewDate,
  sessionsByDate,
  bookedDates,
  selectedDate,
  loading = false,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: SessionMonthCalendarProps) {
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  );
  const daysInMonth = endOfMonth.getDate();

  return (
    <>
      <div className="p-4 sm:p-6 border-b border-border-default flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-body">
            Calendário de Testes
          </h3>
          <p className="text-sm text-text-muted">
            {viewDate.toLocaleString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Sessões liberadas de segunda a sexta, com no mínimo 2 dias de
            antecedência.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="calendar-prev-month"
            onClick={onPrevMonth}
            className="p-2 rounded-lg hover:bg-bg-default text-text-muted transition-colors"
          >
            <AppIcon icon={ChevronLeft} size="md" tone="muted" />
          </button>
          <button
            data-testid="calendar-next-month"
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-bg-default text-text-muted transition-colors"
          >
            <AppIcon icon={ChevronRight} size="md" tone="muted" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1 mb-4 text-center">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              data-testid={`calendar-weekday-${day.toLowerCase()}`}
              className="py-2 text-xs font-bold text-text-muted uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: Math.min(daysInMonth, 28) }).map((_, index) => (
              <div
                key={index}
                className="aspect-square bg-bg-default rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {Array.from({
              length: getMondayFirstWeekdayIndex(startOfMonth),
            }).map((_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateObj = new Date(
                viewDate.getFullYear(),
                viewDate.getMonth(),
                day,
              );
              const dateKey = toDateKey(dateObj);
              const hasSessions = (sessionsByDate[dateKey] || []).length > 0;
              const isBooked = bookedDates.has(dateKey);
              const isSelected = selectedDate === dateKey;
              const isPast =
                dateObj < new Date(new Date().setHours(0, 0, 0, 0));
              const isBlockedByRule = !canMilitaryBookDate(dateKey);

              if (isPast || isBlockedByRule) {
                return (
                  <div
                    key={index}
                    data-testid={`calendar-day-${dateKey}`}
                    data-state={isPast ? "past" : "blocked"}
                    className="aspect-square rounded-xl flex items-center justify-center text-text-muted/40 bg-bg-default/40 text-sm"
                  >
                    {day}
                  </div>
                );
              }

              return (
                <button
                  key={index}
                  data-testid={`calendar-day-${dateKey}`}
                  data-state={
                    isSelected
                      ? "selected"
                      : isBooked
                        ? "booked"
                        : hasSessions
                          ? "available"
                          : "empty"
                  }
                  onClick={() => {
                    if (hasSessions && !isBooked) {
                      onSelectDate(dateKey);
                    }
                  }}
                  className={`aspect-square relative rounded-xl flex items-center justify-center font-medium text-sm transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25"
                      : isBooked
                        ? "text-error bg-error/15 cursor-not-allowed"
                        : hasSessions
                          ? "text-text-body bg-border-default/20 hover:bg-border-default/40 cursor-pointer"
                          : "text-text-muted/50 bg-transparent cursor-not-allowed"
                  }`}
                  disabled={!hasSessions || isBooked}
                >
                  {day}
                  {hasSessions && !isBooked && !isSelected && (
                    <span className="absolute bottom-1.5 w-2.5 h-2.5 rounded-full bg-success" />
                  )}
                  {isBooked && (
                    <span className="absolute bottom-1.5 w-2.5 h-2.5 rounded-full bg-error" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
