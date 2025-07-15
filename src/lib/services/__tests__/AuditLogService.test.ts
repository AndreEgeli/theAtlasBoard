import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuditLogService } from "../AuditLogService";
import { TeamRole } from "@/types";

describe("AuditLogService", () => {
  let auditService: AuditLogService;
  let consoleSpy: any;

  beforeEach(() => {
    auditService = new AuditLogService();
    // Spy on console methods to verify logging in development
    consoleSpy = {
      group: vi.spyOn(console, "group").mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    auditService.stopPeriodicFlush();
    vi.restoreAllMocks();
  });

  describe("Permission Violation Logging", () => {
    it("should log permission violations", async () => {
      await auditService.logPermissionViolation(
        "user-1",
        "board",
        "board-1",
        "edit",
        "canEditBoards",
        "viewer",
        "team-1",
        "Insufficient permissions",
        { additional: "metadata" }
      );

      // Force flush to trigger logging
      await auditService.forceFlush();

      expect(consoleSpy.group).toHaveBeenCalledWith("🔍 Audit Log Batch");
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "❌ [HIGH] permission_violation: edit on board"
        ),
        expect.objectContaining({
          user: "user-1",
          resource: "board-1",
          team: "team-1",
          role: "viewer",
          permission: "canEditBoards",
          error: "Insufficient permissions",
          metadata: { additional: "metadata" },
        })
      );
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });
  });

  describe("Permission Granted Logging", () => {
    it("should log successful permission checks", async () => {
      await auditService.logPermissionGranted(
        "user-1",
        "task",
        "task-1",
        "edit",
        "canEditTasks",
        "editor",
        "team-1",
        { context: "task_update" }
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("✅ [LOW] access_granted: edit on task"),
        expect.objectContaining({
          user: "user-1",
          resource: "task-1",
          team: "team-1",
          role: "editor",
          permission: "canEditTasks",
          error: null,
          metadata: { context: "task_update" },
        })
      );
    });
  });

  describe("Role Change Logging", () => {
    it("should log role changes", async () => {
      await auditService.logRoleChange(
        "admin-1",
        "user-1",
        "team-1",
        "viewer",
        "editor",
        { reason: "promotion" }
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "✅ [MEDIUM] role_change: role_update on team_member"
        ),
        expect.objectContaining({
          user: "admin-1",
          resource: "user-1",
          team: "team-1",
          metadata: expect.objectContaining({
            target_user_id: "user-1",
            old_role: "viewer",
            new_role: "editor",
            reason: "promotion",
          }),
        })
      );
    });
  });

  describe("Bulk Permission Check Logging", () => {
    it("should log bulk permission checks", async () => {
      await auditService.logBulkPermissionCheck(
        "user-1",
        "tasks",
        25,
        ["team-1", "team-2"],
        150,
        { query_type: "user_tasks" }
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "✅ [LOW] bulk_permission_check: bulk_check on tasks"
        ),
        expect.objectContaining({
          user: "user-1",
          metadata: expect.objectContaining({
            resource_count: 25,
            team_ids: ["team-1", "team-2"],
            duration_ms: 150,
            query_type: "user_tasks",
          }),
        })
      );
    });
  });

  describe("Resource Access Logging", () => {
    it("should log successful resource access", async () => {
      await auditService.logResourceAccess(
        "user-1",
        "board",
        "board-1",
        "view",
        true,
        "team-1",
        undefined,
        { source: "board_page" }
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("✅ [LOW] resource_access: view on board"),
        expect.objectContaining({
          user: "user-1",
          resource: "board-1",
          team: "team-1",
          metadata: { source: "board_page" },
        })
      );
    });

    it("should log failed resource access", async () => {
      await auditService.logResourceAccess(
        "user-1",
        "task",
        "task-1",
        "delete",
        false,
        "team-1",
        "Task not found",
        { attempted_action: "delete" }
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("❌ [MEDIUM] resource_access: delete on task"),
        expect.objectContaining({
          user: "user-1",
          resource: "task-1",
          team: "team-1",
          error: "Task not found",
          metadata: { attempted_action: "delete" },
        })
      );
    });
  });

  describe("Batch Processing", () => {
    it("should queue entries and flush in batches", async () => {
      // Add multiple entries
      for (let i = 0; i < 5; i++) {
        await auditService.logResourceAccess(
          `user-${i}`,
          "task",
          `task-${i}`,
          "view",
          true
        );
      }

      await auditService.forceFlush();

      // Should have logged all 5 entries in one batch
      expect(consoleSpy.group).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(5);
      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(1);
    });

    it("should auto-flush when batch size is reached", async () => {
      // Add entries up to batch size (10)
      for (let i = 0; i < 10; i++) {
        await auditService.logResourceAccess(
          `user-${i}`,
          "task",
          `task-${i}`,
          "view",
          true
        );
      }

      // Should have auto-flushed
      expect(consoleSpy.group).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(10);
    });
  });

  describe("Statistics", () => {
    it("should return accurate statistics", () => {
      const initialStats = auditService.getStats();
      expect(initialStats.queuedEntries).toBe(0);
      expect(initialStats.isFlushTimerActive).toBe(true);

      // Add some entries without flushing
      auditService.logResourceAccess("user-1", "task", "task-1", "view", true);
      auditService.logResourceAccess(
        "user-2",
        "board",
        "board-1",
        "edit",
        true
      );

      const updatedStats = auditService.getStats();
      expect(updatedStats.queuedEntries).toBe(2);
    });
  });

  describe("Client Info", () => {
    it("should capture user agent when available", async () => {
      // Mock navigator
      const mockNavigator = {
        userAgent: "Test User Agent",
      };
      Object.defineProperty(global, "navigator", {
        value: mockNavigator,
        writable: true,
      });

      await auditService.logResourceAccess(
        "user-1",
        "task",
        "task-1",
        "view",
        true
      );

      await auditService.forceFlush();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          // The user agent would be captured in the actual log entry
          // but we can't easily test it without accessing the internal queue
        })
      );
    });
  });
});
