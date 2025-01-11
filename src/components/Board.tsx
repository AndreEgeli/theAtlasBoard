import React, { useState } from "react";
import { Task, CellPosition, User, Tag } from "../types";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";
import { useTasks } from "../hooks/useTasks";

const importanceLevels: Task["importance"][] = [
  "super critical",
  "critical",
  "not critical",
];
const timeframeLevels: Task["timeframe"][] = [
  ">3 hours",
  "> 1 day",
  "> 1 week",
];

interface BoardProps {
  boardId: string;
  users: User[];
  tags: Tag[];
  onTaskClick: (taskId: string) => void;
}

export function Board({ boardId, users, tags, onTaskClick }: BoardProps) {
  const { tasks, moveTask, createTask } = useTasks(boardId);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, position: CellPosition) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    moveTask({ id: taskId, position });
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceTaskId = e.dataTransfer.getData("taskId");

    const sourceTask = tasks.find((t) => t.id === sourceTaskId);
    const targetTask = tasks.find((t) => t.id === targetTaskId);

    if (sourceTask && targetTask) {
      moveTask({
        id: sourceTaskId,
        position: {
          importance: targetTask.importance,
          timeframe: targetTask.timeframe,
          order: targetTask.order,
        },
      });
      moveTask({
        id: targetTaskId,
        position: {
          importance: sourceTask.importance,
          timeframe: sourceTask.timeframe,
          order: sourceTask.order,
        },
      });
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleAddTask = (position: CellPosition) => {
    createTask({
      title: "New Task",
      description: "",
      importance: position.importance,
      timeframe: position.timeframe,
      status: "pending",
      assignee: "",
      todos: [],
      tags: [],
      order: tasks.length,
    });
  };

  const handleCellClick = (e: React.MouseEvent, position: CellPosition) => {
    // Only add task if clicking directly on the cell, not on a task card
    if ((e.target as HTMLElement).closest(".task-card") === null) {
      handleAddTask(position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-0 mb-2">
        {timeframeLevels.map((time) => (
          <div
            key={time}
            className="text-center text-sm font-medium text-gray-600"
          >
            {time}
          </div>
        ))}
      </div>

      <div className="absolute -left-24 top-0 h-full flex flex-col justify-around">
        {importanceLevels.map((importance) => (
          <div
            key={importance}
            className="text-sm font-medium text-gray-600 transform -rotate-0"
          >
            {importance}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-lg bg-white">
        {importanceLevels.map((importance, i) => (
          <React.Fragment key={importance}>
            <div className="col-span-3 grid grid-cols-3">
              {timeframeLevels.map((timeframe, j) => (
                <div
                  key={`${importance}-${timeframe}`}
                  onDrop={(e) => handleDrop(e, { importance, timeframe })}
                  onDragOver={handleDragOver}
                  onClick={(e) => handleCellClick(e, { importance, timeframe })}
                  className={`
                    min-h-[200px] p-4 relative group cursor-pointer
                    ${
                      i !== importanceLevels.length - 1
                        ? "border-b border-gray-200 border-dashed"
                        : ""
                    }
                    ${
                      j !== timeframeLevels.length - 1
                        ? "border-r border-gray-200 border-dashed"
                        : ""
                    }
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center">
                      <Plus className="text-blue-500" />
                    </div>
                  </div>

                  {tasks
                    .filter(
                      (task) =>
                        task.importance === importance &&
                        task.timeframe === timeframe
                    )
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((task) => (
                      <div
                        key={task.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTaskId(task.id);
                        }}
                        onDrop={(e) => handleTaskDrop(e, task.id)}
                        className={`relative task-card ${
                          dragOverTaskId === task.id ? "opacity-50" : ""
                        }`}
                      >
                        <TaskCard
                          task={task}
                          users={users}
                          tags={tags}
                          boardId={boardId}
                          onClick={() => onTaskClick(task.id)}
                        />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
