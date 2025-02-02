import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import type { FullTask, TaskPosition } from "@/types";

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
        task_tags (tag_id),
        task_assignees (user_id)
      `
      )
      .eq("board_id", boardId)
      .order("order");

    if (error) throw error;
    return data.map((task) => ({
      ...task,
      task_todos: task.todos,
      task_tags: task.task_tags.map((tt: any) => tt.tag_id),
      task_assignees: task.task_assignees.map((ta: any) => ta.user_id),
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
}
