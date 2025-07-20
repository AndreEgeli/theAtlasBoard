import { supabase } from "@/lib/supabase";
import { TeamRole, TeamPermissions, PermissionError } from "@/types";
import { permissionCacheService } from "./PermissionCacheService";
import { auditLogService } from "./AuditLogService";

/**
 * Service responsible for handling role-based access control
 * and permission calculations throughout the application.
 * Enhanced with caching and audit logging for performance and security.
 */
export class PermissionService {
  /**
   * Maps a team role to its corresponding permissions
   * @param role The team role to map
   * @returns The permissions associated with the role
   */
  public getTeamPermissions(role: TeamRole): TeamPermissions {
    switch (role) {
      case "owner":
        return {
          // Board permissions
          canCreateBoards: true,
          canEditBoards: true,
          canDeleteBoards: true,
          canViewBoards: true,

          // Task permissions
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canAssignTasks: true,
          canViewTasks: true,

          // Todo permissions
          canCreateTodos: true,
          canEditTodos: true,
          canDeleteTodos: true,
          canToggleTodos: true,
          canViewTodos: true,

          // Tag permissions
          canAddTaskTags: true,
          canRemoveTaskTags: true,
        };

      case "editor":
        return {
          // Board permissions
          canCreateBoards: true,
          canEditBoards: true,
          canDeleteBoards: true,
          canViewBoards: true,

          // Task permissions
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canAssignTasks: true,
          canViewTasks: true,

          // Todo permissions
          canCreateTodos: true,
          canEditTodos: true,
          canDeleteTodos: true,
          canToggleTodos: true,
          canViewTodos: true,

          // Tag permissions
          canAddTaskTags: true,
          canRemoveTaskTags: true,
        };

      case "viewer":
        return {
          // Board permissions - read-only
          canCreateBoards: false,
          canEditBoards: false,
          canDeleteBoards: false,
          canViewBoards: true,

          // Task permissions - read-only
          canCreateTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canAssignTasks: false,
          canViewTasks: true,

          // Todo permissions - read-only
          canCreateTodos: false,
          canEditTodos: false,
          canDeleteTodos: false,
          canToggleTodos: false,
          canViewTodos: true,

          // Tag permissions - read-only
          canAddTaskTags: false,
          canRemoveTaskTags: false,
        };

      default:
        throw new Error(`Unknown team role: ${role}`);
    }
  }

  /**
   * Gets the user's role in a specific team
   * @param userId The user ID
   * @param teamId The team ID
   * @returns The user's role in the team, or null if not a member
   */
  public async getUserTeamRole(
    userId: string,
    teamId: string
  ): Promise<TeamRole | null> {
    // Check cache first
    const cached = permissionCacheService.getUserTeamPermissions(
      userId,
      teamId
    );
    if (cached) {
      return cached.role;
    }

    const { data, error } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

    const role = error || !data ? null : (data.role as TeamRole);

    // Cache the result
    const permissions = role ? this.getTeamPermissions(role) : null;
    permissionCacheService.setUserTeamPermissions(
      userId,
      teamId,
      permissions,
      role
    );

    return role;
  }

  /**
   * Gets the user's permissions for a specific team
   * @param userId The user ID
   * @param teamId The team ID
   * @returns The user's permissions for the team
   */
  public async getUserTeamPermissions(
    userId: string,
    teamId: string
  ): Promise<TeamPermissions | null> {
    const role = await this.getUserTeamRole(userId, teamId);

    if (!role) {
      return null;
    }

    return this.getTeamPermissions(role);
  }

  /**
   * Checks if a user can create a board in a specific team
   * @param userId The user ID
   * @param teamId The team ID
   * @returns True if the user can create a board, false otherwise
   */
  public async canUserCreateBoard(
    userId: string,
    teamId: string
  ): Promise<boolean> {
    const permissions = await this.getUserTeamPermissions(userId, teamId);
    return !!permissions?.canCreateBoards;
  }

  /**
   * Gets the team ID associated with a board
   * @param boardId The board ID
   * @returns The team ID, or null if not found
   */
  private async getBoardTeamId(boardId: string): Promise<string | null> {
    // Check cache first
    const cached = permissionCacheService.getBoardTeamId(boardId);
    if (cached !== null) {
      return cached;
    }

    const { data, error } = await supabase
      .from("boards")
      .select("team_id")
      .eq("id", boardId)
      .single();

    const teamId = error || !data ? null : data.team_id;

    // Cache the result
    permissionCacheService.setBoardTeamId(boardId, teamId);

    return teamId;
  }

  /**
   * Checks if a user can edit a specific board
   * @param userId The user ID
   * @param boardId The board ID
   * @returns True if the user can edit the board, false otherwise
   */
  public async canUserEditBoard(
    userId: string,
    boardId: string
  ): Promise<boolean> {
    const teamId = await this.getBoardTeamId(boardId);

    if (!teamId) {
      return false;
    }

    const permissions = await this.getUserTeamPermissions(userId, teamId);
    return !!permissions?.canEditBoards;
  }

  /**
   * Checks if a user can view a specific board
   * @param userId The user ID
   * @param boardId The board ID
   * @returns True if the user can view the board, false otherwise
   */
  public async canUserViewBoard(
    userId: string,
    boardId: string
  ): Promise<boolean> {
    const teamId = await this.getBoardTeamId(boardId);

    if (!teamId) {
      return false;
    }

    const permissions = await this.getUserTeamPermissions(userId, teamId);
    return !!permissions?.canViewBoards;
  }

  /**
   * Gets the team ID associated with a task
   * @param taskId The task ID
   * @returns The team ID, or null if not found
   */
  private async getTaskTeamId(taskId: string): Promise<string | null> {
    // Check cache first
    const cached = permissionCacheService.getTaskTeamId(taskId);
    if (cached !== null) {
      return cached;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("board_id")
      .eq("id", taskId)
      .single();

    if (error || !data || !data.board_id) {
      permissionCacheService.setTaskTeamId(taskId, null);
      return null;
    }

    const teamId = await this.getBoardTeamId(data.board_id);

    // Cache the result
    permissionCacheService.setTaskTeamId(taskId, teamId);

    return teamId;
  }

  /**
   * Checks if a user can edit a specific task
   * @param userId The user ID
   * @param taskId The task ID
   * @returns True if the user can edit the task, false otherwise
   */
  public async canUserEditTask(
    userId: string,
    taskId: string
  ): Promise<boolean> {
    const teamId = await this.getTaskTeamId(taskId);

    if (!teamId) {
      return false;
    }

    const permissions = await this.getUserTeamPermissions(userId, teamId);
    return !!permissions?.canEditTasks;
  }

  /**
   * Checks if a user can view a specific task
   * @param userId The user ID
   * @param taskId The task ID
   * @returns True if the user can view the task, false otherwise
   */
  public async canUserViewTask(
    userId: string,
    taskId: string
  ): Promise<boolean> {
    const teamId = await this.getTaskTeamId(taskId);

    if (!teamId) {
      return false;
    }

    const permissions = await this.getUserTeamPermissions(userId, teamId);
    return !!permissions?.canViewTasks;
  }

  /**
   * Validates that a user has a specific permission for a team
   * Throws a PermissionError if the user doesn't have the required permission
   *
   * @param userId The user ID
   * @param teamId The team ID
   * @param permission The permission to check
   * @param resourceName The name of the resource being accessed (for error messages)
   */
  public async validateTeamPermission(
    userId: string,
    teamId: string,
    permission: keyof TeamPermissions,
    resourceName: string
  ): Promise<void> {
    const role = await this.getUserTeamRole(userId, teamId);
    const permissions = role ? this.getTeamPermissions(role) : null;

    if (!permissions || !permissions[permission]) {
      // Determine the minimum required role for this permission
      let requiredRole: TeamRole;
      if (permission.startsWith("canView")) {
        requiredRole = "viewer";
      } else {
        requiredRole = "editor";
      }

      const error = new PermissionError(
        permission,
        resourceName,
        requiredRole,
        role
      );

      // Log permission violation
      await auditLogService.logPermissionViolation(
        userId,
        "team",
        teamId,
        permission,
        permission,
        role,
        teamId,
        error.message,
        { resource_name: resourceName }
      );

      throw error;
    }

    // Log successful permission check
    await auditLogService.logPermissionGranted(
      userId,
      "team",
      teamId,
      permission,
      permission,
      role!,
      teamId,
      { resource_name: resourceName }
    );
  }

  /**
   * Validates that a user has a specific permission for a board
   * Throws a PermissionError if the user doesn't have the required permission
   *
   * @param userId The user ID
   * @param boardId The board ID
   * @param permission The permission to check
   */
  public async validateBoardPermission(
    userId: string,
    boardId: string,
    permission: keyof TeamPermissions
  ): Promise<void> {
    const teamId = await this.getBoardTeamId(boardId);

    if (!teamId) {
      throw new Error(`Board not found: ${boardId}`);
    }

    await this.validateTeamPermission(
      userId,
      teamId,
      permission,
      `board ${boardId}`
    );
  }

  /**
   * Validates that a user has a specific permission for a task
   * Throws a PermissionError if the user doesn't have the required permission
   *
   * @param userId The user ID
   * @param taskId The task ID
   * @param permission The permission to check
   */
  public async validateTaskPermission(
    userId: string,
    taskId: string,
    permission: keyof TeamPermissions
  ): Promise<void> {
    const teamId = await this.getTaskTeamId(taskId);

    if (!teamId) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.validateTeamPermission(
      userId,
      teamId,
      permission,
      `task ${taskId}`
    );
  }
}
