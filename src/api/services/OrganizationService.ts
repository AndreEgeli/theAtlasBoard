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
    const { data: org, error: orgError } = await this.supabase
      .rpc("begin_transaction")
      .then(async () => {
        try {
          const userOrgs = await this.orgRepo.findUserOrganizations(userId);
          const isFirstOrg = userOrgs.length === 0;

          const organization = await this.orgRepo.create({
            name,
            created_by: userId,
          });

          await this.orgMemberRepo.create({
            organization_id: organization.id,
            user_id: userId,
            role: "owner",
          });

          if (isFirstOrg) {
            await this.setActiveOrganization(organization.id);
          }

          const team = await this.teamRepo.create({
            organization_id: organization.id,
            name: "Default Team",
            is_org_wide: true,
            created_by: userId,
          });

          await this.teamMemberRepo.create({
            team_id: team.id,
            user_id: userId,
            role: "owner",
          });

          await this.supabase.rpc("commit_transaction");
          return { data: organization, error: null };
        } catch (error) {
          await this.supabase.rpc("rollback_transaction");
          return { data: null, error };
        }
      });

    if (orgError) throw orgError;
    if (!org) throw new Error("Organization not created successfully");
    return this.orgRepo.findWithMembers(org.id);
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
    const invite = await this.inviteRepo.acceptInvite(token, userId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (!invite.organization_id) {
      // invite Should always have an organization_id
      throw new Error("Invite does not have an organization");
    }

    // Add user to organization
    await this.orgMemberRepo.create({
      organization_id: invite.organization_id,
      user_id: userId,
      role: invite.role,
    });

    await this.setActiveOrganization(invite.organization_id);

    return invite.organization_id;
  }

  async setActiveOrganization(organizationId: string) {
    const { error } = await supabase.auth.updateUser({
      data: { active_organization_id: organizationId },
    });

    if (error) throw error;
  }

  async getCurrentOrganization(userId: string) {
    const hasOrg = await this.userService.checkUserOrganizations(userId);

    if (!hasOrg) {
      // TODO: Redirect to create organization page

      throw new Error("User does not have any organizations");
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    const activeOrgId = user?.user_metadata?.active_organization_id;

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

  async addMember(
    organizationId: string,
    userId: string,
    role: "admin" | "member" = "member"
  ) {
    return this.orgMemberRepo.create({
      organization_id: organizationId,
      user_id: userId,
      role,
    });
  }

  async removeMember(organizationId: string, userId: string) {
    const members = await this.orgMemberRepo.findByOrganization(organizationId);
    const ownerCount = members.filter((m) => m.role === "owner").length;
    const member = members.find((m) => m.user_id === userId);

    if (member?.role === "owner" && ownerCount <= 1) {
      throw new Error("Cannot remove the last owner of the organization");
    }

    return this.orgMemberRepo.delete(userId);
  }

  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ) {
    return this.orgRepo.update(organizationId, updates);
  }
}
