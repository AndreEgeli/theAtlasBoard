import React, { createContext, useContext, ReactNode } from "react";
import { useBoardDetails } from "@/api/hooks/useBoards";
import { useQuery } from "@tanstack/react-query";
import { OrganizationService } from "@/api/services/OrganizationService";
import type { Board, FullUser } from "@/types";

const organizationService = new OrganizationService();

interface BoardContextData {
  board: Board | null;
  teamMembers: FullUser[];
  isLoadingBoard: boolean;
  isLoadingTeamMembers: boolean;
}

const BoardContext = createContext<BoardContextData | null>(null);

interface BoardProviderProps {
  boardId: string;
  children: ReactNode;
}

export function BoardProvider({ boardId, children }: BoardProviderProps) {
  const { board, isLoading: isLoadingBoard } = useBoardDetails(boardId);

  // Fetch team members based on the board's team_id
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ["team-members", board?.team_id],
    queryFn: () => organizationService.getTeamMembers(board!.team_id),
    enabled: !!board?.team_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Transform team members to FullUser format
  const fullUserTeamMembers: FullUser[] = teamMembers.map((member: any) => ({
    id: member.users.id,
    email: member.users.email,
    name: member.users.name,
    avatar_url: member.users.avatar_url || "",
    active_organization_id: "",
    app_metadata: {},
    user_metadata: {},
    aud: "",
    created_at: "",
  }));

  const contextValue: BoardContextData = {
    board,
    teamMembers: fullUserTeamMembers,
    isLoadingBoard,
    isLoadingTeamMembers,
  };

  return (
    <BoardContext.Provider value={contextValue}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
}
