import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserTaskView } from "../UserTaskView";
import { TaskWithContext } from "@/types";

// Mock the hooks and dependencies
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1", email: "test@example.com" },
  })),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {},
}));

vi.mock("@/api/repositories/UserTaskRepository", () => ({
  UserTaskRepository: vi.fn().mockImplementation(() => ({
    findAssignedTasks: vi.fn().mockResolvedValue([]),
    getTeamsWithAssignedTasks: vi.fn().mockResolvedValue([]),
    getBoardsWithAssignedTasks: vi.fn().mockResolvedValue([]),
    updateTaskStatus: vi.fn().mockResolvedValue(undefined),
  })),
}));

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
    deadline_at: null,
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
      canRemoveTaskTags: false,
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

describe("UserTaskView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<UserTaskView />);

    expect(screen.getByText("Loading your tasks...")).toBeInTheDocument();
  });

  it("should render tasks when loaded", async () => {
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockResolvedValue(mockTasks);
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([
      { id: "team-1", name: "Test Team 1" },
      { id: "team-2", name: "Test Team 2" },
    ]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([
      { id: "board-1", name: "Test Board 1", teamId: "team-1" },
      { id: "board-2", name: "Test Board 2", teamId: "team-2" },
    ]);

    render(<UserTaskView />);

    await waitFor(() => {
      expect(screen.getByText("My Tasks")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    expect(screen.getByText("Test Task 2")).toBeInTheDocument();
  });

  it("should filter tasks by search query", async () => {
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockResolvedValue(mockTasks);
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([]);

    render(<UserTaskView />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.change(searchInput, { target: { value: "Task 1" } });

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Task 2")).not.toBeInTheDocument();
    });
  });

  it("should call onTaskClick when task is clicked", async () => {
    const mockOnTaskClick = vi.fn();
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockResolvedValue(mockTasks);
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([]);

    render(<UserTaskView onTaskClick={mockOnTaskClick} />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Test Task 1"));
    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("should show different tabs with correct task counts", async () => {
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockResolvedValue(mockTasks);
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([]);

    render(<UserTaskView />);

    await waitFor(() => {
      expect(screen.getByText("All (2)")).toBeInTheDocument();
    });

    expect(screen.getByText("Pending (1)")).toBeInTheDocument();
    expect(screen.getByText("Done (1)")).toBeInTheDocument();
  });

  it("should update task status when quick action is clicked", async () => {
    const mockOnTaskStatusUpdate = vi.fn();
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockResolvedValue(mockTasks);
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.updateTaskStatus).mockResolvedValue(undefined);

    render(<UserTaskView onTaskStatusUpdate={mockOnTaskStatusUpdate} />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    // Find and click the start button for the first task
    const startButtons = screen.getAllByRole("button");
    const startButton = startButtons.find(
      (button) =>
        button.querySelector("svg") &&
        button.getAttribute("aria-label") === null
    );

    if (startButton) {
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockRepository.updateTaskStatus).toHaveBeenCalledWith(
          "task-1",
          "user-1",
          "started"
        );
      });
    }
  });

  it("should handle error state", async () => {
    const { UserTaskRepository } = await import(
      "@/api/repositories/UserTaskRepository"
    );
    const mockRepository = new UserTaskRepository({} as any);

    vi.mocked(mockRepository.findAssignedTasks).mockRejectedValue(
      new Error("Failed to load")
    );
    vi.mocked(mockRepository.getTeamsWithAssignedTasks).mockResolvedValue([]);
    vi.mocked(mockRepository.getBoardsWithAssignedTasks).mockResolvedValue([]);

    render(<UserTaskView />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});
