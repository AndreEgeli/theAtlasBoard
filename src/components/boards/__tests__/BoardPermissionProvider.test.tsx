import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  BoardPermissionProvider,
  useBoardPermissionsContext,
} from "../BoardPermissionProvider";

// Mock the useBoardPermissions hook
vi.mock("@/hooks/permissions", () => ({
  useBoardPermissions: vi.fn().mockReturnValue({
    permissions: {
      canEditBoards: true,
      canDeleteBoards: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canViewBoards: true,
      canViewTasks: true,
    },
    role: "editor",
    teamId: "team-123",
    isOwner: false,
    isEditor: true,
    isViewer: false,
    canEditBoard: true,
    canDeleteBoard: true,
    canCreateTasks: true,
    canEditTasks: true,
    isLoading: false,
  }),
}));

// Test component that uses the context
function TestComponent() {
  const {
    canEditBoard,
    canDeleteBoard,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canAssignTasks,
    isOwner,
    isEditor,
    isViewer,
    role,
    teamId,
    isLoading,
  } = useBoardPermissionsContext();

  return (
    <div>
      <div data-testid="can-edit-board">{canEditBoard.toString()}</div>
      <div data-testid="can-delete-board">{canDeleteBoard.toString()}</div>
      <div data-testid="can-create-tasks">{canCreateTasks.toString()}</div>
      <div data-testid="can-edit-tasks">{canEditTasks.toString()}</div>
      <div data-testid="can-delete-tasks">{canDeleteTasks.toString()}</div>
      <div data-testid="can-assign-tasks">{canAssignTasks.toString()}</div>
      <div data-testid="is-owner">{isOwner.toString()}</div>
      <div data-testid="is-editor">{isEditor.toString()}</div>
      <div data-testid="is-viewer">{isViewer.toString()}</div>
      <div data-testid="role">{role}</div>
      <div data-testid="team-id">{teamId}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
    </div>
  );
}

describe("BoardPermissionProvider", () => {
  it("provides board permissions to children", () => {
    render(
      <BoardPermissionProvider boardId="board-123">
        <TestComponent />
      </BoardPermissionProvider>
    );

    expect(screen.getByTestId("can-edit-board")).toHaveTextContent("true");
    expect(screen.getByTestId("can-delete-board")).toHaveTextContent("true");
    expect(screen.getByTestId("can-create-tasks")).toHaveTextContent("true");
    expect(screen.getByTestId("can-edit-tasks")).toHaveTextContent("true");
    expect(screen.getByTestId("can-delete-tasks")).toHaveTextContent("true");
    expect(screen.getByTestId("can-assign-tasks")).toHaveTextContent("true");
    expect(screen.getByTestId("is-owner")).toHaveTextContent("false");
    expect(screen.getByTestId("is-editor")).toHaveTextContent("true");
    expect(screen.getByTestId("is-viewer")).toHaveTextContent("false");
    expect(screen.getByTestId("role")).toHaveTextContent("editor");
    expect(screen.getByTestId("team-id")).toHaveTextContent("team-123");
    expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
  });

  it("throws error when used outside provider", () => {
    // Suppress console errors for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow(
      "useBoardPermissionsContext must be used within a BoardPermissionProvider"
    );

    // Restore console.error
    console.error = consoleError;
  });
});
