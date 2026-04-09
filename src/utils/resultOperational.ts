import { getBookingStatusLabel } from "@/utils/booking";
import { isAfter, parseISO } from "date-fns";

type BookingStatusValue = "agendado" | "remarcado" | "cancelado" | null;

type ResultOperationalSource = {
  booking_status?: string | null;
  booking_metadata?: unknown;
  attendance_confirmed?: boolean | null;
  test_date?: string | null;
};

export function getResultBookingStatus(
  result: ResultOperationalSource,
): BookingStatusValue {
  const status = result.booking_status;
  return status === "agendado" ||
    status === "remarcado" ||
    status === "cancelado"
    ? status
    : null;
}

export function getResultBookingMetadata(
  result: ResultOperationalSource,
): Record<string, unknown> | null {
  const candidate = result.booking_metadata;
  return candidate && typeof candidate === "object"
    ? (candidate as Record<string, unknown>)
    : null;
}

export function getMilitaryBookingStatusLabel(
  result: ResultOperationalSource,
): string {
  const status = getResultBookingStatus(result);
  const metadata = getResultBookingMetadata(result);

  if (
    status === "cancelado" &&
    metadata?.cancellation_source === "admin"
  ) {
    return "Cancelado pela coordenação";
  }

  return getBookingStatusLabel(status);
}

export function getMilitaryBookingStatusTone(
  result: ResultOperationalSource,
): string {
  const status = getResultBookingStatus(result);
  const metadata = getResultBookingMetadata(result);

  if (status === "agendado") {
    return "border-success/30 bg-success/10 text-success";
  }

  if (status === "remarcado") {
    return "border-alert/30 bg-alert/10 text-alert";
  }

  if (
    status === "cancelado" &&
    metadata?.cancellation_source === "admin"
  ) {
    return "border-error/30 bg-error/10 text-error";
  }

  if (status === "cancelado") {
    return "border-border-default bg-bg-default text-text-muted";
  }

  return "border-border-default bg-bg-default text-text-muted";
}

export function getResultAttendanceLabel(
  result: ResultOperationalSource,
): string {
  if (result.attendance_confirmed === true) {
    return "Presença confirmada";
  }

  const bookingStatus = getResultBookingStatus(result);
  const isFuture = result.test_date
    ? isAfter(parseISO(result.test_date), new Date())
    : false;

  if (bookingStatus === "cancelado") {
    return "Presença não aplicável";
  }

  if (bookingStatus === "remarcado") {
    return "Presença do booking histórico";
  }

  if (bookingStatus === "agendado" && isFuture) {
    return "Presença pendente";
  }

  if (bookingStatus === "agendado") {
    return "Presença não confirmada";
  }

  return "Presença não informada";
}

export function getResultAttendanceTone(
  result: ResultOperationalSource,
): string {
  if (result.attendance_confirmed === true) {
    return "border-success/30 bg-success/10 text-success";
  }

  const bookingStatus = getResultBookingStatus(result);
  const isFuture = result.test_date
    ? isAfter(parseISO(result.test_date), new Date())
    : false;

  if (bookingStatus === "agendado" && isFuture) {
    return "border-primary/30 bg-primary/10 text-primary";
  }

  if (bookingStatus === "cancelado" || bookingStatus === "remarcado") {
    return "border-border-default bg-bg-default text-text-muted";
  }

  return "border-alert/30 bg-alert/10 text-alert";
}
