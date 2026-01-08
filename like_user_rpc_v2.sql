-- Drop old versions if they exist
DROP FUNCTION IF EXISTS public.like_user(text);
DROP FUNCTION IF EXISTS public.like_user(text, text);

-- RPC to handle swiping/liking a user securely
-- Modified to accept current_user_id explicitly to avoid UUID type errors with auth.uid()
create or replace function public.like_user(
  current_user_id text,
  target_user_id text
)
returns json
language plpgsql
security definer
as $$
declare
  match_exists boolean;
begin
  -- 1. Insert the swipe record (upsert to prevent duplicate errors)
  insert into public.swipes (swiper_id, target_id, direction)
  values (current_user_id, target_user_id, 'right')
  on conflict (swiper_id, target_id) do update
  set direction = 'right', created_at = now();

  -- 2. Check if it is a match
  select exists (
    select 1 from public.swipes
    where swiper_id = target_user_id
      and target_id = current_user_id
      and (direction = 'right' or direction = 'up')
  ) into match_exists;

  return json_build_object('is_match', match_exists);
end;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.like_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.like_user(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.like_user(text, text) TO anon;
