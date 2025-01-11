import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, deleteUser } from "../api/users";
import type { User } from "../types";

export function useUsers() {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: ({
      name,
      authId,
      avatarFile,
    }: {
      name: string;
      authId: string;
      avatarFile?: File;
    }) => createUser(name, authId, avatarFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}
