import { useState, useEffect } from "react";
import { TaskWithContext, TaskFilters, TaskSorting } from "@/types";
import { UserTaskRepository } from "@/api/repositories/UserTaskRepository";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

/**
 * Hook for managing user tasks across teams and boards
 */
export function useUserTasks(filters?: TaskFilters, sorting?: TaskSorting) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = new UserTaskRepository(supabase);

  const loadTasks = async () => {
    if (!user?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tasksData = await repository.findAssignedTasks(
        user.id,
        filters,
        sorting
      );
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id, filters, sorting]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!user?.id) return;

    try {
      await repository.updateTaskStatus(taskId, user.id, status);

      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: status as any } : task
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task status"
      );
      throw err;
    }
  };

  const getTeamsWithTasks = async () => {
    if (!user?.id) return [];
    return repository.getTeamsWithAssignedTasks(user.id);
  };

  const getBoardsWithTasks = async (teamId?: string) => {
    if (!user?.id) return [];
    return repository.getBoardsWithAssignedTasks(user.id, teamId);
  };

  const countTasks = async (filters?: TaskFilters) => {
    if (!user?.id) return 0;
    return repository.countAssignedTasks(user.id, filters);
  };

  return {
    tasks,
    loading,
    error,
    loadTasks,
    updateTaskStatus,
    getTeamsWithTasks,
    getBoardsWithTasks,
    countTasks,
  };
}
