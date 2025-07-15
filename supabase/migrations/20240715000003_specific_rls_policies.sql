-- Specific RLS policies for todos, task assignees, and tags
-- This migration adds more specific policies to enforce strict role-based access control

-- Add specific policy for todo completion toggle
-- This ensures that viewers cannot toggle todo completion status
CREATE POLICY "Only editors and owners can toggle todo completion" ON todos
  FOR UPDATE USING (
    can_edit_todo(id) AND 
    (
      -- Only allow toggling the is_completed field
      (OLD.is_completed IS DISTINCT FROM NEW.is_completed AND
       OLD.title = NEW.title AND
       OLD.task_id = NEW.task_id)
      OR
      -- Or allow full updates for editors/owners
      can_edit_todo(id)
    )
  );

-- Add specific policy for task assignees to prevent viewers from assigning tasks
CREATE POLICY "Only editors and owners can assign tasks" ON task_assignees
  FOR INSERT WITH CHECK (
    can_manage_task_assignees(task_id)
  );

-- Add specific policy for task tags to prevent viewers from adding tags
CREATE POLICY "Only editors and owners can add tags to tasks" ON task_tags
  FOR INSERT WITH CHECK (
    can_manage_task_tags(task_id)
  );

-- Add specific policy for task status updates
-- This ensures that viewers cannot change task status
CREATE POLICY "Only editors and owners can update task status" ON tasks
  FOR UPDATE USING (
    can_edit_task(id) AND
    (
      -- Only allow updating the status field
      (OLD.status IS DISTINCT FROM NEW.status AND
       OLD.title = NEW.title AND
       OLD.description = NEW.description AND
       OLD.board_id = NEW.board_id AND
       OLD.deadline_at = NEW.deadline_at AND
       OLD.x_index = NEW.x_index AND
       OLD.y_index = NEW.y_index AND
       OLD.order = NEW.order)
      OR
      -- Or allow full updates for editors/owners
      can_edit_task(id)
    )
  );

-- Add specific policy for task position updates
-- This ensures that viewers cannot move tasks
CREATE POLICY "Only editors and owners can move tasks" ON tasks
  FOR UPDATE USING (
    can_edit_task(id) AND
    (
      -- Only allow updating position fields
      ((OLD.x_index IS DISTINCT FROM NEW.x_index OR
        OLD.y_index IS DISTINCT FROM NEW.y_index OR
        OLD.order IS DISTINCT FROM NEW.order) AND
       OLD.title = NEW.title AND
       OLD.description = NEW.description AND
       OLD.board_id = NEW.board_id AND
       OLD.status = NEW.status AND
       OLD.deadline_at = NEW.deadline_at)
      OR
      -- Or allow full updates for editors/owners
      can_edit_task(id)
    )
  );

-- Add specific policy for task deadline updates
-- This ensures that viewers cannot change task deadlines
CREATE POLICY "Only editors and owners can update task deadlines" ON tasks
  FOR UPDATE USING (
    can_edit_task(id) AND
    (
      -- Only allow updating the deadline field
      (OLD.deadline_at IS DISTINCT FROM NEW.deadline_at AND
       OLD.title = NEW.title AND
       OLD.description = NEW.description AND
       OLD.board_id = NEW.board_id AND
       OLD.status = NEW.status AND
       OLD.x_index = NEW.x_index AND
       OLD.y_index = NEW.y_index AND
       OLD.order = NEW.order)
      OR
      -- Or allow full updates for editors/owners
      can_edit_task(id)
    )
  );

-- Add audit logging for permission violations
CREATE TABLE IF NOT EXISTS permission_violation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- Function to log permission violations
CREATE OR REPLACE FUNCTION log_permission_violation(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO permission_violation_logs (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy for permission violation logs
ALTER TABLE permission_violation_logs ENABLE ROW LEVEL SECURITY;

-- Only allow organization admins and owners to view permission violation logs
CREATE POLICY "Only org admins and owners can view permission violation logs" ON permission_violation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN organization_members om ON u.id = om.user_id
      WHERE u.id = auth.uid()
      AND om.role IN ('admin', 'owner')
    )
  );

-- Trigger function to log permission violations when they occur
CREATE OR REPLACE FUNCTION log_permission_violation_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a permission violation
  IF TG_OP = 'UPDATE' AND NOT can_edit_task(NEW.id) THEN
    PERFORM log_permission_violation('update', 'task', NEW.id, jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status
    ));
    RETURN NULL; -- Prevent the update
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to tasks table for permission violation logging
CREATE TRIGGER task_permission_violation_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_permission_violation_trigger();