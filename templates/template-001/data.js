/* Sample Wedding Data mengikuti schema Admin V1 / Template #1. */
const weddingData = {
  id: "WDG-001", slug: "budi-ani", template_id: "template-001", status: "draft",
  cover: { photo: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80" },
  couple: {
    couple_photo: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80",
    groom: { name: "Budi", full_name: "Budi Pratama", photo: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80", childOrder: "1", father: "Bapak Ahmad", mother: "Ibu Siti" },
    bride: { name: "Ani", full_name: "Ani Lestari", photo: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80", childOrder: "2", father: "Bapak Agus", mother: "Ibu Nur" }
  },
  event: {
    akad: { enabled: true, date: "2026-12-20", start_time: "08:00", end_time: "10:00", location: "Masjid Al-Ikhlas", address: "Jl. Kebahagiaan No. 10, Makassar", maps_url: "https://maps.google.com/?q=Masjid+Al-Ikhlas" },
    reception: { enabled: true, date: "2026-12-20", start_time: "11:00", end_time: "15:00", location: "Gedung Harmoni", address: "Jl. Cinta No. 20, Makassar", maps_url: "https://maps.google.com/?q=Gedung+Harmoni" },
    countdown_target: "akad", custom_events: []
  },
  digital_gift: { enabled: true, accounts: [{ bank: "BCA", number: "1234567890", holder: "Budi Pratama" }] },
  music: { enabled: false, url: "", autoplay: false },
  created_at: "2026-08-01T10:00:00+08:00", updated_at: "2026-08-01T10:00:00+08:00"
};

const rsvpData = [
  { id: "RSVP-001", wedding_id: "WDG-001", guest_id: "GST-001", guest_name: "Andi Saputra", attendance: "hadir", guest_count: 2, message: "Selamat menempuh hidup baru!", created_at: "2026-08-01T10:00:00+08:00" }
];
