import { upsertProfile as upsertProfileRpc } from "./supabase";

export async function upsertProfile(profile: Record<string, any>) {
  return upsertProfileRpc(profile as any);
}

export default { upsertProfile };
