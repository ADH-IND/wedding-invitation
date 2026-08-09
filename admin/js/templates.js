const TemplateRegistry = (() => {
  let templates = [];
  async function load() {
    if (templates.length) return templates;
    let registry;
    try { const response = await fetch("../templates/templates.json"); if (!response.ok) throw new Error(); registry = await response.json(); } catch { throw new Error("Registry template tidak dapat dibaca. Jalankan aplikasi melalui local server."); }
    if (!Array.isArray(registry.templates)) throw new Error("Format registry template tidak valid.");
    templates = await Promise.all(registry.templates.map(async (entry) => {
      try { const response = await fetch(`../${entry.manifest}`); if (!response.ok) throw new Error(); const manifest = await response.json(); if (manifest.id !== entry.id) throw new Error(); return { ...entry, ...manifest, manifestError: false }; }
      catch { return { ...entry, sections: [], manifestError: true }; }
    }));
    return templates;
  }
  const getTemplates = () => templates;
  const getTemplateById = (id) => templates.find((template) => template.id === id);
  const getTemplateSections = (id) => getTemplateById(id)?.sections || [];
  const getActiveTemplates = () => templates.filter((template) => template.active && !template.manifestError);
  return { load, getTemplates, getTemplateById, getTemplateSections, getActiveTemplates };
})();
