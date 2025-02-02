import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/TaskService";
import { useOptimistic } from "./useOptimistic";
import type {
  Task,
  TaskPosition,
  TaskInsert,
  FullTask,
  TodoItemInsert,
  TodoItemUpdate,
  Tag,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const taskService = new TaskService();

export function useTasks(boardId: string) {
  const { user } = useAuth();
  const queryKey = ["tasks", boardId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => taskService.getTasks(boardId),
    enabled: !!boardId,
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
    { id: string; position: TaskPosition }
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

  // Task Assignees
  const assignUserMutation = useOptimistic<
    FullTask[],
    { taskId: string; userId: string }
  >({
    queryKey,
    mutationFn: ({ taskId, userId }) => taskService.assignUser(taskId, userId),
    updateCache: (oldTasks, { taskId, userId }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_assignees: [...task.task_assignees, { id: userId }],
            }
          : task
      ),
  });

  const unassignUserMutation = useOptimistic<
    FullTask[],
    { taskId: string; userId: string }
  >({
    queryKey,
    mutationFn: ({ taskId, userId }) =>
      taskService.unassignUser(taskId, userId),
    updateCache: (oldTasks, { taskId, userId }) =>
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

  // Task Todos
  const createTodoMutation = useOptimistic<
    FullTask[],
    { taskId: string; todo: Omit<TodoItemInsert, "id"> }
  >({
    queryKey,
    mutationFn: ({ taskId, todo }) => taskService.createTodo(taskId, todo),
    updateCache: (oldTasks, { taskId, todo }) =>
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
                  created_by: user?.id,
                  updated_at: new Date().toISOString(),
                  is_completed: false,
                  task_id: taskId,
                },
              ],
            }
          : task
      ),
  });

  const updateTodoMutation = useOptimistic<
    FullTask[],
    { taskId: string; todoId: string; updates: Partial<TodoItemUpdate> }
  >({
    queryKey,
    mutationFn: ({ todoId, updates }) =>
      taskService.updateTodo(todoId, updates),
    updateCache: (oldTasks, { taskId, todoId, updates }) =>
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

  const deleteTodoMutation = useOptimistic<
    FullTask[],
    { taskId: string; todoId: string }
  >({
    queryKey,
    mutationFn: ({ todoId }) => taskService.deleteTodo(todoId),
    updateCache: (oldTasks, { taskId, todoId }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_todos: task.task_todos.filter((todo) => todo.id !== todoId),
            }
          : task
      ),
  });

  // Task Tags
  const addTagMutation = useOptimistic<
    FullTask[],
    { taskId: string; tag: Tag }
  >({
    queryKey,
    mutationFn: ({ taskId, tag }) => taskService.addTag(taskId, tag.id),
    updateCache: (oldTasks, { taskId, tag }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_tags: [...task.task_tags, tag],
            }
          : task
      ),
  });

  const removeTagMutation = useOptimistic<
    FullTask[],
    { taskId: string; tagId: string }
  >({
    queryKey,
    mutationFn: ({ taskId, tagId }) => taskService.removeTag(taskId, tagId),
    updateCache: (oldTasks, { taskId, tagId }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              task_tags: task.task_tags.filter((tag) => tag.id !== tagId),
            }
          : task
      ),
  });

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    moveTask: moveTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    assignUser: assignUserMutation.mutateAsync,
    unassignUser: unassignUserMutation.mutateAsync,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isMoving: moveTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isAssigning: assignUserMutation.isPending,
    isUnassigning: unassignUserMutation.isPending,
    isCreatingTodo: createTodoMutation.isPending,
    isUpdatingTodo: updateTodoMutation.isPending,
    isDeletingTodo: deleteTodoMutation.isPending,
    addTag: addTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync,
    isAddingTag: addTagMutation.isPending,
    isRemovingTag: removeTagMutation.isPending,
  };
}
