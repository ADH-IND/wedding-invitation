# Wedding Invitation — Web Admin V1.4

Web Admin Madiva Studio mengelola undangan berbasis template. Data undangan yang disimpan/published memakai Supabase Database dan Supabase Auth, sedangkan Preview, RSVP sementara, dan cache editor tetap memakai `localStorage`.

> Konfigurasi Supabase dan panduan publish tersedia di [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Struktur proyek

```text
wedding-invitation/
├── admin/
│   ├── login.html
│   ├── index.html
│   ├── css/
│   │   └── admin.css
│   └── js/
│       ├── auth.js
│       ├── utils.js
│       ├── storage.js
│       ├── templates.js
│       ├── config.js
│       ├── sections.js
│       └── admin.js
│
├── templates/
│   ├── templates.json
│   └── template-001/
│       ├── index.html
│       ├── style.css
│       ├── script.js
│       ├── data.js
│       ├── template.json
│       └── assets/
│
└── README.md
```

Jalankan melalui local server, lalu buka `admin/login.html`.

## Template registry dan manifest

`templates/templates.json` adalah registry global template. Setiap `templates/template-xxx/template.json` adalah manifest untuk template tersebut. Wedding hanya menyimpan `template_id`; Web Admin menggunakan `TemplateRegistry` untuk menemukan metadata, manifest, dan halaman preview.

`template.json.sections` menentukan editor yang tersedia. Template #1 memakai:

```json
["couple", "event", "digital_gift", "music", "rsvp"]
```

Renderer editor mendukung `couple`, `event`, `digital_gift`, dan `music`. `rsvp` adalah capability template, bukan editor data wedding.

Saat Template Selector berubah, Admin membaca sections baru, merender ulang editor tanpa reload, dan mempertahankan `workingWedding`. Data section yang tidak digunakan template baru tidak langsung dihapus; data dapat muncul kembali jika template sebelumnya dipilih lagi.

## Template #1 — Elegant Minimalist

Template #1 memiliki Couple, Event, Countdown, Digital Gift, Music, dan RSVP. Template ini tidak memiliki foto cover pada hero, Love Story, Gallery, atau Album. Foto pengantin pria dan wanita tetap ditampilkan pada section Mempelai.

Countdown mengikuti acara aktif dengan timezone Asia/Makassar (WITA): Akad saja menggunakan Akad, Resepsi saja menggunakan Resepsi, dan bila keduanya aktif pengguna dapat memilih target. Penyimpanan ditolak jika tidak ada acara aktif.

## RSVP dan personalisasi tamu

RSVP publik hanya mendukung Hadir dan Tidak Hadir. Hadir memakai `guest_count >= 1`; Tidak Hadir memakai `guest_count = 0`. Guestbook publik hanya menampilkan nama dan ucapan, sementara Admin dapat melihat nama, status, jumlah tamu, ucapan, dan waktu.

Template membaca query parameter `?to=`. Contoh: `index.html?to=Andi%20Saputra` akan menampilkan “Andi Saputra” pada bagian Kepada Yth.; tanpa parameter akan memakai “Tamu Undangan”.

## Link undangan dan preview

Wedding Draft belum memiliki link publik. Wedding berstatus Published menampilkan URL dari `SupabaseConfig.publicInvitationUrl(slug)`, misalnya `templates/template-001/?invite=adhiim-nabila`. Atur `PUBLIC_BASE_URL` di `config/supabase.js` untuk production.

**Preview** menyimpan wedding pada `wedding_admin_v1_preview` lalu membuka file template lokal. **Buka Undangan** mengambil data published dari Supabase menggunakan parameter `invite`. Keduanya berbeda.

Web Generator belum dibuat. Workflow berikutnya adalah Admin menyediakan Base Link aktif, lalu customer memasukkan Base Link dan nama tamu ke generator publik. Misalnya Base Link `https://domain.com/budi-ani` dan nama `Andi Saputra` nantinya menghasilkan `https://domain.com/budi-ani?to=Andi%20Saputra`; generator juga akan menangani Chat Template.

## Backup dan login

Export/Import adalah backup cache lokal. Login Admin memakai email/password Supabase Auth; lihat [SUPABASE_SETUP.md](SUPABASE_SETUP.md) untuk membuat akun admin pertama.

## Web Generator Link V1

Status: **Development**. Aplikasi publik stateless ini berada di `generator/`. Customer memasukkan Base Link, satu nama tamu, dan gaya pesan untuk menghasilkan Personal Link (`?to=`) beserta chat undangan. Share WhatsApp hanya membuka WhatsApp dengan pesan yang telah terisi; aplikasi tidak mengirim pesan secara otomatis.
