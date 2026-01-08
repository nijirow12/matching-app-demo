-- Insert Dummy Profiles
insert into public.profiles (id, name, age, bio, images)
values 
  ('dummy_user_1', 'Sakura', 24, 'カフェ巡りが好きです☕️ よろしくお願いします！', ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800']),
  ('dummy_user_2', 'Kaito', 27, '休日はフットサルしてます⚽️', ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800']),
  ('dummy_user_3', 'Yui', 22, '映画と旅行が趣味です✈️', ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800']),
  ('dummy_user_4', 'Ren', 29, 'エンジニアやってます💻', ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'])
on conflict (id) do nothing;
