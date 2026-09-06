create table if not exists public.pizarra_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pizarra_data enable row level security;

create policy "Users can read their own Pizarra data"
  on public.pizarra_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Pizarra data"
  on public.pizarra_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Pizarra data"
  on public.pizarra_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own Pizarra data"
  on public.pizarra_data for delete
  using (auth.uid() = user_id);
