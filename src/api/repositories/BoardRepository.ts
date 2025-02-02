import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type Board = TableRecord<"boards">;

export class BoardRepository extends BaseRepository<"boards", Board> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "boards");
  }

  async findByTeam(teamId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        id, 
        name, 
        created_at,
        team:teams (
          id,
          name,
          organization:organizations (
            id,
            name
          )
        )
      `
      )
      .eq("team_id", teamId)
      .order("created_at");

    if (error) throw error;
    return data;
  }

  async findWithDetails(boardId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
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
}
