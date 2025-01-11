-- First, temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Add auth_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users;

-- Update RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all team members" ON users;
DROP POLICY IF EXISTS "Users can manage team members if authenticated" ON users;

-- Create new policies
CREATE POLICY "Users can view all team members"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can manage team members if authenticated"
  ON users FOR ALL
  USING (auth.role() = 'authenticated');

-- Make auth_id NOT NULL after adding it
ALTER TABLE users ALTER COLUMN auth_id SET NOT NULL; 