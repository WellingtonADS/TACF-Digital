import type { Profile } from "@/types";
import { upsertProfile as upsertProfileRpc } from "./supabase";

type ProfilePayload = Partial<Profile>;

export async function upsertProfile(profile: ProfilePayload) {
  return upsertProfileRpc(profile);
}

export default { upsertProfile };


