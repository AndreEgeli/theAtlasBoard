import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";

export type FullUser = User & {
  active_organization_id: string;
  name: string;
  email: string;
  avatar_url: string;
};

// Add missing CellPosition type
export type CellPosition = {
  x_index: number;
  y_index: number;
  order: number;
};

export type TeamRole = Database["public"]["Enums"]["team_role"];
export type OrgRole = Database["public"]["Enums"]["org_role"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
export type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];

export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type TeamMemberInsert =
  Database["public"]["Tables"]["team_members"]["Insert"];
export type TeamMemberUpdate =
  Database["public"]["Tables"]["team_members"]["Update"];

export type OrganizationMember =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type OrganizationMemberInsert =
  Database["public"]["Tables"]["organization_members"]["Insert"];
export type OrganizationMemberUpdate =
  Database["public"]["Tables"]["organization_members"]["Update"];

export type OrganizationInvite =
  Database["public"]["Tables"]["organization_invites"]["Row"];
export type OrganizationInviteInsert =
  Database["public"]["Tables"]["organization_invites"]["Insert"];
export type OrganizationInviteUpdate =
  Database["public"]["Tables"]["organization_invites"]["Update"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskWithTodos = Task & {
  todos: Array<TodoItem>;
};

export type TaskWithTags = Task & {
  task_tags: Array<Tag>;
};

export type TaskWithAssignees = Task & {
  task_assignees: Array<FullUser>;
};

export type FullTask = Task & {
  task_todos: Array<TodoItem>;
  task_tags: Array<Tag>;
  task_assignees: Array<FullUser>;
};

/**
 * Task with additional context information about its team and board
 */
export type TaskWithContext = FullTask & {
  boardId: string;
  boardName: string;
  teamId: string;
  teamName: string;
  userPermissions: TeamPermissions;
};

/**
 * Filters for task queries
 */
export interface TaskFilters {
  status?: TaskStatus[];
  teamIds?: string[];
  boardIds?: string[];
  dueDateRange?: DateRange;
}

/**
 * Date range for filtering
 */
export interface DateRange {
  start?: string;
  end?: string;
}

/**
 * Sorting options for tasks
 */
export interface TaskSorting {
  field: "dueDate" | "createdAt" | "updatedAt" | "priority";
  direction: "asc" | "desc";
}

export type TaskPosition = {
  x_index: number;
  y_index: number;
  order: number;
};

export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
export type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export type TodoItem = Database["public"]["Tables"]["todos"]["Row"];
export type TodoItemInsert = Database["public"]["Tables"]["todos"]["Insert"];
export type TodoItemUpdate = Database["public"]["Tables"]["todos"]["Update"];

export type TaskTag = Database["public"]["Tables"]["task_tags"]["Row"];
export type TaskTagInsert = Database["public"]["Tables"]["task_tags"]["Insert"];
export type TaskTagUpdate = Database["public"]["Tables"]["task_tags"]["Update"];

export type TaskAssignee =
  Database["public"]["Tables"]["task_assignees"]["Row"];
export type TaskAssigneeInsert =
  Database["public"]["Tables"]["task_assignees"]["Insert"];
export type TaskAssigneeUpdate =
  Database["public"]["Tables"]["task_assignees"]["Update"];

export type Board = Database["public"]["Tables"]["boards"]["Row"];
export type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
export type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];

export type FullBoard = Board & {
  board_tasks: Array<FullTask>;
};

/**
 * Defines all possible permissions that can be granted to a user
 * based on their role within a team.
 */
export interface TeamPermissions {
  // Board permissions
  canCreateBoards: boolean;
  canEditBoards: boolean;
  canDeleteBoards: boolean;
  canViewBoards: boolean;

  // Task permissions
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  canViewTasks: boolean;

  // Todo permissions
  canCreateTodos: boolean;
  canEditTodos: boolean;
  canDeleteTodos: boolean;
  canToggleTodos: boolean;
  canViewTodos: boolean;

  // Tag permissions
  canAddTaskTags: boolean;
  canRemoveTaskTags: boolean;
}

/**
 * Extended team member model that includes calculated permissions
 */
export interface TeamMemberWithPermissions {
  userId: string;
  teamId: string;
  role: TeamRole;
  permissions: TeamPermissions;
}

/**
 * Board access model that includes role and permissions information
 */
export interface BoardAccess {
  boardId: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  permissions: TeamPermissions;
  canEdit: boolean;
  canView: boolean;
}

/**
 * Custom error class for permission-related errors
 */
export class PermissionError extends Error {
  constructor(
    public action: string,
    public resource: string,
    public requiredRole: TeamRole,
    public userRole: TeamRole | null
  ) {
    super(
      `Insufficient permissions: ${action} on ${resource} requires ${requiredRole}, user has ${userRole}`
    );
    this.name = "PermissionError";
  }
}
