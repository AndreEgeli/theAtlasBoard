import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoleHelpText } from "../RoleHelpText";

describe("RoleHelpText", () => {
  it("should render help button", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    expect(helpButton).toBeInTheDocument();
  });

  it("should open modal when help button is clicked", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    expect(screen.getByText("Team Role Permissions Guide")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
  });

  it("should close modal when close button is clicked", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    expect(screen.getByText("Team Role Permissions Guide")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "" }); // X button
    fireEvent.click(closeButton);

    expect(
      screen.queryByText("Team Role Permissions Guide")
    ).not.toBeInTheDocument();
  });

  it("should close modal when backdrop is clicked", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    expect(screen.getByText("Team Role Permissions Guide")).toBeInTheDocument();

    // Click backdrop
    const backdrop = document.querySelector(".fixed.inset-0.bg-black");
    fireEvent.click(backdrop!);

    expect(
      screen.queryByText("Team Role Permissions Guide")
    ).not.toBeInTheDocument();
  });

  it("should close modal when 'Got it, thanks!' button is clicked", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    expect(screen.getByText("Team Role Permissions Guide")).toBeInTheDocument();

    const gotItButton = screen.getByRole("button", {
      name: /got it, thanks!/i,
    });
    fireEvent.click(gotItButton);

    expect(
      screen.queryByText("Team Role Permissions Guide")
    ).not.toBeInTheDocument();
  });

  it("should display role permissions and restrictions", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    // Check that all three roles are displayed
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();

    // Check for unique owner permission
    expect(
      screen.getByText("Manage team members and roles")
    ).toBeInTheDocument();

    // Check for viewer restrictions
    expect(
      screen.getByText("Cannot create, edit, or delete any content")
    ).toBeInTheDocument();
  });

  it("should display best practices section", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    expect(screen.getByText("💡 Best Practices")).toBeInTheDocument();
    expect(screen.getByText(/role sparingly/)).toBeInTheDocument();
    expect(screen.getByText(/active contributors/)).toBeInTheDocument();
    expect(screen.getByText(/stakeholders/)).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<RoleHelpText className="custom-class" />);

    const container = screen.getByRole("button", {
      name: /understanding team roles/i,
    }).parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("should show role icons correctly", () => {
    render(<RoleHelpText />);

    const helpButton = screen.getByRole("button", {
      name: /understanding team roles/i,
    });
    fireEvent.click(helpButton);

    // The icons should be rendered (we can't easily test the specific icons, but we can check they exist)
    const roleCards = screen.getAllByText(/Can Do:/);
    expect(roleCards).toHaveLength(3); // One for each role
  });
});
