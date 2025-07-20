import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type Team = TableRecord<"teams">;

export class TeamRepository extends BaseRepository<"teams", Team> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "teams");
  }

  async findByOrganization(organizationId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select()
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as Team[];
  }
}
