import { Database } from "@/types/supabase";
import { BaseRepository, TableRecord } from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";

type Organization = TableRecord<"organizations">;
export type OrganizationWithMembers = Organization & {
  organization_members: Array<{ user_id: string; role: string }>;
};

export class OrganizationRepository extends BaseRepository<
  "organizations",
  Organization
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "organizations");
  }

  async findWithMembers(id: string): Promise<OrganizationWithMembers | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        organization_members (
          user_id,
          role
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as OrganizationWithMembers;
  }

  async findUserOrganizations(
    userId: string
  ): Promise<OrganizationWithMembers[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        organization_members!inner (
          user_id,
          role
        )
      `
      )
      .eq("organization_members.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
}
