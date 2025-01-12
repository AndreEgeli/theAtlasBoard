import { supabase } from "../lib/supabase";
import type { TodoItem } from "../types";

export async function createTodo(taskId: string, todo: Omit<TodoItem, "id">) {
  const { data, error } = await supabase
    .from("todos")
    .insert({
      task_id: taskId,
      text: todo.text,
      completed: todo.completed,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTodo(id: string, updates: Partial<TodoItem>) {
  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTodo(id: string) {
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) throw error;
}
