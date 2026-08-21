alter table public.user_data
  add column if not exists custom_lists jsonb not null default '[]'::jsonb;
