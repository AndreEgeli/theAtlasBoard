import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserTaskRepository } from "../UserTaskRepository";
import { TaskStatus } from "@/types";

// Mock the PermissionService
vi.mock("@/lib/services/PermissionService", () => ({
  PermissionService: vi.fn().mockImplementation(() => ({
    getUserTeamPermissions: vi.fn(async (userId, teamId) => {
      if (teamId === "team-no-access") {
        return null;
      }

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
    }),
    canUserEditTask: vi.fn(async (userId, taskId) => {
      return taskId !== "task-no-edit-permission";
    }),
  })),
}));

describe("UserTaskRepository", () => {
  let repository: UserTaskRepository;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn(),
    };

    // @ts-ignore - We're using a mock
    repository = new UserTaskRepository(mockSupabase);
  });

  describe("findAssignedTasks", () => {
    it("should return tasks assigned to the user with context", async () => {
      // Setup mock data
      const mockTaskData = [
        {
          tasks: {
            id: "task-1",
            title: "Task 1",
            status: "pending",
            created_at: "2023-01-01T00:00:00Z",
            deadline_at: "2023-01-10T00:00:00Z",
            todos: [{ id: "todo-1", title: "Todo 1" }],
            task_tags: [{ tags: { id: "tag-1", name: "Tag 1" } }],
            task_assignees: [{ users: { id: "user-1", name: "User 1" } }],
            boards: {
              id: "board-1",
              name: "Board 1",
              teams: {
                id: "team-1",
                name: "Team 1",
              },
            },
          },
        },
        {
          tasks: {
            id: "task-2",
            title: "Task 2",
            status: "completed",
            created_at: "2023-01-02T00:00:00Z",
            deadline_at: "2023-01-15T00:00:00Z",
            todos: [{ id: "todo-2", title: "Todo 2" }],
            task_tags: [{ tags: { id: "tag-2", name: "Tag 2" } }],
            task_assignees: [{ users: { id: "user-1", name: "User 1" } }],
            boards: {
              id: "board-2",
              name: "Board 2",
              teams: {
                id: "team-2",
                name: "Team 2",
              },
            },
          },
        },
      ];

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: mockTaskData,
        error: null,
      });

      const result = await repository.findAssignedTasks("user-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("task-1");
      expect(result[0].boardId).toBe("board-1");
      expect(result[0].boardName).toBe("Board 1");
      expect(result[0].teamId).toBe("team-1");
      expect(result[0].teamName).toBe("Team 1");
      expect(result[0].userPermissions).toBeDefined();
      expect(result[0].task_todos).toHaveLength(1);
      expect(result[0].task_tags).toHaveLength(1);
      expect(result[0].task_assignees).toHaveLength(1);

      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining("tasks!task_assignees_task_id_fkey")
      );
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("should apply filters when provided", async () => {
      // Setup mock data with tasks that match different filter criteria
      const mockTaskData = [
        {
          tasks: {
            id: "task-1",
            title: "Task 1",
            status: "pending",
            deadline_at: "2023-01-05T00:00:00Z",
            boards: {
              id: "board-1",
              name: "Board 1",
              teams: {
                id: "team-1",
                name: "Team 1",
              },
            },
            todos: [],
            task_tags: [],
            task_assignees: [],
          },
        },
        {
          tasks: {
            id: "task-2",
            title: "Task 2",
            status: "started",
            deadline_at: "2023-01-15T00:00:00Z",
            boards: {
              id: "board-2",
              name: "Board 2",
              teams: {
                id: "team-2",
                name: "Team 2",
              },
            },
            todos: [],
            task_tags: [],
            task_assignees: [],
          },
        },
        {
          tasks: {
            id: "task-3",
            title: "Task 3",
            status: "completed", // Should be filtered out
            deadline_at: "2023-01-20T00:00:00Z",
            boards: {
              id: "board-3",
              name: "Board 3",
              teams: {
                id: "team-3",
                name: "Team 3",
              },
            },
            todos: [],
            task_tags: [],
            task_assignees: [],
          },
        },
      ];

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: mockTaskData,
        error: null,
      });

      const filters = {
        status: ["pending", "started"] as TaskStatus[],
        teamIds: ["team-1", "team-2"],
        boardIds: ["board-1", "board-2"],
        dueDateRange: {
          start: "2023-01-01",
          end: "2023-01-31",
        },
      };

      const result = await repository.findAssignedTasks("user-1", filters);

      // Should only return the first two tasks that match all filters
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("task-1");
      expect(result[1].id).toBe("task-2");

      // Verify the third task was filtered out
      const taskIds = result.map((task) => task.id);
      expect(taskIds).not.toContain("task-3");

      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining("tasks!task_assignees_task_id_fkey")
      );
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("should apply sorting when provided", async () => {
      // Setup mock data
      const mockTaskData = [
        {
          tasks: {
            id: "task-1",
            title: "Task 1",
            status: "pending",
            created_at: "2023-01-02T00:00:00Z",
            deadline_at: "2023-01-15T00:00:00Z",
            todos: [],
            task_tags: [],
            task_assignees: [],
            boards: {
              id: "board-1",
              name: "Board 1",
              teams: {
                id: "team-1",
                name: "Team 1",
              },
            },
          },
        },
        {
          tasks: {
            id: "task-2",
            title: "Task 2",
            status: "completed",
            created_at: "2023-01-01T00:00:00Z",
            deadline_at: "2023-01-10T00:00:00Z",
            todos: [],
            task_tags: [],
            task_assignees: [],
            boards: {
              id: "board-2",
              name: "Board 2",
              teams: {
                id: "team-2",
                name: "Team 2",
              },
            },
          },
        },
      ];

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: mockTaskData,
        error: null,
      });

      // Test sorting by due date ascending
      const result = await repository.findAssignedTasks("user-1", undefined, {
        field: "dueDate",
        direction: "asc",
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("task-2"); // Earlier deadline should be first
      expect(result[1].id).toBe("task-1");

      // Test sorting by created date descending
      const result2 = await repository.findAssignedTasks("user-1", undefined, {
        field: "createdAt",
        direction: "desc",
      });

      expect(result2).toHaveLength(2);
      expect(result2[0].id).toBe("task-1"); // Later creation date should be first
      expect(result2[1].id).toBe("task-2");
    });
  });

  describe("updateTaskStatus", () => {
    it("should update task status when user has permission", async () => {
      // Setup the mock chain
      const mockUpdate = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: { id: "task-1", status: "completed" },
        error: null,
      });

      await repository.updateTaskStatus("task-1", "user-1", "completed");

      expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          updated_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "task-1");
    });

    it("should throw error when user doesn't have permission", async () => {
      await expect(
        repository.updateTaskStatus(
          "task-no-edit-permission",
          "user-1",
          "completed"
        )
      ).rejects.toThrow("You don't have permission to update this task");

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("getTeamsWithAssignedTasks", () => {
    it("should return unique teams where user has assigned tasks", async () => {
      // Setup mock data
      const mockData = [
        {
          tasks: {
            boards: {
              teams: {
                id: "team-1",
                name: "Team 1",
              },
            },
          },
        },
        {
          tasks: {
            boards: {
              teams: {
                id: "team-1", // Duplicate team
                name: "Team 1",
              },
            },
          },
        },
        {
          tasks: {
            boards: {
              teams: {
                id: "team-2",
                name: "Team 2",
              },
            },
          },
        },
      ];

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getTeamsWithAssignedTasks("user-1");

      expect(result).toHaveLength(2); // Should deduplicate teams
      expect(result[0].id).toBe("team-1");
      expect(result[0].name).toBe("Team 1");
      expect(result[1].id).toBe("team-2");
      expect(result[1].name).toBe("Team 2");

      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining("tasks!task_assignees_task_id_fkey")
      );
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("getBoardsWithAssignedTasks", () => {
    it("should return boards where user has assigned tasks", async () => {
      // Setup mock data
      const mockData = [
        {
          tasks: {
            boards: {
              id: "board-1",
              name: "Board 1",
              teams: {
                id: "team-1",
              },
            },
          },
        },
        {
          tasks: {
            boards: {
              id: "board-2",
              name: "Board 2",
              teams: {
                id: "team-1",
              },
            },
          },
        },
      ];

      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getBoardsWithAssignedTasks("user-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("board-1");
      expect(result[0].name).toBe("Board 1");
      expect(result[0].teamId).toBe("team-1");
      expect(result[1].id).toBe("board-2");
      expect(result[1].name).toBe("Board 2");
      expect(result[1].teamId).toBe("team-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining("tasks!task_assignees_task_id_fkey")
      );
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("should filter boards by team when teamId is provided", async () => {
      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq1 = vi.fn();
      const mockEq2 = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getBoardsWithAssignedTasks("user-1", "team-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockEq1).toHaveBeenCalledWith("user_id", "user-1");
      expect(mockEq2).toHaveBeenCalledWith("tasks.boards.team_id", "team-1");
    });
  });

  describe("countAssignedTasks", () => {
    it("should return the count of assigned tasks", async () => {
      // Setup the mock chain
      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        count: 5,
        error: null,
      });

      const result = await repository.countAssignedTasks("user-1");

      expect(result).toBe(5);
      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockSelect).toHaveBeenCalledWith("task_id", { count: "exact" });
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("should apply filters when provided", async () => {
      // Setup the mock chain for tasks
      const mockTasksSelect = vi.fn();
      const mockTasksIn = vi.fn();

      // Setup the mock chain for task_assignees
      const mockAssigneesSelect = vi.fn();
      const mockAssigneesEq = vi.fn();
      const mockAssigneesIn = vi.fn();

      // First query to get task IDs with matching status
      mockSupabase.from.mockReturnValueOnce({
        select: mockTasksSelect.mockReturnValue({
          in: mockTasksIn.mockResolvedValue({
            data: [{ id: "task-1" }, { id: "task-2" }],
            error: null,
          }),
        }),
      });

      // Second query to count task_assignees
      mockSupabase.from.mockReturnValueOnce({
        select: mockAssigneesSelect.mockReturnValue({
          eq: mockAssigneesEq.mockReturnValue({
            in: mockAssigneesIn.mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        }),
      });

      const filters = {
        status: ["pending", "started"] as TaskStatus[],
      };

      const result = await repository.countAssignedTasks("user-1", filters);

      expect(result).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
      expect(mockTasksIn).toHaveBeenCalledWith("status", [
        "pending",
        "started",
      ]);
      expect(mockSupabase.from).toHaveBeenCalledWith("task_assignees");
      expect(mockAssigneesEq).toHaveBeenCalledWith("user_id", "user-1");
      expect(mockAssigneesIn).toHaveBeenCalledWith("task_id", [
        "task-1",
        "task-2",
      ]);
    });
  });
});
