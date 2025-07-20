import { useState, useEffect } from "react";
import { useTask } from "@/api/hooks/useTask";
import { useBoardContext } from "@/contexts/BoardContext";
import { useAuth } from "@/hooks/useAuth";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";
import { supabase } from "@/lib/supabase";
import type { Task, Tag as TagType, TeamPermissions } from "../../types";
import { Check, Plus, Tag, X, User, Lock } from "lucide-react";
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
  const { user } = useAuth();

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [newTodo, setNewTodo] = useState("");
  const [permissions, setPermissions] = useState<TeamPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Load user permissions for this board
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id || !boardId) return;

      try {
        const repository = new TeamMemberRepository(supabase);
        const boardAccess = await repository.getUserBoardPermissions(
          user.id,
          boardId
        );
        setPermissions(boardAccess?.permissions || null);
      } catch (error) {
        console.error("Failed to load permissions:", error);
        setPermissions(null);
      } finally {
        setPermissionsLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id, boardId]);

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

  // Permission checks
  const canEditTasks = permissions?.canEditTasks ?? false;
  const canDeleteTasks = permissions?.canDeleteTasks ?? false;
  const canAssignTasks = permissions?.canAssignTasks ?? false;
  const canAddTaskTags = permissions?.canAddTaskTags ?? false;
  const canRemoveTaskTags = permissions?.canRemoveTaskTags ?? false;
  const canCreateTodos = permissions?.canCreateTodos ?? false;
  const canEditTodos = permissions?.canEditTodos ?? false;
  const canDeleteTodos = permissions?.canDeleteTodos ?? false;
  const canToggleTodos = permissions?.canToggleTodos ?? false;
  const isViewer = !canEditTasks && !canDeleteTasks;

  // Show loading state for permissions
  if (permissionsLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditTasks}
              className={`text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 ${
                !canEditTasks ? "cursor-not-allowed opacity-60" : ""
              }`}
              title={
                !canEditTasks ? "You need editor access to edit task title" : ""
              }
            />
            {!canEditTasks && <Lock size={16} className="text-gray-400" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDeleteTasks}
              className={`p-2 ${
                canDeleteTasks
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              title={
                canDeleteTasks
                  ? "Delete task"
                  : "You need editor access to delete tasks"
              }
            >
              <Trash2 size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Read-only indicator */}
        {isViewer && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <Lock size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-800">
              You have view-only access to this task. Contact a team owner or
              editor to make changes.
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Add tag
              </label>
              {!canAddTaskTags && <Lock size={14} className="text-gray-400" />}
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && canAddTaskTags) {
                  handleTagSelect(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={!canAddTaskTags}
              className={`w-full px-2 py-1 border rounded ${
                !canAddTaskTags
                  ? "cursor-not-allowed opacity-60 bg-gray-50"
                  : ""
              }`}
              title={
                !canAddTaskTags
                  ? "You need editor access to add tags"
                  : "Select a tag to add"
              }
            >
              <option value="">
                {canAddTaskTags
                  ? "Select a tag..."
                  : "No permission to add tags"}
              </option>
              {canAddTaskTags &&
                tags
                  .filter((tag) => !taskTags.some((tt) => tt.id === tag.id))
                  .map((tag) => (
                    <option key={tag.id} value={tag.id}>
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
                {canRemoveTaskTags ? (
                  <button
                    type="button"
                    onClick={() => handleTagSelect(tag.id)}
                    className="hover:opacity-75"
                    title="Remove tag"
                  >
                    ×
                  </button>
                ) : (
                  <Lock size={12} className="text-gray-600 opacity-60" />
                )}
              </span>
            ))}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Assign user
                </label>
                {!canAssignTasks && (
                  <Lock size={14} className="text-gray-400" />
                )}
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && canAssignTasks) {
                    handleAssignUser(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={!canAssignTasks}
                className={`w-full px-2 py-1 border rounded ${
                  !canAssignTasks
                    ? "cursor-not-allowed opacity-60 bg-gray-50"
                    : ""
                }`}
                title={
                  !canAssignTasks
                    ? "You need editor access to assign users"
                    : "Select a user to assign"
                }
              >
                <option value="">
                  {canAssignTasks
                    ? "Select a user..."
                    : "No permission to assign users"}
                </option>
                {canAssignTasks &&
                  teamMembers
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
                  {canAssignTasks ? (
                    <button
                      type="button"
                      onClick={() => handleUnassignUser(assignee.id)}
                      className="hover:opacity-75 text-red-500"
                      title="Unassign user"
                    >
                      ×
                    </button>
                  ) : (
                    <Lock size={12} className="text-gray-600 opacity-60" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            {!canEditTasks && <Lock size={14} className="text-gray-400" />}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEditTasks}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !canEditTasks ? "cursor-not-allowed opacity-60 bg-gray-50" : ""
            }`}
            rows={4}
            placeholder={
              canEditTasks
                ? "Add a detailed description..."
                : "No permission to edit description"
            }
            title={
              !canEditTasks
                ? "You need editor access to edit task description"
                : ""
            }
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
                  type="button"
                  onClick={() =>
                    canToggleTodos &&
                    handleToggleTodo(todo.id, todo.is_completed ?? false)
                  }
                  disabled={!canToggleTodos}
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    todo.is_completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300"
                  } ${
                    !canToggleTodos
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  title={
                    !canToggleTodos
                      ? "You need editor access to toggle todos"
                      : "Toggle todo completion"
                  }
                >
                  {todo.is_completed && <Check size={14} />}
                  {!canToggleTodos && !todo.is_completed && (
                    <Lock size={10} className="text-gray-400" />
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    todo.is_completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.title}
                </span>
                {canDeleteTodos ? (
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
                    title="Delete todo"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 p-1">
                    <Lock size={12} className="text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              disabled={!canCreateTodos}
              placeholder={
                canCreateTodos
                  ? "Add a new todo item..."
                  : "No permission to add todos"
              }
              className={`flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !canCreateTodos
                  ? "cursor-not-allowed opacity-60 bg-gray-50"
                  : ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreateTodos) {
                  handleAddTodo();
                }
              }}
              title={
                !canCreateTodos ? "You need editor access to add todos" : ""
              }
            />
            <button
              type="button"
              onClick={handleAddTodo}
              disabled={!canCreateTodos || !newTodo.trim()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                canCreateTodos && newTodo.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={
                !canCreateTodos
                  ? "You need editor access to add todos"
                  : "Add todo"
              }
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
            {canEditTasks ? (
              getStatusButton({
                status: task.status,
                onClick: handleStatusChange,
                variant: "modal",
              })
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-gray-500">
                <Lock size={14} />
                <span className="text-sm">Status changes disabled</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canEditTasks}
              className={`px-4 py-2 rounded ${
                canEditTasks
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={
                !canEditTasks
                  ? "You need editor access to save changes"
                  : "Save changes"
              }
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
