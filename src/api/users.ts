import { supabase } from "../lib/supabase";
import type { User } from "../types";

export async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as User[];
}

export async function createUser(
  name: string,
  authId: string,
  avatarFile?: File
) {
  let avatarUrl: string | undefined;

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

  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_id: authId,
      name,
      avatar: avatarUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(id: string) {
  // First get the user to check if they have an avatar
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("avatar")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // If user has an avatar, delete it from storage
  if (user?.avatar) {
    const avatarPath = user.avatar.split("/").pop();
    if (avatarPath) {
      const { error: deleteStorageError } = await supabase.storage
        .from("user-avatars")
        .remove([`avatars/${avatarPath}`]);

      if (deleteStorageError) throw deleteStorageError;
    }
  }

  // Delete the user
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) throw error;
}

export async function updateUserAvatar(id: string, avatarFile: File) {
  // First get the current user to check if they have an existing avatar
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("avatar")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Delete old avatar if it exists
  if (user?.avatar) {
    const oldAvatarPath = user.avatar.split("/").pop();
    if (oldAvatarPath) {
      await supabase.storage
        .from("user-avatars")
        .remove([`avatars/${oldAvatarPath}`]);
    }
  }

  // Upload new avatar
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

  // Update user with new avatar URL
  const { data, error } = await supabase
    .from("users")
    .update({ avatar: publicUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
