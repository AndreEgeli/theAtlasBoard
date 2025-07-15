import { useState } from "react";
import { useTask } from "@/api/hooks/useTask";
import { useBoardContext } from "@/contexts/BoardContext";
import type { Task, Tag as TagType, FullUser } from "../../types";
import { Check, Plus, Tag, X, User } from "lucide-react";
import { Trash2 } from "lucide-react";
import { getStatusButton } from "@/utils/taskStatus";

interface TaskModalProps {
  boardId: string;
  taskId: string;
  tags: TagType[];
  onClose: () => void;
}

export function TaskModal({ boardId, taskId, tags, onClose }: TaskModalProps) {
  const {
    task,
    updateTask,
    deleteTask,
    isUpdating,
    isDeleting,
    createTodo,
    updateTodo,
    deleteTodo,
    addTag,
    removeTag,
    assignUser,
    unassignUser,
  } = useTask(boardId, taskId);

  const { teamMembers } = useBoardContext();

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [newTodo, setNewTodo] = useState("");

  if (!task) {
    return null;
  }

  const todos = task.task_todos || [];
  const taskTags = task.task_tags || [];

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      await createTodo({
        title: newTodo.trim(),
        is_completed: false,
      });
      setNewTodo("");
    }
  };

  const handleToggleTodo = async (todoId: string, isCompleted: boolean) => {
    await updateTodo({ todoId, updates: { is_completed: !isCompleted } });
  };

  const handleSave = () => {
    updateTask({
      updates: { title, description },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask();
    onClose();
  };

  const handleTagSelect = async (tagId: string) => {
    const isSelected = taskTags.some((tag) => tag.id === tagId);

    if (isSelected) {
      await removeTag(tagId);
    } else {
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        await addTag(tag);
      }
    }
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    await updateTask({
      updates: { status: newStatus },
    });
  };

  const handleAssignUser = async (userId: string) => {
    const user = teamMembers.find((member) => member.id === userId);
    if (user) {
      await assignUser(user);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    await unassignUser(userId);
  };

  const completedTodos = todos.filter((todo) => todo.is_completed).length;
  const totalTodos = todos.length;
  const progress = totalTodos === 0 ? 0 : (completedTodos / totalTodos) * 100;

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
              className="w-full px-2 py-1 border rounded "
            >
              <option value="">Select a tag...</option>
              {tags
                .filter((tag) => !taskTags.some((tt) => tt.id === tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id} className="">
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {taskTags.map((tag) => (
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
            ))}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign user
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignUser(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="">Select a user...</option>
                {teamMembers
                  .filter(
                    (member) =>
                      !task.task_assignees.some(
                        (assignee) => assignee.id === member.id
                      )
                  )
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {task.task_assignees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.task_assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="px-3 py-1 bg-blue-100 rounded-full flex items-center gap-2"
                >
                  <User size={14} />
                  <span className="text-sm">{assignee.name}</span>
                  <button
                    onClick={() => handleUnassignUser(assignee.id)}
                    className="hover:opacity-75 text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group"
              >
                <button
                  onClick={() =>
                    handleToggleTodo(todo.id, todo.is_completed ?? false)
                  }
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    todo.is_completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {todo.is_completed && <Check size={14} />}
                </button>
                <span
                  className={`flex-1 ${
                    todo.is_completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
                  title="Delete todo"
                >
                  <X size={16} />
                </button>
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className="font-medium capitalize">{task.status}</span>
          </div>

          <div className="flex justify-end gap-2">
            {getStatusButton({
              status: task.status,
              onClick: handleStatusChange,
              variant: "modal",
            })}
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
