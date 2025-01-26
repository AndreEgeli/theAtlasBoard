-- Add current_organization_id to auth.users
alter table auth.users add column current_organization_id uuid references public.organizations(id);

-- Create team_members junction table
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique user-team combinations
  unique(team_id, user_id)
);

-- RLS policies for team_members
alter table public.team_members enable row level security;

create policy "Users can view their team memberships"
  on public.team_members
  for select
  using (auth.uid() = user_id);

create policy "Organization owners can manage team members"
  on public.team_members
  using (
    exists (
      select 1 from public.organization_members om
      join public.teams t on t.organization_id = om.organization_id
      where om.user_id = auth.uid()
      and om.role = 'owner'
      and t.id = team_members.team_id
    )
  ); 