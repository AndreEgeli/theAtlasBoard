# Database Permission Functions

This document describes the database helper functions created for permission checks in the team-based board access feature.

## Overview

These functions provide a consistent way to check permissions at the database level using Row Level Security (RLS) policies. They enforce the role-based access control system where users have specific roles (owner, editor, viewer) within teams that determine their access level to team-owned boards.

## Role Hierarchy

The permission system follows this role hierarchy:

- **Owner**: Full control over team, boards, tasks, and team members
- **Editor**: Can create, edit, and delete boards and tasks, but cannot manage team members
- **Viewer**: Read-only access to boards and tasks

## Core Permission Functions

### Role Check Functions

These functions check a user's role within a team:

- `has_team_role(team_id, role)`: Checks if the current user has the exact specified role in the team
- `has_minimum_team_role(team_id, minimum_role)`: Checks if the current user has at least the specified role level in the team (following the hierarchy owner > editor > viewer)
- `get_team_role(team_id)`: Gets the current user's role in the team

### Team-Level Permission Functions

These functions check permissions at the team level:

- `can_edit_team_content(team_id)`: Checks if the current user can edit content in the team (owner or editor)
- `can_view_team_content(team_id)`: Checks if the current user can view content in the team (any role)
- `can_manage_team_members(team_id)`: Checks if the current user can manage team members (owner only)

### Board-Level Permission Functions

These functions check permissions at the board level:

- `can_edit_board(board_id)`: Checks if the current user can edit the board
- `can_view_board(board_id)`: Checks if the current user can view the board
- `get_user_board_role(board_id)`: Gets the current user's role for the board's team

### Task-Level Permission Functions

These functions check permissions at the task level:

- `can_edit_task(task_id)`: Checks if the current user can edit the task
- `can_view_task(task_id)`: Checks if the current user can view the task
- `can_manage_task_assignees(task_id)`: Checks if the current user can manage task assignees
- `can_manage_task_tags(task_id)`: Checks if the current user can manage task tags
- `get_user_task_role(task_id)`: Gets the current user's role for the task's board team
- `is_task_assignee(task_id)`: Checks if the current user is assigned to the task

### Todo-Level Permission Functions

These functions check permissions at the todo level:

- `can_edit_todo(todo_id)`: Checks if the current user can edit the todo
- `can_view_todo(todo_id)`: Checks if the current user can view the todo

## Usage in RLS Policies

These functions are used in RLS policies to enforce permissions at the database level. For example:

```sql
-- Users can view boards they have access to
CREATE POLICY "Users can view accessible boards" ON boards
  FOR SELECT USING (
    can_view_board(id)
  );

-- Only editors and owners can create tasks
CREATE POLICY "Team editors and owners can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    can_edit_board(board_id)
  );
```

## Testing

A test function `test_permission_functions` is provided to verify that the permission functions work correctly with different user roles. This function takes user, team, board, task, and todo IDs as parameters and returns the results of all permission checks for that user.

Example usage:

```sql
SELECT * FROM test_permission_functions(
  'user_id_here',
  'team_id_here',
  'board_id_here',
  'task_id_here',
  'todo_id_here'
);
```

## Security Considerations

- All permission functions use `SECURITY DEFINER` to ensure they run with the privileges of the function creator
- Functions follow the principle of least privilege, only checking what's necessary
- The permission hierarchy is strictly enforced, with viewers having no edit capabilities
- All database operations are protected by appropriate RLS policies that use these functions

## Specific RLS Policies

In addition to the general RLS policies, we've added specific policies to enforce strict role-based access control:

### Todo-Specific Policies

- `Only editors and owners can toggle todo completion`: Prevents viewers from toggling todo completion status

### Task Assignee-Specific Policies

- `Only editors and owners can assign tasks`: Prevents viewers from assigning tasks to users

### Task Tag-Specific Policies

- `Only editors and owners can add tags to tasks`: Prevents viewers from adding tags to tasks

### Task-Specific Policies

- `Only editors and owners can update task status`: Prevents viewers from changing task status
- `Only editors and owners can move tasks`: Prevents viewers from moving tasks
- `Only editors and owners can update task deadlines`: Prevents viewers from changing task deadlines

## Audit Logging

We've added audit logging for permission violations to help track and debug security issues:

- `permission_violation_logs`: Table to store permission violation logs
- `log_permission_violation`: Function to log permission violations
- `log_permission_violation_trigger`: Trigger function to automatically log permission violations

This helps system administrators monitor and respond to potential security issues.
