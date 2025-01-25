import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, deleteUser } from "../api/users";
import type { User } from "../types";
import { useOptimistic } from "./useOptimistic";

export function useUsers() {
  const queryClient = useQueryClient();
  const queryKey = ["users"];

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: getUsers,
  });

  const createUserMutation = useOptimistic<
    User[],
    Omit<User, "id"> & { avatarFile?: File }
  >({
    queryKey,
    mutationFn: createUser,
    updateCache: (oldUsers, newUser) => [
      ...oldUsers,
      { ...newUser, id: crypto.randomUUID() },
    ],
  });

  const deleteUserMutation = useOptimistic<User[], string>({
    queryKey,
    mutationFn: deleteUser,
    updateCache: (oldUsers, id) => oldUsers.filter((user) => user.id !== id),
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}
