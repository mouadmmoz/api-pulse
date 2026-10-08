-- Supabase Enterprise Schema for API-Pulse (Hardened)

-- 1. Users Table (Extends Supabase Auth)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  tier text default 'free', -- 'free' or 'pro'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure the users table
alter table public.users enable row level security;
-- Only allow select for own profile. No UPDATE allowed for authenticated users.
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
create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  key_hash text not null unique, -- Store SHA-256 hash here
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.api_keys enable row level security;
create policy "Users can view own keys" on public.api_keys for select using (auth.uid() = user_id);
create policy "Users can insert own keys" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Users can delete own keys" on public.api_keys for delete using (auth.uid() = user_id);
-- No UPDATE policy for API keys.


-- 3. Generations Table (Usage Tracking)
create table if not exists public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  schema_id text, -- ID returned by the API
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.generations enable row level security;
create policy "Users can view own generations" on public.generations for select using (auth.uid() = user_id);
-- No insert/update/delete policy for authenticated users, handled by service role in backend.


-- 4. Mock Endpoints (Edge Worker Data)
create table if not exists public.mock_endpoints (
  id uuid primary key,
  spec jsonb,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Completely lock down mock_endpoints from public/authenticated access
alter table public.mock_endpoints enable row level security;
-- No policies defined = default deny all for anon and authenticated users.
-- Only the service_role key can read/write to this table.
