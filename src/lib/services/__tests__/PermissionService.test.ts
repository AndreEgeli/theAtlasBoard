import { describe, it, expect, vi, beforeEach } from "vitest";
import { PermissionService } from "../PermissionService";
import { TeamRole, PermissionError } from "@/types";
import { supabase } from "@/lib/supabase";
import { permissionCacheService } from "../PermissionCacheService";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

describe("PermissionService", () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
    vi.clearAllMocks();
    // Clear cache before each test to avoid interference
    permissionCacheService.clearAll();
  });

  describe("getTeamPermissions", () => {
    it("should return owner permissions for owner role", () => {
      const permissions = permissionService.getTeamPermissions("owner");

      expect(permissions.canCreateBoards).toBe(true);
      expect(permissions.canEditBoards).toBe(true);
      expect(permissions.canDeleteBoards).toBe(true);
      expect(permissions.canViewBoards).toBe(true);

      expect(permissions.canCreateTasks).toBe(true);
      expect(permissions.canEditTasks).toBe(true);
      expect(permissions.canDeleteTasks).toBe(true);
      expect(permissions.canAssignTasks).toBe(true);
      expect(permissions.canViewTasks).toBe(true);

      expect(permissions.canCreateTodos).toBe(true);
      expect(permissions.canEditTodos).toBe(true);
      expect(permissions.canDeleteTodos).toBe(true);
      expect(permissions.canToggleTodos).toBe(true);
      expect(permissions.canViewTodos).toBe(true);

      expect(permissions.canAddTaskTags).toBe(true);
      expect(permissions.canRemoveTaskTags).toBe(true);
    });

    it("should return editor permissions for editor role", () => {
      const permissions = permissionService.getTeamPermissions("editor");

      expect(permissions.canCreateBoards).toBe(true);
      expect(permissions.canEditBoards).toBe(true);
      expect(permissions.canDeleteBoards).toBe(true);
      expect(permissions.canViewBoards).toBe(true);

      expect(permissions.canCreateTasks).toBe(true);
      expect(permissions.canEditTasks).toBe(true);
      expect(permissions.canDeleteTasks).toBe(true);
      expect(permissions.canAssignTasks).toBe(true);
      expect(permissions.canViewTasks).toBe(true);

      expect(permissions.canCreateTodos).toBe(true);
      expect(permissions.canEditTodos).toBe(true);
      expect(permissions.canDeleteTodos).toBe(true);
      expect(permissions.canToggleTodos).toBe(true);
      expect(permissions.canViewTodos).toBe(true);

      expect(permissions.canAddTaskTags).toBe(true);
      expect(permissions.canRemoveTaskTags).toBe(true);
    });

    it("should return viewer permissions for viewer role", () => {
      const permissions = permissionService.getTeamPermissions("viewer");

      // Board permissions - read-only
      expect(permissions.canCreateBoards).toBe(false);
      expect(permissions.canEditBoards).toBe(false);
      expect(permissions.canDeleteBoards).toBe(false);
      expect(permissions.canViewBoards).toBe(true);

      // Task permissions - read-only
      expect(permissions.canCreateTasks).toBe(false);
      expect(permissions.canEditTasks).toBe(false);
      expect(permissions.canDeleteTasks).toBe(false);
      expect(permissions.canAssignTasks).toBe(false);
      expect(permissions.canViewTasks).toBe(true);

      // Todo permissions - read-only
      expect(permissions.canCreateTodos).toBe(false);
      expect(permissions.canEditTodos).toBe(false);
      expect(permissions.canDeleteTodos).toBe(false);
      expect(permissions.canToggleTodos).toBe(false);
      expect(permissions.canViewTodos).toBe(true);

      // Tag permissions - read-only
      expect(permissions.canAddTaskTags).toBe(false);
      expect(permissions.canRemoveTaskTags).toBe(false);
    });

    it("should throw an error for unknown roles", () => {
      expect(() => {
        // @ts-ignore - Testing invalid role
        permissionService.getTeamPermissions("invalid-role");
      }).toThrow("Unknown team role: invalid-role");
    });
  });

  describe("getUserTeamRole", () => {
    it("should return the user role when user is a team member", async () => {
      const mockRole: TeamRole = "editor";

      // Mock Supabase response
      (supabase.single as any).mockResolvedValueOnce({
        data: { role: mockRole },
        error: null,
      });

      const role = await permissionService.getUserTeamRole(
        "user-123",
        "team-456"
      );

      expect(role).toBe(mockRole);
      expect(supabase.from).toHaveBeenCalledWith("team_members");
      expect(supabase.select).toHaveBeenCalledWith("role");
      expect(supabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(supabase.eq).toHaveBeenCalledWith("team_id", "team-456");
    });

    it("should return null when user is not a team member", async () => {
      // Mock Supabase response for no data
      (supabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { message: "No data found" },
      });

      const role = await permissionService.getUserTeamRole(
        "user-123",
        "team-456"
      );

      expect(role).toBeNull();
    });
  });

  describe("getUserTeamPermissions", () => {
    it("should return permissions when user is a team member", async () => {
      const mockRole: TeamRole = "editor";

      // Mock getUserTeamRole to return a role
      vi.spyOn(permissionService, "getUserTeamRole").mockResolvedValueOnce(
        mockRole
      );

      // Mock getTeamPermissions
      const mockPermissions = {
        canCreateBoards: true,
        canEditBoards: true,
        // ... other permissions
      } as any;
      vi.spyOn(permissionService, "getTeamPermissions").mockReturnValueOnce(
        mockPermissions
      );

      const permissions = await permissionService.getUserTeamPermissions(
        "user-123",
        "team-456"
      );

      expect(permissions).toBe(mockPermissions);
      expect(permissionService.getUserTeamRole).toHaveBeenCalledWith(
        "user-123",
        "team-456"
      );
      expect(permissionService.getTeamPermissions).toHaveBeenCalledWith(
        mockRole
      );
    });

    it("should return null when user is not a team member", async () => {
      // Mock getUserTeamRole to return null
      vi.spyOn(permissionService, "getUserTeamRole").mockResolvedValueOnce(
        null
      );

      const permissions = await permissionService.getUserTeamPermissions(
        "user-123",
        "team-456"
      );

      expect(permissions).toBeNull();
      expect(permissionService.getUserTeamRole).toHaveBeenCalledWith(
        "user-123",
        "team-456"
      );
    });
  });

  describe("canUserCreateBoard", () => {
    it("should return true when user has permission", async () => {
      // Mock getUserTeamPermissions to return permissions with canCreateBoards=true
      vi.spyOn(
        permissionService,
        "getUserTeamPermissions"
      ).mockResolvedValueOnce({
        canCreateBoards: true,
      } as any);

      const canCreate = await permissionService.canUserCreateBoard(
        "user-123",
        "team-456"
      );

      expect(canCreate).toBe(true);
      expect(permissionService.getUserTeamPermissions).toHaveBeenCalledWith(
        "user-123",
        "team-456"
      );
    });

    it("should return false when user does not have permission", async () => {
      // Mock getUserTeamPermissions to return permissions with canCreateBoards=false
      vi.spyOn(
        permissionService,
        "getUserTeamPermissions"
      ).mockResolvedValueOnce({
        canCreateBoards: false,
      } as any);

      const canCreate = await permissionService.canUserCreateBoard(
        "user-123",
        "team-456"
      );

      expect(canCreate).toBe(false);
    });

    it("should return false when user is not a team member", async () => {
      // Mock getUserTeamPermissions to return null
      vi.spyOn(
        permissionService,
        "getUserTeamPermissions"
      ).mockResolvedValueOnce(null);

      const canCreate = await permissionService.canUserCreateBoard(
        "user-123",
        "team-456"
      );

      expect(canCreate).toBe(false);
    });
  });

  describe("validateTeamPermission", () => {
    it("should not throw when user has the required permission", async () => {
      // Mock getUserTeamRole to return a role
      vi.spyOn(permissionService, "getUserTeamRole").mockResolvedValueOnce(
        "editor"
      );

      // Mock getTeamPermissions to return permissions with canEditBoards=true
      vi.spyOn(permissionService, "getTeamPermissions").mockReturnValueOnce({
        canEditBoards: true,
      } as any);

      await expect(
        permissionService.validateTeamPermission(
          "user-123",
          "team-456",
          "canEditBoards",
          "test-board"
        )
      ).resolves.not.toThrow();
    });

    it("should throw PermissionError when user does not have the required permission", async () => {
      // Mock getUserTeamRole to return a role
      vi.spyOn(permissionService, "getUserTeamRole").mockResolvedValueOnce(
        "viewer"
      );

      // Mock getTeamPermissions to return permissions with canEditBoards=false
      vi.spyOn(permissionService, "getTeamPermissions").mockReturnValueOnce({
        canEditBoards: false,
      } as any);

      await expect(
        permissionService.validateTeamPermission(
          "user-123",
          "team-456",
          "canEditBoards",
          "test-board"
        )
      ).rejects.toThrow(PermissionError);
    });

    it("should throw PermissionError when user is not a team member", async () => {
      // Mock getUserTeamRole to return null
      vi.spyOn(permissionService, "getUserTeamRole").mockResolvedValueOnce(
        null
      );

      await expect(
        permissionService.validateTeamPermission(
          "user-123",
          "team-456",
          "canEditBoards",
          "test-board"
        )
      ).rejects.toThrow(PermissionError);
    });
  });
});
