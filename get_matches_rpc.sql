-- Function to get matched user IDs for a given user
-- Returns the profile IDs of users who have mutually liked the current user
create or replace function get_matched_user_ids(
  current_user_id text
)
returns setof text
language sql
security definer
as $$
  select s1.target_id
  from public.swipes s1
  join public.swipes s2 
    on s1.target_id = s2.swiper_id 
    and s1.swiper_id = s2.target_id
  where s1.swiper_id = current_user_id
    and (s1.direction = 'right' or s1.direction = 'up')
    and (s2.direction = 'right' or s2.direction = 'up');
$$;
