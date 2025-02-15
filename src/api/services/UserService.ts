import { supabase } from "@/lib/supabase";
import { User } from "@/types/index";

export class UserService {
  async updateProfile({
    name,
    avatarFile,
  }: {
    name?: string;
    avatarFile?: File;
  }) {
    let avatarUrl = undefined;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("user-avatars").getPublicUrl(filePath);

      avatarUrl = publicUrl;
    }

    // First update auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.updateUser({
      data: {
        name,
        avatar_url: avatarUrl,
      },
    });

    if (authError) throw authError;

    // Then update our users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .update({
        name,
        avatar_url: avatarUrl,
      })
      .eq("id", authUser?.id)
      .select()
      .single();

    if (userError) throw userError;
    return user;
  }

  async checkUserOrganizations(userId: string | undefined) {
    if (!userId) return false;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("active_organization_id")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    if (user?.active_organization_id) {
      return true;
    }

    // If no active org, check if user has any org memberships
    const { data: orgMemberships, error: orgError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1);

    if (orgError) throw orgError;
    return orgMemberships && orgMemberships.length > 0;
  }

  async getCurrentUser() {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) return null;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        *,
        active_organization:organizations!active_organization_id (
          id,
          name
        )
      `
      )
      .eq("id", authUser?.id)
      .single();

    if (userError) throw userError;
    return user;
  }

  async setActiveOrganization(userId: string, organizationId: string | null) {
    const { data: user, error } = await supabase
      .from("users")
      .update({ active_organization_id: organizationId })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return user;
  }
}
