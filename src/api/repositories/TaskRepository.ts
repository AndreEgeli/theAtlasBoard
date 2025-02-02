import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import type {
  FullTask,
  TaskPosition,
  TodoItem,
  TodoItemInsert,
  TodoItemUpdate,
} from "@/types";

type Task = TableRecord<"tasks">;

export class TaskRepository extends BaseRepository<"tasks", Task> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "tasks");
  }

  async findByBoard(boardId: string): Promise<FullTask[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        todos (*),
        task_tags (
          tags (*)
        ),
        task_assignees (
          users (
            id,
            email,
            user_metadata
          )
        )
      `
      )
      .eq("board_id", boardId)
      .order("order");

    if (error) throw error;
    return data.map((task) => ({
      ...task,
      task_todos: task.todos,
      task_tags: task.task_tags.map((tt: any) => tt.tags),
      task_assignees: task.task_assignees.map((ta: any) => ta.users),
    }));
  }

  async moveTask(id: string, position: TaskPosition) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update({
        x_index: position.x_index,
        y_index: position.y_index,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Task Assignees
  async assignUser(taskId: string, userId: string, assignedBy: string) {
    const { error } = await this.supabase.from("task_assignees").insert({
      task_id: taskId,
      user_id: userId,
      assigned_by: assignedBy,
    });

    if (error) throw error;
  }

  async unassignUser(taskId: string, userId: string) {
    const { error } = await this.supabase
      .from("task_assignees")
      .delete()
      .match({ task_id: taskId, user_id: userId });

    if (error) throw error;
  }

  // Task Todos
  async getTodos(taskId: string): Promise<TodoItem[]> {
    const { data, error } = await this.supabase
      .from("todos")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at");

    if (error) throw error;
    return data;
  }

  async createTodo(taskId: string, todo: Omit<TodoItemInsert, "id">) {
    const { data, error } = await this.supabase
      .from("todos")
      .insert({ ...todo, task_id: taskId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTodo(id: string, updates: Partial<TodoItemUpdate>) {
    const { data, error } = await this.supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTodo(id: string) {
    const { error } = await this.supabase.from("todos").delete().eq("id", id);

    if (error) throw error;
  }

  // Task Tags
  async addTag(taskId: string, tagId: string) {
    const { error } = await this.supabase
      .from("task_tags")
      .insert({ task_id: taskId, tag_id: tagId });

    if (error) throw error;
  }

  async removeTag(taskId: string, tagId: string) {
    const { error } = await this.supabase
      .from("task_tags")
      .delete()
      .match({ task_id: taskId, tag_id: tagId });

    if (error) throw error;
  }
}
