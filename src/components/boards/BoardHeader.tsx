import React from "react";
import { Board } from "@/types";
import { useBoardPermissionsContext } from "./BoardPermissionProvider";
import { PermissionButton, RoleBadge } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

interface BoardHeaderProps {
  board: Board;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
  onAddTask?: () => void;
}

/**
 * Header component for a board that respects user permissions
 */
export function BoardHeader({
  board,
  onEditBoard,
  onDeleteBoard,
  onAddTask,
}: BoardHeaderProps) {
  const { canEditBoard, canDeleteBoard, canCreateTasks, role, isLoading } =
    useBoardPermissionsContext();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{board.name}</h2>
        {role && <RoleBadge role={role} size="sm" />}
      </div>

      <div className="flex items-center gap-2">
        {/* Add Task Button */}
        <PermissionButton
          requiredPermission="canCreateTasks"
          userPermissions={isLoading ? undefined : { canCreateTasks }}
          isLoading={isLoading}
          onClick={onAddTask}
          permissionTooltip="You need editor access to add tasks"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Task
        </PermissionButton>

        {/* Edit Board Button */}
        <PermissionButton
          requiredPermission="canEditBoards"
          userPermissions={isLoading ? undefined : { canEditBoards }}
          isLoading={isLoading}
          onClick={onEditBoard}
          permissionTooltip="You need editor access to edit this board"
          variant="outline"
          size="icon"
        >
          <PencilIcon className="h-4 w-4" />
        </PermissionButton>

        {/* Delete Board Button */}
        <PermissionButton
          requiredPermission="canDeleteBoards"
          userPermissions={isLoading ? undefined : { canDeleteBoards }}
          isLoading={isLoading}
          onClick={onDeleteBoard}
          permissionTooltip="You need editor access to delete this board"
          variant="outline"
          size="icon"
        >
          <TrashIcon className="h-4 w-4" />
        </PermissionButton>
      </div>
    </div>
  );
}
