import { permissionCacheService } from "./PermissionCacheService";
import { auditLogService } from "./AuditLogService";
import { TeamRole } from "@/types";

/**
 * Service for managing cache invalidation when data changes
 * Ensures cache consistency across the application
 */
export class CacheInvalidationService {
  /**
   * Handle team member role changes
   * Invalidates relevant caches and logs the change
   */
  async handleRoleChange(
    adminUserId: string,
    targetUserId: string,
    teamId: string,
    oldRole: TeamRole | null,
    newRole: TeamRole
  ): Promise<void> {
    // Invalidate permission cache for the affected user
    permissionCacheService.invalidateUserPermissions(targetUserId);

    // Log the role change for audit purposes
    await auditLogService.logRoleChange(
      adminUserId,
      targetUserId,
      teamId,
      oldRole,
      newRole,
      {
        cache_invalidated: true,
        affected_user: targetUserId,
      }
    );
  }

  /**
   * Handle team member removal
   * Invalidates caches when a user is removed from a team
   */
  async handleTeamMemberRemoval(
    adminUserId: string,
    removedUserId: string,
    teamId: string,
    formerRole: TeamRole
  ): Promise<void> {
    // Invalidate permission cache for the removed user
    permissionCacheService.invalidateUserPermissions(removedUserId);

    // Log the removal
    await auditLogService.logRoleChange(
      adminUserId,
      removedUserId,
      teamId,
      formerRole,
      null as any, // User no longer has a role
      {
        action: "member_removed",
        cache_invalidated: true,
      }
    );
  }

  /**
   * Handle board team changes
   * Invalidates board-team relationship cache
   */
  async handleBoardTeamChange(
    userId: string,
    boardId: string,
    oldTeamId: string | null,
    newTeamId: string
  ): Promise<void> {
    // Invalidate board-team cache
    permissionCacheService.invalidateBoardTeam(boardId);

    // If team changed, invalidate permissions for both teams
    if (oldTeamId && oldTeamId !== newTeamId) {
      permissionCacheService.invalidateTeamPermissions(oldTeamId);
    }
    permissionCacheService.invalidateTeamPermissions(newTeamId);

    // Log the change
    await auditLogService.logResourceAccess(
      userId,
      "board",
      boardId,
      "team_change",
      true,
      newTeamId,
      undefined,
      {
        old_team_id: oldTeamId,
        new_team_id: newTeamId,
        cache_invalidated: true,
      }
    );
  }

  /**
   * Handle task board changes
   * Invalidates task-team relationship cache
   */
  async handleTaskBoardChange(
    userId: string,
    taskId: string,
    oldBoardId: string | null,
    newBoardId: string
  ): Promise<void> {
    // Invalidate task-team cache
    permissionCacheService.invalidateTaskTeam(taskId);

    // If board changed, invalidate board-team cache for both boards
    if (oldBoardId && oldBoardId !== newBoardId) {
      permissionCacheService.invalidateBoardTeam(oldBoardId);
    }
    permissionCacheService.invalidateBoardTeam(newBoardId);

    // Log the change
    await auditLogService.logResourceAccess(
      userId,
      "task",
      taskId,
      "board_change",
      true,
      undefined,
      undefined,
      {
        old_board_id: oldBoardId,
        new_board_id: newBoardId,
        cache_invalidated: true,
      }
    );
  }

  /**
   * Handle bulk team permission changes
   * Useful when team settings or policies change
   */
  async handleBulkTeamPermissionChange(
    adminUserId: string,
    teamId: string,
    affectedUserIds: string[],
    changeDescription: string
  ): Promise<void> {
    // Invalidate permissions for all affected users
    permissionCacheService.batchInvalidateUserPermissions(affectedUserIds);

    // Log the bulk change
    await auditLogService.logResourceAccess(
      adminUserId,
      "team",
      teamId,
      "bulk_permission_change",
      true,
      teamId,
      undefined,
      {
        affected_users: affectedUserIds,
        affected_count: affectedUserIds.length,
        change_description: changeDescription,
        cache_invalidated: true,
      }
    );
  }

  /**
   * Handle organization-wide changes
   * Clears all caches when major structural changes occur
   */
  async handleOrganizationChange(
    adminUserId: string,
    organizationId: string,
    changeType: "restructure" | "policy_change" | "mass_update",
    description: string
  ): Promise<void> {
    // Clear all caches for safety
    permissionCacheService.clearAll();

    // Log the organization-wide change
    await auditLogService.logResourceAccess(
      adminUserId,
      "organization",
      organizationId,
      changeType,
      true,
      undefined,
      undefined,
      {
        change_type: changeType,
        description,
        cache_cleared: true,
        severity: "high",
      }
    );
  }

  /**
   * Periodic cache cleanup
   * Should be called periodically to clean up expired entries
   */
  async performPeriodicCleanup(): Promise<void> {
    const statsBefore = permissionCacheService.getCacheStats();

    // The cache service handles its own cleanup internally
    // This method could be extended to perform additional cleanup tasks

    const statsAfter = permissionCacheService.getCacheStats();

    // Log cleanup statistics if significant changes occurred
    if (statsBefore.totalSize !== statsAfter.totalSize) {
      await auditLogService.logResourceAccess(
        "system",
        "cache",
        "cleanup",
        "periodic_cleanup",
        true,
        undefined,
        undefined,
        {
          entries_before: statsBefore.totalSize,
          entries_after: statsAfter.totalSize,
          entries_cleaned: statsBefore.totalSize - statsAfter.totalSize,
        }
      );
    }
  }

  /**
   * Get cache invalidation statistics
   */
  getCacheStats(): {
    permissionCacheSize: number;
    resourceCacheSize: number;
    totalSize: number;
  } {
    return permissionCacheService.getCacheStats();
  }
}

// Export singleton instance
export const cacheInvalidationService = new CacheInvalidationService();
