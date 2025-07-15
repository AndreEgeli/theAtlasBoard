import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TaskPermissionProvider,
  useTaskPermissionsContext,
} from "../TaskPermissionProvider";

// Mock the useTaskPermissions hook
vi.mock("@/hooks/permissions", () => ({
  useTaskPermissions: vi.fn().mockReturnValue({
    permissions: {
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canCreateTodos: true,
      canEditTodos: true,
      canToggleTodos: true,
      canAddTaskTags: true,
      canRemoveTaskTags: true,
    },
    role: "editor",
    isOwner: false,
    isEditor: true,
    isViewer: false,
    canEditTask: true,
    canDeleteTask: true,
    canAssignTask: true,
    canCreateTodos: true,
    canEditTodos: true,
    canToggleTodos: true,
    isLoading: false,
  }),
}));

// Test component that uses the context
function TestComponent() {
  const {
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canCreateTodos,
    canEditTodos,
    canToggleTodos,
    isOwner,
    isEditor,
    isViewer,
    role,
    isLoading,
  } = useTaskPermissionsContext();

  return (
    <div>
      <div data-testid="can-edit-task">{canEditTask.toString()}</div>
      <div data-testid="can-delete-task">{canDeleteTask.toString()}</div>
      <div data-testid="can-assign-task">{canAssignTask.toString()}</div>
      <div data-testid="can-create-todos">{canCreateTodos.toString()}</div>
      <div data-testid="can-edit-todos">{canEditTodos.toString()}</div>
      <div data-testid="can-toggle-todos">{canToggleTodos.toString()}</div>
      <div data-testid="is-owner">{isOwner.toString()}</div>
      <div data-testid="is-editor">{isEditor.toString()}</div>
      <div data-testid="is-viewer">{isViewer.toString()}</div>
      <div data-testid="role">{role}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
    </div>
  );
}

describe("TaskPermissionProvider", () => {
  it("provides task permissions to children", () => {
    render(
      <TaskPermissionProvider taskId="task-123">
        <TestComponent />
      </TaskPermissionProvider>
    );

    expect(screen.getByTestId("can-edit-task")).toHaveTextContent("true");
    expect(screen.getByTestId("can-delete-task")).toHaveTextContent("true");
    expect(screen.getByTestId("can-assign-task")).toHaveTextContent("true");
    expect(screen.getByTestId("can-create-todos")).toHaveTextContent("true");
    expect(screen.getByTestId("can-edit-todos")).toHaveTextContent("true");
    expect(screen.getByTestId("can-toggle-todos")).toHaveTextContent("true");
    expect(screen.getByTestId("is-owner")).toHaveTextContent("false");
    expect(screen.getByTestId("is-editor")).toHaveTextContent("true");
    expect(screen.getByTestId("is-viewer")).toHaveTextContent("false");
    expect(screen.getByTestId("role")).toHaveTextContent("editor");
    expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
  });

  it("throws error when used outside provider", () => {
    // Suppress console errors for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow(
      "useTaskPermissionsContext must be used within a TaskPermissionProvider"
    );

    // Restore console.error
    console.error = consoleError;
  });
});
