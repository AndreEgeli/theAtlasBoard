import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, TableRecord } from "./BaseRepository";
import { Database } from "@/types/supabase";
import {
  TeamRole,
  TeamPermissions,
  TeamMemberWithPermissions,
  BoardAccess,
} from "@/types";
import { PermissionService } from "@/lib/services/PermissionService";
import { cacheInvalidationService } from "@/lib/services/CacheInvalidationService";
import { auditLogService } from "@/lib/services/AuditLogService";

type TeamMember = TableRecord<"team_members">;

/**
 * Repository for managing team members and their permissions
 */
export class TeamMemberRepository extends BaseRepository<
  "team_members",
  TeamMember
> {
  private permissionService: PermissionService;

  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "team_members");
    this.permissionService = new PermissionService();
  }

  /**
   * Find team members by team ID
   * @param teamId The team ID
   * @returns Array of team members with user details
   */
  async findByTeam(teamId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        users (
          id,
          email,
          name
        )
      `
      )
      .eq("team_id", teamId);

    if (error) throw error;
    return data;
  }

  /**
   * Get a user's permissions for a specific team
   * @param userId The user ID
   * @param teamId The team ID
   * @returns The user's permissions for the team, or null if not a member
   */
  async getUserTeamPermissions(
    userId: string,
    teamId: string
  ): Promise<TeamMemberWithPermissions | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

    if (error || !data) {
      return null;
    }

    const role = data.role as TeamRole;
    const permissions = this.permissionService.getTeamPermissions(role);

    return {
      userId,
      teamId,
      role,
      permissions,
    };
  }

  /**
   * Get a user's permissions for a specific board
   * @param userId The user ID
   * @param boardId The board ID
   * @returns The user's board access information, or null if not accessible
   */
  async getUserBoardPermissions(
    userId: string,
    boardId: string
  ): Promise<BoardAccess | null> {
    // First get the team ID for the board
    const { data: boardData, error: boardError } = await this.supabase
      .from("boards")
      .select("team_id")
      .eq("id", boardId)
      .single();

    if (boardError || !boardData || !boardData.team_id) {
      return null;
    }

    const teamId = boardData.team_id;

    // Then get the user's team permissions
    const teamMemberWithPermissions = await this.getUserTeamPermissions(
      userId,
      teamId
    );

    if (!teamMemberWithPermissions) {
      return null;
    }

    const { role, permissions } = teamMemberWithPermissions;

    return {
      boardId,
      userId,
      teamId,
      role,
      permissions,
      canEdit: permissions.canEditBoards,
      canView: permissions.canViewBoards,
    };
  }

  /**
   * Update a team member's role with cache invalidation and audit logging
   * @param adminUserId The user ID making the change
   * @param teamId The team ID
   * @param userId The user ID to update
   * @param role The new role to assign
   * @returns The updated team member
   */
  async updateMemberRole(
    adminUserId: string,
    teamId: string,
    userId: string,
    role: TeamRole
  ): Promise<TeamMember> {
    // Get the current role for audit logging
    const currentMember = await this.getUserTeamPermissions(userId, teamId);
    const oldRole = currentMember?.role || null;

    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .update({ role })
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        // Log failed role change attempt
        await auditLogService.logResourceAccess(
          adminUserId,
          "team_member",
          userId,
          "role_update",
          false,
          teamId,
          error.message,
          {
            target_user: userId,
            attempted_role: role,
            current_role: oldRole,
          }
        );
        throw error;
      }

      // Handle cache invalidation and audit logging
      await cacheInvalidationService.handleRoleChange(
        adminUserId,
        userId,
        teamId,
        oldRole,
        role
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a team member's role (backward compatibility)
   * @param teamId The team ID
   * @param userId The user ID to update
   * @param role The new role to assign
   * @returns The updated team member
   */
  async updateMemberRoleSimple(
    teamId: string,
    userId: string,
    role: TeamRole
  ): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update({ role })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all teams where a user has a specific permission
   * @param userId The user ID
   * @param permission The permission to check for
   * @returns Array of team IDs where the user has the specified permission
   */
  async getTeamsWithPermission(
    userId: string,
    permission: keyof TeamPermissions
  ): Promise<string[]> {
    // Get all teams the user is a member of
    const { data, error } = await this.supabase
      .from(this.table)
      .select("team_id, role")
      .eq("user_id", userId);

    if (error) throw error;

    // Filter teams based on the permission
    const teamsWithPermission = data
      .filter((member) => {
        const role = member.role as TeamRole;
        const permissions = this.permissionService.getTeamPermissions(role);
        return permissions[permission];
      })
      .map((member) => member.team_id);

    return teamsWithPermission;
  }

  /**
   * Get all boards a user can access with a specific permission
   * @param userId The user ID
   * @param permission The permission to check for
   * @returns Array of board IDs where the user has the specified permission
   */
  async getBoardsWithPermission(
    userId: string,
    permission: keyof TeamPermissions
  ): Promise<string[]> {
    // First get teams where the user has the permission
    const teamIds = await this.getTeamsWithPermission(userId, permission);

    if (teamIds.length === 0) {
      return [];
    }

    // Then get boards belonging to those teams
    const { data, error } = await this.supabase
      .from("boards")
      .select("id")
      .in("team_id", teamIds);

    if (error) throw error;

    return data.map((board) => board.id);
  }

  /**
   * Get all team members for a specific board
   * @param boardId The board ID
   * @returns Array of team members with user details
   */
  async getBoardTeamMembers(boardId: string) {
    // First get the team ID for the board
    const { data: boardData, error: boardError } = await this.supabase
      .from("boards")
      .select("team_id")
      .eq("id", boardId)
      .single();

    if (boardError || !boardData || !boardData.team_id) {
      return [];
    }

    const teamId = boardData.team_id;

    // Then get all team members with user details
    const { data, error } = await this.supabase
      .from(this.table)
      .select(
        `
        *,
        users (
          id,
          email,
          name,
          avatar_url
        )
      `
      )
      .eq("team_id", teamId);

    if (error) throw error;

    // Transform the data to match FullUser type
    return data.map((member) => ({
      id: member.users.id,
      email: member.users.email,
      name: member.users.name,
      avatar_url: member.users.avatar_url,
      active_organization_id: "", // This would need to be fetched separately if needed
    }));
  }
}
