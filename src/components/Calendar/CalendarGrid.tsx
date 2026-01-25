import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useBooking } from "@/hooks/useBooking";
import { fetchSessionsByMonth } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import { isDateInAllowedWindow } from "@/utils/seasonal";
import toastUi from "@/utils/toast";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import CalendarDay from "./CalendarDay";

export default function CalendarGrid({
  onBookingSuccess,
  isAdmin,
  onDayClick,
  refreshKey,
  initialDate,
}: {
  onBookingSuccess?: () => void;
  isAdmin?: boolean;
  onDayClick?: (date: Date) => void;
  refreshKey?: number;
  initialDate?: Date;
}) {
  const [current, setCurrent] = useState<Date>(initialDate ?? new Date());
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmingSessionId, setConfirmingSessionId] = useState<string | null>(
    null,
  );
  // track optimistic pending reservations (sessionId -> true)
  const [pendingReservations, setPendingReservations] = useState<
    Record<string, boolean>
  >({});

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const res = await fetchSessionsByMonth(year, month);
    if (res.error) setSessions([]);
    else setSessions(res.data ?? []);
    setLoading(false);
  }, [current]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchSessions();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchSessions, refreshKey]);

  const { confirm } = useBooking();

  const days = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    return eachDayOfInterval({ start, end });
  }, [current]);

  function sessionsForDay(d: Date) {
    const key = format(d, "yyyy-LL-dd");
    return sessions.filter((s) => s.date === key);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrent(subMonths(current, 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrent(addMonths(current, 1))}
          >
            Próximo
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {format(current, "MMMM yyyy")}
        </div>
      </div>

      {loading && (
        <div className="mb-2 text-sm text-slate-500">Carregando...</div>
      )}

      <div className="grid grid-cols-7 gap-2 text-center text-sm text-slate-600 mb-2">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`${isSameMonth(d, current) ? "" : "opacity-40"}`}
          >
            <CalendarDay
              date={d}
              sessions={sessionsForDay(d)}
              isAdmin={isAdmin}
              onSelect={(date) => {
                if (isAdmin && onDayClick) onDayClick(date);
                else setSelectedDate(date);
              }}
            />
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDate
            ? `Agendamento para ${format(selectedDate, "dd/LL/yyyy")}`
            : ""
        }
      >
        {selectedDate && (
          <div className="flex flex-col gap-3">
            {sessionsForDay(selectedDate).map((s) => {
              const booked =
                (s.booking_count ?? s.bookings?.length ?? 0) +
                (pendingReservations[s.id] ? 1 : 0);
              const isFull = booked >= (s.max_capacity ?? 0);
              return (
                <div key={s.id} className="flex items-center justify-between">
                  <div>{s.period === "morning" ? "Manhã" : "Tarde"}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-[#1B365D]">
                      {booked}/{s.max_capacity}
                    </div>

                    <Button
                      variant="primary"
                      disabled={confirmingSessionId !== null || isFull}
                      isLoading={confirmingSessionId === s.id}
                      onClick={async () => {
                        // season validation: prevent booking outside allowed windows
                        const sessionDate = new Date(`${s.date}T00:00:00`);
                        if (!isDateInAllowedWindow(sessionDate)) {
                          toastUi.seasonalInvalid();
                          return;
                        }

                        // optimistic UI: mark pending and increment displayed count
                        setPendingReservations((prev) => ({
                          ...prev,
                          [s.id]: true,
                        }));
                        setConfirmingSessionId(s.id);

                        const result = await confirm(s.id, async () => {
                          await fetchSessions();
                          setSelectedDate(null);
                        });

                        setConfirmingSessionId(null);

                        if (result.success) {
                          // backend generates the order number; if available, pass it to the toast
                          const orderNumber = (result.data &&
                            (result.data as any)["order_number"]) as
                            | string
                            | undefined;
                          toastUi.bookingConfirmed(orderNumber);
                          // fetch the full booking for receipt generation
                          const { data: bookingData } = await (
                            await import("@/services/api")
                          ).getUserBooking();
                          if (bookingData) {
                            try {
                              const { generateReceipt } =
                                await import("@/utils/receipt/generateReceipt");
                              await generateReceipt({
                                booking_id: (bookingData as any).id,
                                saram:
                                  (bookingData as any).profiles?.saram ?? "",
                                full_name:
                                  (bookingData as any).profiles?.full_name ??
                                  "",
                                rank: (bookingData as any).profiles?.rank ?? "",
                                date: (bookingData as any).sessions?.date ?? "",
                                period:
                                  (bookingData as any).sessions?.period ===
                                  "morning"
                                    ? "Manhã"
                                    : "Tarde",
                              });
                              toast.success("Comprovante gerado para download");
                            } catch (err) {
                              console.error("Receipt generation failed", err);
                              toast.error("Erro ao gerar comprovante");
                            }
                          }

                          onBookingSuccess?.();
                        } else {
                          // revert optimistic change on error
                          setPendingReservations((prev) => {
                            const copy = { ...prev };
                            delete copy[s.id];
                            return copy;
                          });

                          if (result.error?.includes("session full")) {
                            toastUi.sessionFull();
                            // refresh counts
                            await fetchSessions();
                          } else {
                            toastUi.genericError(
                              result.error ?? "Erro ao agendar",
                            );
                          }
                        }
                      }}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            })}
            {sessionsForDay(selectedDate).length === 0 && (
              <div>Não há sessões neste dia.</div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
