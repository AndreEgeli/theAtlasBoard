import React, { createContext, useContext } from "react";
import { useBoardPermissions } from "@/hooks/permissions";
import { TeamPermissions, TeamRole } from "@/types";

interface BoardPermissionsContextValue {
  // Permission flags
  canEditBoard: boolean;
  canDeleteBoard: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;

  // Role flags
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;

  // Raw data
  permissions?: TeamPermissions;
  role?: TeamRole;
  teamId?: string;
  boardId?: string;
  userId?: string;

  // Direct access flags
  canView: boolean;
  canEdit: boolean;

  // Loading state
  isLoading: boolean;
}

const BoardPermissionsContext = createContext<BoardPermissionsContextValue>({
  canEditBoard: false,
  canDeleteBoard: false,
  canCreateTasks: false,
  canEditTasks: false,
  canDeleteTasks: false,
  canAssignTasks: false,

  isOwner: false,
  isEditor: false,
  isViewer: false,

  canView: false,
  canEdit: false,

  isLoading: true,
});

interface BoardPermissionProviderProps {
  boardId: string;
  children: React.ReactNode;
}

/**
 * Provider component that makes board permissions available to all child components
 */
export function BoardPermissionProvider({
  boardId,
  children,
}: BoardPermissionProviderProps) {
  const {
    permissions,
    role,
    teamId,
    userId,
    boardId: boardIdFromHook,
    isOwner,
    isEditor,
    isViewer,
    canEditBoard,
    canDeleteBoard,
    canCreateTasks,
    canEditTasks,
    canView,
    canEdit,
    isLoading,
  } = useBoardPermissions(boardId);

  // Derive additional permissions
  const canDeleteTasks = permissions?.canDeleteTasks ?? false;
  const canAssignTasks = permissions?.canAssignTasks ?? false;

  const value = {
    canEditBoard,
    canDeleteBoard,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canAssignTasks,

    isOwner,
    isEditor,
    isViewer,

    permissions,
    role,
    teamId,
    boardId: boardIdFromHook,
    userId,

    canView: canView ?? false,
    canEdit: canEdit ?? false,

    isLoading,
  };

  return (
    <BoardPermissionsContext.Provider value={value}>
      {children}
    </BoardPermissionsContext.Provider>
  );
}

/**
 * Hook to access board permissions from the context
 */
export function useBoardPermissionsContext() {
  const context = useContext(BoardPermissionsContext);

  if (context === undefined) {
    throw new Error(
      "useBoardPermissionsContext must be used within a BoardPermissionProvider"
    );
  }

  return context;
}
