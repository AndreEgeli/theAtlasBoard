import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardView } from "../BoardView";
import { Board } from "@/types";

// Mock the BoardPermissionProvider component
vi.mock("../BoardPermissionProvider", () => ({
  BoardPermissionProvider: ({ children }: any) => <div>{children}</div>,
  useBoardPermissionsContext: vi.fn().mockReturnValue({
    isViewer: false,
    isLoading: false,
  }),
}));

// Mock the BoardHeader component
vi.mock("../BoardHeader", () => ({
  BoardHeader: ({ board }: any) => (
    <div data-testid="board-header">{board.name}</div>
  ),
}));

// Mock the ReadOnlyWrapper component
vi.mock("@/components/permissions", () => ({
  ReadOnlyWrapper: ({ children, isReadOnly }: any) => (
    <div data-testid="read-only-wrapper" data-readonly={isReadOnly}>
      {children}
    </div>
  ),
}));

describe("BoardView", () => {
  const mockBoard: Board = {
    id: "board-123",
    name: "Test Board",
    created_at: "2023-01-01",
    created_by: "user-123",
    team_id: "team-123",
    is_private: false,
    updated_at: null,
  };

  it("renders board header and content", () => {
    render(
      <BoardView board={mockBoard}>
        <div data-testid="board-content">Board Content</div>
      </BoardView>
    );

    expect(screen.getByTestId("board-header")).toBeInTheDocument();
    expect(screen.getByTestId("board-header")).toHaveTextContent("Test Board");
    expect(screen.getByTestId("board-content")).toBeInTheDocument();
    expect(screen.getByTestId("board-content")).toHaveTextContent(
      "Board Content"
    );
  });

  it("wraps content in ReadOnlyWrapper", () => {
    render(
      <BoardView board={mockBoard}>
        <div>Board Content</div>
      </BoardView>
    );

    expect(screen.getByTestId("read-only-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("read-only-wrapper")).toHaveAttribute(
      "data-readonly",
      "false"
    );
  });

  it("shows loading state when permissions are loading", () => {
    // Override the mock to simulate loading state
    vi.mocked(
      require("../BoardPermissionProvider").useBoardPermissionsContext
    ).mockReturnValueOnce({
      isViewer: false,
      isLoading: true,
    });

    render(
      <BoardView board={mockBoard}>
        <div data-testid="board-content">Board Content</div>
      </BoardView>
    );

    // Should show loading skeleton
    expect(screen.queryByTestId("board-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("board-content")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
