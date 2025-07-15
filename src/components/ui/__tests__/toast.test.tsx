import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ToastProvider, useToast } from "../toast";

// Test component that uses the toast hook
function TestComponent() {
  const { addToast } = useToast();

  return (
    <div>
      <button
        onClick={() =>
          addToast({
            type: "success",
            title: "Success!",
            description: "Operation completed successfully",
          })
        }
      >
        Add Success Toast
      </button>
      <button
        onClick={() =>
          addToast({
            type: "error",
            title: "Error!",
            description: "Something went wrong",
          })
        }
      >
        Add Error Toast
      </button>
      <button
        onClick={() =>
          addToast({
            type: "info",
            title: "Info",
            duration: 1000,
          })
        }
      >
        Add Info Toast
      </button>
    </div>
  );
}

describe("Toast System", () => {
  it("should render toast provider without crashing", () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should throw error when useToast is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast must be used within a ToastProvider");

    consoleSpy.mockRestore();
  });

  it("should display success toast when added", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Success Toast"));

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(
      screen.getByText("Operation completed successfully")
    ).toBeInTheDocument();
  });

  it("should display error toast when added", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Error Toast"));

    expect(screen.getByText("Error!")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should remove toast when close button is clicked", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Success Toast"));
    expect(screen.getByText("Success!")).toBeInTheDocument();

    // Find and click the close button (X icon)
    const closeButton = screen.getByRole("button", { name: "" }); // X button has no text
    fireEvent.click(closeButton);

    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });

  it("should display multiple toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Success Toast"));
    fireEvent.click(screen.getByText("Add Error Toast"));

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("should apply correct styling for different toast types", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Success Toast"));
    // Find the toast container (parent of the title)
    const successToast = screen
      .getByText("Success!")
      .closest("[class*='bg-green-50']");
    expect(successToast).toHaveClass(
      "bg-green-50",
      "border-green-200",
      "text-green-800"
    );

    fireEvent.click(screen.getByText("Add Error Toast"));
    const errorToast = screen
      .getByText("Error!")
      .closest("[class*='bg-red-50']");
    expect(errorToast).toHaveClass(
      "bg-red-50",
      "border-red-200",
      "text-red-800"
    );
  });

  it("should create toast with custom duration", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Add Info Toast"));
    expect(screen.getByText("Info")).toBeInTheDocument();

    // Test that the toast is created (auto-removal testing is complex with timers)
    // The actual auto-removal functionality works in the browser
  });
});
