# Setup Supabase

Integrasi ini menggunakan Supabase Database dan Auth. Foto/base64, Preview, serta RSVP masih memakai mekanisme lokal yang sudah ada.

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor**, buat query baru, lalu jalankan seluruh isi `supabase/schema.sql`.
3. Buka **Project Settings → API**. Salin **Project URL** dan **Publishable key** (browser-safe key).
4. Isi nilai tersebut di `config/supabase.js`:

   ```js
   const SUPABASE_URL = "https://project-ref.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
   ```

   Jangan pernah menaruh `service_role`, `sb_secret_`, atau `SUPABASE_SECRET_KEY` di frontend.

5. Atur `PUBLIC_BASE_URL` di file yang sama ke URL folder Template #001, misalnya:

   ```js
   const PUBLIC_BASE_URL = "https://USERNAME.github.io/wedding-invitation/templates/template-001/";
   ```

   Saat kosong, aplikasi memakai path template lokal yang sedang dibuka.

6. Buat akun admin pertama lewat **Authentication → Users → Add user** di Supabase Dashboard, menggunakan email dan password. Untuk produksi, sesuaikan pengaturan email confirmation sesuai kebutuhan.
7. Jalankan proyek dari local server/hosting statis lalu buka `admin/login.html`. Masuk memakai email dan password tersebut.

## Alur pengujian

1. Buat undangan, isi slug, lalu klik **Simpan Draft**.
2. Refresh Admin; draft akan dimuat ulang dari tabel `public.invitations`.
3. Klik **Publish Undangan**. Admin menampilkan link seperti:

   ```text
   https://USERNAME.github.io/wedding-invitation/templates/template-001/?invite=adhiim-nabila
   ```

4. Buka link itu di jendela incognito atau perangkat lain. Draft tidak dapat dibaca publik karena Row Level Security hanya mengizinkan `published`.
5. Untuk undangan personal, pakai generator dengan base link di atas. Hasilnya memakai `?invite=adhiim-nabila&to=Bapak%20Ahmad`.

## Catatan tahap ini

- Supabase adalah source of truth untuk data undangan yang disimpan/published.
- `localStorage` masih digunakan untuk Preview, cache editor lokal, dan RSVP/ucapan sementara.
- Foto masih disimpan sebagai Data URL di `wedding_data`; Supabase Storage belum digunakan. Batas 1 MB per foto tetap berlaku, tetapi JSONB bukan solusi ideal untuk banyak foto berukuran besar.
