import { useQuery } from "@tanstack/react-query";
import {
  getBoards,
  getBoardDetails,
  createBoard,
  updateBoard,
  deleteBoard,
} from "../api/boards";
import type { Board } from "../types";
import { useOptimistic } from "./useOptimistic";

// For board overview (minimal data)
export function useBoards() {
  const queryKey = ["boards"];

  const { data: boards = [], isLoading } = useQuery({
    queryKey,
    queryFn: getBoards,
  });

  const createBoardMutation = useOptimistic<Board[], { name: string }>({
    queryKey,
    mutationFn: ({ name }) => createBoard(name),
    updateCache: (oldBoards, newBoard) => [
      ...oldBoards,
      {
        ...newBoard,
        tasks: [],
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
    ],
  });

  return {
    boards,
    isLoading,
    createBoard: createBoardMutation.mutateAsync,
    isCreating: createBoardMutation.isPending,
  };
}

// For detailed board data
export function useBoardDetails(boardId: string) {
  const queryKey = ["board", boardId];

  const { data: board, isLoading } = useQuery({
    queryKey,
    queryFn: () => getBoardDetails(boardId),
    enabled: !!boardId,
  });

  const updateBoardMutation = useOptimistic<Board, Partial<Board>>({
    queryKey,
    mutationFn: (updates) => updateBoard(boardId, updates),
    updateCache: (oldBoard, updates) => ({ ...oldBoard, ...updates }),
  });

  const deleteBoardMutation = useOptimistic<Board[], void>({
    queryKey: ["boards"],
    mutationFn: () => deleteBoard(boardId),
    updateCache: (oldBoards: Board[]) =>
      oldBoards.filter((b: Board) => b.id !== boardId),
  });

  return {
    board,
    isLoading,
    updateBoard: updateBoardMutation.mutateAsync,
    deleteBoard: deleteBoardMutation.mutateAsync,
    isUpdating: updateBoardMutation.isPending,
    isDeleting: deleteBoardMutation.isPending,
  };
}
