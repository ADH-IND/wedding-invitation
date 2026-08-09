document.addEventListener("DOMContentLoaded", async () => {
  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const query = new URLSearchParams(location.search);
  const page = query.get("page") || "dashboard";
  const navPage = page === "edit" ? "orders" : page;
  document.querySelector(`[data-nav="${navPage}"]`)?.classList.add("active");
  const message = (text) => { $("#app-message").textContent = text; };
  const data = () => AdminStorage.load();
  const escape = AdminUtils.escape;
  const coupleName = (wedding) => `${wedding.couple.groom.name || "-"} & ${wedding.couple.bride.name || "-"}`;
  const pageSubtitles = {
    dashboard: "Ringkasan aktivitas undangan digital Anda.",
    orders: "Kelola seluruh pesanan undangan dari satu tempat.",
    templates: "Template undangan yang tersedia pada sistem.",
    edit: "Kelola informasi dan konfigurasi undangan."
  };
  $("#page-subtitle").textContent = pageSubtitles[page] || "";

  function formatDateTime(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Makassar"
    }).format(date);
  }

  function statusBadge(status) {
    return status === "active"
      ? '<span class="status active">Aktif</span>'
      : '<span class="status">Draft</span>';
  }

  function sectionLabel(section) {
    const labels = {
      couple: "Couple", event: "Event", digital_gift: "Digital Gift", music: "Music", rsvp: "RSVP",
      love_story: "Love Story"
    };
    return labels[section] || String(section || "-")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const toast = (text, type = "success") => {
    let element = $("#admin-toast");
    if (!element) {
      element = document.createElement("div");
      element.id = "admin-toast";
      document.body.append(element);
    }
    element.textContent = text;
    element.className = `admin-toast ${type} visible`;
    setTimeout(() => element.classList.remove("visible"), 2500);
  };
  window.AdminUI = { showToast: toast };

  try {
    await TemplateRegistry.load();
  } catch (error) {
    message(error.message);
    return;
  }

  $("#logout-button").onclick = AdminAuth.logout;
  $("#mobile-menu").onclick = () => {
    const sidebar = $(".sidebar");
    const isOpen = sidebar.classList.toggle("is-open");
    $("#mobile-menu").setAttribute("aria-expanded", String(isOpen));
  };
  $("#export-data").onclick = exportData;
  $("#import-data").onchange = importData;

  const rows = (items, { emptyMessage = "Belum ada pesanan.", allowDelete = true } = {}) => !items.length
    ? `<p class="empty">${escape(emptyMessage)}</p>`
    : `<div class="table-wrap"><table><thead><tr><th>Pasangan</th><th>Template</th><th>Status</th><th>Updated</th><th>Aksi</th></tr></thead><tbody>${items.map((wedding) => `<tr>
      <td>${escape(coupleName(wedding))}</td>
      <td>${escape(TemplateRegistry.getTemplateById(wedding.template_id)?.name || wedding.template_id)}</td>
      <td>${statusBadge(wedding.status)}</td>
      <td>${formatDateTime(wedding.updated_at)}</td>
      <td class="order-actions"><a href="index.html?page=edit&id=${wedding.id}">Edit</a> <button type="button" class="preview" data-id="${wedding.id}">Preview</button>${allowDelete ? ` <button type="button" class="delete" data-id="${wedding.id}">Hapus</button>` : ""}</td>
    </tr>`).join("")}</tbody></table></div>`;

  const bindOrderActions = () => {
    document.querySelectorAll(".preview").forEach((button) => {
      button.onclick = () => preview(button.dataset.id);
    });
    document.querySelectorAll(".delete").forEach((button) => {
      button.onclick = () => remove(button.dataset.id);
    });
  };

  function dashboard() {
    const weddings = data().weddings;
    const latest = [...weddings]
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 5);
    $("#page-title").textContent = "Dashboard";
    app.innerHTML = `<section class="stats" aria-label="Statistik pesanan">
      <article class="card stat stat--total"><span class="stat-icon" aria-hidden="true">▦</span><span class="stat-label">Total Pesanan</span><strong>${weddings.length}</strong><span class="stat-note">Semua pesanan</span></article>
      <article class="card stat stat--active"><span class="stat-icon" aria-hidden="true">✓</span><span class="stat-label">Aktif</span><strong>${weddings.filter((wedding) => wedding.status === "active").length}</strong><span class="stat-note">Undangan aktif</span></article>
      <article class="card stat stat--draft"><span class="stat-icon" aria-hidden="true">◌</span><span class="stat-label">Draft</span><strong>${weddings.filter((wedding) => wedding.status === "draft").length}</strong><span class="stat-note">Belum dipublikasikan</span></article>
    </section>
    <section class="card dashboard-orders"><div class="list-title"><div><h2>Pesanan Terbaru</h2><p>Pesanan yang terakhir diperbarui.</p></div><div class="list-actions"><a class="text-link" href="index.html?page=orders">Lihat semua</a><a class="admin-button" href="index.html?page=edit">+ Pesanan Baru</a></div></div>${rows(latest, { allowDelete: false })}</section>`;
    bindOrderActions();
  }

  function orders() {
    const weddings = data().weddings;
    $("#page-title").textContent = "Pesanan";
    app.innerHTML = `<section class="card"><div class="list-title"><h2>Daftar Pesanan</h2><a class="admin-button" href="index.html?page=edit">+ Pesanan Baru</a></div>
      <div class="orders-toolbar"><label for="order-search">Cari nama pengantin<input id="order-search" type="search" placeholder="Cari nama pengantin..." aria-label="Cari nama pengantin" /></label>
      <label for="order-status-filter">Filter status pesanan<select id="order-status-filter" aria-label="Filter status pesanan"><option value="">Semua Status</option><option value="draft">Draft</option><option value="active">Aktif</option></select></label></div>
      <div id="order-list"></div></section>`;
    const searchInput = $("#order-search");
    const statusFilter = $("#order-status-filter");
    const renderOrderList = () => {
      const search = searchInput.value.trim().toLowerCase();
      const status = statusFilter.value;
      const filtered = weddings.filter((wedding) => {
        const groom = wedding.couple.groom || {};
        const bride = wedding.couple.bride || {};
        const searchable = [groom.name, groom.full_name, bride.name, bride.full_name, wedding.slug]
          .filter(Boolean).join(" ").toLowerCase();
        return (!search || searchable.includes(search)) && (!status || wedding.status === status);
      }).sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      $("#order-list").innerHTML = rows(filtered, {
        emptyMessage: weddings.length ? "Tidak ada pesanan yang sesuai." : "Belum ada pesanan."
      });
      bindOrderActions();
    };
    searchInput.addEventListener("input", renderOrderList);
    statusFilter.addEventListener("change", renderOrderList);
    renderOrderList();
  }

  function templates() {
    $("#page-title").textContent = "Template";
    app.innerHTML = `<div class="template-grid">${TemplateRegistry.getTemplates().map((template) => {
      const manifestError = template.manifestError === true;
      const status = manifestError ? "Manifest Error" : template.active ? "Aktif" : "Nonaktif";
      const statusClass = manifestError ? "error" : template.active ? "active" : "";
      const sections = Array.isArray(template.sections) ? template.sections : [];
      return `<section class="card template-card"><div class="template-card__visual" aria-hidden="true"></div><div class="template-card__header"><h2>${escape(template.name || template.id || "Template")}</h2><span class="status ${statusClass}">${status}</span></div>
        <dl class="template-meta"><div><dt>ID</dt><dd>${escape(template.id || "-")}</dd></div><div><dt>Versi</dt><dd>${escape(template.version || "-")}</dd></div></dl>
        ${manifestError ? `<p class="form-error">Manifest template tidak dapat dimuat.</p><p class="template-path">Manifest: ${escape(template.manifest || template.path || "-")}</p>` : `<p>${escape(template.description || "Tidak ada deskripsi.")}</p>`}
        <p class="template-section-title">Sections</p><div class="template-sections">${sections.length ? sections.map((section) => `<span class="section-badge">${escape(sectionLabel(section))}</span>`).join("") : '<span class="section-badge">Tidak tersedia</span>'}</div>
      </section>`;
    }).join("")}</div>`;
  }

  function blank() {
    const template = TemplateRegistry.getActiveTemplates()[0];
    const now = new Date().toISOString();
    return {
      id: AdminUtils.id("WDG"), slug: "", template_id: template.id, status: "draft",
      cover: { photo: "" },
      couple: { couple_photo: "", groom: { name: "", full_name: "", photo: "", father: "", mother: "" }, bride: { name: "", full_name: "", photo: "", father: "", mother: "" } },
      event: {
        akad: { enabled: true, date: "", start_time: "", end_time: "", location: "", address: "", maps_url: "" },
        reception: { enabled: true, date: "", start_time: "", end_time: "", location: "", address: "", maps_url: "" },
        countdown_target: "akad"
      },
      digital_gift: { enabled: false, accounts: [] },
      music: { enabled: false, url: "", autoplay: false },
      created_at: now, updated_at: now
    };
  }

  function editor() {
    const old = data().weddings.find((wedding) => wedding.id === query.get("id"));
    let workingWedding = structuredClone(old || blank());
    const template = TemplateRegistry.getTemplateById(workingWedding.template_id);

    $("#page-title").textContent = old ? "Edit Pesanan" : "Pesanan Baru";
    if (!template) {
      app.innerHTML = '<p class="form-error">Template untuk wedding ini tidak ditemukan.</p>';
      return;
    }

    const choices = (old
      ? TemplateRegistry.getTemplates().filter((item) => item.id === workingWedding.template_id || (item.active && !item.manifestError))
      : TemplateRegistry.getActiveTemplates())
      .map((item) => `<option value="${item.id}" ${item.id === workingWedding.template_id ? "selected" : ""}>${escape(item.name)}</option>`)
      .join("");

    app.innerHTML = `<form id="order-form">
      <section class="form-section"><h2>Template</h2><select name="template_id">${choices}</select><p id="section-list"></p></section>
      <div id="section-editors"></div>
      <p id="order-error" class="form-error"></p>
      ${old ? '<button id="preview-current" type="button">Preview</button>' : ""}
      <button name="action" value="draft">Simpan Draft</button>
      <button name="action" value="active">Simpan & Aktifkan</button>
    </form><section id="order-details"><div id="rsvp-details"></div><div id="link-details"></div></section>`;

    const form = $("#order-form");
    const container = $("#section-editors");
    const renderSections = () => {
      const sections = TemplateRegistry.getTemplateSections(workingWedding.template_id);
      $("#section-list").innerHTML = `<span class="section-list__label">Sections</span><span class="section-list__badges">${sections.map((section) => `<span class="section-badge">${escape(sectionLabel(section))}</span>`).join("")}</span>`;
      container.innerHTML = AdminSections.render(sections, workingWedding);
      AdminSections.bind(container, sections, workingWedding);
    };

    renderSections();
    $("#preview-current")?.addEventListener("click", () => preview(old.id));
    const renderOrderDetails = () => {
      $("#rsvp-details").innerHTML = "";
      $("#link-details").innerHTML = "";
      if (!old) return;
      const sections = TemplateRegistry.getTemplateSections(workingWedding.template_id);
      if (sections.includes("rsvp")) rsvp(old);
      link(old);
    };
    renderOrderDetails();

    form.elements.template_id.onchange = () => {
      const currentSections = TemplateRegistry.getTemplateSections(workingWedding.template_id);
      workingWedding = AdminSections.read(form, currentSections, workingWedding);
      workingWedding.template_id = form.elements.template_id.value;
      renderSections();
      renderOrderDetails();
    };

    form.onsubmit = (event) => {
      event.preventDefault();
      const sections = TemplateRegistry.getTemplateSections(workingWedding.template_id);
      const error = AdminSections.validate(form, sections);
      $("#order-error").textContent = error;
      if (error) return;

      const wedding = AdminSections.read(form, sections, workingWedding);
      wedding.template_id = workingWedding.template_id;
      wedding.status = event.submitter?.value || "draft";
      wedding.updated_at = new Date().toISOString();
      wedding.slug = sections.includes("couple")
        ? slug(`${wedding.couple.groom.name}-${wedding.couple.bride.name}`, wedding.id)
        : (wedding.slug || `wedding-${wedding.id}`);

      AdminStorage.update((store) => {
        if (old) store.weddings = store.weddings.map((item) => item.id === wedding.id ? wedding : item);
        else store.weddings.push(wedding);
      });
      location.assign(`index.html?page=edit&id=${wedding.id}`);
    };
  }

  function slug(text, id) {
    const base = AdminUtils.slugify(text) || "wedding";
    const used = data().weddings.filter((wedding) => wedding.id !== id).map((wedding) => wedding.slug);
    let result = base;
    let number = 2;
    while (used.includes(result)) result = `${base}-${number++}`;
    return result;
  }

  function rsvp(wedding) {
    const items = data().rsvps.filter((item) => item.wedding_id === wedding.id);
    const hadir = items.filter((item) => item.attendance === "hadir");
    const tidakHadir = items.filter((item) => item.attendance === "tidak_hadir");
    const totalTamu = hadir.reduce((total, item) => total + Number(item.guest_count || 0), 0);
    const sortedItems = [...items].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const status = (attendance) => attendance === "hadir"
      ? '<span class="status active">Hadir</span>'
      : attendance === "tidak_hadir"
        ? '<span class="status">Tidak Hadir</span>'
        : '<span class="status">Data Lama</span>';
    const table = sortedItems.length
      ? `<div class="table-wrap rsvp-table"><table><thead><tr><th>Nama</th><th>Status</th><th>Jumlah Tamu</th><th>Ucapan</th><th>Waktu</th></tr></thead><tbody>${sortedItems.map((item) => `<tr>
        <td>${escape(item.guest_name || "-")}</td><td>${status(item.attendance)}</td>
        <td>${item.attendance === "hadir" ? Number(item.guest_count || 0) : "-"}</td>
        <td>${escape(item.message || "-")}</td><td>${formatDateTime(item.created_at)}</td>
      </tr>`).join("")}</tbody></table></div>`
      : '<p class="empty">Belum ada RSVP.</p>';
    $("#rsvp-details").innerHTML = `<section class="card"><h2>RSVP</h2><div class="rsvp-stats">
      <article class="stat"><strong>${items.length}</strong><span>Total RSVP</span></article>
      <article class="stat"><strong>${hadir.length}</strong><span>Hadir</span></article>
      <article class="stat"><strong>${tidakHadir.length}</strong><span>Tidak Hadir</span></article>
      <article class="stat"><strong>${totalTamu}</strong><span>Total Tamu Hadir</span></article>
    </div>${table}</section>`;
  }

  function link(wedding) {
    const container = $("#link-details");
    if (wedding.status !== "active") {
      container.innerHTML = '<section class="card invitation-link-card"><h2>Undangan</h2><p>Status: <span class="status">Draft</span></p><p>Undangan belum aktif.</p></section>';
    } else {
      const url = `${AdminConfig.publicInvitationBaseUrl.replace(/\/$/, "")}/${wedding.slug}`;
      container.innerHTML = `<section class="card invitation-link-card"><h2>Link Undangan Aktif</h2><p class="base-link">${escape(url)}</p><div class="link-actions"><button type="button" class="button-secondary copy-invitation-link">Salin Link</button><button type="button" class="admin-button open-invitation-link">Buka Undangan</button></div><p class="link-note">Gunakan link ini pada Web Generator untuk membuat undangan personal bagi setiap tamu.</p></section>`;
      container.querySelector(".copy-invitation-link").onclick = async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast("Link undangan berhasil disalin.");
        } catch {
          toast("Gagal menyalin link. Silakan coba lagi.", "error");
        }
      };
      container.querySelector(".open-invitation-link").onclick = () => window.open(url, "_blank", "noopener");
    }
  }

  function preview(id) {
    const wedding = data().weddings.find((item) => item.id === id);
    const template = wedding && TemplateRegistry.getTemplateById(wedding.template_id);
    if (!template) {
      message("Template tidak ditemukan.");
      return;
    }
    localStorage.setItem("wedding_admin_v1_preview", JSON.stringify(wedding));
    window.open(`../${template.preview}`, "_blank");
  }

  function remove(id) {
    if (!confirm("Hapus pesanan beserta RSVP-nya?")) return;
    AdminStorage.update((store) => {
      store.weddings = store.weddings.filter((wedding) => wedding.id !== id);
      store.rsvps = store.rsvps.filter((item) => item.wedding_id !== id);
    });
    location.assign("index.html?page=orders");
  }

  function exportData() {
    const anchor = document.createElement("a");
    const blob = new Blob([JSON.stringify(AdminStorage.load(), null, 2)], { type: "application/json" });
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "wedding-admin-v1-backup.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file || !confirm("Import backup akan mengganti data saat ini. Lanjutkan?")) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (backup.version !== 1 || !Array.isArray(backup.weddings) || !Array.isArray(backup.rsvps)) throw new Error("invalid backup");
        backup.guests = backup.guests || [];
        AdminStorage.save(backup);
        location.reload();
      } catch {
        message("File backup tidak valid; data tidak diubah.");
      }
    };
    reader.readAsText(file);
  }

  if (page === "orders") orders();
  else if (page === "templates") templates();
  else if (page === "edit") editor();
  else dashboard();
});
