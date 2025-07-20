import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type Tag = TableRecord<"tags">;

export class TagRepository extends BaseRepository<"tags", Tag> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "tags");
  }

  async findByOrganization(organizationId: string): Promise<Tag[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) throw error;
    return data;
  }
}
