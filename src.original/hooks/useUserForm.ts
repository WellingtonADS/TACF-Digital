import { useAuth } from "@/contexts/AuthContext";
import { createProfile, deleteProfile, updateProfile } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import { useCallback, useEffect, useState } from "react";

type UseUserFormProps = {
  profile?: Profile | null;
};

export default function useUserForm({ profile }: UseUserFormProps) {
  const { profile: currentProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        rank: profile.rank,
        semester: profile.semester,
        email: profile.email ?? "",
        role: profile.role,
        active: profile.active ?? true,
      });
    } else {
      setFormData({
        full_name: "",
        rank: "",
        semester: "1",
        email: "",
        role: "user",
        active: true,
      });
    }
  }, [profile]);

  const handleSubmit = useCallback(
    async (onSaved: (p: Profile) => void, onClose: () => void) => {
      setLoading(true);
      try {
        const payload = {
          full_name: formData.full_name || "",
          rank: formData.rank || "",
          semester: (formData.semester as string) || "1",
          email: formData.email || null,
          role: (formData.role as Profile["role"]) || "user",
          active: formData.active ?? true,
        } as unknown as Profile;

        let res;
        if (profile) {
          res = await updateProfile(profile.id, payload as Partial<Profile>);
        } else {
          res = await createProfile(payload as Profile);
        }

        if (res?.error) {
          return { error: res.error };
        }

        if (res?.data) {
          onSaved(res.data as Profile);
          onClose();
          return { data: res.data as Profile };
        }

        return { error: "Unknown error" };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      } finally {
        setLoading(false);
      }
    },
    [formData, profile],
  );

  const handleDelete = useCallback(
    async (onClose: () => void) => {
      if (!profile) return { error: "No profile" };
      setDeleting(true);
      try {
        const res = await deleteProfile(profile.id);
        if (res?.error) return { error: res.error };
        onClose();
        return { success: true };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      } finally {
        setDeleting(false);
      }
    },
    [profile],
  );

  return {
    formData,
    setFormData,
    loading,
    deleting,
    currentProfile: currentProfile ?? null,
    handleSubmit,
    handleDelete,
  } as const;
}
