import React from "react";
import {
  Task,
  User as UserType,
  Tag as TagType,
  TodoItem,
  Tag,
} from "../types";
import { useTasks } from "../hooks/useTasks";

interface TaskCardProps {
  taskId: string;
  users: UserType[];
  tags: TagType[];
  boardId: string;
  onClick: () => void;
}

export function TaskCard({
  taskId,
  users,
  tags,
  boardId,
  onClick,
}: TaskCardProps) {
  const { tasks } = useTasks(boardId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return null;
  }

  console.log(task);

  const todos = task.todos || [];
  const taskTags = task.tags || [];

  const completedTodos = todos.filter(
    (todo: TodoItem) => todo.completed
  ).length;
  const totalTodos = todos.length;
  const progress = totalTodos === 0 ? 0 : (completedTodos / totalTodos) * 100;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const statusColors = {
    pending: "bg-white",
    started: "bg-blue-50 border-blue-200",
    in_review: "bg-orange-50 border-orange-200",
    completed: "bg-green-50 border-green-200",
  };

  const assignedUser = users.find((user) => user.name === task.assignee);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`${
        statusColors[task.status]
      } p-4 rounded-lg shadow-sm border hover:shadow-md transition-all mb-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-gray-800 flex-1">{task.title}</h3>
        {assignedUser && (
          <div className="flex-shrink-0">
            {assignedUser.avatar ? (
              <img
                src={assignedUser.avatar}
                alt={assignedUser.name}
                className="w-6 h-6 rounded-full object-cover"
                title={assignedUser.name}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm"
                title={assignedUser.name}
              >
                {assignedUser.name[0].toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>

      {taskTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {taskTags.map((tagId: string) => {
            const tag = tags.find((t: Tag) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: tag.color, color: "#000000" }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      )}
      {totalTodos > 0 && (
        <div className="h-1 mt-4 border rounded w-full">
          <div
            className="h-full"
            style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? "green" : "blue",
            }}
          />
        </div>
      )}
    </div>
  );
}
