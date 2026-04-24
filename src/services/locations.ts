/**
 * @module locations
 * @description Acesso a dados de locais e grade de horários.
 * @path src/services/locations.ts
 */

import type { Database, LocationSchedule } from "@/types/database.types";
import supabase from "./supabase";

export type SessionLocationInfo = {
  name: string | null;
  address: string | null;
};

export async function fetchSessionLocationBySessionId(
  sessionId: string,
): Promise<SessionLocationInfo | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("location:locations(name, address)")
    .eq("id", sessionId)
    .single();

  if (error) throw error;

  const locationRaw = data?.location as
    | { name?: string | null; address?: string | null }
    | { name?: string | null; address?: string | null }[]
    | null;

  const location = Array.isArray(locationRaw) ? locationRaw[0] : locationRaw;

  return {
    name: location?.name ?? null,
    address: location?.address ?? null,
  };
}

export async function fetchLocationSchedules(
  locationId: string,
): Promise<LocationSchedule[]> {
  const { data, error } = await supabase
    .from("location_schedules")
    .select("*")
    .eq("location_id", locationId);

  if (error) throw error;
  return (data ?? []) as LocationSchedule[];
}

export async function upsertLocationSchedules(
  rows: Database["public"]["Tables"]["location_schedules"]["Insert"][],
): Promise<void> {
  const { error } = await supabase
    .from("location_schedules")
    .upsert(rows, { onConflict: "location_id,day_of_week,period" });

  if (error) throw error;
}
