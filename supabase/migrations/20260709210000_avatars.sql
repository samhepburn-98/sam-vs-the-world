-- Player avatars (§5.4 editing, §5.1 duel cards): an `avatars` storage bucket
-- plus a nullable players.avatar_url pointing at the uploaded photo.
--
-- The bucket is public-read — avatars render for logged-out viewers, same as
-- players_read — and the server enforces what clients should never be trusted
-- with: a 2 MiB cap and image-only mime types (the client downscales to well
-- under that; these limits are the backstop).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- storage.objects already has RLS enabled. Public-bucket reads go through the
-- /object/public/ endpoint, but a select policy keeps API-path reads (list,
-- download) working too.
create policy avatars_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

-- Owner-only writes, mirroring the table policies (§8.5). An upsert:true
-- upload is an insert OR an update depending on whether the object exists,
-- so both policies are required. is_owner() is granted to authenticated only,
-- so none of these are anon-scoped.
create policy avatars_ins on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (select public.is_owner()));
create policy avatars_upd on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (select public.is_owner()))
  with check (bucket_id = 'avatars' and (select public.is_owner()));
create policy avatars_del on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (select public.is_owner()));

-- The stored value is the full public URL with a ?v= cache-buster appended at
-- write time — the object path is fixed per player, so the version param is
-- what makes a re-upload actually show up through the CDN.
alter table public.players add column avatar_url text;
