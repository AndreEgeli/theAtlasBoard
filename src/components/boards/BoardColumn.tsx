import React from "react";
import { Task } from "@/types";
import { useBoardPermissionsContext } from "./BoardPermissionProvider";
import { TaskCard } from "./TaskCard";
import { PermissionButton } from "@/components/permissions";
import { PlusIcon } from "lucide-react";

interface BoardColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onAddTask?: (status: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  onViewTaskDetails?: (task: Task) => void;
}

/**
 * Board column component that respects user permissions
 */
export function BoardColumn({
  title,
  tasks,
  status,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onViewTaskDetails,
}: BoardColumnProps) {
  const { canCreateTasks, permissions, isLoading } =
    useBoardPermissionsContext();

  return (
    <div className="flex flex-col h-full min-w-[280px] bg-gray-50 rounded-md p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{title}</h3>
        <div className="text-xs text-gray-500">{tasks.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onAssignTask={onAssignTask}
            onViewTaskDetails={onViewTaskDetails}
          />
        ))}
      </div>

      <PermissionButton
        requiredPermission="canCreateTasks"
        userPermissions={isLoading ? undefined : permissions}
        isLoading={isLoading}
        onClick={() => onAddTask?.(status)}
        permissionTooltip="You need editor access to add tasks"
        variant="ghost"
        size="sm"
        className="w-full justify-start"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Task
      </PermissionButton>
    </div>
  );
}
