-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#3D4B8C',
  created_at timestamptz default now()
);

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

alter table categories enable row level security;
alter table verses enable row level security;

-- Each person can only ever see/edit their own rows.
create policy "categories: owner read" on categories for select using (auth.uid() = user_id);
create policy "categories: owner write" on categories for insert with check (auth.uid() = user_id);
create policy "categories: owner update" on categories for update using (auth.uid() = user_id);
create policy "categories: owner delete" on categories for delete using (auth.uid() = user_id);

create policy "verses: owner read" on verses for select using (auth.uid() = user_id);
create policy "verses: owner write" on verses for insert with check (auth.uid() = user_id);
create policy "verses: owner update" on verses for update using (auth.uid() = user_id);
create policy "verses: owner delete" on verses for delete using (auth.uid() = user_id);

create index if not exists verses_user_status_idx on verses (user_id, status);
