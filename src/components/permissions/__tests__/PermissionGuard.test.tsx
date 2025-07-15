import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGuard, RoleGuard } from "../PermissionGuard";
import { TeamPermissions } from "@/types";

describe("PermissionGuard", () => {
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

  it("renders children when user has the required permission", () => {
    render(
      <PermissionGuard
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
      >
        <div data-testid="content">Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders fallback when user doesn't have the required permission", () => {
    render(
      <PermissionGuard
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <div data-testid="content">Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders nothing when user doesn't have the required permission and no fallback", () => {
    render(
      <PermissionGuard
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
      >
        <div data-testid="content">Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders nothing when hideIfNoPermission is true and user doesn't have permission", () => {
    render(
      <PermissionGuard
        requiredPermission="canEditBoards"
        userPermissions={viewerPermissions}
        hideIfNoPermission
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <div data-testid="content">Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("renders nothing when isLoading is true", () => {
    render(
      <PermissionGuard
        requiredPermission="canEditBoards"
        userPermissions={editorPermissions}
        isLoading
      >
        <div data-testid="content">Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });
});

describe("RoleGuard", () => {
  it("renders children when user has the required role", () => {
    render(
      <RoleGuard requiredRole="editor" userRole="editor">
        <div data-testid="content">Content</div>
      </RoleGuard>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders children when user has a higher role than required", () => {
    render(
      <RoleGuard requiredRole="editor" userRole="owner">
        <div data-testid="content">Content</div>
      </RoleGuard>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders fallback when user has a lower role than required", () => {
    render(
      <RoleGuard
        requiredRole="editor"
        userRole="viewer"
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <div data-testid="content">Content</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders nothing when user has a lower role and no fallback", () => {
    render(
      <RoleGuard requiredRole="owner" userRole="editor">
        <div data-testid="content">Content</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("renders nothing when hideIfNoRole is true and user has a lower role", () => {
    render(
      <RoleGuard
        requiredRole="owner"
        userRole="editor"
        hideIfNoRole
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <div data-testid="content">Content</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });
});
