import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, updateTask, moveTask, deleteTask } from "../api/tasks";
import type { Task, CellPosition } from "../types";
import { supabase } from "../lib/supabase";

export function useTasks(boardId: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", boardId],
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

      return data.map((task) => ({
        ...task,
        tags: task.task_tags.map((tt) => tt.tag_id),
      }));
    },
    enabled: !!boardId,
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, "id">) => createTask(boardId, task),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", boardId] });
      return newTask;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", boardId] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ id, position }: { id: string; position: CellPosition }) =>
      moveTask(id, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", boardId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", boardId] });
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    moveTask: moveTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isMoving: moveTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}
