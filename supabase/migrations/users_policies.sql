-- First, drop existing policies if they exist
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;

-- Enable RLS (if not already enabled)
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.users to authenticated;

-- Ensure authenticated users can use the sequence if ID is serial
grant usage, select on all sequences in schema public to authenticated; 