import React from "react";
import { cn } from "@/lib/utils";

interface DisabledActionProps {
  /**
   * Whether the action is disabled
   */
  disabled: boolean;

  /**
   * The tooltip text to show when hovering over the disabled element
   */
  tooltip: string;

  /**
   * The content to render
   */
  children: React.ReactNode;

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Optional additional class names for the tooltip
   */
  tooltipClassName?: string;

  /**
   * Optional additional class names for the disabled state
   */
  disabledClassName?: string;
}

/**
 * A component that wraps an action with disabled styling and a tooltip
 */
export function DisabledAction({
  disabled,
  tooltip,
  children,
  className,
  tooltipClassName,
  disabledClassName,
}: DisabledActionProps) {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "opacity-50 cursor-not-allowed pointer-events-none",
          disabledClassName
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10",
          tooltipClassName
        )}
      >
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

/**
 * A component that wraps an action with a tooltip
 */
export function ActionTooltip({
  tooltip,
  children,
  className,
  tooltipClassName,
}: Omit<DisabledActionProps, "disabled" | "disabledClassName">) {
  return (
    <div className={cn("relative group", className)}>
      {children}
      <div
        className={cn(
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10",
          tooltipClassName
        )}
      >
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
