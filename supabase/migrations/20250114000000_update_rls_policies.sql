-- Temporarily disable RLS
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own boards" ON boards;
DROP POLICY IF EXISTS "Users can manage tasks in their boards" ON tasks;
DROP POLICY IF EXISTS "Users can manage todos in their tasks" ON todos;
DROP POLICY IF EXISTS "Users can manage their own tags" ON tags;
DROP POLICY IF EXISTS "Users can manage task_tags for their tasks" ON task_tags;

-- Create new simplified policies
CREATE POLICY "Authenticated users can manage boards"
  ON boards
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tasks"
  ON tasks
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage todos"
  ON todos
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tags"
  ON tags
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage task_tags"
  ON task_tags
  USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY; 