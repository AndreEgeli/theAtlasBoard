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

export const STATUS_TRANSITIONS: Record<Task["status"], StatusTransition> = {
  pending: {
    nextStatus: "started",
    icon: Play,
    label: "Start Task",
    color: "blue",
    title: "Start task",
  },
  started: {
    nextStatus: "in_review",
    icon: Send,
    label: "Send to Review",
    color: "orange",
    title: "Send to review",
  },
  in_review: {
    nextStatus: "completed",
    icon: Check,
    label: "Complete",
    color: "green",
    title: "Mark as completed",
  },
  completed: {
    nextStatus: "archived",
    icon: Archive,
    label: "Archive",
    color: "gray",
    title: "Archive task",
  },
  archived: {
    nextStatus: "archived", // No next status
    icon: Archive,
    label: "Archived",
    color: "gray",
    title: "Task archived",
  },
};

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
  const transition = STATUS_TRANSITIONS[status];
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
