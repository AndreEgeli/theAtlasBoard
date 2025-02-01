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
  organization_invites
CASCADE;

-- ============= ENUMS =============
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE task_status AS ENUM ('pending', 'started', 'in_review', 'completed', 'archived');

-- ============= TABLES =============
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Organization members
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ============= AUTH USER MODIFICATIONS =============
-- Add active organization tracking to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS active_organization_id UUID;

-- ============= ENABLE RLS =============
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


-- ============= HELPER FUNCTIONS =============
-- Get user's organization role
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID)
RETURNS org_role AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is org admin or owner
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

-- Get user's team role
CREATE OR REPLACE FUNCTION get_user_team_role(team_id UUID)
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
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage organization" ON organizations
  FOR ALL USING (
    created_by = auth.uid()
  );


CREATE POLICY "Organization owners and admins can manage members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Teams
CREATE POLICY "Members can view their teams" ON teams
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage teams" ON teams
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

-- Team members
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

-- Organization invites
CREATE POLICY "Invited users can view their invites" ON organization_invites
  FOR SELECT USING (
    email = auth.email()
  );

-- Allow organization admins to manage invites
CREATE POLICY "Organization admins can manage invites" ON organization_invites
  FOR ALL USING (
    is_org_admin_or_owner(organization_id)
  );

-- Allow invited users to accept their invites (update)
CREATE POLICY "Invited users can accept their invites" ON organization_invites
  FOR UPDATE USING (
    email = auth.email() AND accepted_at IS NULL
  ) WITH CHECK (
    email = auth.email() AND accepted_at IS NULL
  );



-- Update team content policies to respect viewer role
CREATE POLICY "Only editors and owners can update boards" ON boards
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Only editors and owners can update tasks" ON tasks
  FOR UPDATE USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'editor')
      )
    )
  );

CREATE POLICY "Only editors and owners can update todos" ON todos
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE team_id IN (
          SELECT team_id FROM team_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'editor')
        )
      )
    )
  );


-- Users can view task assignments for tasks they can access
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

-- Team editors and owners can manage task assignments
CREATE POLICY "Team editors and owners can manage task assignments" ON task_assignees
  FOR ALL USING (
    task_id IN (
      SELECT id FROM tasks WHERE board_id IN (
        SELECT id FROM boards WHERE can_edit_team_content(team_id)
      )
    ) OR assigned_by = auth.uid()
  );

CREATE POLICY "Users can view their own assignments" ON task_assignees
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Assigned users can update their todos" ON todos
  FOR UPDATE USING (
    task_id IN (
      SELECT task_id FROM task_assignees WHERE user_id = auth.uid()
    )
  );


-- Helper function to create organization with default setup
CREATE OR REPLACE FUNCTION create_organization(org_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  team_id UUID;
  user_has_org BOOLEAN;
BEGIN
  -- Check if user already has an organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = auth.uid()
  ) INTO user_has_org;

  -- Create the organization
  INSERT INTO organizations (name, created_by)
  VALUES (org_name, auth.uid())
  RETURNING id INTO org_id;

  -- Add the creator as an owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (org_id, auth.uid(), 'owner');

  -- If this is their first organization, set it as active
  IF NOT user_has_org THEN
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data || 
      jsonb_build_object('active_organization_id', org_id)
    WHERE id = auth.uid();
  END IF;

  -- Create a default team for the organization
  INSERT INTO teams (organization_id, name, is_org_wide, created_by)
  VALUES (org_id, 'Default Team', TRUE, auth.uid())
  RETURNING id INTO team_id;

  -- Add creator as team owner
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (team_id, auth.uid(), 'owner');

  RETURN org_id;
END;
$$;

-- Helper function to create a team
CREATE OR REPLACE FUNCTION create_team(
  org_id UUID,
  team_name TEXT,
  is_org_wide BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Check if user has permission to create team
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create team';
  END IF;

  -- Create team
  INSERT INTO teams (
    organization_id,
    name,
    is_org_wide,
    created_by
  ) VALUES (
    org_id,
    team_name,
    is_org_wide,
    auth.uid()
  ) RETURNING id INTO new_team_id;

  -- Add creator as team owner
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (new_team_id, auth.uid(), 'owner');

  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to add member to team
CREATE OR REPLACE FUNCTION add_team_member(
  p_team_id UUID,
  p_user_id UUID,
  p_member_role team_role DEFAULT 'editor'
) RETURNS void AS $$
BEGIN
  -- Check if user has permission to add members
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only team owners can add members';
  END IF;

  -- Add member
  INSERT INTO team_members (
    team_id,
    user_id,
    role
  ) VALUES (
    p_team_id,
    p_user_id,
    p_member_role
  )
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET role = p_member_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create organization invite
CREATE OR REPLACE FUNCTION create_organization_invite(
  org_id UUID,
  email_address TEXT,
  member_role org_role DEFAULT 'member'
) RETURNS UUID AS $$
DECLARE
  invite_id UUID;
BEGIN
  -- Check if inviter has permission
  IF NOT is_org_admin_or_owner(org_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to create invite';
  END IF;

  -- Check if user is already a member of the organization
  IF EXISTS (
    SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already a member of the organization';
  END IF;

  -- Check if user is already invited
  IF EXISTS (
    SELECT 1 FROM organization_invites WHERE organization_id = org_id AND email = email_address
  ) THEN
    RAISE EXCEPTION 'User is already invited to the organization';
  END IF;

  -- Create invite
  INSERT INTO organization_invites (
    organization_id,
    email,
    role,
    token,
    created_by
  ) VALUES (
    org_id,
    email_address,
    member_role,
    encode(gen_random_bytes(32), 'hex'),
    auth.uid()
  ) RETURNING id INTO invite_id;

  RETURN invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to accept organization invite
CREATE OR REPLACE FUNCTION accept_organization_invite(invite_token TEXT)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get and validate invite
  UPDATE organization_invites
  SET 
    accepted_at = NOW(),
    accepted_by = auth.uid()
  WHERE 
    token = invite_token
    AND accepted_at IS NULL
    AND expires_at > NOW()
  RETURNING organization_id INTO org_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- Check if user is already a member of the organization
  IF EXISTS (
    SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already a member of the organization';
  END IF;

  -- check if email matches the invite
  IF NOT EXISTS (
    SELECT 1 FROM organization_invites WHERE email = auth.email() AND token = invite_token
  ) THEN
    RAISE EXCEPTION 'Email does not match the invite';
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role
  )
  SELECT 
    organization_id,
    auth.uid(),
    role
  FROM organization_invites
  WHERE token = invite_token;

  -- Update user's active organization
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('active_organization_id', org_id)
  WHERE id = auth.uid();

  -- Return the organization ID
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_pending_invites(email_address TEXT)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    email TEXT,
    role org_role,
    token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    created_by UUID,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID,
    organization_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.id,
        oi.organization_id,
        oi.email,
        oi.role,
        oi.token,
        oi.expires_at,
        oi.created_at,
        oi.created_by,
        oi.accepted_at,
        oi.accepted_by,
        o.name as organization_name
    FROM organization_invites oi
    JOIN organizations o ON o.id = oi.organization_id
    WHERE 
        oi.email = email_address
        AND oi.accepted_at IS NULL
        AND oi.expires_at > NOW();
END;
$$;

-- Helper function to get user's accessible boards
CREATE OR REPLACE FUNCTION get_user_boards(
  user_id UUID,
  page_size INTEGER DEFAULT 10,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  boards boards,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
BEGIN
  offset_val := (page_number - 1) * page_size;

  RETURN QUERY
  WITH filtered_boards AS (
    SELECT b.* FROM boards b
    WHERE 
      (NOT b.is_private AND b.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = user_id
      ))
      OR 
      (b.is_private AND b.created_by = user_id)
  )
  SELECT 
    b.*,
    (SELECT COUNT(*) FROM filtered_boards)::BIGINT
  FROM filtered_boards b
  ORDER BY b.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's assigned tasks
CREATE OR REPLACE FUNCTION get_user_tasks(
  user_id UUID,
  task_status_filter task_status DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  board_name TEXT,
  team_name TEXT,
  organization_name TEXT,
  deadline_at TIMESTAMPTZ,
  status task_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    b.name as board_name,
    tm.name as team_name,
    o.name as organization_name,
    t.deadline_at,
    t.status
  FROM tasks t
  JOIN task_assignees ta ON t.id = ta.task_id
  JOIN boards b ON t.board_id = b.id
  JOIN teams tm ON b.team_id = tm.id
  JOIN organizations o ON tm.organization_id = o.id
  WHERE 
    ta.user_id = user_id
    AND (task_status_filter IS NULL OR t.status = task_status_filter);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Cleanup expired invites (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM organization_invites
  WHERE 
    expires_at < NOW()
    AND accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= TRIGGERS =============
-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============= INDEXES =============
-- Organizations
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

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
