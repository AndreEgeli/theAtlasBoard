import { Database } from "@/types/supabase";
import {
  BaseRepository,
  TableInsert,
  TableUpdate,
  TableRecord,
} from "./BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";

type OrganizationInviteRow = TableRecord<"organization_invites">;
type OrganizationInviteInsert = TableInsert<"organization_invites">;
type OrganizationInviteUpdate = TableUpdate<"organization_invites">;

export class OrganizationInviteRepository extends BaseRepository<
  "organization_invites",
  OrganizationInviteRow,
  OrganizationInviteInsert,
  OrganizationInviteUpdate
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "organization_invites");
  }

  async findPendingInvites(email: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        organizations (
          id,
          name
        )
      `
      )
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());

    if (error) throw error;
    return data;
  }

  async acceptInvite(
    token: string,
    userId: string
  ): Promise<OrganizationInviteRow> {
    const { data: invite, error: inviteError } = await this.supabase
      .from(this.table)
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq("token", token)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .select()
      .single();

    if (inviteError) throw inviteError;
    return invite;
  }
}
