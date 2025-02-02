import { useQuery } from "@tanstack/react-query";
import { TodoService } from "../services/TodoService";
import { useOptimistic } from "./useOptimistic";
import type { TodoItem } from "@/types";

const todoService = new TodoService();

export function useTodos(taskId: string) {
  const queryKey = ["todos", taskId];

  const { data: todos = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => todoService.getTodos(taskId),
    enabled: !!taskId,
  });

  const createTodoMutation = useOptimistic<TodoItem[], Omit<TodoItem, "id">>({
    queryKey,
    mutationFn: (todo) => todoService.createTodo(taskId, todo),
    updateCache: (oldTodos, newTodo) => [
      ...oldTodos,
      {
        ...newTodo,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
    ],
  });

  const updateTodoMutation = useOptimistic<
    TodoItem[],
    { id: string; updates: Partial<TodoItem> }
  >({
    queryKey,
    mutationFn: ({ id, updates }) => todoService.updateTodo(id, updates),
    updateCache: (oldTodos, { id, updates }) =>
      oldTodos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
  });

  const deleteTodoMutation = useOptimistic<TodoItem[], string>({
    queryKey,
    mutationFn: (id) => todoService.deleteTodo(id),
    updateCache: (oldTodos, id) => oldTodos.filter((todo) => todo.id !== id),
  });

  return {
    todos,
    isLoading,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
  };
}
