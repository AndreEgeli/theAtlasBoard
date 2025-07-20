import React from "react";
import { Task } from "@/types";
import { useBoardPermissionsContext } from "./BoardPermissionProvider";
import { DisabledAction } from "@/components/permissions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PencilIcon,
  TrashIcon,
  UsersIcon,
  TagIcon,
  CheckSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  onViewTaskDetails?: (task: Task) => void;
}

/**
 * Task card component that respects user permissions
 */
export function TaskCard({
  task,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onViewTaskDetails,
}: TaskCardProps) {
  const { canEditTasks, canDeleteTasks, canAssignTasks, isViewer } =
    useBoardPermissionsContext();

  // Format the deadline if it exists
  const formattedDeadline = task.deadline_at
    ? new Date(task.deadline_at).toLocaleDateString()
    : null;

  // Handle card click for viewing task details
  const handleCardClick = () => {
    if (onViewTaskDetails) {
      onViewTaskDetails(task);
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{task.title}</CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {formattedDeadline && (
          <div className="mt-2 text-xs text-gray-500">
            Due: {formattedDeadline}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center gap-1">
          <DisabledAction
            disabled={!canAssignTasks}
            tooltip="You need editor access to assign users"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                if (canAssignTasks && onAssignTask) {
                  onAssignTask(task);
                }
              }}
              disabled={!canAssignTasks || isViewer}
            >
              <UsersIcon className="h-4 w-4" />
            </Button>
          </DisabledAction>

          <DisabledAction
            disabled={!canEditTasks}
            tooltip="You need editor access to add tags"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canEditTasks || isViewer}
            >
              <TagIcon className="h-4 w-4" />
            </Button>
          </DisabledAction>

          <DisabledAction
            disabled={!canEditTasks}
            tooltip="You need editor access to manage todos"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canEditTasks || isViewer}
            >
              <CheckSquareIcon className="h-4 w-4" />
            </Button>
          </DisabledAction>
        </div>

        <div className="flex items-center gap-1">
          <DisabledAction
            disabled={!canEditTasks}
            tooltip="You need editor access to edit tasks"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                if (canEditTasks && onEditTask) {
                  onEditTask(task);
                }
              }}
              disabled={!canEditTasks || isViewer}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </DisabledAction>

          <DisabledAction
            disabled={!canDeleteTasks}
            tooltip="You need editor access to delete tasks"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                if (canDeleteTasks && onDeleteTask) {
                  onDeleteTask(task);
                }
              }}
              disabled={!canDeleteTasks || isViewer}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </DisabledAction>
        </div>
      </CardFooter>
    </Card>
  );
}
