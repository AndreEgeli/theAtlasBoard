import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleBadge } from "../RoleBadge";

describe("RoleBadge", () => {
  it("renders owner badge with correct styling", () => {
    render(<RoleBadge role="owner" data-testid="role-badge" />);

    const badge = screen.getByTestId("role-badge");
    expect(badge).toHaveTextContent("Owner");
    expect(badge).toHaveClass("bg-amber-100");
    expect(badge).toHaveClass("text-amber-800");
  });

  it("renders editor badge with correct styling", () => {
    render(<RoleBadge role="editor" data-testid="role-badge" />);

    const badge = screen.getByTestId("role-badge");
    expect(badge).toHaveTextContent("Editor");
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-800");
  });

  it("renders viewer badge with correct styling", () => {
    render(<RoleBadge role="viewer" data-testid="role-badge" />);

    const badge = screen.getByTestId("role-badge");
    expect(badge).toHaveTextContent("Viewer");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });

  it("applies custom className", () => {
    render(
      <RoleBadge
        role="owner"
        className="custom-class"
        data-testid="role-badge"
      />
    );

    const badge = screen.getByTestId("role-badge");
    expect(badge).toHaveClass("custom-class");
  });

  it("applies size variants", () => {
    render(<RoleBadge role="owner" size="sm" data-testid="small-badge" />);
    render(
      <RoleBadge role="owner" size="default" data-testid="default-badge" />
    );
    render(<RoleBadge role="owner" size="lg" data-testid="large-badge" />);

    expect(screen.getByTestId("small-badge")).toHaveClass("text-xs");
    expect(screen.getByTestId("default-badge")).toHaveClass("text-sm");
    expect(screen.getByTestId("large-badge")).toHaveClass("text-base");
  });
});
