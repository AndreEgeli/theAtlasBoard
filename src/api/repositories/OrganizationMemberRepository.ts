import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, TableRecord } from "./BaseRepository";
import { Database } from "@/types/supabase";

type OrganizationMember = TableRecord<"organization_members">;

export class OrganizationMemberRepository extends BaseRepository<
  "organization_members",
  OrganizationMember
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "organization_members");
  }

  async findByOrganization(organizationId: string) {
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
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data;
  }
}
