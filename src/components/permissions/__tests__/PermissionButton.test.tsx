import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PermissionButton } from "../PermissionButton";
import { TeamPermissions } from "@/types";

// Mock the Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, ...props }: any) => (
    <button disabled={disabled} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

describe("PermissionButton", () => {
  const editorPermissions: TeamPermissions = {
    canCreateBoards: true,
    canEditBoards: true,
    canDeleteBoards: true,
    canViewBoards: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canAssignTasks: true,
    canViewTasks: true,
    canCreateTodos: true,
    canEditTodos: true,
    canDeleteTodos: true,
    canToggleTodos: true,
    canViewTodos: true,
    canAddTaskTags: true,
    canRemoveTaskTags: true,
  };

  const viewerPermissions: TeamPermissions = {
    canCreateBoards: false,
    canEditBoards: false,
    canDeleteBoards: false,
    canViewBoards: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canViewTasks: true,
    canCreateTodos: false,
    canEditTodos: false,
    canDeleteTodos: false,
    canToggleTodos: false,
    canViewTodos: true,
    canAddTaskTags: false,
    canRemoveTaskTags: false,
  };

  it("renders enabled button when user has the required permission", () => {
    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
      >
        Edit Board
      </PermissionButton>
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Edit Board");
  });

  it("renders disabled button when user doesn't have the required permission", () => {
    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
      >
        Edit Board
      </PermissionButton>
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("renders nothing when hideIfNoPermission is true and user doesn't have permission", () => {
    const { container } = render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
        hideIfNoPermission
      >
        Edit Board
      </PermissionButton>
    );

    expect(screen.queryByTestId("button")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("renders disabled button when isLoading is true", () => {
    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
        isLoading
      >
        Edit Board
      </PermissionButton>
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("displays custom permission tooltip", () => {
    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
        permissionTooltip="You need editor access to edit this board"
      >
        Edit Board
      </PermissionButton>
    );

    expect(
      screen.getByText("You need editor access to edit this board")
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
        className="custom-class"
      >
        Edit Board
      </PermissionButton>
    );

    expect(screen.getByTestId("button")).toHaveClass("custom-class");
  });

  it("passes through other button props", () => {
    const onClick = vi.fn();

    render(
      <PermissionButton
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
        onClick={onClick}
        type="submit"
      >
        Edit Board
      </PermissionButton>
    );

    const button = screen.getByTestId("button");
    expect(button).toHaveAttribute("type", "submit");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
