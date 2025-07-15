import { useQuery } from "@tanstack/react-query";
import {
  TeamPermissions,
  TeamRole,
  TeamMemberWithPermissions,
  BoardAccess,
} from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";

// Create a repository instance
const teamMemberRepository = new TeamMemberRepository(supabase);

/**
 * Hook to get a user's permissions for a specific team
 * @param teamId The team ID to get permissions for
 * @returns Object containing permissions, role, and loading state
 */
export function useTeamPermissions(teamId: string | undefined) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["permissions", "team", teamId, user?.id],
    queryFn: async () => {
      if (!teamId || !user?.id) return null;
      return teamMemberRepository.getUserTeamPermissions(user.id, teamId);
    },
    enabled: !!teamId && !!user?.id,
  });

  const isOwner = data?.role === "owner";
  const isEditor = data?.role === "editor";
  const isViewer = data?.role === "viewer";

  return {
    permissions: data?.permissions,
    role: data?.role,
    userId: data?.userId,
    teamId: data?.teamId,
    isOwner,
    isEditor,
    isViewer,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get a user's permissions for a specific board
 * @param boardId The board ID to get permissions for
 * @returns Object containing permissions, role, and loading state
 */
export function useBoardPermissions(boardId: string | undefined) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["permissions", "board", boardId, user?.id],
    queryFn: async () => {
      if (!boardId || !user?.id) return null;
      return teamMemberRepository.getUserBoardPermissions(user.id, boardId);
    },
    enabled: !!boardId && !!user?.id,
  });

  const isOwner = data?.role === "owner";
  const isEditor = data?.role === "editor";
  const isViewer = data?.role === "viewer";

  const canEditBoard = !!data?.permissions?.canEditBoards;
  const canDeleteBoard = !!data?.permissions?.canDeleteBoards;
  const canCreateTasks = !!data?.permissions?.canCreateTasks;
  const canEditTasks = !!data?.permissions?.canEditTasks;

  return {
    permissions: data?.permissions,
    role: data?.role,
    userId: data?.userId,
    boardId: data?.boardId,
    teamId: data?.teamId,
    isOwner,
    isEditor,
    isViewer,
    canEditBoard,
    canDeleteBoard,
    canCreateTasks,
    canEditTasks,
    canView: data?.canView,
    canEdit: data?.canEdit,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get a user's permissions for a specific task
 * @param taskId The task ID to get permissions for
 * @returns Object containing permissions, role, and loading state
 */
export function useTaskPermissions(taskId: string | undefined) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["permissions", "task", taskId, user?.id],
    queryFn: async () => {
      if (!taskId || !user?.id) return null;

      // First get the board ID for the task
      const { data: taskData } = await supabase
        .from("tasks")
        .select("board_id")
        .eq("id", taskId)
        .single();

      if (!taskData || !taskData.board_id) return null;

      // Then get the board permissions
      return teamMemberRepository.getUserBoardPermissions(
        user.id,
        taskData.board_id
      );
    },
    enabled: !!taskId && !!user?.id,
  });

  const isOwner = data?.role === "owner";
  const isEditor = data?.role === "editor";
  const isViewer = data?.role === "viewer";

  const canEditTask = !!data?.permissions?.canEditTasks;
  const canDeleteTask = !!data?.permissions?.canDeleteTasks;
  const canAssignTask = !!data?.permissions?.canAssignTasks;
  const canCreateTodos = !!data?.permissions?.canCreateTodos;
  const canEditTodos = !!data?.permissions?.canEditTodos;
  const canToggleTodos = !!data?.permissions?.canToggleTodos;

  return {
    permissions: data?.permissions,
    role: data?.role,
    userId: data?.userId,
    teamId: data?.teamId,
    boardId: data?.boardId,
    isOwner,
    isEditor,
    isViewer,
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canCreateTodos,
    canEditTodos,
    canToggleTodos,
    canView: data?.canView,
    canEdit: data?.canEdit,
    isLoading,
    error,
    refetch,
  };
}
