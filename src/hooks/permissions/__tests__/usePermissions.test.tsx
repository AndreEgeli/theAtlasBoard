import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useTeamPermissions,
  useBoardPermissions,
  useTaskPermissions,
} from "../usePermissions";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock the auth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}));

// Mock the TeamMemberRepository
vi.mock("@/api/repositories/TeamMemberRepository", () => ({
  TeamMemberRepository: vi.fn().mockImplementation(() => ({
    getUserTeamPermissions: vi.fn().mockResolvedValue({
      userId: "test-user-id",
      teamId: "test-team-id",
      role: "editor",
      permissions: {
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
      },
    }),
    getUserBoardPermissions: vi.fn().mockResolvedValue({
      userId: "test-user-id",
      teamId: "test-team-id",
      boardId: "test-board-id",
      role: "editor",
      permissions: {
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
      },
      canEdit: true,
      canView: true,
    }),
  })),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockImplementation((table) => {
      if (table === "tasks") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { board_id: "test-board-id" },
            error: null,
          }),
        };
      }
      return {};
    }),
  },
}));

// Create a wrapper with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useTeamPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns permissions for a team", async () => {
    const { result } = renderHook(() => useTeamPermissions("test-team-id"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check the returned values
    expect(result.current.role).toBe("editor");
    expect(result.current.isEditor).toBe(true);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isViewer).toBe(false);
    expect(result.current.permissions?.canEditBoards).toBe(true);
    expect(result.current.userId).toBe("test-user-id");
    expect(result.current.teamId).toBe("test-team-id");
  });

  it("returns undefined when teamId is undefined", async () => {
    const { result } = renderHook(() => useTeamPermissions(undefined), {
      wrapper: createWrapper(),
    });

    // Should not be loading since the query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.role).toBeUndefined();
    expect(result.current.permissions).toBeUndefined();
  });
});

describe("useBoardPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns permissions for a board", async () => {
    const { result } = renderHook(() => useBoardPermissions("test-board-id"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check the returned values
    expect(result.current.role).toBe("editor");
    expect(result.current.canEditBoard).toBe(true);
    expect(result.current.canCreateTasks).toBe(true);
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.userId).toBe("test-user-id");
    expect(result.current.teamId).toBe("test-team-id");
    expect(result.current.boardId).toBe("test-board-id");
  });
});

describe("useTaskPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns permissions for a task", async () => {
    const { result } = renderHook(() => useTaskPermissions("test-task-id"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check the returned values
    expect(result.current.role).toBe("editor");
    expect(result.current.canEditTask).toBe(true);
    expect(result.current.canCreateTodos).toBe(true);
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.userId).toBe("test-user-id");
    expect(result.current.teamId).toBe("test-team-id");
    expect(result.current.boardId).toBe("test-board-id");
  });
});
