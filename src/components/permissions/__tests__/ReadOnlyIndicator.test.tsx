import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadOnlyIndicator, ReadOnlyWrapper } from "../ReadOnlyIndicator";

describe("ReadOnlyIndicator", () => {
  it("renders nothing when not in read-only mode", () => {
    const { container } = render(<ReadOnlyIndicator isReadOnly={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders indicator when in read-only mode", () => {
    render(<ReadOnlyIndicator isReadOnly={true} data-testid="indicator" />);
    expect(screen.getByTestId("indicator")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ReadOnlyIndicator
        isReadOnly={true}
        className="custom-class"
        data-testid="indicator"
      />
    );
    expect(screen.getByTestId("indicator")).toHaveClass("custom-class");
  });

  it("applies size variants", () => {
    render(
      <ReadOnlyIndicator isReadOnly={true} size="sm" data-testid="small" />
    );
    render(
      <ReadOnlyIndicator
        isReadOnly={true}
        size="default"
        data-testid="default"
      />
    );
    render(
      <ReadOnlyIndicator isReadOnly={true} size="lg" data-testid="large" />
    );

    expect(screen.getByTestId("small")).toHaveClass("text-xs");
    expect(screen.getByTestId("default")).toHaveClass("text-sm");
    expect(screen.getByTestId("large")).toHaveClass("text-base");
  });

  it("displays custom tooltip text", () => {
    render(
      <ReadOnlyIndicator isReadOnly={true} tooltipText="Custom tooltip" />
    );
    expect(screen.getByText("Custom tooltip")).toBeInTheDocument();
  });
});

describe("ReadOnlyWrapper", () => {
  it("renders children normally when not in read-only mode", () => {
    render(
      <ReadOnlyWrapper isReadOnly={false}>
        <div data-testid="content">Content</div>
      </ReadOnlyWrapper>
    );

    const content = screen.getByTestId("content");
    expect(content).toBeInTheDocument();
    expect(content.parentElement).not.toHaveClass("opacity-90");
  });

  it("applies read-only styling when in read-only mode", () => {
    render(
      <ReadOnlyWrapper isReadOnly={true}>
        <div data-testid="content">Content</div>
      </ReadOnlyWrapper>
    );

    const content = screen.getByTestId("content");
    expect(content.parentElement).toHaveClass("opacity-90");
    expect(content.parentElement).toHaveClass("pointer-events-none");
  });

  it("renders read-only indicator when in read-only mode", () => {
    render(
      <ReadOnlyWrapper isReadOnly={true}>
        <div>Content</div>
      </ReadOnlyWrapper>
    );

    // Check for the indicator (EyeIcon would be rendered)
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ReadOnlyWrapper
        isReadOnly={true}
        className="custom-class"
        data-testid="wrapper"
      >
        <div>Content</div>
      </ReadOnlyWrapper>
    );

    expect(screen.getByTestId("wrapper")).toHaveClass("custom-class");
  });

  it("positions indicator correctly", () => {
    render(
      <ReadOnlyWrapper isReadOnly={true} indicatorPosition="bottom-left">
        <div>Content</div>
      </ReadOnlyWrapper>
    );

    const indicator =
      document.querySelector("svg")?.parentElement?.parentElement
        ?.parentElement;
    expect(indicator).toHaveClass("bottom-2");
    expect(indicator).toHaveClass("left-2");
  });
});
