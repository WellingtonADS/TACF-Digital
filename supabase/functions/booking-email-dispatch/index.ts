import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (
    handler: (request: Request) => Response | Promise<Response>,
  ) => void;
};

type NotificationType = "booking_confirmation" | "booking_reminder";

type QueueRow = {
  notification_id: string;
  booking_id: string;
  recipient_user_id: string;
  recipient_email: string;
  notification_type: NotificationType;
  scheduled_for: string;
  payload: {
    recipient_name?: string | null;
    session_date?: string | null;
    session_period?: string | null;
    location_name?: string | null;
    location_address?: string | null;
    order_number?: string | null;
  } | null;
};

type DispatchBody = {
  bookingId?: string;
  notificationTypes?: NotificationType[];
  limit?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const senderEmail = Deno.env.get("BOOKING_EMAIL_FROM");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const formatDatePtBr = (value?: string | null) => {
  if (!value) return "data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Manaus",
    dateStyle: "full",
  }).format(new Date(`${value}T12:00:00-04:00`));
};

const formatPeriod = (value?: string | null) => {
  if (value === "manha") return "Manhã";
  if (value === "tarde") return "Tarde";
  return value || "Horário não informado";
};

const buildMessage = (row: QueueRow) => {
  const payload = row.payload ?? {};
  const recipientName = payload.recipient_name || "Militar";
  const sessionDate = formatDatePtBr(payload.session_date);
  const sessionPeriod = formatPeriod(payload.session_period);
  const locationName = payload.location_name || "Local não informado";
  const locationAddress = payload.location_address
    ? `\nEndereço: ${payload.location_address}`
    : "";
  const orderNumber = payload.order_number
    ? `\nBilhete: ${payload.order_number}`
    : "";

  if (row.notification_type === "booking_reminder") {
    return {
      subject: "Lembrete do seu agendamento TACF",
      text: [
        `Prezado(a) ${recipientName},`,
        "",
        "Este é um lembrete do seu agendamento TACF para amanhã.",
        `Data: ${sessionDate}`,
        `Turno: ${sessionPeriod}`,
        `Local: ${locationName}${locationAddress}`,
        orderNumber.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    subject: "Confirmação do seu agendamento TACF",
    text: [
      `Prezado(a) ${recipientName},`,
      "",
      "Seu agendamento TACF foi confirmado com sucesso.",
      `Data: ${sessionDate}`,
      `Turno: ${sessionPeriod}`,
      `Local: ${locationName}${locationAddress}`,
      orderNumber.trim(),
      "",
      "Você também receberá um lembrete no dia anterior à sessão.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
};

const sendEmail = async (row: QueueRow) => {
  if (!resendApiKey || !senderEmail) {
    throw new Error(
      "RESEND_API_KEY e BOOKING_EMAIL_FROM precisam estar configurados.",
    );
  }

  const message = buildMessage(row);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderEmail,
      to: [row.recipient_email],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend ${response.status}: ${details}`);
  }

  const result = (await response.json()) as { id?: string };
  return result.id ?? null;
};

const markNotification = async (
  notificationId: string,
  input: {
    status: "pending" | "sent" | "failed";
    providerMessageId?: string | null;
    lastError?: string | null;
    incrementRetry?: boolean;
  },
) => {
  if (input.incrementRetry) {
    const { data, error: fetchError } = await supabase
      .from("booking_email_notifications")
      .select("retry_count")
      .eq("id", notificationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const nextRetryCount = (data?.retry_count ?? 0) + 1;

    const { error: retryError } = await supabase
      .from("booking_email_notifications")
      .update({
        provider_message_id: input.providerMessageId ?? null,
        last_error: input.lastError ?? null,
        sent_at: null,
        retry_count: nextRetryCount,
        status: nextRetryCount >= 5 ? "failed" : input.status,
      })
      .eq("id", notificationId);

    if (retryError) {
      throw retryError;
    }

    return;
  }

  const { error } = await supabase
    .from("booking_email_notifications")
    .update({
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      last_error: input.lastError ?? null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = ((await request.json().catch(() => ({}))) ??
      {}) as DispatchBody;
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

    const { data, error } = await supabase.rpc(
      "claim_booking_email_notifications",
      {
        p_limit: limit,
        p_booking_id: body.bookingId ?? null,
        p_types: body.notificationTypes ?? null,
      },
    );

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as QueueRow[];

    for (const row of rows) {
      try {
        const providerMessageId = await sendEmail(row);
        await markNotification(row.notification_id, {
          status: "sent",
          providerMessageId,
        });
      } catch (error) {
        await markNotification(row.notification_id, {
          status: "pending",
          lastError: error instanceof Error ? error.message : String(error),
          incrementRetry: true,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: rows.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro inesperado.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
