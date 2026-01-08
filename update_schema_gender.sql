-- Add gender columns to profiles
alter table public.profiles add column if not exists gender text check (gender in ('male', 'female', 'other'));
alter table public.profiles add column if not exists interested_in text[] default ARRAY['male', 'female', 'other'];

-- Function to get random unswiped profiles filtering by gender
-- This is much more efficient than fetching all and filtering in client
create or replace function get_random_profiles(
  current_user_id text,
  target_genders text[],
  limit_count int
)
returns setof public.profiles
language sql
security definer
as $$
  select *
  from public.profiles
  where id != current_user_id
  and gender = any(target_genders)
  and id not in (
    select target_id from public.swipes where swiper_id = current_user_id
  )
  order by random()
  limit limit_count;
$$;
