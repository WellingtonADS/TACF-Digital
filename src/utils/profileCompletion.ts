import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

type ProfileCompletionFields = Pick<
  Profile,
  "full_name" | "email" | "war_name" | "saram" | "rank" | "sector"
>;

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function isUserProfileComplete(
  profile: Partial<ProfileCompletionFields> | null | undefined,
): boolean {
  if (!profile) return false;

  return (
    normalizeText(profile.full_name).length > 0 &&
    normalizeText(profile.email).length > 0 &&
    normalizeText(profile.war_name).length > 0 &&
    normalizeDigits(profile.saram).length === 7 &&
    normalizeText(profile.rank).length > 0 &&
    normalizeText(profile.sector).length > 0
  );
}

export function buildProfileDraftFromUser(
  user: User,
  profile: Profile | null | undefined,
): Profile {
  if (profile) return profile;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;

  return {
    id: user.id,
    full_name: metadataName?.trim() || null,
    email: user.email ?? null,
    role: "user",
    active: true,
    saram: null,
    rank: null,
    semester: null,
    phone_number: null,
    war_name: null,
    sector: null,
    metadata: null,
    created_at: null,
    updated_at: null,
  };
}
