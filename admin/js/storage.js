const AdminStorage = (() => {
  const KEY = "wedding_admin_v1"; const empty = () => ({ version:1, weddings:[], guests:[], rsvps:[] });
  const load = () => { try { const data = JSON.parse(localStorage.getItem(KEY)); return data && data.version === 1 ? { ...empty(), ...data } : empty(); } catch { return empty(); } };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const update = (callback) => { const data = load(); callback(data); save(data); return data; };
  return { load, save, update, key:KEY };
})();
