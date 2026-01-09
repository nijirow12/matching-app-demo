-- Function to get random profiles filtering by gender AND excluding already swiped profiles
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
    select s1.target_id 
    from public.swipes s1
    join public.swipes s2 
      on s1.target_id = s2.swiper_id 
      and s1.swiper_id = s2.target_id
    where s1.swiper_id = current_user_id 
    and s1.direction = 'right'
    and s2.direction = 'right' -- Only exclude if BOTH parties swiped right (Match established)
    -- This means 'One-way Like' or 'Nope' users WILL reappear.
  )
  order by random()
  limit limit_count;
$$;
