import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTags,
  createTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
} from "../api/tags";
import type { Tag } from "../types";

export function useTags() {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });

  const createTagMutation = useMutation({
    mutationFn: (tag: Omit<Tag, "id">) => createTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const addTagToTaskMutation = useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      addTagToTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const removeTagFromTaskMutation = useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      removeTagFromTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    tags,
    isLoading,
    createTag: createTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    addTagToTask: addTagToTaskMutation.mutate,
    removeTagFromTask: removeTagFromTaskMutation.mutate,
    isCreating: createTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}
