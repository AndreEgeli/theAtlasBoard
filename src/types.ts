export type TaskStatus =
  | "pending"
  | "started"
  | "in_review"
  | "completed"
  | "archived";

export type TeamRole = "owner" | "editor" | "viewer";

export type OrgRole = "owner" | "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface TodoItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  created_by: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  x_index: number;
  y_index: number;
  status: TaskStatus;
  deadline_at?: string;
  order: number;
  created_at: string;
  created_by: string;
}

export interface Board {
  id: string;
  name: string;
  team_id: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
}

export interface CellPosition {
  x_index: Task["x_index"];
  y_index: Task["y_index"];
  order: Task["order"];
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface Team {
  id: string;
  name: string;
  organization_id: string;
  is_org_wide: boolean;
  created_at: string;
  created_by: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface PendingInvite {
  id: string;
  organization_id: string;
  organization_name: string;
  role: OrgRole;
  token: string;
  created_at: string;
  expires_at: string;
  email: string;
  accepted_at: string | null;
  created_by: string;
}
