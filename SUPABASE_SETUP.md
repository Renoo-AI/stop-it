# Supabase Setup for Mind Warrior

To make the application work with Supabase, you need to:

1.  **Create a `profiles` table** in your Supabase SQL Editor:

```sql
-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_id text default '1',
  current_day integer default 1,
  week integer default 1,
  streak integer default 0,
  xp integer default 0,
  completed_days integer[] default '{}',
  last_completed_date text,
  last_completed_timestamp bigint,
  total_days_completed integer default 0,
  total_dojo_wins integer default 0,
  longest_streak integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Set up Realtime
alter publication supabase_realtime add table profiles;
```

2.  **Enable Anonymous Sign-in** in your Supabase Dashboard:
    -   Go to **Authentication** -> **Providers**.
    -   Find **Anonymous** and enable it.

3.  **Add Environment Variables** in AI Studio Settings:
    -   `SUPABASE_URL`: Your Supabase project URL.
    -   `SUPABASE_ANON_KEY`: Your Supabase project anonymous key.
