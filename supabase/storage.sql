-- Jalankan setelah supabase/schema.sql.
-- Bucket khusus aset undangan bersifat public agar audio bisa diputar oleh pengunjung.
insert into storage.buckets (id, name, public)
values ('wedding-assets', 'wedding-assets', true)
on conflict (id) do update set public = true;

-- Anon tidak memperoleh policy tulis. Hanya owner invitation yang dapat mengubah file.
drop policy if exists "Owners can upload invitation music" on storage.objects;
create policy "Owners can upload invitation music"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'music'
  and storage.filename(name) = 'background.mp3'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2]
      and owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update invitation music" on storage.objects;
create policy "Owners can update invitation music"
on storage.objects for update to authenticated
using (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'music'
  and storage.filename(name) = 'background.mp3'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2]
      and owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'music'
  and storage.filename(name) = 'background.mp3'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2]
      and owner_id = auth.uid()
  )
);

drop policy if exists "Owners can delete invitation music" on storage.objects;
create policy "Owners can delete invitation music"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'music'
  and storage.filename(name) = 'background.mp3'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2]
      and owner_id = auth.uid()
  )
);

-- Image assets: cover/groom/bride/couple memakai nama tetap; galeri memakai nama unik.
drop policy if exists "Owners can upload invitation images" on storage.objects;
create policy "Owners can upload invitation images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'images'
  and (
    storage.filename(name) in ('cover.jpg', 'groom.jpg', 'bride.jpg', 'couple.jpg')
    or (storage.foldername(name))[4] = 'gallery'
  )
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2] and owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update invitation images" on storage.objects;
create policy "Owners can update invitation images"
on storage.objects for update to authenticated
using (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'images'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2] and owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'images'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2] and owner_id = auth.uid()
  )
);

drop policy if exists "Owners can delete invitation images" on storage.objects;
create policy "Owners can delete invitation images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wedding-assets'
  and (storage.foldername(name))[1] = 'invitations'
  and (storage.foldername(name))[3] = 'images'
  and exists (
    select 1 from public.invitations
    where id::text = (storage.foldername(name))[2] and owner_id = auth.uid()
  )
);
