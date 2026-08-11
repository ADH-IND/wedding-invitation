const AdminAuth = (() => {
  let user = null;
  const isLoginPage = () => location.pathname.endsWith("login.html");
  const afterDomReady = (callback) => {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
  };
  const setError = (text) => {
    const error = document.querySelector("#login-error");
    if (error) error.textContent = text;
  };
  const ready = (async () => {
    const supabase = window.getSupabaseClient?.();
    if (!supabase) {
      if (!isLoginPage()) location.replace("login.html");
      else
        afterDomReady(() =>
          setError("Supabase belum dikonfigurasi. Isi config/supabase.js terlebih dahulu."),
        );
      return null;
    }
    try {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user || null;
      if (!user && !isLoginPage()) location.replace("login.html");
      if (user && !isLoginPage())
        afterDomReady(() => {
          document.querySelector(".admin-shell").hidden = false;
        });
      return user;
    } catch {
      if (!isLoginPage()) location.replace("login.html");
      else afterDomReady(() => setError("Sesi tidak dapat diperiksa. Coba muat ulang halaman."));
      return null;
    }
  })();

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#login-form");
    if (!form) return;
    ready.then((sessionUser) => {
      if (sessionUser) location.replace("index.html");
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setError("");
      const supabase = window.getSupabaseClient?.();
      if (!supabase)
        return setError("Supabase belum dikonfigurasi. Isi config/supabase.js terlebih dahulu.");
      const values = Object.fromEntries(new FormData(form));
      const { error } = await supabase.auth.signInWithPassword({
        email: String(values.email || "").trim(),
        password: values.password,
      });
      if (error) return setError("Email atau password tidak valid.");
      location.replace("index.html");
    });
  });

  const logout = async () => {
    const supabase = window.getSupabaseClient?.();
    if (supabase) await supabase.auth.signOut();
    location.replace("login.html");
  };
  return { ready, logout, isLoggedIn: () => Boolean(user), getUser: () => user };
})();
