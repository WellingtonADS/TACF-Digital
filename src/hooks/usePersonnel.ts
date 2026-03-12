/**
 * @module Domínio
 * @page usePersonnel
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\usePersonnel.ts
 */


import supabase from "@/services/supabase";
import type { Profile } from "@/types";

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(id: string, payload: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
  return true;
}

// Named exports are defined above.
