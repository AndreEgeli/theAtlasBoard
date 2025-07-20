import React from "react";
import { TeamRole } from "@/types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  /**
   * The role to display
   */
  role: TeamRole;

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Optional size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

/**
 * A component that displays a user's role as a badge
 */
export function RoleBadge({
  role,
  className,
  size = "default",
}: RoleBadgeProps) {
  // Define colors based on role
  const colors = {
    owner: "bg-amber-100 text-amber-800 border-amber-200",
    editor: "bg-blue-100 text-blue-800 border-blue-200",
    viewer: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Define sizes
  const sizes = {
    sm: "text-xs px-1.5 py-0.5",
    default: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        colors[role],
        sizes[size],
        className
      )}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

/**
 * A component that displays a user's role as a badge with a tooltip
 */
export function RoleBadgeWithTooltip({
  role,
  className,
  size = "default",
}: RoleBadgeProps) {
  // Define tooltip text based on role
  const tooltips = {
    owner: "Team Owner: Full control over team, boards, and tasks",
    editor: "Editor: Can create and edit boards and tasks",
    viewer: "Viewer: Can only view boards and tasks",
  };

  return (
    <div className="relative group">
      <RoleBadge role={role} className={className} size={size} />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {tooltips[role]}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
