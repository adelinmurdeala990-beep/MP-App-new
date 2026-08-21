alter table public.user_data
  add column if not exists meal_preferences jsonb not null default '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}'::jsonb;
