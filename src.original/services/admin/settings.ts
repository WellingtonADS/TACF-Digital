import type { Database, SystemSettings } from "@/types/database.types";
import { supabase } from "../supabase";

export type SystemSettingsPayload = Omit<
  SystemSettings,
  "id" | "created_at" | "updated_at"
>;

const defaultSettings: SystemSettingsPayload = {
  is_global: true,
  system_name: "TACF Digital",
  organization_name: "Forca Aerea Brasileira",
  min_capacity: 8,
  max_capacity: 21,
  default_periods: ["morning", "afternoon"],
  allow_swaps: true,
  require_quorum: true,
};

export async function fetchSystemSettings(): Promise<{
  data: SystemSettingsPayload | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from<
      Database["public"]["Tables"]["system_settings"]["Row"]
    >("system_settings")
    .select("*")
    .eq("is_global", true)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: defaultSettings, error: null };
  }

  return {
    data: {
      is_global: data.is_global,
      system_name: data.system_name,
      organization_name: data.organization_name,
      min_capacity: data.min_capacity,
      max_capacity: data.max_capacity,
      default_periods: data.default_periods,
      allow_swaps: data.allow_swaps,
      require_quorum: data.require_quorum,
    },
    error: null,
  };
}

export async function saveSystemSettings(
  payload: SystemSettingsPayload,
): Promise<{ data: SystemSettingsPayload | null; error: string | null }> {
  const { data, error } = await supabase
    .from<
      Database["public"]["Tables"]["system_settings"]["Insert"]
    >("system_settings")
    .upsert(payload, { onConflict: "is_global" })
    .select()
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "no_data" };
  }

  return {
    data: {
      is_global: data.is_global,
      system_name: data.system_name,
      organization_name: data.organization_name,
      min_capacity: data.min_capacity,
      max_capacity: data.max_capacity,
      default_periods: data.default_periods,
      allow_swaps: data.allow_swaps,
      require_quorum: data.require_quorum,
    },
    error: null,
  };
}
