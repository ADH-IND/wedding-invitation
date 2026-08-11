window.MusicStorage = (() => {
  const BUCKET = "wedding-assets";
  const pathFor = (invitationId) =>
    `invitations/${invitationId}/music/background.mp3`;
  const client = () => window.getSupabaseClient?.();
  const ensureClient = () => {
    const supabase = client();
    if (!supabase) throw new Error("Supabase Storage belum dikonfigurasi.");
    return supabase;
  };
  const ensureUser = async () => {
    const { data, error } = await ensureClient().auth.getUser();
    if (error || !data.user)
      throw new Error("Sesi admin berakhir. Silakan masuk kembali.");
  };

  async function upload(file, invitationId) {
    await ensureUser();
    const storagePath = pathFor(invitationId);
    const { error } = await ensureClient()
      .storage.from(BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: "audio/mpeg",
        cacheControl: "3600",
      });
    if (error) throw new Error("Gagal mengupload musik. Silakan coba lagi.");
    const { data } = ensureClient().storage.from(BUCKET).getPublicUrl(storagePath);
    return {
      storage_path: storagePath,
      file_name: "background.mp3",
      updated_at: new Date().toISOString(),
      url: `${data.publicUrl}?v=${Date.now()}`,
    };
  }

  async function remove(storagePath) {
    if (!storagePath) return;
    await ensureUser();
    const { error } = await ensureClient().storage.from(BUCKET).remove([storagePath]);
    if (error) throw new Error("Gagal menghapus musik. Silakan coba lagi.");
  }

  return { bucket: BUCKET, pathFor, upload, remove };
})();
