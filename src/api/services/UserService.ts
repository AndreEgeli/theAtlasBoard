import { supabase } from "@/lib/supabase";

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

    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      data: {
        name,
        avatar_url: avatarUrl,
      },
    });

    if (error) throw error;
    return user;
  }

  async checkUserOrganizations(userId: string) {
    const { data: orgMemberships, error } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1);

    if (error) throw error;
    return orgMemberships && orgMemberships.length > 0;
  }
}
