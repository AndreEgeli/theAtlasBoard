import { getCurrentUserId } from "../utils/auth";
import { supabase } from "../lib/supabase";
import type { Tag } from "../types";

export async function getTags() {
  const { data, error } = await supabase.from("tags").select("*").order("name");

  if (error) throw error;
  return data as Tag[];
}

export async function createTag(tag: Omit<Tag, "id">) {
  const user_id = await getCurrentUserId();

  const { data, error } = await supabase
    .from("tags")
    .insert({ ...tag, user_id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) throw error;
}

export async function addTagToTask(taskId: string, tagId: string) {
  const { error } = await supabase
    .from("task_tags")
    .insert({ task_id: taskId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  const { error } = await supabase
    .from("task_tags")
    .delete()
    .match({ task_id: taskId, tag_id: tagId });

  if (error) throw error;
}

// Optional: Get all tags for a specific task
export async function getTaskTags(taskId: string) {
  const { data, error } = await supabase
    .from("task_tags")
    .select(
      `
      tag_id,
      tags (*)
    `
    )
    .eq("task_id", taskId);

  if (error) throw error;
  return data;
}
