import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "../services/TaskService";
import { useOptimistic } from "./useOptimistic";
import type {
  FullTask,
  FullUser,
  TodoItemInsert,
  TodoItemUpdate,
  Tag,
  TaskUpdate,
} from "@/types";
import { useAuth } from "@/hooks/useAuth";

const taskService = new TaskService();

export function useTask(boardId: string, taskId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const boardTasksKey = ["tasks", boardId];

  // Get the specific task from the board tasks cache
  const task = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => {
      const boardTasks =
        queryClient.getQueryData<FullTask[]>(boardTasksKey) || [];
      const foundTask = boardTasks.find((t) => t.id === taskId);
      if (!foundTask) {
        throw new Error("Task not found");
      }
      return foundTask;
    },
    enabled: !!taskId,
    staleTime: 0, // Always use fresh data from board cache
  });

  const updateTaskMutation = useOptimistic<
    FullTask[],
    { updates: Partial<TaskUpdate> }
  >({
    queryKey: boardTasksKey,
    mutationFn: ({ updates }) => taskService.updateTask(taskId, updates),
    updateCache: (oldTasks, { updates }) =>
      oldTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
  });

  const deleteTaskMutation = useOptimistic<FullTask[], void>({
    queryKey: boardTasksKey,
    mutationFn: () => taskService.deleteTask(taskId),
    updateCache: (oldTasks) => oldTasks.filter((task) => task.id !== taskId),
  });

  const createTodoMutation = useOptimistic<
    FullTask[],
    Omit<TodoItemInsert, "id" | "created_by" | "task_id">
  >({
    queryKey: boardTasksKey,
    mutationFn: (todo) =>
      taskService.createTodo(taskId, {
        ...todo,
        created_by: user?.id || "",
        task_id: taskId,
      }),
    updateCache: (oldTasks, todo) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_todos: [
                ...task.task_todos,
                {
                  ...todo,
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                  created_by: user?.id || "",
                  updated_at: new Date().toISOString(),
                  task_id: taskId,
                  is_completed: todo.is_completed ?? false,
                },
              ],
            }
          : task
      ),
  });

  const updateTodoMutation = useOptimistic<
    FullTask[],
    { todoId: string; updates: Partial<TodoItemUpdate> }
  >({
    queryKey: boardTasksKey,
    mutationFn: ({ todoId, updates }) =>
      taskService.updateTodo(todoId, updates),
    updateCache: (oldTasks, { todoId, updates }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_todos: task.task_todos.map((todo) =>
                todo.id === todoId ? { ...todo, ...updates } : todo
              ),
            }
          : task
      ),
  });

  const deleteTodoMutation = useOptimistic<FullTask[], string>({
    queryKey: boardTasksKey,
    mutationFn: (todoId) => taskService.deleteTodo(todoId),
    updateCache: (oldTasks, todoId) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_todos: task.task_todos.filter((todo) => todo.id !== todoId),
            }
          : task
      ),
  });

  const addTagMutation = useOptimistic<FullTask[], Tag>({
    queryKey: boardTasksKey,
    mutationFn: (tag) => taskService.addTag(taskId, tag.id),
    updateCache: (oldTasks, tag) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_tags: [...task.task_tags, tag],
            }
          : task
      ),
  });

  const removeTagMutation = useOptimistic<FullTask[], string>({
    queryKey: boardTasksKey,
    mutationFn: (tagId) => taskService.removeTag(taskId, tagId),
    updateCache: (oldTasks, tagId) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_tags: task.task_tags.filter((tag) => tag.id !== tagId),
            }
          : task
      ),
  });

  const assignUserMutation = useOptimistic<FullTask[], FullUser>({
    queryKey: boardTasksKey,
    mutationFn: (userToAssign) =>
      taskService.assignUser(taskId, userToAssign.id),
    updateCache: (oldTasks, userToAssign) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_assignees: [...task.task_assignees, userToAssign],
            }
          : task
      ),
  });

  const unassignUserMutation = useOptimistic<FullTask[], string>({
    queryKey: boardTasksKey,
    mutationFn: (userId) => taskService.unassignUser(taskId, userId),
    updateCache: (oldTasks, userId) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_assignees: task.task_assignees.filter(
                (user) => user.id !== userId
              ),
            }
          : task
      ),
  });

  return {
    task: task.data,
    isLoading: task.isLoading,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    addTag: addTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync,
    assignUser: assignUserMutation.mutateAsync,
    unassignUser: unassignUserMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isCreatingTodo: createTodoMutation.isPending,
    isUpdatingTodo: updateTodoMutation.isPending,
    isDeletingTodo: deleteTodoMutation.isPending,
    isAddingTag: addTagMutation.isPending,
    isRemovingTag: removeTagMutation.isPending,
    isAssigningUser: assignUserMutation.isPending,
    isUnassigningUser: unassignUserMutation.isPending,
  };
}
