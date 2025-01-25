import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from "../api/boards";
import type { Board } from "../types";
import { useOptimistic } from "./useOptimistic";

export function useBoards() {
  const queryClient = useQueryClient();
  const queryKey = ["boards"];

  const { data: boards = [], isLoading } = useQuery({
    queryKey,
    queryFn: getBoards,
  });

  const createBoardMutation = useOptimistic<Board[], Omit<Board, "id">>({
    queryKey,
    mutationFn: createBoard,
    updateCache: (oldBoards, newBoard) => [
      ...oldBoards,
      { ...newBoard, id: crypto.randomUUID() }, // Temporary ID
    ],
  });

  const updateBoardMutation = useOptimistic<
    Board[],
    { id: string; updates: Partial<Board> }
  >({
    queryKey,
    mutationFn: ({ id, updates }) => updateBoard(id, updates),
    updateCache: (oldBoards, { id, updates }) =>
      oldBoards.map((board) =>
        board.id === id ? { ...board, ...updates } : board
      ),
  });

  const deleteBoardMutation = useOptimistic<Board[], string>({
    queryKey,
    mutationFn: deleteBoard,
    updateCache: (oldBoards, id) =>
      oldBoards.filter((board) => board.id !== id),
  });

  return {
    boards,
    isLoading,
    createBoard: createBoardMutation.mutateAsync,
    updateBoard: updateBoardMutation.mutateAsync,
    deleteBoard: deleteBoardMutation.mutateAsync,
    isCreating: createBoardMutation.isPending,
    isUpdating: updateBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
  };
}
