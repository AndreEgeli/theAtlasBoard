import React from "react";
import { Task } from "@/types";
import { useTaskPermissionsContext } from "./TaskPermissionProvider";
import { PermissionButton, ReadOnlyWrapper } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  TrashIcon,
  UsersIcon,
  TagIcon,
  CalendarIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TaskDetailProps {
  task: Task;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  onAddTag?: (task: Task) => void;
  onClose?: () => void;
}

/**
 * Task detail component that respects user permissions
 */
export function TaskDetail({
  task,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onAddTag,
  onClose,
}: TaskDetailProps) {
  const {
    canEditTask,
    canDeleteTask,
    canAssignTask,
    isViewer,
    permissions,
    isLoading,
  } = useTaskPermissionsContext();

  // Format the deadline if it exists
  const formattedDeadline = task.deadline_at
    ? new Date(task.deadline_at).toLocaleDateString()
    : "No deadline";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{task.title}</CardTitle>

        <div className="flex items-center gap-2">
          <PermissionButton
            requiredPermission="canEditTasks"
            userPermissions={isLoading ? undefined : permissions}
            isLoading={isLoading}
            onClick={() => onEditTask?.(task)}
            permissionTooltip="You need editor access to edit this task"
            variant="outline"
            size="icon"
          >
            <PencilIcon className="h-4 w-4" />
          </PermissionButton>

          <PermissionButton
            requiredPermission="canDeleteTasks"
            userPermissions={isLoading ? undefined : permissions}
            isLoading={isLoading}
            onClick={() => onDeleteTask?.(task)}
            permissionTooltip="You need editor access to delete this task"
            variant="outline"
            size="icon"
          >
            <TrashIcon className="h-4 w-4" />
          </PermissionButton>

          <Button variant="outline" size="icon" onClick={onClose}>
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ReadOnlyWrapper isReadOnly={isViewer}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Description
              </h3>
              <p className="text-sm">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{formattedDeadline}</span>
            </div>

            <div className="flex items-center gap-4">
              <PermissionButton
                requiredPermission="canAssignTasks"
                userPermissions={isLoading ? undefined : permissions}
                isLoading={isLoading}
                onClick={() => onAssignTask?.(task)}
                permissionTooltip="You need editor access to assign users"
                variant="outline"
                size="sm"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Assign Users
              </PermissionButton>

              <PermissionButton
                requiredPermission="canAddTaskTags"
                userPermissions={isLoading ? undefined : permissions}
                isLoading={isLoading}
                onClick={() => onAddTag?.(task)}
                permissionTooltip="You need editor access to add tags"
                variant="outline"
                size="sm"
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Add Tag
              </PermissionButton>
            </div>
          </div>
        </ReadOnlyWrapper>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-xs text-gray-500">
          Created: {new Date(task.created_at || "").toLocaleString()}
          {task.updated_at && (
            <span className="ml-4">
              Updated: {new Date(task.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
