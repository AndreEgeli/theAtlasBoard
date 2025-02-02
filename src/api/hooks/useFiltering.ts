import { useState } from "react";
import type { Task } from "../types";

interface FilterState {
  assignees: string[];
  statuses: Task["status"][];
  tags: string[];
  showArchived: boolean;
}

export function useFiltering() {
  const [filters, setFilters] = useState<FilterState>({
    assignees: [],
    statuses: [],
    tags: [],
    showArchived: false,
  });

  const filterTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // First check if we should show archived tasks
      if (task.status === "archived" && !filters.showArchived) {
        return false;
      }

      const assigneeMatch =
        filters.assignees.length === 0 ||
        filters.assignees.includes(task.assignee || "");

      const statusMatch =
        filters.statuses.length === 0 || filters.statuses.includes(task.status);

      const tagsMatch =
        filters.tags.length === 0 ||
        filters.tags.some((tagId) => task.tags.includes(tagId));

      return assigneeMatch && statusMatch && tagsMatch;
    });
  };

  const hasActiveFilters =
    filters.assignees.length > 0 ||
    filters.statuses.length > 0 ||
    filters.tags.length > 0 ||
    filters.showArchived;

  const clearFilters = () =>
    setFilters({
      assignees: [],
      statuses: [],
      tags: [],
      showArchived: false,
    });

  return {
    filters,
    setFilters,
    filterTasks,
    hasActiveFilters,
    clearFilters,
  };
}
