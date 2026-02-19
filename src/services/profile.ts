import type { Database } from "@/types/database.types";
import { upsertProfile as upsertProfileRpc } from "./supabase";

type ProfilePayload = Partial<Database["public"]["Tables"]["profiles"]["Row"]>;

export async function upsertProfile(profile: ProfilePayload) {
  return upsertProfileRpc(profile);
}

export default { upsertProfile };
