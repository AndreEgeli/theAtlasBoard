import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/TaskService";
import { useOptimistic } from "./useOptimistic";
import type { Task, CellPosition } from "@/types";

const taskService = new TaskService();

export function useTasks(boardId: string) {
  const queryKey = ["tasks", boardId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => taskService.getTasks(boardId),
    enabled: !!boardId,
  });

  const createTaskMutation = useOptimistic<
    Task[],
    Omit<Task, "id" | "created_at" | "updated_at">
  >({
    queryKey,
    mutationFn: (task) => taskService.createTask(boardId, task),
    updateCache: (oldTasks, newTask) => [
      ...oldTasks,
      {
        ...newTask,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        todos: [],
        tags: [],
      },
    ],
  });

  const updateTaskMutation = useOptimistic<
    Task[],
    { id: string; updates: Partial<Task> }
  >({
    queryKey,
    mutationFn: ({ id, updates }) => taskService.updateTask(id, updates),
    updateCache: (oldTasks, { id, updates }) =>
      oldTasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  });

  const moveTaskMutation = useOptimistic<
    Task[],
    { id: string; position: CellPosition }
  >({
    queryKey,
    mutationFn: ({ id, position }) => taskService.moveTask(id, position),
    updateCache: (oldTasks, { id, position }) =>
      oldTasks.map((task) =>
        task.id === id ? { ...task, ...position } : task
      ),
  });

  const deleteTaskMutation = useOptimistic<Task[], string>({
    queryKey,
    mutationFn: (id) => taskService.deleteTask(id),
    updateCache: (oldTasks, id) => oldTasks.filter((task) => task.id !== id),
  });

  return {
    tasks,
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
