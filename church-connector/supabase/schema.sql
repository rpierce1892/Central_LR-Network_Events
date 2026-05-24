-- Church Community Connector — Database Schema
-- Run this in your Supabase SQL editor to set up the database.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- CHURCH CONFIG
-- ─────────────────────────────────────────────────────────────
create table church_config (
  id              uuid primary key default uuid_generate_v4(),
  church_name     text not null default 'Our Church',
  primary_service_day text not null default 'Sunday',
  midweek_day     text,
  service_time    text not null default '10:00',
  timezone        text not null default 'America/Chicago',
  updated_at      timestamptz default now()
);

-- Insert a default config row
insert into church_config (church_name) values ('Our Church');

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references auth.users(id) on delete cascade not null unique,
  role                    text not null default 'guest' check (role in ('guest','member','leader','admin')),
  first_name              text not null default '',
  last_name               text not null default '',
  photo_url               text,
  age                     int,
  age_range               text,
  marital_status          text check (marital_status in ('single','married','divorced','widowed','partnered')),
  spouse_first_name       text,
  spouse_age              int,
  spouse_occupation       text,
  about_me                text,
  occupation              text,
  employer_type           text,
  how_long_in_area        text,
  neighborhood            text,
  home_zip                text,
  faith_stage             text check (faith_stage in ('new','growing','established')),
  how_long_attending      text,
  social_style            text check (social_style in ('introvert','ambivert','extrovert')),
  looking_for             text,
  hobbies                 text[] default '{}',
  interests               text[] default '{}',
  volunteer_activities    text[] default '{}',
  sports_leagues          text[] default '{}',
  favorite_local_spots    text[] default '{}',
  is_active               boolean not null default true,
  completion_pct          int not null default 0,
  invite_token            text unique,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Trigger to keep updated_at fresh
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CHILDREN
-- ─────────────────────────────────────────────────────────────
create table children (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid references profiles(id) on delete cascade not null,
  first_name        text not null default '',
  age               int not null,
  gender            text not null check (gender in ('boy','girl','nonbinary')),
  school            text not null default '',
  grade             text not null default '',
  activities        text[] default '{}',
  sports            text[] default '{}',
  clubs             text[] default '{}',
  personality_notes text,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- STARRED CRITERIA (guest priority weighting)
-- ─────────────────────────────────────────────────────────────
create table starred_criteria (
  id                  uuid primary key default uuid_generate_v4(),
  guest_profile_id    uuid references profiles(id) on delete cascade not null,
  criteria_type       text not null,
  criteria_value      text not null,
  priority            int not null check (priority between 1 and 3),
  created_at          timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- MATCHES
-- ─────────────────────────────────────────────────────────────
create table matches (
  id                  uuid primary key default uuid_generate_v4(),
  guest_profile_id    uuid references profiles(id) on delete cascade not null,
  member_profile_id   uuid references profiles(id) on delete cascade not null,
  status              text not null default 'pending'
                        check (status in ('pending','accepted','declined','expired')),
  match_score         numeric not null default 0,
  notified_at         timestamptz,
  responded_at        timestamptz,
  created_at          timestamptz default now(),
  unique(guest_profile_id, member_profile_id)
);

-- ─────────────────────────────────────────────────────────────
-- MESSAGES (in-app chat)
-- ─────────────────────────────────────────────────────────────
create table messages (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid references matches(id) on delete cascade not null,
  sender_id   uuid references auth.users(id) on delete cascade not null,
  content     text not null,
  created_at  timestamptz default now(),
  read_at     timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null,
  payload     jsonb default '{}',
  sent_at     timestamptz default now(),
  read_at     timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table children enable row level security;
alter table starred_criteria enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table church_config enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns text as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$ language sql security definer;

-- PROFILES policies
create policy "Users can read their own profile"
  on profiles for select using (user_id = auth.uid());

create policy "Leaders and admins can read all profiles"
  on profiles for select
  using (get_my_role() in ('leader','admin'));

create policy "Members can read active member profiles for matching context"
  on profiles for select
  using (is_active = true and role in ('member','leader','admin'));

create policy "Users can update their own profile"
  on profiles for update using (user_id = auth.uid());

create policy "Admins can update any profile"
  on profiles for update using (get_my_role() = 'admin');

create policy "Users can insert their own profile"
  on profiles for insert with check (user_id = auth.uid());

-- CHILDREN policies
create policy "Users can manage their own children"
  on children for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Leaders and admins can read all children"
  on children for select
  using (get_my_role() in ('leader','admin'));

create policy "Members can read guest children when matched"
  on children for select
  using (
    profile_id in (
      select guest_profile_id from matches
      where member_profile_id in (select id from profiles where user_id = auth.uid())
        and status in ('pending','accepted')
    )
  );

-- STARRED CRITERIA policies
create policy "Guests can manage their own starred criteria"
  on starred_criteria for all using (
    guest_profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Matched members can read guest starred criteria"
  on starred_criteria for select
  using (
    guest_profile_id in (
      select guest_profile_id from matches
      where member_profile_id in (select id from profiles where user_id = auth.uid())
        and status in ('pending','accepted')
    )
  );

create policy "Leaders and admins can read all starred criteria"
  on starred_criteria for select
  using (get_my_role() in ('leader','admin'));

-- MATCHES policies
create policy "Users can see their own matches"
  on matches for select using (
    guest_profile_id in (select id from profiles where user_id = auth.uid())
    or
    member_profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Leaders and admins can see all matches"
  on matches for select using (get_my_role() in ('leader','admin'));

create policy "Members can update their own match status"
  on matches for update using (
    member_profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Admins and leaders can update any match"
  on matches for update using (get_my_role() in ('leader','admin'));

create policy "Service role can insert matches"
  on matches for insert with check (true);

-- MESSAGES policies
create policy "Match participants can read messages"
  on messages for select using (
    match_id in (
      select id from matches
      where guest_profile_id in (select id from profiles where user_id = auth.uid())
         or member_profile_id in (select id from profiles where user_id = auth.uid())
    )
    or get_my_role() in ('leader','admin')
  );

create policy "Match participants can insert messages"
  on messages for insert with check (
    sender_id = auth.uid()
    and match_id in (
      select id from matches
      where (
        guest_profile_id in (select id from profiles where user_id = auth.uid())
        or member_profile_id in (select id from profiles where user_id = auth.uid())
      )
      and status = 'accepted'
    )
  );

-- NOTIFICATIONS policies
create policy "Users can read their own notifications"
  on notifications for select using (user_id = auth.uid());

create policy "Users can update their own notifications (mark read)"
  on notifications for update using (user_id = auth.uid());

-- CHURCH CONFIG policies
create policy "Anyone authenticated can read church config"
  on church_config for select using (auth.role() = 'authenticated');

create policy "Admins can update church config"
  on church_config for update using (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- REALTIME (enable for chat)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
