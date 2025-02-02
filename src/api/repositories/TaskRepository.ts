import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import type { CellPosition } from "@/types";

type Task = TableRecord<"tasks">;

export class TaskRepository extends BaseRepository<"tasks", Task> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "tasks");
  }

  async findByBoard(boardId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        todos (*),
        task_tags (tag_id)
      `
      )
      .eq("board_id", boardId)
      .order("order");

    if (error) throw error;
    return data.map((task) => ({
      ...task,
      tags: task.task_tags.map((tt: any) => tt.tag_id),
    }));
  }

  async moveTask(id: string, position: CellPosition) {
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
