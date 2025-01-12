import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useTodos } from "../hooks/useTodos";
import type {
  Task,
  TodoItem,
  User as UserType,
  Tag as TagType,
} from "../types";
import { Check, Plus, Tag, X } from "lucide-react";
import { Trash2 } from "lucide-react";
import { User } from "lucide-react";
import { createTodo, updateTodo } from "../api/todos";
import { useTaskTags } from "../hooks/useTaskTags";

interface TaskModalProps {
  taskId: string;
  users: UserType[];
  tags: TagType[];
  boardId: string;
  onClose: () => void;
}

export function TaskModal({
  taskId,
  users,
  tags,
  boardId,
  onClose,
}: TaskModalProps) {
  const { tasks, updateTask, deleteTask, isUpdating, isDeleting } =
    useTasks(boardId);
  const { addTodo, toggleTodo } = useTodos(taskId);
  const { addTag, removeTag } = useTaskTags(taskId);
  const task = tasks.find((t) => t.id === taskId);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [newTodo, setNewTodo] = useState("");

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      await addTodo({
        text: newTodo.trim(),
        completed: false,
        task_id: taskId,
      });
      setNewTodo("");
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    await toggleTodo({ id: todoId, completed: !completed });
  };

  const handleSave = () => {
    updateTask({
      id: task.id,
      updates: { title, description },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  const handleAssigneeChange = (assignee: string) => {
    updateTask({ id: task.id, updates: { assignee } });
  };

  const handleTagSelect = (tagId: string) => {
    const isSelected = task.task_tags.some((tt) => tt.tag_id === tagId);
    if (isSelected) {
      removeTag(tagId);
    } else {
      addTag(tagId);
    }
  };

  const completedTodos = task?.todos.filter((todo) => todo.completed).length;
  const totalTodos = task?.todos.length;
  const progress = totalTodos === 0 ? 0 : (completedTodos / totalTodos) * 100;

  const assignedUser = users.find((user) => user.name === task.assignee);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 p-2"
              title="Delete task"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to
            </label>
            <div className="flex items-center gap-2">
              {assignedUser?.avatar ? (
                <img
                  src={assignedUser.avatar}
                  alt={assignedUser.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
              <select
                value={task.assignee || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add tag
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleTagSelect(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="">Select a tag...</option>
              {tags
                .filter((tag) => !task.tags.includes(tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {task.tags.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full flex items-center gap-2"
                  style={{ backgroundColor: tag.color }}
                >
                  <Tag size={14} />
                  {tag.name}
                  <button
                    onClick={() => handleTagSelect(tag.id)}
                    className="hover:opacity-75"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Add a detailed description..."
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Todo List {totalTodos > 0 && `(${completedTodos}/${totalTodos})`}
            </label>
            <div className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </div>
          </div>

          {totalTodos > 0 && (
            <div className="h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="space-y-2 mb-4">
            {task?.todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
              >
                <button
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    todo.completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {todo.completed && <Check size={14} />}
                </button>
                <span
                  className={`flex-1 ${
                    todo.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo item..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddTodo();
                }
              }}
            />
            <button
              onClick={handleAddTodo}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <select
            value={task.status}
            onChange={(e) =>
              updateTask({
                id: task.id,
                updates: { status: e.target.value as Task["status"] },
              })
            }
            className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="started">Started</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
