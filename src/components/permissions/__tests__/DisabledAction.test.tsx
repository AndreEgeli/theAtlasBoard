import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisabledAction, ActionTooltip } from "../DisabledAction";

describe("DisabledAction", () => {
  it("renders children normally when not disabled", () => {
    render(
      <DisabledAction disabled={false} tooltip="Test tooltip">
        <button data-testid="button">Click me</button>
      </DisabledAction>
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button.parentElement).not.toHaveClass("opacity-50");
    expect(button.parentElement).not.toHaveClass("cursor-not-allowed");
  });

  it("applies disabled styling when disabled", () => {
    render(
      <DisabledAction disabled={true} tooltip="Test tooltip">
        <button data-testid="button">Click me</button>
      </DisabledAction>
    );

    const button = screen.getByTestId("button");
    expect(button.parentElement).toHaveClass("opacity-50");
    expect(button.parentElement).toHaveClass("cursor-not-allowed");
    expect(button.parentElement).toHaveClass("pointer-events-none");
  });

  it("renders tooltip text", () => {
    render(
      <DisabledAction disabled={true} tooltip="Test tooltip">
        <button>Click me</button>
      </DisabledAction>
    );

    expect(screen.getByText("Test tooltip")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <DisabledAction
        disabled={true}
        tooltip="Test tooltip"
        className="custom-class"
      >
        <button>Click me</button>
      </DisabledAction>
    );

    expect(
      screen.getByText("Test tooltip").parentElement?.parentElement
    ).toHaveClass("custom-class");
  });

  it("applies custom disabledClassName", () => {
    render(
      <DisabledAction
        disabled={true}
        tooltip="Test tooltip"
        disabledClassName="custom-disabled"
      >
        <button data-testid="button">Click me</button>
      </DisabledAction>
    );

    expect(screen.getByTestId("button").parentElement).toHaveClass(
      "custom-disabled"
    );
  });

  it("applies custom tooltipClassName", () => {
    render(
      <DisabledAction
        disabled={true}
        tooltip="Test tooltip"
        tooltipClassName="custom-tooltip"
      >
        <button>Click me</button>
      </DisabledAction>
    );

    expect(screen.getByText("Test tooltip").parentElement).toHaveClass(
      "custom-tooltip"
    );
  });
});

describe("ActionTooltip", () => {
  it("renders children normally", () => {
    render(
      <ActionTooltip tooltip="Test tooltip">
        <button data-testid="button">Click me</button>
      </ActionTooltip>
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
  });

  it("renders tooltip text", () => {
    render(
      <ActionTooltip tooltip="Test tooltip">
        <button>Click me</button>
      </ActionTooltip>
    );

    expect(screen.getByText("Test tooltip")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ActionTooltip tooltip="Test tooltip" className="custom-class">
        <button>Click me</button>
      </ActionTooltip>
    );

    expect(
      screen.getByText("Test tooltip").parentElement?.parentElement
    ).toHaveClass("custom-class");
  });

  it("applies custom tooltipClassName", () => {
    render(
      <ActionTooltip tooltip="Test tooltip" tooltipClassName="custom-tooltip">
        <button>Click me</button>
      </ActionTooltip>
    );

    expect(screen.getByText("Test tooltip").parentElement).toHaveClass(
      "custom-tooltip"
    );
  });
});
