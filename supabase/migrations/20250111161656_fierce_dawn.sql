/*
  # Task Management Schema

  1. New Tables
    - `boards`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

    - `tasks`
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `title` (text)
      - `description` (text)
      - `assignee` (text)
      - `importance` (enum)
      - `timeframe` (enum)
      - `status` (enum)
      - `order` (integer)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

    - `todos`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references tasks)
      - `text` (text)
      - `completed` (boolean)
      - `created_at` (timestamp)

    - `tags`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

    - `task_tags`
      - `task_id` (uuid, references tasks)
      - `tag_id` (uuid, references tags)
      - Primary key (task_id, tag_id)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create custom types
CREATE TYPE importance_level AS ENUM ('not critical', 'critical', 'super critical');
CREATE TYPE timeframe_level AS ENUM ('>3 hours', '> 1 day', '> 1 week');
CREATE TYPE task_status AS ENUM ('pending', 'started', 'in_review', 'completed');

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES boards ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  assignee text,
  importance importance_level NOT NULL,
  timeframe timeframe_level NOT NULL,
  status task_status DEFAULT 'pending',
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create task_tags junction table
CREATE TABLE IF NOT EXISTS task_tags (
  task_id uuid REFERENCES tasks ON DELETE CASCADE,
  tag_id uuid REFERENCES tags ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own boards"
  ON boards
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage tasks in their boards"
  ON tasks
  USING (
    board_id IN (
      SELECT id FROM boards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage todos in their tasks"
  ON todos
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN boards b ON t.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own tags"
  ON tags
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage task_tags for their tasks"
  ON task_tags
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN boards b ON t.board_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );