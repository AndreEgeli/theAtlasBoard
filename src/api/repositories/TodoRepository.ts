import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type Todo = TableRecord<"todos">;

export class TodoRepository extends BaseRepository<"todos", Todo> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "todos");
  }

  async getByTaskId(taskId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("task_id", taskId)
      .order("created_at");

    if (error) throw error;
    return data;
  }

  async findByTask(taskId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("task_id", taskId)
      .order("created_at");

    if (error) throw error;
    return data;
  }
}
