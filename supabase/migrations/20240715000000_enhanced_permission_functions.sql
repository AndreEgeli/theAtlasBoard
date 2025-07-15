-- Enhanced permission functions for team-based board access
-- This migration adds more granular permission check functions to enforce strict role-based access control

-- Function to check if a user has a specific role in a team
CREATE OR REPLACE FUNCTION has_team_role(p_team_id UUID, p_role team_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = p_team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has at least a specific role level in a team
-- Role hierarchy: owner > editor > viewer
CREATE OR REPLACE FUNCTION has_minimum_team_role(p_team_id UUID, p_minimum_role team_role)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to check if user can edit team content
-- This replaces the existing can_edit_team_content function with more explicit role checking
CREATE OR REPLACE FUNCTION can_edit_team_content(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_minimum_team_role(p_team_id, 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view team content
CREATE OR REPLACE FUNCTION can_view_team_content(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_minimum_team_role(p_team_id, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage team members
CREATE OR REPLACE FUNCTION can_manage_team_members(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_team_role(p_team_id, 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit board content
CREATE OR REPLACE FUNCTION can_edit_board(p_board_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Get the team ID for the board
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  -- Check if user has edit permissions for the team
  RETURN v_team_id IS NOT NULL AND can_edit_team_content(v_team_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view board content
CREATE OR REPLACE FUNCTION can_view_board(p_board_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Get the team ID for the board
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  -- Check if user has view permissions for the team
  RETURN v_team_id IS NOT NULL AND can_view_team_content(v_team_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit task content
CREATE OR REPLACE FUNCTION can_edit_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_board_id UUID;
BEGIN
  -- Get the board ID for the task
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  -- Check if user has edit permissions for the board
  RETURN v_board_id IS NOT NULL AND can_edit_board(v_board_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view task content
CREATE OR REPLACE FUNCTION can_view_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_board_id UUID;
BEGIN
  -- Get the board ID for the task
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  -- Check if user has view permissions for the board
  RETURN v_board_id IS NOT NULL AND can_view_board(v_board_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit todo items
CREATE OR REPLACE FUNCTION can_edit_todo(p_todo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_task_id UUID;
BEGIN
  -- Get the task ID for the todo
  SELECT task_id INTO v_task_id
  FROM todos
  WHERE id = p_todo_id;
  
  -- Check if user has edit permissions for the task
  RETURN v_task_id IS NOT NULL AND can_edit_task(v_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view todo items
CREATE OR REPLACE FUNCTION can_view_todo(p_todo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_task_id UUID;
BEGIN
  -- Get the task ID for the todo
  SELECT task_id INTO v_task_id
  FROM todos
  WHERE id = p_todo_id;
  
  -- Check if user has view permissions for the task
  RETURN v_task_id IS NOT NULL AND can_view_task(v_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage task assignees
CREATE OR REPLACE FUNCTION can_manage_task_assignees(p_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN can_edit_task(p_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage task tags
CREATE OR REPLACE FUNCTION can_manage_task_tags(p_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN can_edit_task(p_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role for a specific board
CREATE OR REPLACE FUNCTION get_user_board_role(p_board_id UUID)
RETURNS team_role AS $$
DECLARE
  v_team_id UUID;
  v_role team_role;
BEGIN
  -- Get the team ID for the board
  SELECT team_id INTO v_team_id
  FROM boards
  WHERE id = p_board_id;
  
  IF v_team_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's role in the team
  SELECT tm.role INTO v_role
  FROM team_members tm
  WHERE tm.team_id = v_team_id
  AND tm.user_id = auth.uid();
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role for a specific task
CREATE OR REPLACE FUNCTION get_user_task_role(p_task_id UUID)
RETURNS team_role AS $$
DECLARE
  v_board_id UUID;
BEGIN
  -- Get the board ID for the task
  SELECT board_id INTO v_board_id
  FROM tasks
  WHERE id = p_task_id;
  
  IF v_board_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's role for the board
  RETURN get_user_board_role(v_board_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is assigned to a task
-- This can be used for special permissions for assignees
CREATE OR REPLACE FUNCTION is_task_assignee(p_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM task_assignees ta
    WHERE ta.task_id = p_task_id
    AND ta.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;