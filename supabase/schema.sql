-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- User profiles (lightweight — name + avatar preference)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_index int default 0,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles: owner read"   on profiles for select using (auth.uid() = id);
create policy "profiles: owner write"  on profiles for insert with check (auth.uid() = id);
create policy "profiles: owner update" on profiles for update using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- Categories
-- ────────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#3D4B8C',
  created_at timestamptz default now()
);
alter table categories enable row level security;
create policy "categories: owner read"   on categories for select using (auth.uid() = user_id);
create policy "categories: owner write"  on categories for insert with check (auth.uid() = user_id);
create policy "categories: owner update" on categories for update using (auth.uid() = user_id);
create policy "categories: owner delete" on categories for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Verses
-- ────────────────────────────────────────────────────────────
create table if not exists verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reference text not null,
  content text not null,
  translation text default 'KJV',
  category_id uuid references categories(id) on delete set null,
  status text default 'learning' check (status in ('learning', 'mastered')),
  date_started date default current_date,
  date_mastered date,
  reminder_interval_minutes int default 60,
  created_at timestamptz default now()
);
alter table verses enable row level security;
create policy "verses: owner read"   on verses for select using (auth.uid() = user_id);
create policy "verses: owner write"  on verses for insert with check (auth.uid() = user_id);
create policy "verses: owner update" on verses for update using (auth.uid() = user_id);
create policy "verses: owner delete" on verses for delete using (auth.uid() = user_id);

create index if not exists verses_user_status_idx on verses (user_id, status);

-- ────────────────────────────────────────────────────────────
-- Feedback
-- ────────────────────────────────────────────────────────────
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  type text default 'general' check (type in ('bug', 'suggestion', 'general')),
  message text not null,
  created_at timestamptz default now()
);
alter table feedback enable row level security;
-- Users can insert their own feedback; only admins read it (use service role key)
create policy "feedback: anyone insert" on feedback for insert with check (true);

-- ────────────────────────────────────────────────────────────
-- Error logs (replaces Sentry — see src/lib/monitoring.ts)
--
-- The app writes here directly with the anon key (insert-only, same
-- pattern as feedback above). To *read* them — e.g. to see critical
-- errors — use the Supabase dashboard's Table Editor, or the SQL
-- Editor with a query like:
--
--   select severity, message, context, app_version, platform, created_at
--   from error_logs
--   where severity = 'fatal'
--   order by created_at desc;
--
-- Both of those go through your Supabase login, not the anon key, so
-- the read-side restriction below doesn't block you from seeing them.
-- ────────────────────────────────────────────────────────────
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  severity text not null check (severity in ('fatal', 'error', 'warning')),
  message text not null,
  stack text,
  context jsonb,
  platform text,
  app_version text,
  created_at timestamptz default now()
);
alter table error_logs enable row level security;
create policy "error_logs: anyone insert" on error_logs for insert with check (true);

create index if not exists error_logs_severity_created_idx
  on error_logs (severity, created_at desc);
