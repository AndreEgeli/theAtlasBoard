import React, { createContext, useContext } from "react";
import { useTaskPermissions } from "@/hooks/permissions";
import { TeamPermissions, TeamRole } from "@/types";

interface TaskPermissionsContextValue {
  // Permission flags
  canEditTask: boolean;
  canDeleteTask: boolean;
  canAssignTask: boolean;
  canCreateTodos: boolean;
  canEditTodos: boolean;
  canToggleTodos: boolean;

  // Role flags
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;

  // Raw data
  permissions?: TeamPermissions;
  role?: TeamRole;
  userId?: string;
  teamId?: string;
  boardId?: string;

  // Direct access flags
  canView?: boolean;
  canEdit?: boolean;

  // Loading state
  isLoading: boolean;
}

const TaskPermissionsContext = createContext<TaskPermissionsContextValue>({
  canEditTask: false,
  canDeleteTask: false,
  canAssignTask: false,
  canCreateTodos: false,
  canEditTodos: false,
  canToggleTodos: false,

  isOwner: false,
  isEditor: false,
  isViewer: false,

  isLoading: true,
});

interface TaskPermissionProviderProps {
  taskId: string;
  children: React.ReactNode;
}

/**
 * Provider component that makes task permissions available to all child components
 */
export function TaskPermissionProvider({
  taskId,
  children,
}: TaskPermissionProviderProps) {
  const {
    permissions,
    role,
    userId,
    teamId,
    boardId,
    isOwner,
    isEditor,
    isViewer,
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canCreateTodos,
    canEditTodos,
    canToggleTodos,
    canView,
    canEdit,
    isLoading,
  } = useTaskPermissions(taskId);

  const value = {
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canCreateTodos,
    canEditTodos,
    canToggleTodos,

    isOwner,
    isEditor,
    isViewer,

    permissions,
    role,
    userId,
    teamId,
    boardId,

    canView,
    canEdit,

    isLoading,
  };

  return (
    <TaskPermissionsContext.Provider value={value}>
      {children}
    </TaskPermissionsContext.Provider>
  );
}

/**
 * Hook to access task permissions from the context
 */
export function useTaskPermissionsContext() {
  const context = useContext(TaskPermissionsContext);

  if (context === undefined) {
    throw new Error(
      "useTaskPermissionsContext must be used within a TaskPermissionProvider"
    );
  }

  return context;
}
