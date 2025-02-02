import { useQuery, useMutation } from "@tanstack/react-query";
import { BoardService } from "../services/BoardService";
import type { BoardUpdate } from "@/types";

const boardService = new BoardService();

export function useBoards() {
  const queryKey = ["boards"];

  const { data: boards = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => boardService.getBoards(),
  });

  const createBoardMutation = useMutation({
    mutationFn: ({ name, teamId }: { name: string; teamId: string }) =>
      boardService.createBoard({ name, teamId }),
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
    queryFn: () => boardService.getBoardDetails(boardId),
    enabled: !!boardId,
  });

  const updateBoardMutation = useMutation({
    mutationFn: (updates: Partial<BoardUpdate>) =>
      boardService.updateBoard(boardId, updates),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: () => boardService.deleteBoard(boardId),
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
