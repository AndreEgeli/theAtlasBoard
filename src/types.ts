export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  task_id: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  tags: string[];
  importance: "not critical" | "critical" | "super critical";
  timeframe: ">3 hours" | "> 1 day" | "> 1 week";
  status: "pending" | "started" | "in_review" | "completed" | "archived";
  todos: TodoItem[];
  order?: number;
}

export interface Board {
  id: string;
  name: string;
  tasks: Task[];
  created_at: string;
}

export interface CellPosition {
  importance: Task["importance"];
  timeframe: Task["timeframe"];
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
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  token: string;
  email?: string;
  created_at: string;
  expires_at: string;
}
