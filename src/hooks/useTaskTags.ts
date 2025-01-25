import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addTagToTask, removeTagFromTask } from "../api/tags";
import { useOptimistic } from "./useOptimistic";
import type { Task } from "../types";

export function useTaskTags(taskId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks"];

  const addTagMutation = useOptimistic<Task[], string>({
    queryKey,
    mutationFn: (tagId: string) => addTagToTask(taskId, tagId),
    updateCache: (oldTasks, tagId) =>
      oldTasks.map((task) =>
        task.id === taskId ? { ...task, tags: [...task.tags, tagId] } : task
      ),
  });

  const removeTagMutation = useOptimistic<Task[], string>({
    queryKey,
    mutationFn: (tagId: string) => removeTagFromTask(taskId, tagId),
    updateCache: (oldTasks, tagId) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? { ...task, tags: task.tags.filter((id) => id !== tagId) }
          : task
      ),
  });

  return {
    addTag: addTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync,
    isAdding: addTagMutation.isPending,
    isRemoving: removeTagMutation.isPending,
  };
}
