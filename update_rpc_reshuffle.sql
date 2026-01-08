-- Function to get random profiles filtering by gender, ALLOWING already swiped profiles to reappear
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
  -- removed the 'not in swipes' logic to allow reshuffling
  order by random()
  limit limit_count;
$$;
