/**
 * @module systemSettings
 * @description Acesso centralizado às configurações do sistema e logs de auditoria.
 * @path src/services/systemSettings.ts
 */

import supabase from "@/services/supabase";
import type { AuditLogRow, SystemSettingsRow } from "@/types";

export async function fetchSystemSettings(): Promise<SystemSettingsRow | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data as SystemSettingsRow;
}

export async function saveSystemSettings(
  id: string,
  payload: Partial<SystemSettingsRow>,
): Promise<SystemSettingsRow | null> {
  const { error } = await supabase
    .from("system_settings")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
  return fetchSystemSettings();
}

export async function fetchAuditLogs(): Promise<AuditLogRow[]> {
  const { data, error } = await supabase.rpc("get_audit_logs");
  if (error) throw error;
  return (data as AuditLogRow[] | null) ?? [];
}

export async function fetchFullAuditLog(limit = 500): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as AuditLogRow[] | null) ?? [];
}
