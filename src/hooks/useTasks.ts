import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, updateTask, moveTask, deleteTask } from "../api/tasks";
import type { Task, CellPosition } from "../types";
import { supabase } from "../lib/supabase";
import { useOptimistic } from "./useOptimistic";

export function useTasks(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", boardId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          todos (*),
          task_tags (tag_id)
        `
        )
        .eq("board_id", boardId)
        .order("order");

      if (error) throw error;

      return data.map((task: any) => ({
        ...task,
        tags: task.task_tags.map((tt: any) => tt.tag_id),
      }));
    },
    enabled: !!boardId,
  });

  const createTaskMutation = useOptimistic<Task[], Omit<Task, "id">>({
    queryKey,
    mutationFn: (task) => createTask(boardId, task),
    updateCache: (oldTasks, newTask) => [
      ...oldTasks,
      { ...newTask, id: crypto.randomUUID() },
    ],
  });

  const updateTaskMutation = useOptimistic<
    Task[],
    { id: string; updates: Partial<Task> }
  >({
    queryKey,
    mutationFn: ({ id, updates }) => updateTask(id, updates),
    updateCache: (oldTasks, { id, updates }) =>
      oldTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updates,
              // Add any specific optimistic update logic here
              // For example, updating timestamps or derived fields
            }
          : task
      ),
  });

  const moveTaskMutation = useOptimistic<
    Task[],
    { id: string; position: CellPosition }
  >({
    queryKey,
    mutationFn: ({ id, position }) => moveTask(id, position),
    updateCache: (oldTasks, { id, position }) =>
      oldTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              importance: position.importance,
              timeframe: position.timeframe,
            }
          : task
      ),
  });

  const deleteTaskMutation = useOptimistic<Task[], string>({
    queryKey,
    mutationFn: deleteTask,
    updateCache: (oldTasks, id) => oldTasks.filter((task) => task.id !== id),
    invalidateOnSuccess: false,
  });

  return {
    tasks: tasks || [],
    isLoading,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    moveTask: moveTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isMoving: moveTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}
