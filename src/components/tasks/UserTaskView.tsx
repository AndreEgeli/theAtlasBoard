import { useState, useEffect } from "react";
import { TaskWithContext, TaskFilters, TaskSorting, TaskStatus } from "@/types";
import { UserTaskRepository } from "@/api/repositories/UserTaskRepository";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  TagIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  CheckCircleIcon,
  CircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ArchiveIcon,
  XIcon,
} from "lucide-react";

interface UserTaskViewProps {
  onTaskClick?: (task: TaskWithContext) => void;
  onTaskStatusUpdate?: (taskId: string, status: TaskStatus) => void;
}

/**
 * Component that displays all tasks assigned to the current user across teams and boards
 */
export function UserTaskView({
  onTaskClick,
  onTaskStatusUpdate,
}: UserTaskViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [boardFilter, setBoardFilter] = useState<string[]>([]);
  const [dueDateStart, setDueDateStart] = useState("");
  const [dueDateEnd, setDueDateEnd] = useState("");
  const [sorting, setSorting] = useState<TaskSorting>({
    field: "dueDate",
    direction: "asc",
  });

  // Available filter options
  const [availableTeams, setAvailableTeams] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableBoards, setAvailableBoards] = useState<
    { id: string; name: string; teamId: string }[]
  >([]);

  const repository = new UserTaskRepository(supabase);

  // Load tasks and filter options
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load tasks with current filters
        const filters: TaskFilters = {
          status: statusFilter.length > 0 ? statusFilter : undefined,
          teamIds: teamFilter.length > 0 ? teamFilter : undefined,
          boardIds: boardFilter.length > 0 ? boardFilter : undefined,
          dueDateRange:
            dueDateStart || dueDateEnd
              ? {
                  start: dueDateStart || undefined,
                  end: dueDateEnd || undefined,
                }
              : undefined,
        };

        const [tasksData, teamsData, boardsData] = await Promise.all([
          repository.findAssignedTasks(user.id, filters, sorting),
          repository.getTeamsWithAssignedTasks(user.id),
          repository.getBoardsWithAssignedTasks(user.id),
        ]);

        setTasks(tasksData);
        setAvailableTeams(teamsData);
        setAvailableBoards(boardsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    user?.id,
    statusFilter,
    teamFilter,
    boardFilter,
    dueDateStart,
    dueDateEnd,
    sorting,
  ]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks(tasks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.boardName.toLowerCase().includes(query) ||
        task.teamName.toLowerCase().includes(query)
    );

    setFilteredTasks(filtered);
  }, [tasks, searchQuery]);

  // Handle task status update
  const handleStatusUpdate = async (
    task: TaskWithContext,
    newStatus: TaskStatus
  ) => {
    if (!user?.id) return;

    try {
      await repository.updateTaskStatus(task.id, user.id, newStatus);

      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );

      onTaskStatusUpdate?.(task.id, newStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task status"
      );
    }
  };

  // Get status icon
  const getStatusIcon = (status: TaskStatus | null) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "started":
        return <PlayCircleIcon className="h-4 w-4 text-blue-500" />;
      case "in_review":
        return <PauseCircleIcon className="h-4 w-4 text-yellow-500" />;
      case "archived":
        return <ArchiveIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <CircleIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: TaskStatus | null) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "started":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "in_review":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "archived":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Group tasks by status for tabs
  const tasksByStatus = {
    all: filteredTasks,
    pending: filteredTasks.filter((t) => t.status === "pending" || !t.status),
    started: filteredTasks.filter((t) => t.status === "started"),
    in_review: filteredTasks.filter((t) => t.status === "in_review"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-gray-600">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
            assigned to you
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Field Selector */}
          <select
            value={sorting.field}
            onChange={(e) =>
              setSorting((prev) => ({
                ...prev,
                field: e.target.value as TaskSorting["field"],
              }))
            }
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
            aria-label="Sort tasks by field"
          >
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="priority">Priority</option>
          </select>

          {/* Sort Direction Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSorting((prev) => ({
                ...prev,
                direction: prev.direction === "asc" ? "desc" : "asc",
              }))
            }
          >
            {sorting.direction === "asc" ? (
              <SortAscIcon className="h-4 w-4 mr-2" />
            ) : (
              <SortDescIcon className="h-4 w-4 mr-2" />
            )}
            {sorting.direction === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "pending",
                    "started",
                    "in_review",
                    "completed",
                    "archived",
                  ] as TaskStatus[]
                ).map((status) => (
                  <Button
                    key={status}
                    variant={
                      statusFilter.includes(status) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setStatusFilter((prev) =>
                        prev.includes(status)
                          ? prev.filter((s) => s !== status)
                          : [...prev, status]
                      );
                    }}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Team Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Teams</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableTeams.map((team) => (
                  <div key={team.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`team-${team.id}`}
                      checked={teamFilter.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeamFilter((prev) => [...prev, team.id]);
                        } else {
                          setTeamFilter((prev) =>
                            prev.filter((id) => id !== team.id)
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`team-${team.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {team.name}
                    </label>
                  </div>
                ))}
                {availableTeams.length === 0 && (
                  <p className="text-sm text-gray-500">No teams found</p>
                )}
              </div>
            </div>

            {/* Board Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Boards</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableBoards
                  .filter(
                    (board) =>
                      teamFilter.length === 0 ||
                      teamFilter.includes(board.teamId)
                  )
                  .map((board) => (
                    <div key={board.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`board-${board.id}`}
                        checked={boardFilter.includes(board.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBoardFilter((prev) => [...prev, board.id]);
                          } else {
                            setBoardFilter((prev) =>
                              prev.filter((id) => id !== board.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`board-${board.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {board.name}
                      </label>
                    </div>
                  ))}
                {availableBoards.length === 0 && (
                  <p className="text-sm text-gray-500">No boards found</p>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Due Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    From
                  </label>
                  <Input
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <Input
                    type="date"
                    value={dueDateEnd}
                    onChange={(e) => setDueDateEnd(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(statusFilter.length > 0 ||
            teamFilter.length > 0 ||
            boardFilter.length > 0 ||
            dueDateStart ||
            dueDateEnd) && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Active Filters:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter([]);
                    setTeamFilter([]);
                    setBoardFilter([]);
                    setDueDateStart("");
                    setDueDateEnd("");
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilter.map((status) => (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    Status:{" "}
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                    <button
                      type="button"
                      onClick={() =>
                        setStatusFilter((prev) =>
                          prev.filter((s) => s !== status)
                        )
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                      aria-label={`Remove ${status} status filter`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {teamFilter.map((teamId) => {
                  const team = availableTeams.find((t) => t.id === teamId);
                  return (
                    <span
                      key={teamId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      Team: {team?.name || teamId}
                      <button
                        type="button"
                        onClick={() =>
                          setTeamFilter((prev) =>
                            prev.filter((id) => id !== teamId)
                          )
                        }
                        className="hover:bg-green-200 rounded-full p-0.5"
                        aria-label={`Remove ${
                          team?.name || teamId
                        } team filter`}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {boardFilter.map((boardId) => {
                  const board = availableBoards.find((b) => b.id === boardId);
                  return (
                    <span
                      key={boardId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      Board: {board?.name || boardId}
                      <button
                        type="button"
                        onClick={() =>
                          setBoardFilter((prev) =>
                            prev.filter((id) => id !== boardId)
                          )
                        }
                        className="hover:bg-purple-200 rounded-full p-0.5"
                        aria-label={`Remove ${
                          board?.name || boardId
                        } board filter`}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {dueDateStart && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    From: {new Date(dueDateStart).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => setDueDateStart("")}
                      className="hover:bg-orange-200 rounded-full p-0.5"
                      aria-label="Remove start date filter"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dueDateEnd && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    To: {new Date(dueDateEnd).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => setDueDateEnd("")}
                      className="hover:bg-orange-200 rounded-full p-0.5"
                      aria-label="Remove end date filter"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({tasksByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({tasksByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="started">
            In Progress ({tasksByStatus.started.length})
          </TabsTrigger>
          <TabsTrigger value="in_review">
            Review ({tasksByStatus.in_review.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done ({tasksByStatus.completed.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(task.status)}
                            <h3 className="font-medium truncate">
                              {task.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status?.replace("_", " ") || "pending"}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              <span>{task.teamName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TagIcon className="h-3 w-3" />
                              <span>{task.boardName}</span>
                            </div>
                            {task.deadline_at && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    task.deadline_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>
                                {new Date(
                                  task.created_at || ""
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick status actions */}
                        {task.userPermissions.canEditTasks && (
                          <div className="flex gap-1 ml-4">
                            {task.status !== "started" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(task, "started");
                                }}
                              >
                                <PlayCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {task.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(task, "completed");
                                }}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
