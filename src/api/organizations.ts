import { supabase } from "../lib/supabase";
import { Organization, Team, OrganizationMember } from "../types";

export const organizationApi = {
  // Get user's active organization
  getCurrentOrganization: async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from("organizations")
      .select(
        `
        *,
        organization_members!inner (
          role
        )
      `
      )
      .eq("organization_members.user_id", user.user.id)
      .single();

    if (error) throw error;
    return data as Organization;
  },

  // Get all organizations user is a member of
  getUserOrganizations: async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select(
        `
        *,
        organization_members!inner (
          role
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Organization[];
  },

  // Create new organization
  createOrganization: async (name: string) => {
    try {
      const { data, error } = await supabase.rpc("create_organization", {
        org_name: name,
      });

      if (error) throw error;

      // Ensure we got a valid organization ID back
      if (!data) throw new Error("Failed to create organization");

      return { organizationId: data as string };
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  },

  // Switch active organization
  switchOrganization: async (organizationId: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { active_organization_id: organizationId },
    });
    if (error) throw error;
  },

  // Get teams in organization
  getTeams: async (organizationId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        team_members!inner (
          role
        )
      `
      )
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as Team[];
  },

  // Get organization members with their roles
  getMembers: async (organizationId: string) => {
    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        *,
        users:user_id (
          id,
          email,
          user_metadata
        )
      `
      )
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as OrganizationMember[];
  },

  // Create team in organization
  createTeam: async (organizationId: string, name: string) => {
    const { data, error } = await supabase.rpc("create_team", {
      org_id: organizationId,
      team_name: name,
    });

    if (error) throw error;
    return data as string; // Returns team_id
  },

  // Get team members with their roles
  getTeamMembers: async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
        *,
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

  // Add member to team
  addTeamMember: async (
    teamId: string,
    userId: string,
    role: "editor" | "viewer" = "editor"
  ) => {
    const { error } = await supabase.rpc("add_team_member", {
      team_id: teamId,
      user_id: userId,
      member_role: role,
    });

    if (error) throw error;
  },

  // Remove member from team
  removeTeamMember: async (teamId: string, userId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) throw error;
  },

  // Create organization invite
  createInvite: async (
    organizationId: string,
    email: string,
    role: "admin" | "member" = "member"
  ) => {
    // First check if the user already has a pending invite
    const { data: existingInvites, error: checkError } = await supabase
      .from("organization_invites")
      .select("id")
      .eq("email", email)
      .eq("organization_id", organizationId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());

    if (checkError) throw checkError;

    // If there's already a pending invite, don't create a new one
    if (existingInvites && existingInvites.length > 0) {
      return existingInvites[0].id;
    }

    const { data, error } = await supabase.rpc("create_organization_invite", {
      org_id: organizationId,
      email_address: email,
      member_role: role,
    });

    if (error) throw error;
    return data as string; // Returns invite_id
  },
};
