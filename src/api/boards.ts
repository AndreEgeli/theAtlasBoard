import { supabase } from "../lib/supabase";
import type { Board } from "../types";
import { getCurrentUserId } from "../utils/auth";

export async function getBoards() {
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, created_at")
    .order("created_at");

  if (error) throw error;
  return data;
}

export async function getBoardDetails(boardId: string) {
  const { data, error } = await supabase
    .from("boards")
    .select(
      `
      *,
      tasks (
        *,
        todos (*),
        task_tags (tag_id)
      )
    `
    )
    .eq("id", boardId)
    .single();

  if (error) throw error;
  return {
    ...data,
    tasks: data.tasks.map((task: any) => ({
      ...task,
      tags: task.task_tags.map((tt: any) => tt.tag_id),
    })),
  };
}

export async function createBoard(name: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("boards")
    .insert({ name, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBoard(id: string, updates: Partial<Board>) {
  const { data, error } = await supabase
    .from("boards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(id: string) {
  const { error } = await supabase.from("boards").delete().eq("id", id);

  if (error) throw error;
}
