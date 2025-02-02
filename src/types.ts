import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";

export type FullUser = User & {
  active_organization_id: string;
  name: string;
  email: string;
  avatar_url: string;
};

export type TeamRole = Database["public"]["Enums"]["team_role"];
export type OrgRole = Database["public"]["Enums"]["org_role"];

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

export type TaskPosition = {
  x_index: number;
  y_index: number;
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
