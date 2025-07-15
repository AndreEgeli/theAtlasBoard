-- Test queries for permission functions
-- These are example queries that can be run to test the permission functions
-- Note: These are commented out as they are meant to be run manually for testing

/*
-- Test has_team_role function
SELECT has_team_role('team_id_here', 'owner');
SELECT has_team_role('team_id_here', 'editor');
SELECT has_team_role('team_id_here', 'viewer');

-- Test has_minimum_team_role function
SELECT has_minimum_team_role('team_id_here', 'owner');
SELECT has_minimum_team_role('team_id_here', 'editor');
SELECT has_minimum_team_role('team_id_here', 'viewer');

-- Test can_edit_team_content function
SELECT can_edit_team_content('team_id_here');

-- Test can_view_team_content function
SELECT can_view_team_content('team_id_here');

-- Test can_manage_team_members function
SELECT can_manage_team_members('team_id_here');

-- Test can_edit_board function
SELECT can_edit_board('board_id_here');

-- Test can_view_board function
SELECT can_view_board('board_id_here');

-- Test can_edit_task function
SELECT can_edit_task('task_id_here');

-- Test can_view_task function
SELECT can_view_task('task_id_here');

-- Test can_edit_todo function
SELECT can_edit_todo('todo_id_here');

-- Test can_view_todo function
SELECT can_view_todo('todo_id_here');

-- Test can_manage_task_assignees function
SELECT can_manage_task_assignees('task_id_here');

-- Test can_manage_task_tags function
SELECT can_manage_task_tags('task_id_here');

-- Test get_user_board_role function
SELECT get_user_board_role('board_id_here');

-- Test get_user_task_role function
SELECT get_user_task_role('task_id_here');

-- Test is_task_assignee function
SELECT is_task_assignee('task_id_here');
*/

-- Create a function to test all permission functions with different user roles
CREATE OR REPLACE FUNCTION test_permission_functions(
  p_user_id UUID,
  p_team_id UUID,
  p_board_id UUID,
  p_task_id UUID,
  p_todo_id UUID
)
RETURNS TABLE (
  function_name TEXT,
  result BOOLEAN,
  role team_role
) AS $$
DECLARE
  v_role team_role;
BEGIN
  -- Get the user's role in the team
  SELECT role INTO v_role
  FROM team_members
  WHERE team_id = p_team_id
  AND user_id = p_user_id;
  
  -- Return results for each permission function
  function_name := 'has_team_role(owner)';
  result := has_team_role(p_team_id, 'owner');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'has_team_role(editor)';
  result := has_team_role(p_team_id, 'editor');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'has_team_role(viewer)';
  result := has_team_role(p_team_id, 'viewer');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'has_minimum_team_role(owner)';
  result := has_minimum_team_role(p_team_id, 'owner');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'has_minimum_team_role(editor)';
  result := has_minimum_team_role(p_team_id, 'editor');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'has_minimum_team_role(viewer)';
  result := has_minimum_team_role(p_team_id, 'viewer');
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_edit_team_content';
  result := can_edit_team_content(p_team_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_view_team_content';
  result := can_view_team_content(p_team_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_manage_team_members';
  result := can_manage_team_members(p_team_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_edit_board';
  result := can_edit_board(p_board_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_view_board';
  result := can_view_board(p_board_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_edit_task';
  result := can_edit_task(p_task_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_view_task';
  result := can_view_task(p_task_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_edit_todo';
  result := can_edit_todo(p_todo_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_view_todo';
  result := can_view_todo(p_todo_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_manage_task_assignees';
  result := can_manage_task_assignees(p_task_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'can_manage_task_tags';
  result := can_manage_task_tags(p_task_id);
  role := v_role;
  RETURN NEXT;
  
  function_name := 'is_task_assignee';
  result := is_task_assignee(p_task_id);
  role := v_role;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage of the test function:
/*
SELECT * FROM test_permission_functions(
  'user_id_here',
  'team_id_here',
  'board_id_here',
  'task_id_here',
  'todo_id_here'
);
*/