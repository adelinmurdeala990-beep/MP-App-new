create policy "Authenticated users add recipes" on public.recipes for insert to authenticated with check (true);

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "Authenticated users upload recipe images"
on storage.objects for insert to authenticated with check (bucket_id = 'recipe-images');

create policy "Anyone reads recipe images"
on storage.objects for select to public using (bucket_id = 'recipe-images');
