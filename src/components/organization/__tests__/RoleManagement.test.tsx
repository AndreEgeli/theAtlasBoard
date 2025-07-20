import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleManagement } from "../RoleManagement";
import { ToastProvider } from "../../ui/toast";
import { TeamMemberRepository } from "@/api/repositories/TeamMemberRepository";

// Mock the TeamMemberRepository
vi.mock("@/api/repositories/TeamMemberRepository");
vi.mock("@/lib/supabase", () => ({
  supabase: {},
}));

const MockedTeamMemberRepository = vi.mocked(TeamMemberRepository);

function renderWithToast(component: React.ReactElement) {
  return render(<ToastProvider>{component}</ToastProvider>);
}

describe("RoleManagement", () => {
  const defaultProps = {
    teamId: "team-123",
    userId: "user-456",
    currentRole: "editor" as const,
    userName: "John Doe",
    userEmail: "john@example.com",
    canManageRoles: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render role badge when user cannot manage roles", () => {
    renderWithToast(
      <RoleManagement {...defaultProps} canManageRoles={false} />
    );

    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(
      screen.getByText(/can create, edit, and delete/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render dropdown button when user can manage roles", () => {
    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    expect(dropdownButton).toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
  });

  it("should open dropdown when button is clicked", () => {
    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    expect(screen.getByText("Change Role for John Doe")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
  });

  it("should close dropdown when backdrop is clicked", () => {
    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    expect(screen.getByText("Change Role for John Doe")).toBeInTheDocument();

    // Click backdrop (the fixed overlay)
    const backdrop = document.querySelector(".fixed.inset-0");
    fireEvent.click(backdrop!);

    expect(
      screen.queryByText("Change Role for John Doe")
    ).not.toBeInTheDocument();
  });

  it("should show current role as selected", () => {
    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const currentRoleButton = screen.getByText("Editor").closest("button");
    expect(currentRoleButton).toHaveClass(
      "bg-blue-50",
      "border",
      "border-blue-200"
    );
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("should call updateMemberRole when a different role is selected", async () => {
    const mockUpdateMemberRole = vi.fn().mockResolvedValue({});
    MockedTeamMemberRepository.prototype.updateMemberRole =
      mockUpdateMemberRole;

    const onRoleChange = vi.fn();
    renderWithToast(
      <RoleManagement {...defaultProps} onRoleChange={onRoleChange} />
    );

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const viewerButton = screen.getByText("Viewer").closest("button");
    fireEvent.click(viewerButton!);

    await waitFor(() => {
      expect(mockUpdateMemberRole).toHaveBeenCalledWith(
        "team-123",
        "user-456",
        "viewer"
      );
    });

    expect(onRoleChange).toHaveBeenCalledWith("viewer");
  });

  it("should show success toast when role is updated successfully", async () => {
    const mockUpdateMemberRole = vi.fn().mockResolvedValue({});
    MockedTeamMemberRepository.prototype.updateMemberRole =
      mockUpdateMemberRole;

    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const ownerButton = screen.getByText("Owner").closest("button");
    fireEvent.click(ownerButton!);

    await waitFor(() => {
      expect(screen.getByText("Role Updated Successfully")).toBeInTheDocument();
    });

    expect(
      screen.getByText("John Doe is now a team owner")
    ).toBeInTheDocument();
    expect(screen.getByText("Permission Changes Applied")).toBeInTheDocument();
  });

  it("should show error toast when role update fails", async () => {
    const mockUpdateMemberRole = vi
      .fn()
      .mockRejectedValue(new Error("Update failed"));
    MockedTeamMemberRepository.prototype.updateMemberRole =
      mockUpdateMemberRole;

    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const viewerButton = screen.getByText("Viewer").closest("button");
    fireEvent.click(viewerButton!);

    await waitFor(() => {
      expect(screen.getByText("Failed to Update Role")).toBeInTheDocument();
    });

    expect(screen.getByText("Update failed")).toBeInTheDocument();
  });

  it("should disable button when updating", async () => {
    const mockUpdateMemberRole = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    MockedTeamMemberRepository.prototype.updateMemberRole =
      mockUpdateMemberRole;

    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const viewerButton = screen.getByText("Viewer").closest("button");
    fireEvent.click(viewerButton!);

    // Button should be disabled during update
    expect(dropdownButton).toBeDisabled();
  });

  it("should not call updateMemberRole when same role is selected", () => {
    const mockUpdateMemberRole = vi.fn();
    MockedTeamMemberRepository.prototype.updateMemberRole =
      mockUpdateMemberRole;

    renderWithToast(<RoleManagement {...defaultProps} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    const editorButton = screen.getByText("Editor").closest("button");
    fireEvent.click(editorButton!);

    expect(mockUpdateMemberRole).not.toHaveBeenCalled();
  });

  it("should use email as fallback when userName is not provided", () => {
    renderWithToast(<RoleManagement {...defaultProps} userName="" />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    expect(
      screen.getByText("Change Role for john@example.com")
    ).toBeInTheDocument();
  });
});
