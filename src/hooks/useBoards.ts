import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from "../api/boards";
import type { Board } from "../types";

export function useBoards() {
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });

  const createBoardMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Board> }) =>
      updateBoard(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  return {
    boards,
    isLoading,
    createBoard: createBoardMutation.mutate,
    updateBoard: updateBoardMutation.mutate,
    deleteBoard: deleteBoardMutation.mutate,
    isCreating: createBoardMutation.isPending,
    isUpdating: updateBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
  };
}
