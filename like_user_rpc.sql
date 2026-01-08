-- RPC to handle swiping/liking a user securely
create or replace function like_user(
  target_user_id text
)
returns json
language plpgsql
security definer
as $$
declare
  match_exists boolean;
begin
  -- 1. Insert the swipe record (upsert to prevent duplicate errors, or just ignore)
  insert into public.swipes (swiper_id, target_id, direction)
  values (auth.uid(), target_user_id, 'right')
  on conflict (swiper_id, target_id) do update
  set direction = 'right', created_at = now(); -- Update timestamp if swiped again

  -- 2. Check if it is a match (i.e., the target has already liked the current user)
  select exists (
    select 1 from public.swipes
    where swiper_id = target_user_id
      and target_id = auth.uid()
      and (direction = 'right' or direction = 'up')
  ) into match_exists;

  return json_build_object('is_match', match_exists);
end;
$$;
