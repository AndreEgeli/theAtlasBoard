import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/TaskService";
import { useOptimistic } from "./useOptimistic";
import type { Task, TaskPosition, TaskInsert, FullTask } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const taskService = new TaskService();

export function useTasks(boardId: string) {
  const { user } = useAuth();
  const queryKey = ["tasks", boardId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => taskService.getTasks(boardId),
    enabled: !!boardId,
    staleTime: 1000 * 60 * 2, // Tasks change more frequently, 2 minutes
  });

  const createTaskMutation = useOptimistic<FullTask[], Omit<TaskInsert, "id">>({
    queryKey,
    mutationFn: (task) => taskService.createTask(boardId, task),
    updateCache: (oldTasks, newTask) => [
      ...oldTasks,
      {
        ...newTask,
        id: crypto.randomUUID(),
        created_at: newTask.created_at ?? new Date().toISOString(),
        board_id: newTask.board_id ?? boardId,
        created_by: newTask.created_by ?? user?.id,
        deadline_at: newTask.deadline_at ?? null,
        description: newTask.description ?? null,
        order: newTask.order ?? 0,
        status: newTask.status ?? "pending",
        title: newTask.title ?? "",
        updated_at: newTask.updated_at ?? new Date().toISOString(),
        x_index: newTask.x_index ?? 0,
        y_index: newTask.y_index ?? 0,
        task_todos: [],
        task_tags: [],
        task_assignees: [],
      },
    ],
  });

  const updateTaskMutation = useOptimistic<
    FullTask[],
    { id: string; updates: Partial<Task> }
  >({
    queryKey,
    mutationFn: ({ id, updates }) => taskService.updateTask(id, updates),
    updateCache: (oldTasks, { id, updates }) =>
      oldTasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  });

  const moveTaskMutation = useOptimistic<
    FullTask[],
    { id: string; position: TaskPosition }
  >({
    queryKey,
    mutationFn: ({ id, position }) => taskService.moveTask(id, position),
    updateCache: (oldTasks, { id, position }) =>
      oldTasks.map((task) =>
        task.id === id ? { ...task, ...position } : task
      ),
  });

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    moveTask: moveTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isMoving: moveTaskMutation.isPending,
  };
}
