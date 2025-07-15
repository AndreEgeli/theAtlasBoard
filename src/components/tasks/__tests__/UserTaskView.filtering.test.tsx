import { describe, it, expect } from "vitest";
import { TaskWithContext, TaskFilters, TaskSorting } from "@/types";

// Test data
const mockTasks: TaskWithContext[] = [
  {
    id: "task-1",
    title: "Test Task 1",
    description: "Test description 1",
    status: "pending",
    created_at: "2023-01-01T00:00:00Z",
    deadline_at: "2023-01-10T00:00:00Z",
    boardId: "board-1",
    boardName: "Test Board 1",
    teamId: "team-1",
    teamName: "Test Team 1",
    userPermissions: {
      canViewTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canCreateTasks: false,
      canAssignTasks: false,
      canViewBoards: true,
      canEditBoards: false,
      canDeleteBoards: false,
      canCreateBoards: false,
      canViewTodos: true,
      canEditTodos: true,
      canDeleteTodos: true,
      canCreateTodos: true,
      canToggleTodos: true,
      canAddTaskTags: false,
      canRemoveTaskTags: false,
    },
    task_todos: [],
    task_tags: [],
    task_assignees: [],
    created_by: "user-1",
    updated_at: null,
    board_id: "board-1",
    order: 1,
    x_index: 0,
    y_index: 0,
  },
  {
    id: "task-2",
    title: "Test Task 2",
    description: "Test description 2",
    status: "completed",
    created_at: "2023-01-02T00:00:00Z",
    deadline_at: "2023-01-15T00:00:00Z",
    boardId: "board-2",
    boardName: "Test Board 2",
    teamId: "team-2",
    teamName: "Test Team 2",
    userPermissions: {
      canViewTasks: true,
      canEditTasks: false,
      canDeleteTasks: false,
      canCreateTasks: false,
      canAssignTasks: false,
      canViewBoards: true,
      canEditBoards: false,
      canDeleteBoards: false,
      canCreateBoards: false,
      canViewTodos: true,
      canEditTodos: false,
      canDeleteTodos: false,
      canCreateTodos: false,
      canToggleTodos: false,
      canAddTaskTags: false,
      canRemoveTaskTasks: false,
    },
    task_todos: [],
    task_tags: [],
    task_assignees: [],
    created_by: "user-2",
    updated_at: null,
    board_id: "board-2",
    order: 1,
    x_index: 0,
    y_index: 0,
  },
];

// Helper functions to test filtering and sorting logic
function applySearchFilter(
  tasks: TaskWithContext[],
  searchQuery: string
): TaskWithContext[] {
  if (!searchQuery.trim()) {
    return tasks;
  }

  const query = searchQuery.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.boardName.toLowerCase().includes(query) ||
      task.teamName.toLowerCase().includes(query)
  );
}

function applySorting(
  tasks: TaskWithContext[],
  sorting: TaskSorting
): TaskWithContext[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sorting.field) {
      case "dueDate":
        if (!a.deadline_at && !b.deadline_at) return 0;
        if (!a.deadline_at) return sorting.direction === "asc" ? 1 : -1;
        if (!b.deadline_at) return sorting.direction === "asc" ? -1 : 1;
        comparison =
          new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
        break;
      case "createdAt":
        comparison =
          new Date(a.created_at || "").getTime() -
          new Date(b.created_at || "").getTime();
        break;
      case "updatedAt":
        if (!a.updated_at && !b.updated_at) return 0;
        if (!a.updated_at) return sorting.direction === "asc" ? 1 : -1;
        if (!b.updated_at) return sorting.direction === "asc" ? -1 : 1;
        comparison =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "priority":
        comparison = 0; // Placeholder for priority sorting
        break;
      default:
        comparison = 0;
    }

    return sorting.direction === "asc" ? comparison : -comparison;
  });
}

function groupTasksByStatus(tasks: TaskWithContext[]) {
  return {
    all: tasks,
    pending: tasks.filter((t) => t.status === "pending" || !t.status),
    started: tasks.filter((t) => t.status === "started"),
    in_review: tasks.filter((t) => t.status === "in_review"),
    completed: tasks.filter((t) => t.status === "completed"),
  };
}

describe("UserTaskView Filtering and Sorting Logic", () => {
  describe("Search Filtering", () => {
    it("should filter tasks by title", () => {
      const result = applySearchFilter(mockTasks, "Task 1");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Task 1");
    });

    it("should filter tasks by description", () => {
      const result = applySearchFilter(mockTasks, "description 2");
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("Test description 2");
    });

    it("should filter tasks by board name", () => {
      const result = applySearchFilter(mockTasks, "Board 1");
      expect(result).toHaveLength(1);
      expect(result[0].boardName).toBe("Test Board 1");
    });

    it("should filter tasks by team name", () => {
      const result = applySearchFilter(mockTasks, "Team 2");
      expect(result).toHaveLength(1);
      expect(result[0].teamName).toBe("Test Team 2");
    });

    it("should return all tasks when search query is empty", () => {
      const result = applySearchFilter(mockTasks, "");
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no tasks match search", () => {
      const result = applySearchFilter(mockTasks, "nonexistent");
      expect(result).toHaveLength(0);
    });
  });

  describe("Sorting", () => {
    it("should sort tasks by due date ascending", () => {
      const sorting: TaskSorting = { field: "dueDate", direction: "asc" };
      const result = applySorting(mockTasks, sorting);

      expect(result[0].deadline_at).toBe("2023-01-10T00:00:00Z");
      expect(result[1].deadline_at).toBe("2023-01-15T00:00:00Z");
    });

    it("should sort tasks by due date descending", () => {
      const sorting: TaskSorting = { field: "dueDate", direction: "desc" };
      const result = applySorting(mockTasks, sorting);

      expect(result[0].deadline_at).toBe("2023-01-15T00:00:00Z");
      expect(result[1].deadline_at).toBe("2023-01-10T00:00:00Z");
    });

    it("should sort tasks by created date ascending", () => {
      const sorting: TaskSorting = { field: "createdAt", direction: "asc" };
      const result = applySorting(mockTasks, sorting);

      expect(result[0].created_at).toBe("2023-01-01T00:00:00Z");
      expect(result[1].created_at).toBe("2023-01-02T00:00:00Z");
    });

    it("should sort tasks by created date descending", () => {
      const sorting: TaskSorting = { field: "createdAt", direction: "desc" };
      const result = applySorting(mockTasks, sorting);

      expect(result[0].created_at).toBe("2023-01-02T00:00:00Z");
      expect(result[1].created_at).toBe("2023-01-01T00:00:00Z");
    });
  });

  describe("Status Grouping", () => {
    it("should group tasks by status correctly", () => {
      const grouped = groupTasksByStatus(mockTasks);

      expect(grouped.all).toHaveLength(2);
      expect(grouped.pending).toHaveLength(1);
      expect(grouped.started).toHaveLength(0);
      expect(grouped.in_review).toHaveLength(0);
      expect(grouped.completed).toHaveLength(1);
    });

    it("should include tasks with null status in pending group", () => {
      const tasksWithNullStatus = [
        { ...mockTasks[0], status: null as any },
        mockTasks[1],
      ];

      const grouped = groupTasksByStatus(tasksWithNullStatus);
      expect(grouped.pending).toHaveLength(1);
    });
  });

  describe("Filter Integration", () => {
    it("should apply search filter and then sorting", () => {
      const searchResult = applySearchFilter(mockTasks, "Test");
      const sorting: TaskSorting = { field: "createdAt", direction: "desc" };
      const sortedResult = applySorting(searchResult, sorting);

      expect(sortedResult).toHaveLength(2);
      expect(sortedResult[0].created_at).toBe("2023-01-02T00:00:00Z");
      expect(sortedResult[1].created_at).toBe("2023-01-01T00:00:00Z");
    });
  });
});
