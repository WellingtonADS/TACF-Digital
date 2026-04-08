import AppIcon from "@/components/atomic/AppIcon";
import { ChevronLeft, ChevronRight } from "@/icons";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export type CalendarDayTone = "default" | "available" | "booked" | "muted";

export type CalendarDayState = {
  disabled?: boolean;
  tone?: CalendarDayTone;
  dotTone?: "success" | "error";
};

export type CalendarDayContext = {
  isCurrentMonth: boolean;
  dateKey: string;
};

type CustomCalendarProps = {
  viewDate: Date;
  onViewDateChange: (nextDate: Date) => void;
  selectedDateKey?: string | null;
  /** Extra dates to highlight as "in range" (lighter primary). Does not include selectedDateKey. */
  selectedDateKeys?: string[];
  onSelectDate?: (dateKey: string, date: Date) => void;
  resolveDayState?: (
    date: Date,
    context: CalendarDayContext,
  ) => CalendarDayState;
  weekStartsOn?: 0 | 1;
  size?: "regular" | "compact";
  className?: string;
  showLegend?: boolean;
};

function toCalendarDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toneClasses(tone: CalendarDayTone): string {
  switch (tone) {
    case "available":
      return "text-text-body bg-border-default/20 hover:bg-border-default/40";
    case "booked":
      return "text-error bg-error/15";
    case "muted":
      return "text-text-muted/50 bg-transparent";
    case "default":
    default:
      return "text-text-body bg-bg-default hover:bg-border-default/30";
  }
}

export default function CustomCalendar({
  viewDate,
  onViewDateChange,
  selectedDateKey,
  selectedDateKeys,
  onSelectDate,
  resolveDayState,
  weekStartsOn = 1,
  size = "regular",
  className = "",
  showLegend = true,
}: CustomCalendarProps) {
  const weekdays = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(weekStart, index), "EEE", { locale: ptBR })
        .slice(0, 3)
        .replace(".", "")
        .toUpperCase(),
    );
  }, [weekStartsOn]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn }),
      end: endOfWeek(monthEnd, { weekStartsOn }),
    });
  }, [viewDate, weekStartsOn]);

  const calendarEntries = useMemo(() => {
    return calendarDays.map((date) => {
      const dateKey = toCalendarDateKey(date);
      const isCurrentMonth = isSameMonth(date, viewDate);
      const dayState = resolveDayState?.(date, {
        isCurrentMonth,
        dateKey,
      }) ?? {
        disabled: !isCurrentMonth,
        tone: isCurrentMonth ? "default" : "muted",
      };

      return {
        date,
        dateKey,
        isCurrentMonth,
        dayState,
      };
    });
  }, [calendarDays, resolveDayState, viewDate]);

  const hasAvailableLegend = useMemo(
    () => calendarEntries.some((entry) => entry.dayState.dotTone === "success"),
    [calendarEntries],
  );

  const hasBookedLegend = useMemo(
    () =>
      calendarEntries.some(
        (entry) =>
          entry.dayState.dotTone === "error" ||
          entry.dayState.tone === "booked",
      ),
    [calendarEntries],
  );

  const hasMutedLegend = useMemo(
    () => calendarEntries.some((entry) => entry.dayState.tone === "muted"),
    [calendarEntries],
  );

  const rangeSet = useMemo(
    () => new Set(selectedDateKeys ?? []),
    [selectedDateKeys],
  );
  const hasRangeLegend = (selectedDateKeys?.length ?? 0) > 0;

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDateChange(addMonths(viewDate, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition-colors hover:bg-bg-default sm:h-9 sm:w-9"
          aria-label="Mês anterior"
        >
          <AppIcon icon={ChevronLeft} size="sm" decorative />
        </button>

        <p className="text-xs font-semibold capitalize text-text-body sm:text-sm md:text-base">
          {format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>

        <button
          type="button"
          onClick={() => onViewDateChange(addMonths(viewDate, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition-colors hover:bg-bg-default sm:h-9 sm:w-9"
          aria-label="Próximo mês"
        >
          <AppIcon icon={ChevronRight} size="sm" decorative />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5">
        {weekdays.map((day) => (
          <div
            key={day}
            className="py-1.5 text-[10px] font-bold uppercase text-text-muted sm:py-2 sm:text-[11px]"
          >
            {day}
          </div>
        ))}

        {calendarEntries.map(({ date, dateKey, dayState }) => {
          const isSelected = selectedDateKey === dateKey;
          const isInRange = !isSelected && rangeSet.has(dateKey);
          const disabled = dayState.disabled ?? false;
          const baseSize =
            size === "compact"
              ? "h-8 rounded-md text-[11px] sm:h-9 sm:text-xs md:h-10"
              : "h-9 rounded-lg text-xs sm:h-11 sm:rounded-xl sm:text-sm md:h-12";

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate?.(dateKey, date)}
              disabled={disabled}
              className={`relative flex items-center justify-center font-medium transition-all ${baseSize} ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25"
                  : isInRange
                    ? "bg-primary/15 font-semibold text-primary"
                    : toneClasses(dayState.tone ?? "default")
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {format(date, "d")}
              {!isSelected && dayState.dotTone === "success" && (
                <span className="absolute bottom-1 h-2 w-2 rounded-full bg-success sm:bottom-1.5 sm:h-2.5 sm:w-2.5" />
              )}
              {!isSelected && dayState.dotTone === "error" && (
                <span className="absolute bottom-1 h-2 w-2 rounded-full bg-error sm:bottom-1.5 sm:h-2.5 sm:w-2.5" />
              )}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border-default pt-3 text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Selecionado
          </span>
          {hasRangeLegend && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
              No período
            </span>
          )}
          {hasAvailableLegend && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Disponível
            </span>
          )}
          {hasBookedLegend && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-error" />
              Indisponível
            </span>
          )}
          {hasMutedLegend && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-border-default bg-transparent" />
              Bloqueado
            </span>
          )}
        </div>
      )}
    </div>
  );
}
