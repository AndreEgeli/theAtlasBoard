import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTags,
  createTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
} from "../api/tags";
import type { Tag } from "../types";
import { useOptimistic } from "./useOptimistic";

export function useTags() {
  const queryClient = useQueryClient();
  const queryKey = ["tags"];

  const { data: tags = [], isLoading } = useQuery({
    queryKey,
    queryFn: getTags,
  });

  const createTagMutation = useOptimistic<Tag[], Omit<Tag, "id">>({
    queryKey,
    mutationFn: createTag,
    updateCache: (oldTags, newTag) => [
      ...oldTags,
      { ...newTag, id: crypto.randomUUID() },
    ],
  });

  const deleteTagMutation = useOptimistic<Tag[], string>({
    queryKey,
    mutationFn: deleteTag,
    updateCache: (oldTags, id) => oldTags.filter((tag) => tag.id !== id),
  });

  const addTagToTaskMutation = useOptimistic<
    Tag[],
    { taskId: string; tagId: string }
  >({
    queryKey: ["tasks"],
    mutationFn: ({ taskId, tagId }) => addTagToTask(taskId, tagId),
    updateCache: (oldTasks, { taskId, tagId }) =>
      oldTasks.map((task) =>
        task.id === taskId ? { ...task, tags: [...task.tags, tagId] } : task
      ),
  });

  const removeTagFromTaskMutation = useOptimistic<
    Tag[],
    { taskId: string; tagId: string }
  >({
    queryKey: ["tasks"],
    mutationFn: ({ taskId, tagId }) => removeTagFromTask(taskId, tagId),
    updateCache: (oldTasks, { taskId, tagId }) =>
      oldTasks.map((task) =>
        task.id === taskId
          ? { ...task, tags: task.tags.filter((id) => id !== tagId) }
          : task
      ),
  });

  return {
    tags,
    isLoading,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    addTagToTask: addTagToTaskMutation.mutateAsync,
    removeTagFromTask: removeTagFromTaskMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}
