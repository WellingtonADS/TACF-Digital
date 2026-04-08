import supabase from "./supabase";

export type BookingEmailType =
  | "booking_confirmation"
  | "booking_reminder";

type DispatchBookingEmailsParams = {
  bookingId: string;
  notificationTypes?: BookingEmailType[];
  limit?: number;
};

export async function dispatchBookingEmails({
  bookingId,
  notificationTypes,
  limit,
}: DispatchBookingEmailsParams): Promise<void> {
  const { error } = await supabase.functions.invoke(
    "booking-email-dispatch",
    {
      body: {
        bookingId,
        notificationTypes,
        limit,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Falha ao disparar e-mail do agendamento.");
  }
}

export async function dispatchBookingConfirmationEmail(
  bookingId: string,
): Promise<void> {
  await dispatchBookingEmails({
    bookingId,
    notificationTypes: ["booking_confirmation"],
    limit: 1,
  });
}
