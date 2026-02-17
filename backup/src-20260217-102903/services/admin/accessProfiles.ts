import type {
  AccessProfile,
  AccessProfilePermission,
  Permission,
  UserRole,
} from "@/types/database.types";
import { supabase } from "../supabase";

export type AccessProfileWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  role: UserRole;
  icon: string;
  isActive: boolean;
  permissions: string[];
  permissionIds: string[];
};

export type PermissionOption = {
  id: string;
  name: string;
  description: string | null;
};

export async function fetchAccessProfiles(): Promise<{
  data: AccessProfileWithPermissions[];
  permissions: PermissionOption[];
  error: string | null;
}> {
  const { data: profiles, error: profilesError } = await supabase
    .from<AccessProfile>("access_profiles")
    .select("*")
    .order("name", { ascending: true });

  if (profilesError) {
    return { data: [], permissions: [], error: profilesError.message };
  }

  const { data: permissions, error: permissionsError } = await supabase
    .from<Permission>("permissions")
    .select("*")
    .order("name", { ascending: true });

  if (permissionsError) {
    return { data: [], permissions: [], error: permissionsError.message };
  }

  const { data: mappings, error: mappingsError } = await supabase
    .from<AccessProfilePermission>("access_profile_permissions")
    .select("access_profile_id, permission_id");

  if (mappingsError) {
    return { data: [], permissions: [], error: mappingsError.message };
  }

  const permissionById = new Map(
    (permissions ?? []).map((permission) => [permission.id, permission]),
  );

  const permissionIdsByProfile = new Map<string, string[]>();
  (mappings ?? []).forEach((mapping) => {
    const list = permissionIdsByProfile.get(mapping.access_profile_id) ?? [];
    list.push(mapping.permission_id);
    permissionIdsByProfile.set(mapping.access_profile_id, list);
  });

  const profileWithPermissions = (profiles ?? []).map((profile) => {
    const permissionIds = permissionIdsByProfile.get(profile.id) ?? [];
    const permissionNames = permissionIds
      .map((id) => permissionById.get(id)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      role: profile.role,
      icon: profile.icon,
      isActive: profile.is_active,
      permissions: permissionNames,
      permissionIds,
    };
  });

  return {
    data: profileWithPermissions,
    permissions: (permissions ?? []).map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
    })),
    error: null,
  };
}

export async function toggleAccessProfilePermission(
  profileId: string,
  permissionId: string,
  enabled: boolean,
): Promise<{ error: string | null }> {
  if (enabled) {
    const { error } = await supabase
      .from<AccessProfilePermission>("access_profile_permissions")
      .upsert(
        {
          access_profile_id: profileId,
          permission_id: permissionId,
        },
        { onConflict: "access_profile_id,permission_id" },
      );

    return { error: error?.message ?? null };
  }

  const { error } = await supabase
    .from<AccessProfilePermission>("access_profile_permissions")
    .delete()
    .eq("access_profile_id", profileId)
    .eq("permission_id", permissionId);

  return { error: error?.message ?? null };
}
