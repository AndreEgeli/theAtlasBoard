import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoardHeader } from "../BoardHeader";
import { Board } from "@/types";

// Mock the useBoardPermissionsContext hook
vi.mock("../BoardPermissionProvider", () => ({
  useBoardPermissionsContext: vi.fn().mockReturnValue({
    canEditBoard: true,
    canDeleteBoard: true,
    canCreateTasks: true,
    role: "editor",
    isLoading: false,
  }),
}));

// Mock the RoleBadge component
vi.mock("@/components/permissions", () => ({
  PermissionButton: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="permission-button">
      {children}
    </button>
  ),
  RoleBadge: ({ role }: any) => <div data-testid="role-badge">{role}</div>,
}));

describe("BoardHeader", () => {
  const mockBoard: Board = {
    id: "board-123",
    name: "Test Board",
    created_at: "2023-01-01",
    created_by: "user-123",
    team_id: "team-123",
    is_private: false,
    updated_at: null,
  };

  it("renders board name", () => {
    render(<BoardHeader board={mockBoard} />);

    expect(screen.getByText("Test Board")).toBeInTheDocument();
  });

  it("renders role badge", () => {
    render(<BoardHeader board={mockBoard} />);

    expect(screen.getByTestId("role-badge")).toBeInTheDocument();
    expect(screen.getByTestId("role-badge")).toHaveTextContent("editor");
  });

  it("calls onEditBoard when edit button is clicked", () => {
    const onEditBoard = vi.fn();

    render(<BoardHeader board={mockBoard} onEditBoard={onEditBoard} />);

    const buttons = screen.getAllByTestId("permission-button");
    // Find the edit button (usually the second button)
    const editButton = buttons.find((button) =>
      button.innerHTML.includes("PencilIcon")
    );

    fireEvent.click(editButton!);
    expect(onEditBoard).toHaveBeenCalled();
  });

  it("calls onDeleteBoard when delete button is clicked", () => {
    const onDeleteBoard = vi.fn();

    render(<BoardHeader board={mockBoard} onDeleteBoard={onDeleteBoard} />);

    const buttons = screen.getAllByTestId("permission-button");
    // Find the delete button (usually the third button)
    const deleteButton = buttons.find((button) =>
      button.innerHTML.includes("TrashIcon")
    );

    fireEvent.click(deleteButton!);
    expect(onDeleteBoard).toHaveBeenCalled();
  });

  it("calls onAddTask when add task button is clicked", () => {
    const onAddTask = vi.fn();

    render(<BoardHeader board={mockBoard} onAddTask={onAddTask} />);

    const buttons = screen.getAllByTestId("permission-button");
    // Find the add task button (usually the first button)
    const addTaskButton = buttons.find((button) =>
      button.innerHTML.includes("PlusIcon")
    );

    fireEvent.click(addTaskButton!);
    expect(onAddTask).toHaveBeenCalled();
  });
});
