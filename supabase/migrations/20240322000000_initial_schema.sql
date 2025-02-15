CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS 
  task_tags,
  tags,
  todos,
  tasks,
  task_assignees,
  boards,
  team_members,
  teams,
  organization_members,
  organizations,
  organization_invites,
  users
CASCADE;

-- ============= ENUMS =============
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE task_status AS ENUM ('pending', 'started', 'in_review', 'completed', 'archived');

-- ============= TABLES =============
-- Users (moved to top since other tables reference it)
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
  created_by UUID REFERENCES users(id) NOT NULL  -- Changed to reference users instead of auth.users
);

-- Add foreign key for active_organization_id now that organizations exists
ALTER TABLE users 
  ADD CONSTRAINT fk_users_active_organization 
  FOREIGN KEY (active_organization_id) 
  REFERENCES organizations(id);

-- Organization members
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Changed to reference users
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
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Team members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  PRIMARY KEY (task_id, user_id)
);

-- Todos
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id)
);

-- ============= TRIGGERS =============
-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============= HELPER FUNCTIONS =============
-- Check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to check organization membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION is_org_admin_or_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in team
CREATE OR REPLACE FUNCTION get_team_role(team_id UUID)
RETURNS team_role AS $$
BEGIN
  RETURN (
    SELECT role FROM team_members 
    WHERE team_id = team_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit team content
CREATE OR REPLACE FUNCTION can_edit_team_content(team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organizations
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

-- Organization Members
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

-- Teams
CREATE POLICY "Organization members can view teams" ON teams
  FOR SELECT USING (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization admins and owners can manage teams" ON teams
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

-- Team Members
CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Boards
CREATE POLICY "Users can view accessible boards" ON boards
  FOR SELECT USING (
    (NOT is_private AND team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ))
    OR (is_private AND created_by = auth.uid())
  );

CREATE POLICY "Team editors and owners can manage boards" ON boards
  FOR ALL USING (
    can_edit_team_content(team_id) OR created_by = auth.uid()
  );

-- Tasks
CREATE POLICY "Users can view tasks in accessible boards" ON tasks
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards WHERE 
        (NOT is_private AND team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
        ))
        OR (is_private AND created_by = auth.uid())
    )
  );

CREATE POLICY "Team editors and owners can manage tasks" ON tasks
  FOR ALL USING (
    board_id IN (
      SELECT id FROM boards WHERE can_edit_team_content(team_id)
    ) OR created_by = auth.uid()
  );

-- Task Assignees
CREATE POLICY "Users can view task assignments" ON task_assignees
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE 
          (NOT is_private AND team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          ))
          OR (is_private AND created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Team editors and owners can manage task assignments" ON task_assignees
  FOR ALL USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE can_edit_team_content(team_id)
      )
    ) OR assigned_by = auth.uid()
  );

-- Todos
CREATE POLICY "Users can view todos in accessible tasks" ON todos
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE 
          (NOT is_private AND team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          ))
          OR (is_private AND created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Team editors and owners can manage todos" ON todos
  FOR ALL USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE can_edit_team_content(team_id)
      )
    ) OR created_by = auth.uid()
  );

-- Tags
CREATE POLICY "Organization members can view tags" ON tags
  FOR SELECT USING (
    is_organization_member(organization_id)
  );

CREATE POLICY "Organization admins and owners can manage tags" ON tags
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

-- Task Tags
CREATE POLICY "Users can view task tags" ON task_tags
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE 
          (NOT is_private AND team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
          ))
          OR (is_private AND created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Team editors and owners can manage task tags" ON task_tags
  FOR ALL USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE can_edit_team_content(team_id)
      )
    )
  );

-- Organization Invites
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

-- ============= INDEXES =============
-- Organizations
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Add users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_org ON users(active_organization_id);

-- Teams
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);

-- Boards
CREATE INDEX idx_boards_team ON boards(team_id);
CREATE INDEX idx_boards_creator ON boards(created_by);
CREATE INDEX idx_boards_private ON boards(is_private);

-- Tasks
CREATE INDEX idx_tasks_board ON tasks(board_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline_at);
CREATE INDEX idx_tasks_creator ON tasks(created_by);

-- Task Assignees
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);

-- Todos
CREATE INDEX idx_todos_task ON todos(task_id);
CREATE INDEX idx_todos_completed ON todos(is_completed);

-- Tags
CREATE INDEX idx_tags_org ON tags(organization_id);
CREATE INDEX idx_task_tags_task ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);

-- Invites
CREATE INDEX idx_org_invites_org ON organization_invites(organization_id);
CREATE INDEX idx_org_invites_email ON organization_invites(email);
CREATE INDEX idx_org_invites_token ON organization_invites(token);
CREATE INDEX idx_org_invites_expires ON organization_invites(expires_at);