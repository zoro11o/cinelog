-- ============================================================
-- WatchVault — Supabase Database Schema
-- ============================================================
-- HOW TO USE:
-- 1. Go to your Supabase project dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire file and click "Run"
-- ============================================================


-- ── Table: profiles ────────────────────────────────────────
-- One row per user. Created when they sign up.
-- avatar_url is just a text URL — we never store the image itself.

create table profiles (
  id          uuid references auth.users primary key,
  username    text unique not null,
  bio         text    default '',
  avatar_url  text    default '',
  created_at  timestamptz default now()
);

-- Row Level Security: users can only write their own profile,
-- but anyone can read any profile (needed for future public profile pages).
alter table profiles enable row level security;

create policy "Anyone can view profiles"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);


-- ── Table: list_entries ────────────────────────────────────
-- One row per (user, movie/show). Stores everything about
-- what they're watching, their score, and episode progress.

create table list_entries (
  id                uuid        default gen_random_uuid() primary key,
  user_id           uuid        references auth.users not null,
  tmdb_id           integer     not null,
  media_type        text        not null check (media_type in ('movie', 'tv')),
  title             text        not null,
  poster_path       text        default '',
  status            text        not null check (status in ('watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold')),
  score             integer     check (score >= 1 and score <= 10),
  episodes_watched  integer     default 0,
  total_episodes    integer     default 0,
  runtime           integer     default 0,   -- minutes per episode (tv) or total runtime (movie)
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  -- Prevent a user adding the same movie/show twice
  unique(user_id, tmdb_id, media_type)
);

-- Row Level Security: users can only see and change their own entries.
alter table list_entries enable row level security;

create policy "Users can view their own entries"
  on list_entries for select using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on list_entries for insert with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on list_entries for update using (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on list_entries for delete using (auth.uid() = user_id);


-- ── Index for faster queries ────────────────────────────────
-- This makes loading a user's full list much faster.
create index list_entries_user_id_idx on list_entries(user_id);
