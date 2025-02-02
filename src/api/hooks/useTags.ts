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
