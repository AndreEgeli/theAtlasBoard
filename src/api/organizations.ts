import { supabase } from "../lib/supabase";
import { Organization, Team, OrganizationMember } from "../types";

export const organizationApi = {
  getFirstOrganization: async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;
    return data as Organization;
  },

  getTeams: async (organizationId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as Team[];
  },

  getMembers: async (organizationId: string) => {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as OrganizationMember[];
  },

  updateCurrentOrganization: async (organizationId: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { current_organization_id: organizationId },
    });
    if (error) throw error;
  },

  getTeamMembers: async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
        user_id,
        users:user_id (
          id,
          email,
          user_metadata
        )
      `
      )
      .eq("team_id", teamId);

    if (error) throw error;
    return data;
  },

  addTeamMember: async (teamId: string, userId: string) => {
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, user_id: userId });

    if (error) throw error;
  },

  removeTeamMember: async (teamId: string, userId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) throw error;
  },
};
