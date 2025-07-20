import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { TeamRepository } from "../repositories/TeamRepository";
import { OrganizationMemberRepository } from "../repositories/OrganizationMemberRepository";
import { TeamMemberRepository } from "../repositories/TeamMemberRepository";
import { OrganizationInviteRepository } from "../repositories/OrganizationInviteRepository";
import { supabase } from "@/lib/supabase";
import { generateToken } from "@/utils/crypto";
import { UserService } from "./UserService";
import { SupabaseClient } from "@supabase/supabase-js";
import { Organization } from "@/types";

export class OrganizationService {
  private supabase: SupabaseClient;
  private orgRepo: OrganizationRepository;
  private teamRepo: TeamRepository;
  private orgMemberRepo: OrganizationMemberRepository;
  private teamMemberRepo: TeamMemberRepository;
  private inviteRepo: OrganizationInviteRepository;
  private userService: UserService;

  constructor() {
    this.supabase = supabase;
    this.orgRepo = new OrganizationRepository(supabase);
    this.teamRepo = new TeamRepository(supabase);
    this.orgMemberRepo = new OrganizationMemberRepository(supabase);
    this.teamMemberRepo = new TeamMemberRepository(supabase);
    this.inviteRepo = new OrganizationInviteRepository(supabase);
    this.userService = new UserService();
  }

  async createOrganization(name: string, userId: string) {
    try {
      const { data, error } = await this.supabase.rpc(
        "create_organization_with_setup",
        {
          p_name: name,
          p_user_id: userId,
        }
      );

      if (error) {
        console.error("Error creating organization:", error);
        throw new Error(error.message || "Failed to create organization");
      }

      return data;
    } catch (error) {
      console.error("Error creating organization:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create organization"
      );
    }
  }

  async createTeam(
    organizationId: string,
    name: string,
    userId: string,
    isOrgWide = false
  ) {
    const team = await this.teamRepo.create({
      organization_id: organizationId,
      name,
      is_org_wide: isOrgWide,
      created_by: userId,
    });

    await this.teamMemberRepo.create({
      team_id: team.id,
      user_id: userId,
      role: "owner",
    });

    return team;
  }

  async inviteMember(
    organizationId: string,
    email: string,
    role: "admin" | "member" = "member",
    userId: string
  ) {
    const existingInvites = await this.inviteRepo.findPendingInvites(email);
    const hasExistingInvite = existingInvites.some(
      (invite) => invite.organization_id === organizationId
    );

    if (hasExistingInvite) {
      throw new Error("User already has a pending invite");
    }

    // Create new invite
    const token = generateToken();
    const invite = await this.inviteRepo.create({
      organization_id: organizationId,
      email,
      role,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      created_by: userId,
    });

    return invite;
  }

  async getPendingInvites(email: string) {
    return this.inviteRepo.findPendingInvites(email);
  }

  async acceptInvite(token: string, userId: string) {
    const { error } = await this.supabase.rpc("accept_invitation", {
      p_token: token,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error accepting invitation:", error);
      throw new Error("Failed to accept invitation");
    }
  }

  async setActiveOrganization(organizationId: string) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("No authenticated user");

    const { error } = await supabase
      .from("users")
      .update({ active_organization_id: organizationId })
      .eq("id", user.id);

    if (error) throw error;
  }

  async getCurrentOrganization(userId: string) {
    try {
      const hasOrg = await this.userService.checkUserOrganizations(userId);

      if (!hasOrg) {
        // Instead of throwing an error, return null
        // This will allow the UI to handle the no-org state
        return null;
      }

      // Get active organization from public.users table
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("active_organization_id")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const activeOrgId = user?.active_organization_id;

      if (!activeOrgId) {
        // Get first organization if no active one is set
        const orgs = await this.orgRepo.findUserOrganizations(userId);
        if (orgs.length > 0) {
          await this.setActiveOrganization(orgs[0].id);
          return orgs[0];
        }
        return null;
      }

      return this.orgRepo.findOne(activeOrgId);
    } catch (error) {
      console.error("Error getting current organization:", error);
      return null; // Return null instead of throwing
    }
  }

  async getUserOrganizations(userId: string) {
    return this.orgRepo.findUserOrganizations(userId);
  }

  async getTeams(organizationId: string) {
    return this.teamRepo.findByOrganization(organizationId);
  }

  async getMembers(organizationId: string) {
    return this.orgMemberRepo.findByOrganization(organizationId);
  }

  async getTeamMembers(teamId: string) {
    return this.teamMemberRepo.findByTeam(teamId);
  }

  async addTeamMember(
    teamId: string,
    userId: string,
    role: "editor" | "viewer" = "editor"
  ) {
    return this.teamMemberRepo.create({
      team_id: teamId,
      user_id: userId,
      role,
    });
  }

  async removeTeamMember(teamId: string, userId: string) {
    const members = await this.teamMemberRepo.findByTeam(teamId);
    const ownerCount = members.filter((m) => m.role === "owner").length;
    const member = members.find((m) => m.user_id === userId);

    if (member?.role === "owner" && ownerCount <= 1) {
      throw new Error("Cannot remove the last owner of the team");
    }

    await this.teamMemberRepo.delete(userId);
  }

  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ) {
    return this.orgRepo.update(organizationId, updates);
  }
}
