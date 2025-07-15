-- Enhanced RLS policies for team-based board access
-- This migration updates existing RLS policies to use the new permission check functions

-- Drop existing policies for boards, tasks, todos, task_assignees, and task_tags
DROP POLICY IF EXISTS "Users can view accessible boards" ON boards;
DROP POLICY IF EXISTS "Team editors and owners can manage boards" ON boards;

DROP POLICY IF EXISTS "Users can view tasks in accessible boards" ON tasks;
DROP POLICY IF EXISTS "Team editors and owners can manage tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view todos in accessible tasks" ON todos;
DROP POLICY IF EXISTS "Team editors and owners can manage todos" ON todos;

DROP POLICY IF EXISTS "Users can view task assignments" ON task_assignees;
DROP POLICY IF EXISTS "Team editors and owners can manage task assignments" ON task_assignees;

DROP POLICY IF EXISTS "Users can view task tags" ON task_tags;
DROP POLICY IF EXISTS "Team editors and owners can manage task tags" ON task_tags;

-- Create enhanced policies for boards
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

-- Create enhanced policies for tasks
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

-- Create enhanced policies for todos
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

-- Create enhanced policies for task assignees
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

-- Create enhanced policies for task tags
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

-- Create enhanced policies for team members
-- Only team owners can manage team members
DROP POLICY IF EXISTS "Team owners can manage team members" ON team_members;

CREATE POLICY "Team owners can manage team members" ON team_members
  FOR ALL USING (
    can_manage_team_members(team_id)
    OR is_org_admin_or_owner((SELECT organization_id FROM teams WHERE id = team_members.team_id))
  );