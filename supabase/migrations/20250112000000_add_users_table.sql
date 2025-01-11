-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Update policies for authenticated users
CREATE POLICY "Users can view all team members"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can manage team members if authenticated"
  ON users
  USING (auth.role() = 'authenticated');

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name)
VALUES ('user-avatars', 'user-avatars')
ON CONFLICT DO NOTHING;

-- Enable public access to avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  ); 