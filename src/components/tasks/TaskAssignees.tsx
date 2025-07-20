import React from "react";
import { FullUser } from "@/types";
import { useTaskPermissionsContext } from "./TaskPermissionProvider";
import { PermissionButton } from "@/components/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskAssigneesProps {
  assignees: FullUser[];
  taskId: string;
  onAddAssignee?: (taskId: string) => void;
  onRemoveAssignee?: (taskId: string, userId: string) => void;
}

/**
 * Task assignees component that respects user permissions
 */
export function TaskAssignees({
  assignees,
  taskId,
  onAddAssignee,
  onRemoveAssignee,
}: TaskAssigneesProps) {
  const { canAssignTask, permissions, isLoading } = useTaskPermissionsContext();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Assignees</h3>

        <PermissionButton
          requiredPermission="canAssignTasks"
          userPermissions={isLoading ? undefined : permissions}
          isLoading={isLoading}
          onClick={() => onAddAssignee?.(taskId)}
          permissionTooltip="You need editor access to assign users"
          variant="outline"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </PermissionButton>
      </div>

      {assignees.length === 0 ? (
        <div className="text-sm text-gray-500">No assignees</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignees.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 bg-gray-100 rounded-full pl-1 pr-2 py-1"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback>
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className="text-sm">{user.name}</span>

              {canAssignTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full"
                  onClick={() => onRemoveAssignee?.(taskId, user.id)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
