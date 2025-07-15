import React from "react";
import { cn } from "@/lib/utils";
import { EyeIcon } from "lucide-react";

interface ReadOnlyIndicatorProps {
  /**
   * Whether the content is in read-only mode
   */
  isReadOnly: boolean;

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Optional size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Optional custom tooltip text
   * @default "You have view-only access"
   */
  tooltipText?: string;
}

/**
 * A component that displays a read-only indicator when content is not editable
 */
export function ReadOnlyIndicator({
  isReadOnly,
  className,
  size = "default",
  tooltipText = "You have view-only access",
}: ReadOnlyIndicatorProps) {
  if (!isReadOnly) {
    return null;
  }

  // Define sizes
  const sizes = {
    sm: "text-xs p-1",
    default: "text-sm p-1.5",
    lg: "text-base p-2",
  };

  const iconSizes = {
    sm: 14,
    default: 16,
    lg: 20,
  };

  return (
    <div className="relative group inline-flex">
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-700 border border-gray-200",
          sizes[size],
          className
        )}
      >
        <EyeIcon size={iconSizes[size]} />
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {tooltipText}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

/**
 * A component that wraps content with a read-only indicator and styling
 */
export function ReadOnlyWrapper({
  isReadOnly,
  children,
  className,
  indicatorPosition = "top-right",
  tooltipText = "You have view-only access",
}: {
  isReadOnly: boolean;
  children: React.ReactNode;
  className?: string;
  indicatorPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  tooltipText?: string;
}) {
  if (!isReadOnly) {
    return <>{children}</>;
  }

  const positionClasses = {
    "top-right": "top-2 right-2",
    "top-left": "top-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
  };

  return (
    <div className={cn("relative", className)}>
      <div className="opacity-90 pointer-events-none select-none">
        {children}
      </div>
      <div className={cn("absolute z-10", positionClasses[indicatorPosition])}>
        <ReadOnlyIndicator isReadOnly={true} tooltipText={tooltipText} />
      </div>
    </div>
  );
}
