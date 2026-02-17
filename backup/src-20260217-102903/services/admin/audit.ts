import { supabase } from "../supabase";

export type AuditLogEntry = {
  id: string;
  action: string | null;
  entity: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
  details: string | null;
};

export async function fetchAuditLogs(): Promise<{
  data: AuditLogEntry[];
  error: string | null;
}> {
  const { data, error } = await supabase.rpc<AuditLogEntry[]>("get_audit_logs");

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as AuditLogEntry[], error: null };
}
