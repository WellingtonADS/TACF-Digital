import supabase from "@/services/supabase";

export type UserNotificationRow = {
  id: string;
  recipient_user_id: string;
  sender_user_id: string | null;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

type PendingRevalidationNotificationInput = {
  targetUserId: string;
  targetName: string;
  targetEmail: string | null;
  priority: "ALTA" | "MEDIA" | "BAIXA";
  expiration: string;
  unit: string;
  actorUserId: string | null;
  actorName: string;
};

export async function notifyPendingRevalidation(
  input: PendingRevalidationNotificationInput,
) {
  const details = [
    `destinatario=${input.targetName}`,
    `email=${input.targetEmail ?? "sem_email"}`,
    `user_id=${input.targetUserId}`,
    `prioridade=${input.priority}`,
    `validade=${input.expiration}`,
    `unidade=${input.unit}`,
  ].join(" | ");

  const { error: notificationError } = await supabase
    .from("user_notifications")
    .insert({
      recipient_user_id: input.targetUserId,
      sender_user_id: input.actorUserId,
      type: "revalidacao_pendente",
      title: "Revalidação pendente",
      message: `Sua revalidação está pendente (prioridade ${input.priority}). Validade: ${input.expiration}.`,
      metadata: {
        priority: input.priority,
        expiration: input.expiration,
        unit: input.unit,
      },
      is_read: false,
    });

  if (notificationError) throw notificationError;

  const { error: auditError } = await supabase.rpc("log_audit_event", {
    p_action: "notificacao_revalidacao_pendente",
    p_entity: "profiles",
    p_details: `${details} | ator=${input.actorName}`,
  });

  // Auditoria continua best-effort para nao bloquear notificacao in-app.
  if (auditError) {
    console.warn("Falha ao registrar auditoria via RPC log_audit_event", {
      code: auditError.code,
      message: auditError.message,
    });
  }
}

export async function fetchUserNotifications(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "id, recipient_user_id, sender_user_id, type, title, message, metadata, is_read, read_at, created_at",
    )
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as UserNotificationRow[];
}

export async function markUserNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("recipient_user_id", userId);

  if (error) throw error;
}
