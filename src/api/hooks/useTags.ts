import { useQuery } from "@tanstack/react-query";
import { TagService } from "../services/TagService";
import { useOptimistic } from "./useOptimistic";
import type { Tag } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const tagService = new TagService();

export function useTags(organizationId?: string) {
  const { currentOrganization } = useAuth();
  const orgId = organizationId || currentOrganization?.id;
  const queryKey = ["tags", orgId];

  const { data: tags = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => tagService.getTags(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // Tags don't change often
  });

  const createTagMutation = useOptimistic<
    Tag[],
    Omit<Tag, "id" | "created_at" | "created_by">
  >({
    queryKey,
    mutationFn: (tag) =>
      tagService.createTag({
        ...tag,
        organization_id: orgId!,
      }),
    updateCache: (oldTags, newTag) => [
      ...oldTags,
      {
        ...newTag,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        created_by: "", // This will be set by the service
        organization_id: orgId!,
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
