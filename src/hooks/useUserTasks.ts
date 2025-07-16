import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskWithContext, TaskFilters, TaskSorting, TaskStatus } from "@/types";
import { UserTaskRepository } from "@/api/repositories/UserTaskRepository";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

// Create repository instance
const userTaskRepository = new UserTaskRepository(supabase);

/**
 * Hook for managing user tasks across teams and boards using React Query
 */
export function useUserTasks(filters?: TaskFilters, sorting?: TaskSorting) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Main query for user tasks
  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch: loadTasks,
  } = useQuery({
    queryKey: ["userTasks", user?.id, filters, sorting],
    queryFn: () =>
      userTaskRepository.findAssignedTasks(user!.id, filters, sorting),
    enabled: !!user?.id,
  });

  // Query for teams with tasks
  const { data: teamsWithTasks = [] } = useQuery({
    queryKey: ["userTaskTeams", user?.id],
    queryFn: () => userTaskRepository.getTeamsWithAssignedTasks(user!.id),
    enabled: !!user?.id,
  });

  // Query for boards with tasks
  const getBoardsWithTasksQuery = (teamId?: string) =>
    useQuery({
      queryKey: ["userTaskBoards", user?.id, teamId],
      queryFn: () =>
        userTaskRepository.getBoardsWithAssignedTasks(user!.id, teamId),
      enabled: !!user?.id,
    });

  // Query for task count
  const getTaskCountQuery = (countFilters?: TaskFilters) =>
    useQuery({
      queryKey: ["userTaskCount", user?.id, countFilters],
      queryFn: () =>
        userTaskRepository.countAssignedTasks(user!.id, countFilters),
      enabled: !!user?.id,
    });

  // Mutation for updating task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      userTaskRepository.updateTaskStatus(taskId, user!.id, status),
    onSuccess: (_, { taskId, status }) => {
      // Invalidate and refetch user tasks
      queryClient.invalidateQueries({ queryKey: ["userTasks", user?.id] });

      // Optimistically update the cache
      queryClient.setQueryData(
        ["userTasks", user?.id, filters, sorting],
        (oldTasks: TaskWithContext[] | undefined) =>
          oldTasks?.map((task) =>
            task.id === taskId ? { ...task, status } : task
          ) || []
      );
    },
    onError: (error) => {
      console.error("Failed to update task status:", error);
    },
  });

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    return updateTaskStatusMutation.mutateAsync({ taskId, status });
  };

  // Helper functions that return query results
  const getTeamsWithTasks = () => teamsWithTasks;

  const getBoardsWithTasks = (teamId?: string) => {
    const query = getBoardsWithTasksQuery(teamId);
    return query.data || [];
  };

  const countTasks = (countFilters?: TaskFilters) => {
    const query = getTaskCountQuery(countFilters);
    return query.data || 0;
  };

  return {
    tasks,
    loading,
    error: error?.message || null,
    loadTasks,
    updateTaskStatus,
    getTeamsWithTasks,
    getBoardsWithTasks,
    countTasks,
    // Expose additional React Query states
    isUpdatingStatus: updateTaskStatusMutation.isPending,
    updateError: updateTaskStatusMutation.error?.message || null,
  };
}
