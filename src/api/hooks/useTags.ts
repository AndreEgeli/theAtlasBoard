import { useQuery } from "@tanstack/react-query";
import { TagService } from "../services/TagService";
import { useOptimistic } from "./useOptimistic";
import type { Tag } from "@/types";
import { useOrganization } from "./useOrganization";

const tagService = new TagService();

export function useTags() {
  const { currentOrganization } = useOrganization();
  const queryKey = ["tags", currentOrganization?.id];

  const { data: tags = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => tagService.getTags(currentOrganization!.id),
    enabled: !!currentOrganization,
  });

  const createTagMutation = useOptimistic<Tag[], Omit<Tag, "id">>({
    queryKey,
    mutationFn: (tag) => tagService.createTag(tag),
    updateCache: (oldTags, newTag) => [
      ...oldTags,
      {
        ...newTag,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
    ],
  });

  const deleteTagMutation = useOptimistic<Tag[], string>({
    queryKey,
    mutationFn: (id) => tagService.deleteTag(id),
    updateCache: (oldTags, id) => oldTags.filter((tag) => tag.id !== id),
  });

  return {
    tags,
    isLoading,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}

export function useTaskTags(taskId: string) {
  const queryKey = ["tasks"];

  const addTagMutation = useOptimistic<Tag[], string>({
    queryKey,
    mutationFn: (tagId) => tagService.addTagToTask(taskId, tagId),
    updateCache: (oldTasks, tagId) =>
      oldTasks.map((task) =>
        task.id === taskId ? { ...task, tags: [...task.tags, tagId] } : task
      ),
  });

  const removeTagMutation = useOptimistic<Tag[], string>({
    queryKey,
    mutationFn: (tagId) => tagService.removeTagFromTask(taskId, tagId),
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
