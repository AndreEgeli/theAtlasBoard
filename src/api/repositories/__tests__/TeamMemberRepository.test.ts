import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamMemberRepository } from "../TeamMemberRepository";
import { PermissionService } from "@/lib/services/PermissionService";
import { TeamRole, TeamPermissions } from "@/types";

// Mock the PermissionService
vi.mock("@/lib/services/PermissionService", () => ({
  PermissionService: vi.fn().mockImplementation(() => ({
    getTeamPermissions: vi.fn((role: TeamRole) => {
      if (role === "owner" || role === "editor") {
        return {
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
      } else {
        return {
          canCreateBoards: false,
          canEditBoards: false,
          canDeleteBoards: false,
          canViewBoards: true,
          canCreateTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canAssignTasks: false,
          canViewTasks: true,
          canCreateTodos: false,
          canEditTodos: false,
          canDeleteTodos: false,
          canToggleTodos: false,
          canViewTodos: true,
          canAddTaskTags: false,
          canRemoveTaskTags: false,
        };
      }
    }),
  })),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("TeamMemberRepository", () => {
  let repository: TeamMemberRepository;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn(),
    };

    // @ts-ignore - We're using a mock
    repository = new TeamMemberRepository(mockSupabase);
  });

  describe("getUserTeamPermissions", () => {
    it("should return team member with permissions when user is a team member", async () => {
      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq1 = vi.fn();
      const mockEq2 = vi.fn();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: { role: "editor" },
        error: null,
      });

      const result = await repository.getUserTeamPermissions(
        "user-123",
        "team-456"
      );

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-123");
      expect(result?.teamId).toBe("team-456");
      expect(result?.role).toBe("editor");
      expect(result?.permissions.canEditBoards).toBe(true);

      expect(mockSupabase.from).toHaveBeenCalledWith("team_members");
      expect(mockSelect).toHaveBeenCalledWith("role");
      expect(mockEq1).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockEq2).toHaveBeenCalledWith("team_id", "team-456");
    });

    it("should return null when user is not a team member", async () => {
      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq1 = vi.fn();
      const mockEq2 = vi.fn();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "No data found" },
      });

      const result = await repository.getUserTeamPermissions(
        "user-123",
        "team-456"
      );

      expect(result).toBeNull();
    });
  });

  describe("getUserBoardPermissions", () => {
    it("should return board access when user has access to the board", async () => {
      // Setup the mock chain for board query
      const mockBoardSelect = vi.fn();
      const mockBoardEq = vi.fn();
      const mockBoardSingle = vi.fn();

      mockSupabase.from.mockReturnValueOnce({ select: mockBoardSelect });
      mockBoardSelect.mockReturnValue({ eq: mockBoardEq });
      mockBoardEq.mockReturnValue({ single: mockBoardSingle });
      mockBoardSingle.mockResolvedValue({
        data: { team_id: "team-456" },
        error: null,
      });

      // Setup the mock chain for team member query
      const mockTeamSelect = vi.fn();
      const mockTeamEq1 = vi.fn();
      const mockTeamEq2 = vi.fn();
      const mockTeamSingle = vi.fn();

      mockSupabase.from.mockReturnValueOnce({ select: mockTeamSelect });
      mockTeamSelect.mockReturnValue({ eq: mockTeamEq1 });
      mockTeamEq1.mockReturnValue({ eq: mockTeamEq2 });
      mockTeamEq2.mockReturnValue({ single: mockTeamSingle });
      mockTeamSingle.mockResolvedValue({
        data: { role: "editor" },
        error: null,
      });

      const result = await repository.getUserBoardPermissions(
        "user-123",
        "board-789"
      );

      expect(result).not.toBeNull();
      expect(result?.boardId).toBe("board-789");
      expect(result?.userId).toBe("user-123");
      expect(result?.teamId).toBe("team-456");
      expect(result?.role).toBe("editor");
      expect(result?.canEdit).toBe(true);
      expect(result?.canView).toBe(true);
    });

    it("should return null when board does not exist", async () => {
      // Setup the mock chain for board query
      const mockBoardSelect = vi.fn();
      const mockBoardEq = vi.fn();
      const mockBoardSingle = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockBoardSelect });
      mockBoardSelect.mockReturnValue({ eq: mockBoardEq });
      mockBoardEq.mockReturnValue({ single: mockBoardSingle });
      mockBoardSingle.mockResolvedValue({
        data: null,
        error: { message: "No data found" },
      });

      const result = await repository.getUserBoardPermissions(
        "user-123",
        "board-789"
      );

      expect(result).toBeNull();
    });
  });

  describe("updateMemberRole", () => {
    it("should update a team member's role", async () => {
      // Setup the mock chain
      const mockUpdate = vi.fn();
      const mockEq1 = vi.fn();
      const mockEq2 = vi.fn();
      const mockSelect = vi.fn();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: { user_id: "user-123", team_id: "team-456", role: "editor" },
        error: null,
      });

      const result = await repository.updateMemberRole(
        "team-456",
        "user-123",
        "editor"
      );

      expect(result).toEqual({
        user_id: "user-123",
        team_id: "team-456",
        role: "editor",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("team_members");
      expect(mockUpdate).toHaveBeenCalledWith({ role: "editor" });
      expect(mockEq1).toHaveBeenCalledWith("team_id", "team-456");
      expect(mockEq2).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("getTeamsWithPermission", () => {
    it("should return teams where user has the specified permission", async () => {
      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: [
          { team_id: "team-1", role: "owner" },
          { team_id: "team-2", role: "editor" },
          { team_id: "team-3", role: "viewer" },
        ],
        error: null,
      });

      const result = await repository.getTeamsWithPermission(
        "user-123",
        "canEditBoards"
      );

      expect(result).toEqual(["team-1", "team-2"]);
      expect(mockSupabase.from).toHaveBeenCalledWith("team_members");
      expect(mockSelect).toHaveBeenCalledWith("team_id, role");
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("getBoardsWithPermission", () => {
    it("should return boards where user has the specified permission", async () => {
      // Mock getTeamsWithPermission
      vi.spyOn(repository, "getTeamsWithPermission").mockResolvedValue([
        "team-1",
        "team-2",
      ]);

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockIn = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ in: mockIn });
      mockIn.mockResolvedValue({
        data: [{ id: "board-1" }, { id: "board-2" }, { id: "board-3" }],
        error: null,
      });

      const result = await repository.getBoardsWithPermission(
        "user-123",
        "canEditBoards"
      );

      expect(result).toEqual(["board-1", "board-2", "board-3"]);
      expect(repository.getTeamsWithPermission).toHaveBeenCalledWith(
        "user-123",
        "canEditBoards"
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("boards");
      expect(mockSelect).toHaveBeenCalledWith("id");
      expect(mockIn).toHaveBeenCalledWith("team_id", ["team-1", "team-2"]);
    });

    it("should return empty array when user has no teams with permission", async () => {
      // Mock getTeamsWithPermission
      vi.spyOn(repository, "getTeamsWithPermission").mockResolvedValue([]);

      const result = await repository.getBoardsWithPermission(
        "user-123",
        "canEditBoards"
      );

      expect(result).toEqual([]);
      expect(repository.getTeamsWithPermission).toHaveBeenCalledWith(
        "user-123",
        "canEditBoards"
      );
      // Should not query boards if no teams
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
