import { supabase } from '../lib/supabase';
import type { Board } from '../types';

export async function getBoards() {
  const { data, error } = await supabase
    .from('boards')
    .select(`
      id,
      name,
      tasks:tasks(
        id,
        title,
        description,
        assignee,
        importance,
        timeframe,
        status,
        order,
        todos(id, text, completed),
        task_tags(tag_id)
      )
    `)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Board[];
}

export async function createBoard(name: string) {
  const { data, error } = await supabase
    .from('boards')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBoard(id: string, updates: Partial<Board>) {
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(id: string) {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}