-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  email text not null,
  city text,
  is_admin boolean default false,
  certified boolean default false,
  certified_at timestamptz,
  created_at timestamptz default now()
);

-- Session results
create table session_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_index integer not null check (session_index between 0 and 3),
  score integer not null,
  total integer not null,
  passed boolean generated always as (score::float / total >= 0.8) stored,
  attempt integer default 1,
  completed_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table session_results enable row level security;

-- Helper function to check admin status (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_admin()
returns boolean as $$
  select is_admin from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Admin reads all profiles" on profiles for select using (public.is_admin());

create policy "Users read own results" on session_results for select using (auth.uid() = user_id);
create policy "Users insert own results" on session_results for insert with check (auth.uid() = user_id);
create policy "Admin reads all results" on session_results for select using (public.is_admin());

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, city, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'city', ''),
    new.email = 'admin@thelandlord.tn'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
