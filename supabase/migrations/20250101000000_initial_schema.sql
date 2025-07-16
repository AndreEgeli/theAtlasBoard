-- Initial database schema for Atlas Board
-- Team-based task management application with role-based access control

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= ENUMS =============
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE task_status AS ENUM ('pending', 'started', 'in_review', 'completed', 'archived');

-- ============= TABLES =============

-- Users (references auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  active_organization_id UUID,  -- Will be updated with foreign key after organizations table is created
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL
);

-- Add foreign key for active_organization_id now that organizations exists
ALTER TABLE users 
  ADD CONSTRAINT fk_users_active_organization 
  FOREIGN KEY (active_organization_id) 
  REFERENCES organizations(id);

-- Organization members
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, 
  role org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_org_wide BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL
);

-- Team members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Boards
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  x_index INTEGER NOT NULL DEFAULT 0,
  y_index INTEGER NOT NULL DEFAULT 0,
  status task_status DEFAULT 'pending',
  deadline_at TIMESTAMPTZ,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task assignees
CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) NOT NULL,
  PRIMARY KEY (task_id, user_id)
);

-- Todos
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL
);

-- Task tags
CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Organization invites
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id)
);

-- Permission violation logs for audit trail
CREATE TABLE permission_violation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- ============= TRIGGERS =============

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  -- Create a new user record
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============= HELPER FUNCTIONS =============

-- Check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.users WHERE id = user_id
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check organization membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_org_admin_or_owner(org_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in team
CREATE OR REPLACE FUNCTION get_team_role(p_team_id UUID)
RETURNS team_role AS $
BEGIN
  RETURN (
    SELECT tm.role FROM team_members tm
    WHERE tm.team_id = p_team_id 
    AND tm.user_id = auth.uid()
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= PERMISSION FUNCTIONS =============

-- Check if a user has a specific role in a team
CREATE OR REPLACE FUNCTION has_team_role(p_team_id UUID, p_role team_role)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = p_team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = p_role
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a user has at least a specific role level in a team
-- Role hierarchy: owner > editor > viewer
CREATE OR REPLACE FUNCTION has_minimum_team_role(p_team_id UUID, p_minimum_role team_role)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = p_team_id 
    AND tm.user_id = auth.uid() 
    AND (
      (p_minimum_role = 'viewer') OR
      (p_minimum_role = 'editor' AND tm.role IN ('editor', 'owner')) OR
      (p_minimum_role = 'owner' AND tm.role = 'owner')
    )
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit team content
CREATE OR REPLACE FUNCTION can_edit_team_content(p_team_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN has_minimum_team_role(p_team_id, 'editor');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view team content
CREATE OR REPLACE FUNCTION can_view_team_content(p_team_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN has_minimum_team_role(p_team_id, 'viewer');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage team members
CREATE OR REPLACE FUNCTION can_manage_team_members(p_team_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN has_team_role(p_team_id, 'owner');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit board content
CREATE OR REPLACE FUNCTION can_edit_board(p_board_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  RETURN v_team_id IS NOT NULL AND can_edit_team_content(v_team_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view board content
CREATE OR REPLACE FUNCTION can_view_board(p_board_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  RETURN v_team_id IS NOT NULL AND can_view_team_content(v_team_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit task content
CREATE OR REPLACE FUNCTION can_edit_task(p_task_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_board_id UUID;
BEGIN
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  RETURN v_board_id IS NOT NULL AND can_edit_board(v_board_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view task content
CREATE OR REPLACE FUNCTION can_view_task(p_task_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_board_id UUID;
BEGIN
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  RETURN v_board_id IS NOT NULL AND can_view_board(v_board_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit todo items
CREATE OR REPLACE FUNCTION can_edit_todo(p_todo_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_task_id UUID;
BEGIN
  SELECT task_id INTO v_task_id
  FROM todos
  WHERE id = p_todo_id;
  
  RETURN v_task_id IS NOT NULL AND can_edit_task(v_task_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view todo items
CREATE OR REPLACE FUNCTION can_view_todo(p_todo_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_task_id UUID;
BEGIN
  SELECT task_id INTO v_task_id
  FROM todos
  WHERE id = p_todo_id;
  
  RETURN v_task_id IS NOT NULL AND can_view_task(v_task_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage task assignees
CREATE OR REPLACE FUNCTION can_manage_task_assignees(p_task_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN can_edit_task(p_task_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage task tags
CREATE OR REPLACE FUNCTION can_manage_task_tags(p_task_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN can_edit_task(p_task_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role for a specific board
CREATE OR REPLACE FUNCTION get_user_board_role(p_board_id UUID)
RETURNS team_role AS $
DECLARE
  v_team_id UUID;
  v_role team_role;
BEGIN
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  IF v_team_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT tm.role INTO v_role
  FROM team_members tm
  WHERE tm.team_id = v_team_id
  AND tm.user_id = auth.uid();
  
  RETURN v_role;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role for a specific task
CREATE OR REPLACE FUNCTION get_user_task_role(p_task_id UUID)
RETURNS team_role AS $
DECLARE
  v_board_id UUID;
BEGIN
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  IF v_board_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN get_user_board_role(v_board_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a user is assigned to a task
CREATE OR REPLACE FUNCTION is_task_assignee(p_task_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM task_assignees ta
    WHERE ta.task_id = p_task_id
    AND ta.user_id = auth.uid()
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log permission violations
CREATE OR REPLACE FUNCTION log_permission_violation(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $
BEGIN
  INSERT INTO permission_violation_logs (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_details
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= ORGANIZATION FUNCTIONS =============

-- Function to accept an organization invitation
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS VOID AS $
DECLARE
  v_invite organization_invites%ROWTYPE;
  v_org_wide_team_id UUID;
BEGIN
  -- Find the invitation
  SELECT * INTO v_invite
  FROM organization_invites
  WHERE token = p_token AND expires_at > NOW() AND accepted_at IS NULL;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- Add the user to the organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_invite.organization_id, p_user_id, v_invite.role);

  -- Find the organization-wide team
  SELECT id INTO v_org_wide_team_id
  FROM teams
  WHERE organization_id = v_invite.organization_id AND is_org_wide = TRUE;

  -- Add the user to the organization-wide team
  IF v_org_wide_team_id IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_org_wide_team_id, p_user_id, 'editor');
  END IF;

  -- Mark the invitation as accepted
  UPDATE organization_invites
  SET accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = v_invite.id;

END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create organization with all required setup
CREATE OR REPLACE FUNCTION create_organization_with_setup(
  p_name TEXT,
  p_user_id UUID
)
RETURNS JSON AS $
DECLARE
  v_organization organizations%ROWTYPE;
  v_team teams%ROWTYPE;
  v_user_org_count INTEGER;
  v_result JSON;
BEGIN
  -- Check if user exists
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create the organization
  INSERT INTO public.organizations (name, created_by)
  VALUES (p_name, p_user_id)
  RETURNING * INTO v_organization;

  -- Create organization membership (bypasses RLS)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_organization.id, p_user_id, 'owner');

  -- Create default team
  INSERT INTO public.teams (organization_id, name, is_org_wide, created_by)
  VALUES (v_organization.id, 'Default Team', TRUE, p_user_id)
  RETURNING * INTO v_team;

  -- Create team membership (bypasses RLS)
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team.id, p_user_id, 'owner');

  -- Check if this is the user's first organization
  SELECT COUNT(*) INTO v_user_org_count
  FROM public.organization_members
  WHERE user_id = p_user_id;

  -- If this is their first organization, set it as active
  IF v_user_org_count = 1 THEN
    UPDATE public.users
    SET active_organization_id = v_organization.id
    WHERE id = p_user_id;
  END IF;

  -- Return organization with member details
  SELECT json_build_object(
    'id', v_organization.id,
    'name', v_organization.name,
    'created_at', v_organization.created_at,
    'created_by', v_organization.created_by,
    'organization_members', json_build_array(
      json_build_object(
        'user_id', p_user_id,
        'role', 'owner'
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= RLS POLICIES =============

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_violation_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organizations policies
CREATE POLICY "Users can create their first organization"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view their organizations"
  ON organizations FOR SELECT
  USING (
    is_organization_member(id)
  );

CREATE POLICY "Organization owners can manage organization" ON organizations
  FOR ALL USING (
    created_by = auth.uid()
  );

-- Organization Members policies
CREATE POLICY "Members can view other members in their organizations" 
  ON organization_members FOR SELECT
  USING (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization admins and owners can manage members"
  ON organization_members
  FOR ALL
  USING (
    is_org_admin_or_owner(organization_id)
  );

-- Teams policies
CREATE POLICY "Organization members can view teams" ON teams
  FOR SELECT USING (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization admins and owners can manage teams" ON teams
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

-- Team Members policies
CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t, organization_members om
      WHERE t.id = team_id
      AND om.organization_id = t.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON team_members
  FOR ALL USING (
    can_manage_team_members(team_id)
    OR is_org_admin_or_owner((SELECT organization_id FROM teams WHERE id = team_members.team_id))
  );

-- Boards policies
CREATE POLICY "Users can view accessible boards" ON boards
  FOR SELECT USING (
    can_view_board(id)
  );

CREATE POLICY "Team editors and owners can create boards" ON boards
  FOR INSERT WITH CHECK (
    can_edit_team_content(team_id)
  );

CREATE POLICY "Team editors and owners can update boards" ON boards
  FOR UPDATE USING (
    can_edit_board(id)
  );

CREATE POLICY "Team editors and owners can delete boards" ON boards
  FOR DELETE USING (
    can_edit_board(id)
  );

-- Tasks policies
CREATE POLICY "Users can view tasks in accessible boards" ON tasks
  FOR SELECT USING (
    can_view_task(id)
  );

CREATE POLICY "Team editors and owners can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    can_edit_board(board_id)
  );

CREATE POLICY "Team editors and owners can update tasks" ON tasks
  FOR UPDATE USING (
    can_edit_task(id)
  );

CREATE POLICY "Team editors and owners can delete tasks" ON tasks
  FOR DELETE USING (
    can_edit_task(id)
  );

-- Task Assignees policies
CREATE POLICY "Users can view task assignments" ON task_assignees
  FOR SELECT USING (
    can_view_task(task_id)
  );

CREATE POLICY "Team editors and owners can create task assignments" ON task_assignees
  FOR INSERT WITH CHECK (
    can_manage_task_assignees(task_id)
  );

CREATE POLICY "Team editors and owners can update task assignments" ON task_assignees
  FOR UPDATE USING (
    can_manage_task_assignees(task_id)
  );

CREATE POLICY "Team editors and owners can delete task assignments" ON task_assignees
  FOR DELETE USING (
    can_manage_task_assignees(task_id)
  );

-- Todos policies
CREATE POLICY "Users can view todos in accessible tasks" ON todos
  FOR SELECT USING (
    can_view_todo(id)
  );

CREATE POLICY "Team editors and owners can create todos" ON todos
  FOR INSERT WITH CHECK (
    task_id IS NULL OR can_edit_task(task_id)
  );

CREATE POLICY "Team editors and owners can update todos" ON todos
  FOR UPDATE USING (
    can_edit_todo(id)
  );

CREATE POLICY "Team editors and owners can delete todos" ON todos
  FOR DELETE USING (
    can_edit_todo(id)
  );

-- Tags policies
CREATE POLICY "Organization members can view tags" ON tags
  FOR SELECT USING (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization members can create tags" ON tags
  FOR INSERT WITH CHECK (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization admins and owners can update tags" ON tags
  FOR UPDATE USING (
    is_org_admin_or_owner(organization_id)
  );

CREATE POLICY "Organization admins and owners can delete tags" ON tags
  FOR DELETE USING (
    is_org_admin_or_owner(organization_id)
  );

CREATE POLICY "Tag creators can update their own tags" ON tags
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Task Tags policies
CREATE POLICY "Users can view task tags" ON task_tags
  FOR SELECT USING (
    can_view_task(task_id)
  );

CREATE POLICY "Team editors and owners can create task tags" ON task_tags
  FOR INSERT WITH CHECK (
    can_manage_task_tags(task_id)
  );

CREATE POLICY "Team editors and owners can update task tags" ON task_tags
  FOR UPDATE USING (
    can_manage_task_tags(task_id)
  );

CREATE POLICY "Team editors and owners can delete task tags" ON task_tags
  FOR DELETE USING (
    can_manage_task_tags(task_id)
  );

-- Organization Invites policies
CREATE POLICY "Invited users can view their invites" ON organization_invites
  FOR SELECT USING (
    email = auth.email()
  );

CREATE POLICY "Organization admins can manage invites" ON organization_invites
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

CREATE POLICY "Invited users can accept their invites" ON organization_invites
  FOR UPDATE USING (
    email = auth.email() AND accepted_at IS NULL
  ) WITH CHECK (
    email = auth.email() AND accepted_at IS NULL
  );

-- Permission violation logs policies
CREATE POLICY "Only org admins and owners can view permission violation logs" ON permission_violation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN organization_members om ON u.id = om.user_id
      WHERE u.id = auth.uid()
      AND om.role IN ('admin', 'owner')
    )
  );

-- ============= INDEXES =============

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_org ON users(active_organization_id);

-- Organizations indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Teams indexes
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);

-- Boards indexes
CREATE INDEX idx_boards_team ON boards(team_id);
CREATE INDEX idx_boards_creator ON boards(created_by);
CREATE INDEX idx_boards_private ON boards(is_private);

-- Tasks indexes
CREATE INDEX idx_tasks_board ON tasks(board_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline_at);
CREATE INDEX idx_tasks_creator ON tasks(created_by);

-- Task Assignees indexes
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);

-- Todos indexes
CREATE INDEX idx_todos_task ON todos(task_id);
CREATE INDEX idx_todos_completed ON todos(is_completed);

-- Tags indexes
CREATE INDEX idx_tags_org ON tags(organization_id);
CREATE INDEX idx_task_tags_task ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);

-- Invites indexes
CREATE INDEX idx_org_invites_org ON organization_invites(organization_id);
CREATE INDEX idx_org_invites_email ON organization_invites(email);
CREATE INDEX idx_org_invites_token ON organization_invites(token);

-- Permission logs indexes
CREATE INDEX idx_permission_logs_user ON permission_violation_logs(user_id);
CREATE INDEX idx_permission_logs_resource ON permission_violation_logs(resource_type, resource_id);
CREATE INDEX idx_permission_logs_attempted_at ON permission_violation_logs(attempted_at);