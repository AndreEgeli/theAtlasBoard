import React from 'react';
import { Task, User as UserType, Tag as TagType } from '../types';

interface TaskCardProps {
  task: Task;
  users: UserType[];
  tags: TagType[];
  onDelete: (id: string) => void;
  onAssigneeChange: (id: string, assignee: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onClick: () => void;
}

export function TaskCard({
  task,
  users,
  tags,
  onClick,
}: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const statusColors = {
    pending: 'bg-white',
    started: 'bg-blue-50 border-blue-200',
    in_review: 'bg-orange-50 border-orange-200',
    completed: 'bg-green-50 border-green-200',
  };

  const assignedUser = users.find(user => user.name === task.assignee);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`${statusColors[task.status]} p-4 rounded-lg shadow-sm border hover:shadow-md transition-all mb-3`}
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

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tagId) => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: tag.color, color: '#000000' }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}