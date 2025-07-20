import React from "react";
import { Button } from "@/components/ui/button";
import { TeamPermissions } from "@/types";
import { cn } from "@/lib/utils";

interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The permission required to enable the button
   */
  requiredPermission: keyof TeamPermissions;

  /**
   * The user's permissions
   */
  userPermissions: TeamPermissions | undefined;

  /**
   * The tooltip text to show when the button is disabled due to permissions
   */
  permissionTooltip?: string;

  /**
   * Whether to hide the button when the user doesn't have permission
   * @default false
   */
  hideIfNoPermission?: boolean;

  /**
   * Whether the component is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Optional variant for the button
   */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * Optional size for the button
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Button content
   */
  children: React.ReactNode;
}

/**
 * A button component that is disabled when the user doesn't have the required permission
 */
export function PermissionButton({
  requiredPermission,
  userPermissions,
  permissionTooltip,
  hideIfNoPermission = false,
  isLoading = false,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: PermissionButtonProps) {
  // If permissions are loading, show a disabled button
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Check if user has the required permission
  const hasPermission = userPermissions && userPermissions[requiredPermission];

  // If user doesn't have permission and we should hide the button
  if (!hasPermission && hideIfNoPermission) {
    return null;
  }

  // If user doesn't have permission, show a disabled button with tooltip
  if (!hasPermission) {
    const tooltip =
      permissionTooltip ||
      `You need ${requiredPermission.replace("can", "")} permission`;

    return (
      <div className="relative group inline-block">
        <Button
          variant={variant}
          size={size}
          className={cn("opacity-50", className)}
          disabled
          {...props}
        >
          {children}
        </Button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  // If user has permission, show the button normally
  return (
    <Button variant={variant} size={size} className={className} {...props}>
      {children}
    </Button>
  );
}
