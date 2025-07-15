import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacheInvalidationService } from "../CacheInvalidationService";
import { permissionCacheService } from "../PermissionCacheService";
import { auditLogService } from "../AuditLogService";
import { TeamRole } from "@/types";

// Mock the services
vi.mock("../PermissionCacheService", () => ({
  permissionCacheService: {
    invalidateUserPermissions: vi.fn(),
    invalidateTeamPermissions: vi.fn(),
    invalidateBoardTeam: vi.fn(),
    invalidateTaskTeam: vi.fn(),
    batchInvalidateUserPermissions: vi.fn(),
    clearAll: vi.fn(),
    getCacheStats: vi.fn(() => ({
      permissionCacheSize: 5,
      resourceCacheSize: 3,
      totalSize: 8,
    })),
  },
}));

vi.mock("../AuditLogService", () => ({
  auditLogService: {
    logRoleChange: vi.fn(),
    logResourceAccess: vi.fn(),
  },
}));

describe("CacheInvalidationService", () => {
  let cacheInvalidationService: CacheInvalidationService;

  beforeEach(() => {
    cacheInvalidationService = new CacheInvalidationService();
    vi.clearAllMocks();
  });

  describe("Role Change Handling", () => {
    it("should handle role changes with cache invalidation and audit logging", async () => {
      const adminUserId = "admin-1";
      const targetUserId = "user-1";
      const teamId = "team-1";
      const oldRole: TeamRole = "viewer";
      const newRole: TeamRole = "editor";

      await cacheInvalidationService.handleRoleChange(
        adminUserId,
        targetUserId,
        teamId,
        oldRole,
        newRole
      );

      expect(
        permissionCacheService.invalidateUserPermissions
      ).toHaveBeenCalledWith(targetUserId);
      expect(auditLogService.logRoleChange).toHaveBeenCalledWith(
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
    });

    it("should handle role changes with null old role", async () => {
      const adminUserId = "admin-1";
      const targetUserId = "user-1";
      const teamId = "team-1";
      const oldRole = null;
      const newRole: TeamRole = "editor";

      await cacheInvalidationService.handleRoleChange(
        adminUserId,
        targetUserId,
        teamId,
        oldRole,
        newRole
      );

      expect(
        permissionCacheService.invalidateUserPermissions
      ).toHaveBeenCalledWith(targetUserId);
      expect(auditLogService.logRoleChange).toHaveBeenCalledWith(
        adminUserId,
        targetUserId,
        teamId,
        null,
        newRole,
        expect.objectContaining({
          cache_invalidated: true,
          affected_user: targetUserId,
        })
      );
    });
  });

  describe("Team Member Removal", () => {
    it("should handle team member removal", async () => {
      const adminUserId = "admin-1";
      const removedUserId = "user-1";
      const teamId = "team-1";
      const formerRole: TeamRole = "editor";

      await cacheInvalidationService.handleTeamMemberRemoval(
        adminUserId,
        removedUserId,
        teamId,
        formerRole
      );

      expect(
        permissionCacheService.invalidateUserPermissions
      ).toHaveBeenCalledWith(removedUserId);
      expect(auditLogService.logRoleChange).toHaveBeenCalledWith(
        adminUserId,
        removedUserId,
        teamId,
        formerRole,
        expect.any(Object), // null role, but typed as any due to type constraints
        {
          action: "member_removed",
          cache_invalidated: true,
        }
      );
    });
  });

  describe("Board Team Changes", () => {
    it("should handle board team changes", async () => {
      const userId = "user-1";
      const boardId = "board-1";
      const oldTeamId = "team-1";
      const newTeamId = "team-2";

      await cacheInvalidationService.handleBoardTeamChange(
        userId,
        boardId,
        oldTeamId,
        newTeamId
      );

      expect(permissionCacheService.invalidateBoardTeam).toHaveBeenCalledWith(
        boardId
      );
      expect(
        permissionCacheService.invalidateTeamPermissions
      ).toHaveBeenCalledWith(oldTeamId);
      expect(
        permissionCacheService.invalidateTeamPermissions
      ).toHaveBeenCalledWith(newTeamId);
      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
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
    });

    it("should handle board team changes with null old team", async () => {
      const userId = "user-1";
      const boardId = "board-1";
      const oldTeamId = null;
      const newTeamId = "team-2";

      await cacheInvalidationService.handleBoardTeamChange(
        userId,
        boardId,
        oldTeamId,
        newTeamId
      );

      expect(permissionCacheService.invalidateBoardTeam).toHaveBeenCalledWith(
        boardId
      );
      expect(
        permissionCacheService.invalidateTeamPermissions
      ).toHaveBeenCalledWith(newTeamId);
      // Should not invalidate old team permissions when oldTeamId is null
      expect(
        permissionCacheService.invalidateTeamPermissions
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task Board Changes", () => {
    it("should handle task board changes", async () => {
      const userId = "user-1";
      const taskId = "task-1";
      const oldBoardId = "board-1";
      const newBoardId = "board-2";

      await cacheInvalidationService.handleTaskBoardChange(
        userId,
        taskId,
        oldBoardId,
        newBoardId
      );

      expect(permissionCacheService.invalidateTaskTeam).toHaveBeenCalledWith(
        taskId
      );
      expect(permissionCacheService.invalidateBoardTeam).toHaveBeenCalledWith(
        oldBoardId
      );
      expect(permissionCacheService.invalidateBoardTeam).toHaveBeenCalledWith(
        newBoardId
      );
      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
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
    });
  });

  describe("Bulk Team Permission Changes", () => {
    it("should handle bulk team permission changes", async () => {
      const adminUserId = "admin-1";
      const teamId = "team-1";
      const affectedUserIds = ["user-1", "user-2", "user-3"];
      const changeDescription = "Updated team policies";

      await cacheInvalidationService.handleBulkTeamPermissionChange(
        adminUserId,
        teamId,
        affectedUserIds,
        changeDescription
      );

      expect(
        permissionCacheService.batchInvalidateUserPermissions
      ).toHaveBeenCalledWith(affectedUserIds);
      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
        adminUserId,
        "team",
        teamId,
        "bulk_permission_change",
        true,
        teamId,
        undefined,
        {
          affected_users: affectedUserIds,
          affected_count: 3,
          change_description: changeDescription,
          cache_invalidated: true,
        }
      );
    });
  });

  describe("Organization Changes", () => {
    it("should handle organization-wide changes", async () => {
      const adminUserId = "admin-1";
      const organizationId = "org-1";
      const changeType = "restructure";
      const description = "Major organizational restructure";

      await cacheInvalidationService.handleOrganizationChange(
        adminUserId,
        organizationId,
        changeType,
        description
      );

      expect(permissionCacheService.clearAll).toHaveBeenCalled();
      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
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
    });

    it("should handle different organization change types", async () => {
      const adminUserId = "admin-1";
      const organizationId = "org-1";

      // Test policy change
      await cacheInvalidationService.handleOrganizationChange(
        adminUserId,
        organizationId,
        "policy_change",
        "Updated security policies"
      );

      expect(permissionCacheService.clearAll).toHaveBeenCalled();
      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
        adminUserId,
        "organization",
        organizationId,
        "policy_change",
        true,
        undefined,
        undefined,
        expect.objectContaining({
          change_type: "policy_change",
          description: "Updated security policies",
        })
      );
    });
  });

  describe("Periodic Cleanup", () => {
    it("should perform periodic cleanup and log statistics", async () => {
      // Mock cache stats to show a change
      const mockGetCacheStats = vi.mocked(permissionCacheService.getCacheStats);
      mockGetCacheStats
        .mockReturnValueOnce({
          permissionCacheSize: 10,
          resourceCacheSize: 5,
          totalSize: 15,
        })
        .mockReturnValueOnce({
          permissionCacheSize: 8,
          resourceCacheSize: 4,
          totalSize: 12,
        });

      await cacheInvalidationService.performPeriodicCleanup();

      expect(auditLogService.logResourceAccess).toHaveBeenCalledWith(
        "system",
        "cache",
        "cleanup",
        "periodic_cleanup",
        true,
        undefined,
        undefined,
        {
          entries_before: 15,
          entries_after: 12,
          entries_cleaned: 3,
        }
      );
    });

    it("should not log when no cleanup occurs", async () => {
      // Mock cache stats to show no change
      const mockGetCacheStats = vi.mocked(permissionCacheService.getCacheStats);
      mockGetCacheStats.mockReturnValue({
        permissionCacheSize: 5,
        resourceCacheSize: 3,
        totalSize: 8,
      });

      await cacheInvalidationService.performPeriodicCleanup();

      // Should not log when no changes occurred
      expect(auditLogService.logResourceAccess).not.toHaveBeenCalled();
    });
  });

  describe("Cache Statistics", () => {
    it("should return cache statistics", () => {
      const stats = cacheInvalidationService.getCacheStats();

      expect(stats).toEqual({
        permissionCacheSize: 5,
        resourceCacheSize: 3,
        totalSize: 8,
      });
      expect(permissionCacheService.getCacheStats).toHaveBeenCalled();
    });
  });
});
