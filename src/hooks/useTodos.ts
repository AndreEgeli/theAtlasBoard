import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTodo, updateTodo, deleteTodo } from "../api/todos";
import type { TodoItem } from "../types";

export function useTodos(taskId: string) {
  const queryClient = useQueryClient();

  const addTodoMutation = useMutation({
    mutationFn: (todo: Omit<TodoItem, "id">) => createTodo(taskId, todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["todos", taskId] });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["todos", taskId] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (todoId: string) => deleteTodo(todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["todos", taskId] });
    },
  });

  return {
    addTodo: addTodoMutation.mutate,
    toggleTodo: toggleTodoMutation.mutate,
    deleteTodo: deleteTodoMutation.mutate,
    isAdding: addTodoMutation.isPending,
    isUpdating: toggleTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
  };
}
