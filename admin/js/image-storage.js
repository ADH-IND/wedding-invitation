window.ImageStorage = (() => {
  const BUCKET = "wedding-assets";
  const FIXED_NAMES = {
    cover: "cover.jpg",
    groom: "groom.jpg",
    bride: "bride.jpg",
    couple: "couple.jpg",
  };
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
  const publicUrl = (path, version = Date.now()) => {
    const { data } = ensureClient().storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${version}`;
  };
  const pathFor = (invitationId, key) =>
    `invitations/${invitationId}/images/${FIXED_NAMES[key]}`;
  const galleryPathFor = (invitationId) =>
    `invitations/${invitationId}/images/gallery/${crypto.randomUUID()}.jpg`;

  async function upload(file, invitationId, key) {
    await ensureUser();
    const path = pathFor(invitationId, key);
    const { error } = await ensureClient().storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
    if (error) {
      console.error("Image upload failed:", error);
      throw new Error("Gagal mengupload foto. Silakan coba lagi.");
    }
    return { path, url: publicUrl(path) };
  }
  async function uploadGallery(file, invitationId) {
    await ensureUser();
    const path = galleryPathFor(invitationId);
    const { error } = await ensureClient().storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });
    if (error) {
      console.error("Gallery upload failed:", error);
      throw new Error("Gagal mengupload galeri. Silakan coba lagi.");
    }
    return { path, url: publicUrl(path) };
  }
  async function remove(paths) {
    const validPaths = (paths || []).filter(Boolean);
    if (!validPaths.length) return;
    await ensureUser();
    const { error } = await ensureClient().storage.from(BUCKET).remove(validPaths);
    if (error) {
      console.error("Image delete failed:", error);
      throw new Error("Gagal menghapus foto. Silakan coba lagi.");
    }
  }
  const pathFromPublicUrl = (url) => {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = String(url || "").indexOf(marker);
    return index >= 0 ? String(url).slice(index + marker.length).split("?")[0] : "";
  };
  return { BUCKET, pathFor, upload, uploadGallery, remove, pathFromPublicUrl };
})();
