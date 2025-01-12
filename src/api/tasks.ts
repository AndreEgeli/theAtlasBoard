import { supabase } from "../lib/supabase";
import type { Task, CellPosition } from "../types";
import { getCurrentUserId } from "../utils/auth";

export async function createTask(boardId: string, task: Omit<Task, "id">) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      board_id: boardId,
      user_id: userId,
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      importance: task.importance,
      timeframe: task.timeframe,
      status: task.status,
      order: task.order,
    })
    .select()
    .single();

  if (error) throw error;

  // Create todos if any
  if (task.todos.length > 0) {
    const { error: todosError } = await supabase.from("todos").insert(
      task.todos.map((todo) => ({
        task_id: data.id,
        text: todo.text,
        completed: todo.completed,
      }))
    );

    if (todosError) throw todosError;
  }

  // Create tag associations if any
  if (task.tags.length > 0) {
    const { error: tagsError } = await supabase.from("task_tags").insert(
      task.tags.map((tagId) => ({
        task_id: data.id,
        tag_id: tagId,
      }))
    );

    if (tagsError) throw tagsError;
  }

  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveTask(id: string, position: CellPosition) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      importance: position.importance,
      timeframe: position.timeframe,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw error;
}
