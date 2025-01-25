import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createTodo, updateTodo, deleteTodo } from "../api/todos";
import type { TodoItem } from "../types";
import { useOptimistic } from "./useOptimistic";

export function useTodos(taskId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks"];

  const addTodoMutation = useOptimistic<TodoItem[], Omit<TodoItem, "id">>({
    queryKey,
    mutationFn: (todo) => createTodo(taskId, todo),
    updateCache: (oldTasks, newTodo) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              todos: [...task.todos, { ...newTodo, id: crypto.randomUUID() }],
            }
          : task
      ),
  });

  const toggleTodoMutation = useOptimistic<
    TodoItem[],
    { id: string; completed: boolean }
  >({
    queryKey,
    mutationFn: ({ id, completed }) => updateTodo(id, { completed }),
    updateCache: (oldTasks, { id, completed }) =>
      oldTasks.map((task) => ({
        ...task,
        todos: task.todos.map((todo) =>
          todo.id === id ? { ...todo, completed } : todo
        ),
      })),
  });

  const deleteTodoMutation = useOptimistic<TodoItem[], string>({
    queryKey,
    mutationFn: deleteTodo,
    updateCache: (oldTasks, todoId) =>
      oldTasks.map((task) => ({
        ...task,
        todos: task.todos.filter((todo) => todo.id !== todoId),
      })),
  });

  return {
    addTodo: addTodoMutation.mutateAsync,
    toggleTodo: toggleTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    isAdding: addTodoMutation.isPending,
    isUpdating: toggleTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
  };
}
