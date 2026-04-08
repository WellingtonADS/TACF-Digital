import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  buildProfileDraftFromUser,
  isUserProfileComplete,
} from "./profileCompletion";

describe("profileCompletion", () => {
  it("builds a draft profile from auth metadata when no DB profile exists", () => {
    const user = {
      id: "user-1",
      email: "militar@fab.mil.br",
      user_metadata: { full_name: "Fulano de Tal" },
    } as User;

    const profile = buildProfileDraftFromUser(user, null);

    expect(profile.full_name).toBe("Fulano de Tal");
    expect(profile.email).toBe("militar@fab.mil.br");
    expect(profile.role).toBe("user");
    expect(isUserProfileComplete(profile)).toBe(false);
  });

  it("detects when the mandatory user profile fields are complete", () => {
    expect(
      isUserProfileComplete({
        full_name: "Fulano de Tal",
        email: "militar@fab.mil.br",
        war_name: "FULANO",
        saram: "1234567",
        rank: "Capitão",
        sector: "HACO",
      }),
    ).toBe(true);
  });
});
