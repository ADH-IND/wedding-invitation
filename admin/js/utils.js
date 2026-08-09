const AdminUtils = (() => {
  const slugify = (text) => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const id = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const date = (value) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)) : "-";
  const escape = (value) => String(value || "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  return { slugify, id, date, escape };
})();
