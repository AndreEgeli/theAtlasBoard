import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoList } from "../TodoList";
import { TodoItem } from "@/types";

// Mock the useTaskPermissionsContext hook
vi.mock("../TaskPermissionProvider", () => ({
  useTaskPermissionsContext: vi.fn().mockReturnValue({
    canCreateTodos: true,
    canEditTodos: true,
    canToggleTodos: true,
    canDeleteTodos: true,
    permissions: {
      canCreateTodos: true,
      canEditTodos: true,
      canToggleTodos: true,
      canDeleteTodos: true,
    },
    isLoading: false,
  }),
}));

// Mock the permission components
vi.mock("@/components/permissions", () => ({
  PermissionButton: ({ children, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="permission-button"
    >
      {children}
    </button>
  ),
  DisabledAction: ({ children, disabled }: any) => (
    <div data-testid="disabled-action" data-disabled={disabled}>
      {children}
    </div>
  ),
}));

// Mock the UI components
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onCheckedChange(!checked)}
      disabled={disabled}
      data-testid="checkbox"
    />
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} data-testid="input" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, size, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-size={size}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

describe("TodoList", () => {
  const mockTodos: TodoItem[] = [
    {
      id: "todo-1",
      title: "Todo 1",
      is_completed: false,
      task_id: "task-123",
      created_at: "2023-01-01",
      created_by: "user-123",
      updated_at: null,
    },
    {
      id: "todo-2",
      title: "Todo 2",
      is_completed: true,
      task_id: "task-123",
      created_at: "2023-01-01",
      created_by: "user-123",
      updated_at: null,
    },
  ];

  it("renders todos correctly", () => {
    render(<TodoList todos={mockTodos} taskId="task-123" />);

    expect(screen.getByText("Todo 1")).toBeInTheDocument();
    expect(screen.getByText("Todo 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("checkbox")[0]).not.toBeChecked();
    expect(screen.getAllByTestId("checkbox")[1]).toBeChecked();
  });

  it("calls onToggleTodo when checkbox is clicked", () => {
    const onToggleTodo = vi.fn();

    render(
      <TodoList
        todos={mockTodos}
        taskId="task-123"
        onToggleTodo={onToggleTodo}
      />
    );

    fireEvent.click(screen.getAllByTestId("checkbox")[0]);
    expect(onToggleTodo).toHaveBeenCalledWith(mockTodos[0]);
  });

  it("allows adding new todos", () => {
    const onAddTodo = vi.fn();

    render(
      <TodoList todos={mockTodos} taskId="task-123" onAddTodo={onAddTodo} />
    );

    const input = screen.getByTestId("input");
    const addButton = screen.getByTestId("permission-button");

    fireEvent.change(input, { target: { value: "New Todo" } });
    fireEvent.click(addButton);

    expect(onAddTodo).toHaveBeenCalledWith("task-123", "New Todo");
  });

  it("allows editing todos", () => {
    const onEditTodo = vi.fn();

    render(
      <TodoList todos={mockTodos} taskId="task-123" onEditTodo={onEditTodo} />
    );

    // Click edit button for first todo
    const editButtons = screen
      .getAllByTestId("button")
      .filter((button) => button.textContent?.includes("PencilIcon"));
    fireEvent.click(editButtons[0]);

    // Now we should be in edit mode
    const input = screen.getByTestId("input");
    expect(input).toHaveValue("Todo 1");

    // Change the value and save
    fireEvent.change(input, { target: { value: "Updated Todo" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(onEditTodo).toHaveBeenCalledWith(mockTodos[0], "Updated Todo");
  });

  it("allows deleting todos", () => {
    const onDeleteTodo = vi.fn();

    render(
      <TodoList
        todos={mockTodos}
        taskId="task-123"
        onDeleteTodo={onDeleteTodo}
      />
    );

    // Click delete button for first todo
    const deleteButtons = screen
      .getAllByTestId("button")
      .filter((button) => button.textContent?.includes("TrashIcon"));
    fireEvent.click(deleteButtons[0]);

    expect(onDeleteTodo).toHaveBeenCalledWith(mockTodos[0]);
  });
});
