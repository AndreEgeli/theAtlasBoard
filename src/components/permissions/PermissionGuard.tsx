import React from "react";
import { TeamPermissions } from "@/types";

interface PermissionGuardProps {
  /**
   * The permission required to render the children
   */
  requiredPermission: keyof TeamPermissions;

  /**
   * The user's permissions
   */
  userPermissions: TeamPermissions | undefined;

  /**
   * Content to render when the user has the required permission
   */
  children: React.ReactNode;

  /**
   * Optional content to render when the user doesn't have the required permission
   */
  fallback?: React.ReactNode;

  /**
   * Whether to render nothing when the user doesn't have the required permission
   * @default false
   */
  hideIfNoPermission?: boolean;

  /**
   * Whether the component is in a loading state
   * @default false
   */
  isLoading?: boolean;
}

/**
 * A component that conditionally renders its children based on user permissions
 */
export function PermissionGuard({
  requiredPermission,
  userPermissions,
  children,
  fallback,
  hideIfNoPermission = false,
  isLoading = false,
}: PermissionGuardProps) {
  // If permissions are loading, show nothing or a loading state
  if (isLoading) {
    return null;
  }

  // If user has the required permission, render the children
  if (userPermissions && userPermissions[requiredPermission]) {
    return <>{children}</>;
  }

  // If user doesn't have the required permission
  if (hideIfNoPermission) {
    return null;
  }

  // Render the fallback if provided, otherwise null
  return fallback ? <>{fallback}</> : null;
}

/**
 * A component that renders its children only if the user has the required role
 */
export function RoleGuard({
  requiredRole,
  userRole,
  children,
  fallback,
  hideIfNoRole = false,
  isLoading = false,
}: {
  requiredRole: "owner" | "editor" | "viewer";
  userRole: string | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoRole?: boolean;
  isLoading?: boolean;
}) {
  // If role is loading, show nothing or a loading state
  if (isLoading) {
    return null;
  }

  // Role hierarchy: owner > editor > viewer
  const hasRequiredRole = (() => {
    if (!userRole) return false;

    if (requiredRole === "viewer") {
      // Any role can view
      return ["owner", "editor", "viewer"].includes(userRole);
    }

    if (requiredRole === "editor") {
      // Only owner and editor can edit
      return ["owner", "editor"].includes(userRole);
    }

    if (requiredRole === "owner") {
      // Only owner can perform owner actions
      return userRole === "owner";
    }

    return false;
  })();

  // If user has the required role, render the children
  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // If user doesn't have the required role
  if (hideIfNoRole) {
    return null;
  }

  // Render the fallback if provided, otherwise null
  return fallback ? <>{fallback}</> : null;
}
