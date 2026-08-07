-- Supabase Enterprise Schema for API-Pulse

-- 1. Users Table (Extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  tier text default 'free', -- 'free' or 'pro'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure the users table
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. API Keys Table
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  key_hash text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.api_keys enable row level security;
create policy "Users can manage own keys" on public.api_keys for all using (auth.uid() = user_id);


-- 3. Generations Table (Usage Tracking)
create table public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  schema_id text, -- ID returned by the API
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.generations enable row level security;
create policy "Users can view own generations" on public.generations for select using (auth.uid() = user_id);


-- 4. Mock Endpoints (From MVP phase)
-- Already exists, but for completion:
create table if not exists public.mock_endpoints (
  id uuid primary key,
  spec jsonb,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
