import { describe, it, expect, beforeEach, vi } from "vitest";
import { PermissionCacheService } from "../PermissionCacheService";
import { TeamRole, TeamPermissions } from "@/types";

describe("PermissionCacheService", () => {
  let cacheService: PermissionCacheService;

  beforeEach(() => {
    cacheService = new PermissionCacheService();
  });

  describe("User Team Permissions Caching", () => {
    it("should cache and retrieve user team permissions", () => {
      const userId = "user-1";
      const teamId = "team-1";
      const role: TeamRole = "editor";
      const permissions: TeamPermissions = {
        canCreateBoards: true,
        canEditBoards: true,
        canDeleteBoards: true,
        canViewBoards: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canAssignTasks: true,
        canViewTasks: true,
        canCreateTodos: true,
        canEditTodos: true,
        canDeleteTodos: true,
        canToggleTodos: true,
        canViewTodos: true,
        canAddTaskTags: true,
        canRemoveTaskTags: true,
      };

      // Cache permissions
      cacheService.setUserTeamPermissions(userId, teamId, permissions, role);

      // Retrieve permissions
      const cached = cacheService.getUserTeamPermissions(userId, teamId);

      expect(cached).not.toBeNull();
      expect(cached!.permissions).toEqual(permissions);
      expect(cached!.role).toBe(role);
    });

    it("should return null for non-cached permissions", () => {
      const cached = cacheService.getUserTeamPermissions("user-1", "team-1");
      expect(cached).toBeNull();
    });

    it("should handle null permissions and roles", () => {
      const userId = "user-1";
      const teamId = "team-1";

      cacheService.setUserTeamPermissions(userId, teamId, null, null);

      const cached = cacheService.getUserTeamPermissions(userId, teamId);
      expect(cached).not.toBeNull();
      expect(cached!.permissions).toBeNull();
      expect(cached!.role).toBeNull();
    });
  });

  describe("Resource Team ID Caching", () => {
    it("should cache and retrieve board team ID", () => {
      const boardId = "board-1";
      const teamId = "team-1";

      cacheService.setBoardTeamId(boardId, teamId);

      const cached = cacheService.getBoardTeamId(boardId);
      expect(cached).toBe(teamId);
    });

    it("should cache and retrieve task team ID", () => {
      const taskId = "task-1";
      const teamId = "team-1";

      cacheService.setTaskTeamId(taskId, teamId);

      const cached = cacheService.getTaskTeamId(taskId);
      expect(cached).toBe(teamId);
    });

    it("should handle null team IDs", () => {
      const boardId = "board-1";

      cacheService.setBoardTeamId(boardId, null);

      const cached = cacheService.getBoardTeamId(boardId);
      expect(cached).toBeNull();
    });
  });

  describe("Cache Invalidation", () => {
    beforeEach(() => {
      // Set up some cached data
      cacheService.setUserTeamPermissions(
        "user-1",
        "team-1",
        {} as TeamPermissions,
        "editor"
      );
      cacheService.setUserTeamPermissions(
        "user-1",
        "team-2",
        {} as TeamPermissions,
        "viewer"
      );
      cacheService.setUserTeamPermissions(
        "user-2",
        "team-1",
        {} as TeamPermissions,
        "owner"
      );
      cacheService.setBoardTeamId("board-1", "team-1");
      cacheService.setTaskTeamId("task-1", "team-1");
    });

    it("should invalidate all permissions for a user", () => {
      cacheService.invalidateUserPermissions("user-1");

      expect(
        cacheService.getUserTeamPermissions("user-1", "team-1")
      ).toBeNull();
      expect(
        cacheService.getUserTeamPermissions("user-1", "team-2")
      ).toBeNull();
      // Other user's permissions should remain
      expect(
        cacheService.getUserTeamPermissions("user-2", "team-1")
      ).not.toBeNull();
    });

    it("should invalidate all permissions for a team", () => {
      cacheService.invalidateTeamPermissions("team-1");

      expect(
        cacheService.getUserTeamPermissions("user-1", "team-1")
      ).toBeNull();
      expect(
        cacheService.getUserTeamPermissions("user-2", "team-1")
      ).toBeNull();
      // Other team's permissions should remain
      expect(
        cacheService.getUserTeamPermissions("user-1", "team-2")
      ).not.toBeNull();
    });

    it("should invalidate board team relationship", () => {
      cacheService.invalidateBoardTeam("board-1");

      expect(cacheService.getBoardTeamId("board-1")).toBeNull();
    });

    it("should invalidate task team relationship", () => {
      cacheService.invalidateTaskTeam("task-1");

      expect(cacheService.getTaskTeamId("task-1")).toBeNull();
    });

    it("should batch invalidate user permissions", () => {
      cacheService.batchInvalidateUserPermissions(["user-1", "user-2"]);

      expect(
        cacheService.getUserTeamPermissions("user-1", "team-1")
      ).toBeNull();
      expect(
        cacheService.getUserTeamPermissions("user-1", "team-2")
      ).toBeNull();
      expect(
        cacheService.getUserTeamPermissions("user-2", "team-1")
      ).toBeNull();
    });

    it("should clear all cached data", () => {
      cacheService.clearAll();

      expect(
        cacheService.getUserTeamPermissions("user-1", "team-1")
      ).toBeNull();
      expect(
        cacheService.getUserTeamPermissions("user-2", "team-1")
      ).toBeNull();
      expect(cacheService.getBoardTeamId("board-1")).toBeNull();
      expect(cacheService.getTaskTeamId("task-1")).toBeNull();
    });
  });

  describe("Cache Statistics", () => {
    it("should return accurate cache statistics", () => {
      const initialStats = cacheService.getCacheStats();
      expect(initialStats.permissionCacheSize).toBe(0);
      expect(initialStats.resourceCacheSize).toBe(0);
      expect(initialStats.totalSize).toBe(0);

      // Add some cached data
      cacheService.setUserTeamPermissions(
        "user-1",
        "team-1",
        {} as TeamPermissions,
        "editor"
      );
      cacheService.setBoardTeamId("board-1", "team-1");

      const updatedStats = cacheService.getCacheStats();
      expect(updatedStats.permissionCacheSize).toBe(1);
      expect(updatedStats.resourceCacheSize).toBe(1);
      expect(updatedStats.totalSize).toBe(2);
    });
  });

  describe("Cache Expiration", () => {
    it("should not return expired entries", async () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      const userId = "user-1";
      const teamId = "team-1";
      const permissions = {} as TeamPermissions;
      const role: TeamRole = "editor";

      // Cache permissions
      cacheService.setUserTeamPermissions(userId, teamId, permissions, role);

      // Should be available immediately
      expect(
        cacheService.getUserTeamPermissions(userId, teamId)
      ).not.toBeNull();

      // Advance time beyond TTL (5 minutes = 300,000ms)
      currentTime += 400000;

      // Should now return null due to expiration
      expect(cacheService.getUserTeamPermissions(userId, teamId)).toBeNull();

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });
});
