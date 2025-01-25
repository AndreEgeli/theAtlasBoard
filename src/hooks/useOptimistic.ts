import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";

interface OptimisticConfig<TData, TVariables> {
  // The query key to update
  queryKey: QueryKey;
  // The mutation function that updates the database
  mutationFn: (variables: TVariables) => Promise<any>;
  // Function to update the cached data optimistically
  updateCache: (oldData: TData, variables: TVariables) => TData;
  // Optional function to handle successful mutations
  onSuccess?: (data: any, variables: TVariables) => void;
  // Optional function to handle errors
  onError?: (error: Error, variables: TVariables) => void;
  // Optional function to roll back optimistic update on error
  rollbackOnError?: boolean;
  // Optional flag to control query invalidation
  invalidateOnSuccess?: boolean;
}

export function useOptimistic<TData, TVariables>({
  queryKey,
  mutationFn,
  updateCache,
  onSuccess,
  onError,
  rollbackOnError = true,
  invalidateOnSuccess = true, // Default to true for safety
}: OptimisticConfig<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, (old) => {
          if (!old) return old;
          return updateCache(old, variables);
        });
      }

      // Return context with the snapshotted value
      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // If there was an error, roll back to the snapshot
      if (rollbackOnError && context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Call error handler if provided
      onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      // Call success handler if provided
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Only invalidate if explicitly enabled
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
