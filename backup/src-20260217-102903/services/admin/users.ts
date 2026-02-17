import type { Database, Profile } from "@/types/database.types";
import { supabase } from "../supabase";

export async function fetchProfiles(
  includeInactive = false,
): Promise<Profile[] | null> {
  const query = supabase
    .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  const q = includeInactive ? query : query.eq("active", true);

  const { data, error } = await q;
  if (error) return null;
  return (data as Profile[]) ?? null;
}

export async function updateProfile(
  id: string,
  updates: Partial<Profile>,
): Promise<{ data?: Profile; error?: string }> {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["profiles"]["Update"]>("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return { error: error.message };
  return { data: data as Profile };
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function createProfile(
  profile: Partial<Profile>,
): Promise<{ data?: Profile; error?: string }> {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["profiles"]["Insert"]>("profiles")
    .insert(profile)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };
  return { data: data as Profile };
}
