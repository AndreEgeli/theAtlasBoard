import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, TableRecord } from "./BaseRepository";
import { Database } from "@/types/supabase";

type TeamMember = TableRecord<"team_members">;

export class TeamMemberRepository extends BaseRepository<
  "team_members",
  TeamMember
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "team_members");
  }

  async findByTeam(teamId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        users (
          id,
          email,
          user_metadata
        )
      `
      )
      .eq("team_id", teamId);

    if (error) throw error;
    return data;
  }
}
