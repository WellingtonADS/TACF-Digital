import supabase from "@/services/supabase";
import type { Json, NotificationLevel, UserNotification } from "@/types";

export type PendingRevalidationNotificationContext = {
  unit: string;
  expiration: string;
  priority: "ALTA" | "MEDIA" | "BAIXA";
  status: "Expirado" | "Pendente" | "Agendado";
  identity: string;
};

type SendPendingRevalidationArgs = {
  userId: string;
  title: string;
  message: string;
  level?: NotificationLevel;
  context: PendingRevalidationNotificationContext;
};

export async function sendPendingRevalidationNotification({
  userId,
  title,
  message,
  level = "warning",
  context,
}: SendPendingRevalidationArgs): Promise<string> {
  const { data, error } = await supabase.rpc(
    "send_pending_revalidation_notification",
    {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_level: level,
      p_context: context as Json,
    },
  );

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success || !row.notification_id) {
    throw new Error("Nao foi possivel enviar a notificacao.");
  }

  return row.notification_id;
}

export async function fetchUserNotifications(): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as UserNotification[];
}

export async function markUserNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
}
