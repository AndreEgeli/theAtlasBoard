import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, TableRecord } from "./BaseRepository";
import { Database } from "@/types/supabase";
import {
  TaskWithContext,
  TeamPermissions,
  TaskFilters,
  TaskSorting,
  TaskStatus,
} from "@/types";
import { PermissionService } from "@/lib/services/PermissionService";
import { auditLogService } from "@/lib/services/AuditLogService";

type Task = TableRecord<"tasks">;

/**
 * Repository for managing user tasks across teams and boards
 */
export class UserTaskRepository extends BaseRepository<"tasks", Task> {
  private permissionService: PermissionService;

  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, "tasks");
    this.permissionService = new PermissionService();
  }

  /**
   * Find tasks assigned to a specific user across all accessible teams and boards
   * Optimized with better query performance and audit logging
   * @param userId The user ID
   * @param filters Optional filters for tasks
   * @param sorting Optional sorting parameters
   * @returns Array of tasks with team and board context
   */
  async findAssignedTasks(
    userId: string,
    filters?: TaskFilters,
    sorting?: TaskSorting
  ): Promise<TaskWithContext[]> {
    const startTime = Date.now();

    // Build optimized query with database-level filtering where possible
    let query = this.supabase
      .from("task_assignees")
      .select(
        `
        tasks!task_assignees_task_id_fkey (
          id,
          title,
          description,
          status,
          deadline_at,
          created_at,
          updated_at,
          board_id,
          todos (
            id,
            content,
            completed,
            created_at
          ),
          task_tags (
            tags (
              id,
              name,
              color
            )
          ),
          task_assignees (
            users (
              id,
              email,
              name
            )
          ),
          boards!tasks_board_id_fkey (
            id,
            name,
            team_id,
            teams!boards_team_id_fkey (
              id,
              name
            )
          )
        )
      `
      )
      .eq("user_id", userId);

    // Apply database-level filters for better performance
    if (filters?.status && filters.status.length > 0) {
      query = query.in("tasks.status", filters.status);
    }

    if (filters?.teamIds && filters.teamIds.length > 0) {
      query = query.in("tasks.boards.team_id", filters.teamIds);
    }

    if (filters?.boardIds && filters.boardIds.length > 0) {
      query = query.in("tasks.board_id", filters.boardIds);
    }

    // Apply date range filters at database level
    if (filters?.dueDateRange?.start) {
      query = query.gte("tasks.deadline_at", filters.dueDateRange.start);
    }
    if (filters?.dueDateRange?.end) {
      query = query.lte("tasks.deadline_at", filters.dueDateRange.end);
    }

    // Apply sorting at database level where possible
    if (sorting) {
      let orderColumn: string;
      switch (sorting.field) {
        case "dueDate":
          orderColumn = "tasks.deadline_at";
          break;
        case "createdAt":
          orderColumn = "tasks.created_at";
          break;
        case "updatedAt":
          orderColumn = "tasks.updated_at";
          break;
        default:
          orderColumn = "tasks.created_at";
      }
      query = query.order(orderColumn, {
        ascending: sorting.direction === "asc",
        nullsFirst: false,
      });
    }

    const { data, error } = await query;

    if (error) {
      await auditLogService.logResourceAccess(
        userId,
        "user_tasks",
        "bulk",
        "query",
        false,
        undefined,
        error.message,
        { filters, sorting }
      );
      throw error;
    }

    if (!data) return [];

    // Filter out invalid tasks and extract valid ones
    const validTasks = data.filter(
      (item) => item.tasks && item.tasks.boards && item.tasks.boards.teams
    );

    // Group tasks by team to optimize permission queries
    const tasksByTeam = new Map<string, any[]>();
    validTasks.forEach((item) => {
      const teamId = item.tasks!.boards!.teams!.id;
      if (!tasksByTeam.has(teamId)) {
        tasksByTeam.set(teamId, []);
      }
      tasksByTeam.get(teamId)!.push(item);
    });

    // Batch permission queries for better performance
    const teamIds = Array.from(tasksByTeam.keys());
    const permissionPromises = teamIds.map(async (teamId) => {
      const permissions = await this.permissionService.getUserTeamPermissions(
        userId,
        teamId
      );
      return [teamId, permissions] as const;
    });

    const permissionResults = await Promise.all(permissionPromises);
    const teamPermissions = new Map<string, TeamPermissions>();

    permissionResults.forEach(([teamId, permissions]) => {
      teamPermissions.set(
        teamId,
        permissions ||
          ({
            canViewTasks: true,
            canEditTasks: false,
            canDeleteTasks: false,
            canCreateTasks: false,
            canAssignTasks: false,
            canViewBoards: true,
            canEditBoards: false,
            canDeleteBoards: false,
            canCreateBoards: false,
            canViewTodos: true,
            canEditTodos: false,
            canDeleteTodos: false,
            canCreateTodos: false,
            canToggleTodos: false,
            canAddTaskTags: false,
            canRemoveTaskTags: false,
          } as TeamPermissions)
      );
    });

    // Transform the data into TaskWithContext objects
    const tasksWithContext: TaskWithContext[] = validTasks.map((item) => {
      const task = item.tasks!;
      const board = task.boards!;
      const team = board.teams!;
      const userPermissions = teamPermissions.get(team.id)!;

      return {
        ...task,
        task_todos: task.todos || [],
        task_tags: task.task_tags?.map((tt: any) => tt.tags) || [],
        task_assignees: task.task_assignees?.map((ta: any) => ta.users) || [],
        boardId: board.id,
        boardName: board.name,
        teamId: team.id,
        teamName: team.name,
        userPermissions,
      };
    });

    const duration = Date.now() - startTime;

    // Log bulk permission check for performance monitoring
    await auditLogService.logBulkPermissionCheck(
      userId,
      "user_tasks",
      tasksWithContext.length,
      teamIds,
      duration,
      {
        filters,
        sorting,
        teams_queried: teamIds.length,
        cache_hits: 0, // Could be enhanced to track cache hits
      }
    );

    // Log successful resource access
    await auditLogService.logResourceAccess(
      userId,
      "user_tasks",
      "bulk",
      "query",
      true,
      undefined,
      undefined,
      {
        task_count: tasksWithContext.length,
        team_count: teamIds.length,
        duration_ms: duration,
        filters,
        sorting,
      }
    );

    return tasksWithContext;
  }

  /**
   * Update the status of a task, with permission checking and audit logging
   * @param taskId The task ID
   * @param userId The user ID making the change
   * @param status The new status
   */
  async updateTaskStatus(
    taskId: string,
    userId: string,
    status: TaskStatus
  ): Promise<void> {
    try {
      // First check if the user has permission to edit this task
      const canEdit = await this.permissionService.canUserEditTask(
        userId,
        taskId
      );

      if (!canEdit) {
        const error = "You don't have permission to update this task";

        // Log permission violation
        await auditLogService.logResourceAccess(
          userId,
          "task",
          taskId,
          "update_status",
          false,
          undefined,
          error,
          { attempted_status: status }
        );

        throw new Error(error);
      }

      // Update the task status
      const { error } = await this.supabase
        .from("tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) {
        // Log database error
        await auditLogService.logResourceAccess(
          userId,
          "task",
          taskId,
          "update_status",
          false,
          undefined,
          error.message,
          { attempted_status: status }
        );
        throw error;
      }

      // Log successful update
      await auditLogService.logResourceAccess(
        userId,
        "task",
        taskId,
        "update_status",
        true,
        undefined,
        undefined,
        { new_status: status }
      );
    } catch (error) {
      // Re-throw the error after logging
      throw error;
    }
  }

  /**
   * Get all teams where a user has assigned tasks
   * @param userId The user ID
   * @returns Array of team objects with id and name
   */
  async getTeamsWithAssignedTasks(
    userId: string
  ): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.supabase
      .from("task_assignees")
      .select(
        `
        tasks!task_assignees_task_id_fkey (
          boards!tasks_board_id_fkey (
            teams!boards_team_id_fkey (
              id,
              name
            )
          )
        )
      `
      )
      .eq("user_id", userId);

    if (error) throw error;
    if (!data) return [];

    // Extract unique teams
    const teamsMap = new Map<string, { id: string; name: string }>();

    data.forEach((item) => {
      if (item.tasks?.boards?.teams) {
        const team = item.tasks.boards.teams;
        teamsMap.set(team.id, { id: team.id, name: team.name });
      }
    });

    return Array.from(teamsMap.values());
  }

  /**
   * Get all boards where a user has assigned tasks
   * @param userId The user ID
   * @param teamId Optional team ID to filter boards by team
   * @returns Array of board objects with id and name
   */
  async getBoardsWithAssignedTasks(
    userId: string,
    teamId?: string
  ): Promise<{ id: string; name: string; teamId: string }[]> {
    let query = this.supabase
      .from("task_assignees")
      .select(
        `
        tasks!task_assignees_task_id_fkey (
          boards!tasks_board_id_fkey (
            id,
            name,
            teams!boards_team_id_fkey (
              id
            )
          )
        )
      `
      )
      .eq("user_id", userId);

    // Filter by team if provided
    if (teamId) {
      query = query.eq("tasks.boards.team_id", teamId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Extract unique boards
    const boardsMap = new Map<
      string,
      { id: string; name: string; teamId: string }
    >();

    data.forEach((item) => {
      if (item.tasks?.boards) {
        const board = item.tasks.boards;
        boardsMap.set(board.id, {
          id: board.id,
          name: board.name,
          teamId: board.teams.id,
        });
      }
    });

    return Array.from(boardsMap.values());
  }

  /**
   * Count tasks assigned to a user, with optional filtering
   * @param userId The user ID
   * @param filters Optional filters
   * @returns The count of matching tasks
   */
  async countAssignedTasks(
    userId: string,
    filters?: TaskFilters
  ): Promise<number> {
    // If we have status filters, we need to first get the task IDs that match the status
    if (filters?.status && filters.status.length > 0) {
      // First get task IDs that match the status filter
      const { data: tasksWithStatus, error: statusError } = await this.supabase
        .from("tasks")
        .select("id")
        .in("status", filters.status);

      if (statusError) throw statusError;

      if (!tasksWithStatus || tasksWithStatus.length === 0) {
        return 0; // No tasks match the status filter
      }

      // Then count task_assignees that match both the user and the filtered task IDs
      const taskIds = tasksWithStatus.map((t) => t.id);
      const { count, error } = await this.supabase
        .from("task_assignees")
        .select("task_id", { count: "exact" })
        .eq("user_id", userId)
        .in("task_id", taskIds);

      if (error) throw error;
      return count || 0;
    }

    // If no status filters, just count all tasks assigned to the user
    const { count, error } = await this.supabase
      .from("task_assignees")
      .select("task_id", { count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  }
}
