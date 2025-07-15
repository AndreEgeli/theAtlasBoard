import React, { useState } from "react";
import { TodoItem } from "@/types";
import { useTaskPermissionsContext } from "./TaskPermissionProvider";
import { PermissionButton, DisabledAction } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

interface TodoListProps {
  todos: TodoItem[];
  taskId: string;
  onAddTodo?: (taskId: string, title: string) => void;
  onToggleTodo?: (todo: TodoItem) => void;
  onEditTodo?: (todo: TodoItem, newTitle: string) => void;
  onDeleteTodo?: (todo: TodoItem) => void;
}

/**
 * Todo list component that respects user permissions
 */
export function TodoList({
  todos,
  taskId,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  onDeleteTodo,
}: TodoListProps) {
  const {
    canCreateTodos,
    canEditTodos,
    canToggleTodos,
    canDeleteTodos = false, // Derived from canEditTodos
    permissions,
    isLoading,
  } = useTaskPermissionsContext();

  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");

  // Handle adding a new todo
  const handleAddTodo = () => {
    if (newTodoTitle.trim() && onAddTodo) {
      onAddTodo(taskId, newTodoTitle.trim());
      setNewTodoTitle("");
    }
  };

  // Start editing a todo
  const startEditingTodo = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  };

  // Save edited todo
  const saveEditedTodo = (todo: TodoItem) => {
    if (editingTodoTitle.trim() && onEditTodo) {
      onEditTodo(todo, editingTodoTitle.trim());
    }
    setEditingTodoId(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTodoId(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Todo Items</h3>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2">
            {editingTodoId === todo.id ? (
              // Editing mode
              <>
                <Input
                  value={editingTodoTitle}
                  onChange={(e) => setEditingTodoTitle(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveEditedTodo(todo)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                  Cancel
                </Button>
              </>
            ) : (
              // View mode
              <>
                <DisabledAction
                  disabled={!canToggleTodos}
                  tooltip="You need editor access to toggle todos"
                >
                  <Checkbox
                    checked={todo.is_completed || false}
                    onCheckedChange={() => onToggleTodo?.(todo)}
                    disabled={!canToggleTodos}
                  />
                </DisabledAction>

                <span
                  className={`flex-1 ${
                    todo.is_completed ? "line-through text-gray-500" : ""
                  }`}
                >
                  {todo.title}
                </span>

                <DisabledAction
                  disabled={!canEditTodos}
                  tooltip="You need editor access to edit todos"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEditingTodo(todo)}
                    disabled={!canEditTodos}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </DisabledAction>

                <DisabledAction
                  disabled={!canDeleteTodos}
                  tooltip="You need editor access to delete todos"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDeleteTodo?.(todo)}
                    disabled={!canDeleteTodos}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </DisabledAction>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new todo form */}
      <div className="flex items-center gap-2 mt-4">
        <Input
          placeholder="Add a new todo item..."
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          disabled={!canCreateTodos}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddTodo();
            }
          }}
        />

        <PermissionButton
          requiredPermission="canCreateTodos"
          userPermissions={isLoading ? undefined : permissions}
          isLoading={isLoading}
          onClick={handleAddTodo}
          permissionTooltip="You need editor access to add todos"
          disabled={!newTodoTitle.trim()}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </PermissionButton>
      </div>
    </div>
  );
}
