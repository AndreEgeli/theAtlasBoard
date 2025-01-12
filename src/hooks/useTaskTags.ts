import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addTagToTask, removeTagFromTask } from "../api/tags";

export function useTaskTags(taskId: string) {
  const queryClient = useQueryClient();

  const addTagMutation = useMutation({
    mutationFn: (tagId: string) => addTagToTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-tags", taskId] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => removeTagFromTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-tags", taskId] });
    },
  });

  return {
    addTag: addTagMutation.mutate,
    removeTag: removeTagMutation.mutate,
    isAdding: addTagMutation.isPending,
    isRemoving: removeTagMutation.isPending,
  };
}
