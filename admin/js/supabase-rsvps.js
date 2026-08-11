window.RsvpRepository = (() => {
  const ensureClient = () => {
    const client = window.getSupabaseClient?.();
    if (!client)
      throw new Error(
        "Supabase belum dikonfigurasi. Isi Project URL dan Publishable Key terlebih dahulu.",
      );
    return client;
  };

  async function list() {
    const { data, error } = await ensureClient()
      .from("rsvps")
      .select(
        "id, wedding_id, guest_name, attendance, guest_count, message, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return { list };
})();
