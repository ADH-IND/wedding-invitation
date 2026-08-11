# Setup Supabase

Integrasi ini menggunakan Supabase Database, Auth, dan Storage. Preview lokal tetap memakai mekanisme lokal agar proses editing tidak bergantung pada publish.

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor**, buat query baru, lalu jalankan seluruh isi `supabase/schema.sql`.
3. Jalankan seluruh isi `supabase/rsvp.sql` untuk membuat tabel RSVP, policy RLS, dan function public guestbook.
4. Buka **Project Settings -> API**. Salin **Project URL** dan **Publishable key** (browser-safe key).
5. Isi nilai tersebut di `config/supabase.js`:

   ```js
   const SUPABASE_URL = "https://project-ref.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
   ```

   Jangan pernah menaruh `service_role`, `sb_secret_`, atau `SUPABASE_SECRET_KEY` di frontend.

6. Atur `PUBLIC_BASE_URL` di file yang sama ke URL folder Template #001, misalnya:

   ```js
   const PUBLIC_BASE_URL = "https://USERNAME.github.io/wedding-invitation/templates/template-001/";
   ```

   Saat kosong, aplikasi memakai path template lokal yang sedang dibuka.

7. Buat akun admin pertama lewat **Authentication -> Users -> Add user** di Supabase Dashboard, menggunakan email dan password. Untuk produksi, sesuaikan pengaturan email confirmation sesuai kebutuhan.
8. Jalankan proyek dari local server/hosting statis lalu buka `admin/login.html`. Masuk memakai email dan password tersebut.

## Alur pengujian

1. Buat undangan, isi slug, lalu klik **Simpan Draft**.
2. Refresh Admin; draft akan dimuat ulang dari tabel `public.invitations`.
3. Klik **Publish Undangan**. Admin menampilkan link seperti:

   ```text
   https://USERNAME.github.io/wedding-invitation/templates/template-001/?invite=adhiim-nabila
   ```

4. Buka link itu di jendela incognito atau perangkat lain. Draft tidak dapat dibaca publik karena Row Level Security hanya mengizinkan `published`.
5. Untuk undangan personal, pakai generator dengan base link di atas. Hasilnya memakai `?invite=adhiim-nabila&to=Bapak%20Ahmad`.
6. Submit RSVP dari undangan published. Data masuk ke `public.rsvps`, dan ucapan akan terlihat dari perangkat lain melalui public guestbook.

## Catatan tahap ini

- Supabase adalah source of truth untuk data undangan yang disimpan/published.
- RSVP undangan published tersimpan di `public.rsvps`. Public guestbook membaca data melalui function `get_public_rsvp_messages`, sehingga pengunjung hanya melihat nama dan ucapan.
- `localStorage` masih digunakan untuk Preview dan cache editor lokal.
- Foto dan musik disimpan di Supabase Storage bucket `wedding-assets`; database hanya menyimpan URL public aset.

## Supabase Storage: musik MP3 dan gambar

1. Setelah menjalankan `supabase/schema.sql`, jalankan seluruh isi `supabase/storage.sql` di SQL Editor. File ini membuat bucket public `wedding-assets` serta policy tulis khusus owner invitation.
2. Bucket bersifat public agar pengunjung dapat memutar audio, tetapi anon tidak memiliki policy upload, update, atau delete.
3. Web Admin menerima MP3 (`audio/mpeg`, atau ekstensi `.mp3` bila MIME browser kosong) hingga 15 MB dan gambar JPEG/PNG/WEBP hingga 5 MB per gambar.
4. File baru hanya menjadi pending/preview lokal saat dipilih. Upload baru berlangsung saat **Simpan Draft** atau **Publish Undangan**.
5. Path file selalu menggunakan UUID invitation, sehingga slug dapat diubah dengan aman:

   ```text
   invitations/<invitation-id>/music/background.mp3
   ```

6. Mengganti musik memakai upsert pada path yang sama; file tidak menumpuk. Klik **Hapus Musik** hanya menandai penghapusan sampai undangan disimpan.

7. Foto cover, couple, groom, dan bride menggunakan path tetap berbasis UUID invitation:

   ```text
   invitations/<invitation-id>/images/cover.jpg
   invitations/<invitation-id>/images/couple.jpg
   invitations/<invitation-id>/images/groom.jpg
   invitations/<invitation-id>/images/bride.jpg
   ```

   Galeri memakai `invitations/<invitation-id>/images/gallery/<uuid>.jpg`. URL galeri disimpan sebagai array `gallery` pada `wedding_data`.

Jangan gunakan service role, `sb_secret_`, atau secret key untuk Storage di frontend.
