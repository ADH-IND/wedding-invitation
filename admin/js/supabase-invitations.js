window.InvitationRepository = (() => {
  const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || ""),
    );
  const client = () => window.getSupabaseClient?.();
  const ensureClient = () => {
    const value = client();
    if (!value)
      throw new Error(
        "Supabase belum dikonfigurasi. Isi Project URL dan Publishable Key terlebih dahulu.",
      );
    return value;
  };
  const ensureUser = async () => {
    const { data, error } = await ensureClient().auth.getUser();
    if (error || !data.user)
      throw new Error("Sesi admin berakhir. Silakan masuk kembali.");
    return data.user;
  };
  const normalizeRow = (row) => ({
    ...(row.wedding_data || {}),
    id: row.id,
    slug: row.slug,
    template_id: row.template_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });

  async function list() {
    const { data, error } = await ensureClient()
      .from("invitations")
      .select("id, slug, template_id, status, wedding_data, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeRow);
  }

  async function slugAvailable(slug, currentId) {
    const { data, error } = await ensureClient()
      .from("invitations")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    return !data?.length || data[0].id === currentId;
  }

  async function save(wedding, status) {
    const supabase = ensureClient();
    const user = await ensureUser();
    const id = isUuid(wedding.id) ? wedding.id : crypto.randomUUID();
    const weddingData = {
      ...structuredClone(wedding),
      id,
      slug: wedding.slug,
      template_id: wedding.template_id,
      status,
    };
    const payload = {
      id,
      owner_id: user.id,
      slug: wedding.slug,
      template_id: wedding.template_id,
      status,
      wedding_data: weddingData,
    };
    const query = isUuid(wedding.id)
      ? supabase.from("invitations").update(payload).eq("id", id)
      : supabase.from("invitations").insert(payload);
    const { data, error } = await query
      .select("id, slug, template_id, status, wedding_data, created_at, updated_at")
      .single();
    if (error) {
      if (error.code === "23505")
        throw new Error("Link undangan sudah digunakan. Silakan gunakan nama lain.");
      throw error;
    }
    return normalizeRow(data);
  }

  async function remove(id) {
    const { error } = await ensureClient().from("invitations").delete().eq("id", id);
    if (error) throw error;
  }

  return { list, slugAvailable, save, remove };
})();
