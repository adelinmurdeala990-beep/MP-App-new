create table public.recipes (
  id uuid primary key default gen_random_uuid(), name text not null, description text not null default '',
  category text not null, image_url text, servings integer not null check (servings >= 1),
  calories numeric not null default 0, protein numeric not null default 0, carbs numeric not null default 0, fat numeric not null default 0,
  ingredients jsonb not null default '[]'::jsonb, steps jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table public.user_data (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  pantry jsonb not null default '[]'::jsonb, favorites jsonb not null default '[]'::jsonb,
  meal_plan jsonb not null default '[]'::jsonb, shopping_list jsonb not null default '[]'::jsonb,
  meal_preferences jsonb not null default '{"breakfast":true,"lunch":true,"dinner":true,"snack":true}'::jsonb, updated_at timestamptz not null default now()
);
create index recipes_category_idx on public.recipes(category); create index user_data_user_id_idx on public.user_data(user_id);
alter table public.recipes enable row level security; alter table public.user_data enable row level security;
create policy "Authenticated users read recipes" on public.recipes for select to authenticated using (true);
create policy "Users read own data" on public.user_data for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own data" on public.user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own data" on public.user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
insert into public.recipes (name,description,category,servings,calories,protein,carbs,fat,ingredients,steps) values
('Omletă cu legume','O omletă rapidă și colorată pentru orice moment al zilei.','Mic dejun',2,340,23,12,22,'[{"name":"Ouă","quantity":4,"unit":"buc"},{"name":"Roșii","quantity":150,"unit":"g"},{"name":"Ardei","quantity":100,"unit":"g"},{"name":"Ulei de măsline","quantity":1,"unit":"lingură"}]','["Taie roșiile și ardeiul.","Bate ouăle într-un bol.","Călește legumele, apoi adaugă ouăle.","Gătește până se încheagă."]'),
('Piept de pui cu orez','Prânz echilibrat, ușor de pregătit.','Prânz',2,560,48,58,14,'[{"name":"Piept de pui","quantity":400,"unit":"g"},{"name":"Orez","quantity":160,"unit":"g"},{"name":"Broccoli","quantity":200,"unit":"g"},{"name":"Ulei de măsline","quantity":1,"unit":"lingură"}]','["Fierbe orezul conform instrucțiunilor.","Gătește pieptul de pui într-o tigaie.","Prepară broccoli la abur.","Servește toate ingredientele împreună."]');
