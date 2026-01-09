-- Enable Realtime for messages table
-- This allows clients to listen for changes (INSERTs)
begin;
  -- Try to add table to publication strictly
  alter publication supabase_realtime add table public.messages;
exception 
  when duplicate_object then 
    null; -- already added, ignore
end;

-- Simplify RLS policies for troubleshooting
-- Drop existing specific policies
drop policy if exists "Users can read own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Allow all messages access" on public.messages;

-- Create a permissive policy for development/testing
-- This avoids any UUID vs Text type casting issues with auth.uid() temporarily
create policy "Allow all messages access"
on public.messages for all
using (true)
with check (true);
