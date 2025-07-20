import { Task } from "../types";
import { Play, Send, Check, Archive } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatusTransition {
  nextStatus: Task["status"];
  icon: LucideIcon;
  label: string;
  color: string;
  title: string;
}

export const TASK_STATUSES: Record<Task["status"], StatusTransition> = {
  pending: {
    icon: Play,
    title: "Start the task",
    label: "Pending",
    color: "gray",
    nextStatus: "started" as const,
  },
  started: {
    icon: Play,
    title: "Start the task",
    label: "In Progress",
    color: "blue",
    nextStatus: "in_review" as const,
  },
  in_review: {
    icon: Send,
    title: "Start the task",
    label: "In Review",
    color: "orange",
    nextStatus: "completed" as const,
  },
  completed: {
    icon: Check,
    title: "Start the task",
    label: "Completed",
    color: "green",
    nextStatus: "archived" as const,
  },
  archived: {
    icon: Archive,
    title: "Start the task",
    label: "Archived",
    color: "gray",
    nextStatus: "archived" as const,
  },
} as const;

interface GetStatusButtonProps {
  status: Task["status"];
  onClick: (newStatus: Task["status"]) => void;
  variant?: "card" | "modal";
}

export function getStatusButton({
  status,
  onClick,
  variant = "card",
}: GetStatusButtonProps) {
  const transition = TASK_STATUSES[status];
  if (!transition || status === "archived") return null;

  const { icon: Icon, label, color, title, nextStatus } = transition;

  if (variant === "card") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(nextStatus);
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-${color}-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:scale-110`}
        title={title}
      >
        <Icon size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(nextStatus)}
      className={`flex items-center gap-2 px-3 py-2 bg-${color}-500 text-white rounded hover:bg-${color}-600 transition-colors`}
      title={title}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
