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

-- ────────────────────────────────────────────────────────────
-- Local-first architecture: cloud-side tables
--
-- As of the local-first rewrite, `verses` and `categories` above are no
-- longer written to on every add/edit/delete — the on-device SQLite
-- database (src/lib/db.ts) is the source of truth for that data. They're
-- left in place for backward compatibility (older installed builds, or
-- anyone reading this data outside the app) but the app itself only
-- touches the tables below for anything backup-related. See
-- src/lib/backup.ts and app/backup.tsx.
-- ────────────────────────────────────────────────────────────

-- Subscription status lives on the profile — this is what the premium
-- Backup & Restore offering (see PRD) will gate against once billing is
-- wired up. `free` is fully functional today; the paid tiers exist here
-- so that turning them on later is a billing-provider integration, not a
-- schema change.
alter table profiles add column if not exists subscription_tier text
  default 'free' check (subscription_tier in ('free', 'backup_monthly', 'backup_annual'));
alter table profiles add column if not exists subscription_status text
  default 'active' check (subscription_status in ('active', 'canceled', 'past_due', 'none'));

-- One row per user: their current backup preferences and the last time a
-- backup actually succeeded. Read by app/backup.tsx's "View Last Backup
-- Date" and used by src/lib/backup.ts to decide whether a scheduled
-- backup (daily/weekly/monthly) is due.
create table if not exists backup_metadata (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  frequency text not null default 'weekly' check (frequency in ('daily', 'weekly', 'monthly')),
  last_backup_at timestamptz,
  updated_at timestamptz default now()
);
alter table backup_metadata enable row level security;
create policy "backup_metadata: owner read"   on backup_metadata for select using (auth.uid() = user_id);
create policy "backup_metadata: owner write"  on backup_metadata for insert with check (auth.uid() = user_id);
create policy "backup_metadata: owner update" on backup_metadata for update using (auth.uid() = user_id);

-- The actual backup payload: one encrypted JSON blob per user, containing
-- their verses/categories/preferences as of the last backup. Encrypted
-- client-side before it ever leaves the device (see src/lib/backup.ts) —
-- this table only ever holds ciphertext, so a database-level breach alone
-- doesn't expose scripture content or any other user data.
create table if not exists backup_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_data text not null,
  verse_count int default 0,
  created_at timestamptz default now()
);
alter table backup_snapshots enable row level security;
create policy "backup_snapshots: owner read"   on backup_snapshots for select using (auth.uid() = user_id);
create policy "backup_snapshots: owner write"  on backup_snapshots for insert with check (auth.uid() = user_id);
create policy "backup_snapshots: owner update" on backup_snapshots for update using (auth.uid() = user_id);

-- Which devices a user has backed up from/restored to — mainly useful for
-- "you're currently signed in on 2 devices" type messaging later, and
-- gives support something to look at if a user reports a restore issue.
create table if not exists device_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_name text,
  platform text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table device_registrations enable row level security;
create policy "device_registrations: owner read"   on device_registrations for select using (auth.uid() = user_id);
create policy "device_registrations: owner write"  on device_registrations for insert with check (auth.uid() = user_id);
create policy "device_registrations: owner update" on device_registrations for update using (auth.uid() = user_id);

-- Audit trail of backup/restore events — lets a user (or support) see
-- "backed up successfully on device X" / "restore failed" history rather
-- than only ever knowing the single most recent outcome.
create table if not exists sync_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null check (action in ('backup', 'restore')),
  success boolean not null,
  verse_count int,
  error_message text,
  created_at timestamptz default now()
);
alter table sync_history enable row level security;
create policy "sync_history: owner read"   on sync_history for select using (auth.uid() = user_id);
create policy "sync_history: owner write"  on sync_history for insert with check (auth.uid() = user_id);

create index if not exists sync_history_user_created_idx on sync_history (user_id, created_at desc);
