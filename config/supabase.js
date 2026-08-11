/*
 * Konfigurasi browser-safe untuk Supabase.
 * Jangan pernah memasukkan service_role, sb_secret_, atau SUPABASE_SECRET_KEY di file frontend.
 */
const SUPABASE_URL = "https://lstkebidnurxsfrbkpww.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rn6gZMMUUUhC9G-eVD54HQ_OkjQZ2xV";

/* Kosongkan untuk memakai path template saat ini; isi saat memakai domain produksi. */
const PUBLIC_BASE_URL = "";

window.SupabaseConfig = {
  url: SUPABASE_URL,
  
  publishableKey: SUPABASE_PUBLISHABLE_KEY,
  publicBaseUrl: PUBLIC_BASE_URL,
  isConfigured() {
    return (
      this.url &&
      this.publishableKey &&
      !this.url.includes("YOUR_") &&
      !this.publishableKey.includes("YOUR_")
    );
  },
  publicInvitationUrl(slug) {
    const configuredBase = this.publicBaseUrl.trim();
    const base = configuredBase
      ? new URL(configuredBase, window.location.href)
      : new URL("../templates/template-001/", window.location.href);
    base.searchParams.set("invite", slug);
    return base.toString();
  },
};

window.getSupabaseClient = (() => {
  let client;
  return () => {
    if (!window.SupabaseConfig?.isConfigured() || !window.supabase) return null;
    if (!client)
      client = window.supabase.createClient(
        window.SupabaseConfig.url,
        window.SupabaseConfig.publishableKey,
      );
    return client;
  };
})();
