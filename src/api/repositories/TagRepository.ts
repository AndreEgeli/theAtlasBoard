import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type Tag = TableRecord<"tags">;

export class TagRepository extends BaseRepository<"tags", Tag> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "tags");
  }

  async findByOrganization(organizationId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) throw error;
    return data;
  }

  async addToTask(taskId: string, tagId: string) {
    const { error } = await this.supabase
      .from("task_tags")
      .insert({ task_id: taskId, tag_id: tagId });

    if (error) throw error;
  }

  async removeFromTask(taskId: string, tagId: string) {
    const { error } = await this.supabase
      .from("task_tags")
      .delete()
      .match({ task_id: taskId, tag_id: tagId });

    if (error) throw error;
  }
}
