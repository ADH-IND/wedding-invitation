/* global weddingData, rsvpData */
document.addEventListener("DOMContentLoaded", async () => {
  const $ = (selector) => document.querySelector(selector);
  const inviteSlug = new URLSearchParams(window.location.search)
    .get("invite")
    ?.trim();
  const previewWedding = (() => {
    try {
      return JSON.parse(localStorage.getItem("wedding_admin_v1_preview"));
    } catch {
      return null;
    }
  })();
  const loadedWedding = await loadWeddingData(inviteSlug, previewWedding);
  if (!loadedWedding) return;
  let data;
  try {
    data = adaptWeddingForTemplate(loadedWedding);
    $("#invitation-loading").hidden = true;
    $("main").hidden = false;
  } catch (error) {
    console.error("Template data adapter failed:", error);
    showLoadError("Data undangan tidak valid.");
    return;
  }
  const RSVP_STORAGE_KEY = data._wedding_id
    ? `wedding_rsvp_${data._wedding_id}`
    : "wedding_rsvp";
  let rsvpState = [];
  let backgroundMusic = null;
  const fallback = {
    opening:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
    closing:
      "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  };
  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value || "";
  };

  async function loadWeddingData(slug, preview) {
    if (!slug) return preview || weddingData;
    const client = window.getSupabaseClient?.();
    if (!client) {
      showLoadError("Undangan belum dapat dimuat karena konfigurasi belum tersedia.");
      return null;
    }
    try {
      const { data: rows, error } = await client
        .from("invitations")
        .select("wedding_data, template_id, status")
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1);
      if (error) throw error;
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) {
        showLoadError("Undangan tidak ditemukan.");
        return null;
      }
      const weddingData = row.wedding_data;
      if (!weddingData || typeof weddingData !== "object" || Array.isArray(weddingData)) {
        showLoadError("Data undangan tidak valid.");
        return null;
      }
      window.WEDDING_DATA = weddingData;
      return {
        ...weddingData,
        slug,
        template_id: row.template_id,
        status: row.status,
      };
    } catch (error) {
      showLoadError(
        "Undangan tidak dapat dimuat. Periksa koneksi internet dan coba lagi.",
      );
      return null;
    }
  }

  function showLoadError(text) {
    $("#invitation-loading").hidden = true;
    const error = $("#invitation-error");
    error.textContent = text;
    error.hidden = false;
  }

  // Adapter sementara: menjaga desain Template #1 tetap mandiri dari schema Admin V1.
  function adaptWeddingForTemplate(wedding) {
    const event = wedding.event || {};
    const target =
      event.countdown_target === "reception" ? event.reception : event.akad;
    const formatDate = (date) =>
      date
        ? new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeZone: "Asia/Makassar",
          }).format(new Date(`${date}T00:00:00+08:00`))
        : "";
    const formatTime = (item) =>
      [item?.start_time, item?.end_time].filter(Boolean).join(" - ");
    const mapEvent = (item) => ({
      enabled: Boolean(item?.enabled),
      date: formatDate(item?.date),
      time: formatTime(item),
      location: item?.location || "",
      address: item?.address || "",
      maps_url: item?.maps_url || "",
    });
    const customEvents = Array.isArray(event.custom_events)
      ? event.custom_events
      : [];
    return {
      _wedding_id: wedding.id,
      groom_name: wedding.couple?.groom?.name || "",
      bride_name: wedding.couple?.bride?.name || "",
      groom_full_name: wedding.couple?.groom?.full_name || "",
      bride_full_name: wedding.couple?.bride?.full_name || "",
      groom_photo: wedding.couple?.groom?.photo || "",
      bride_photo: wedding.couple?.bride?.photo || "",
      cover_photo: wedding.cover?.photo || "",
      couple_photo: wedding.couple?.couple_photo || "",
      groom_father: wedding.couple?.groom?.father || "",
      groom_mother: wedding.couple?.groom?.mother || "",
      groom_child_order:
        wedding.couple?.groom?.childOrder || wedding.couple?.groom?.child_order || "",
      bride_father: wedding.couple?.bride?.father || "",
      bride_mother: wedding.couple?.bride?.mother || "",
      bride_child_order:
        wedding.couple?.bride?.childOrder || wedding.couple?.bride?.child_order || "",
      wedding_date_display: formatDate(target?.date),
      countdown_target:
        target?.date && target?.start_time
          ? `${target.date}T${target.start_time}:00+08:00`
          : "",
      akad: mapEvent(event.akad),
      reception: mapEvent(event.reception),
      custom_events: customEvents.map((item) => ({
        ...mapEvent(item),
        title: item?.title || "",
        position: item?.position === "before" ? "before" : "after",
      })),
      bank_accounts: wedding.digital_gift?.enabled
        ? (wedding.digital_gift.accounts || []).map((account) => ({
            bank_name: account.bank,
            account_number: account.number,
            account_holder: account.holder,
          }))
        : [],
      opening_text: "",
      closing_text: "",
      music_url: wedding.music?.enabled ? wedding.music.url : "",
      music_autoplay: Boolean(wedding.music?.autoplay),
    };
  }

  function childOrderText(value) {
    const order = Number(value);
    const ordinals = {
      1: "pertama",
      2: "kedua",
      3: "ketiga",
      4: "keempat",
      5: "kelima",
      6: "keenam",
      7: "ketujuh",
      8: "kedelapan",
      9: "kesembilan",
      10: "kesepuluh",
    };
    return Number.isInteger(order) && order > 0
      ? ordinals[order] || `ke-${order}`
      : "";
  }

  function getGuestNameFromUrl() {
    const name = new URLSearchParams(window.location.search).get("to")?.trim();
    return name || "Tamu Undangan";
  }
  function renderWeddingData() {
    setText("#groom-name", data.groom_name);
    setText("#bride-name", data.bride_name);
    setText("#wedding-date-display", data.wedding_date_display);
    setText("#groom-full-name", data.groom_full_name);
    setText("#groom-father", data.groom_father);
    setText("#groom-mother", data.groom_mother);
    const groomOrder = childOrderText(data.groom_child_order);
    setText(
      "#groom-child-order-label",
      groomOrder ? `Putra ${groomOrder} dari:` : "Putra dari:",
    );
    setText("#bride-full-name", data.bride_full_name);
    setText("#bride-father", data.bride_father);
    setText("#bride-mother", data.bride_mother);
    const brideOrder = childOrderText(data.bride_child_order);
    setText(
      "#bride-child-order-label",
      brideOrder ? `Putri ${brideOrder} dari:` : "Putri dari:",
    );
    setText("#opening-text", data.opening_text || fallback.opening);
    setText("#closing-text", data.closing_text || fallback.closing);
    document.querySelectorAll("[data-couple-groom]").forEach((element) => {
      element.textContent = data.groom_name;
    });
    document.querySelectorAll("[data-couple-bride]").forEach((element) => {
      element.textContent = data.bride_name;
    });
    [
      ["#groom-photo", data.groom_photo],
      ["#bride-photo", data.bride_photo],
    ].forEach(([selector, source]) => {
      const image = $(selector);
      if (image) image.src = source;
    });
    document.title = `Undangan Pernikahan ${data.groom_name} & ${data.bride_name}`;
  }
  function renderGuest() {
    const guestName = getGuestNameFromUrl();
    setText("#guest-name", guestName);
    $("#rsvp-form").elements.name.value =
      guestName === "Tamu Undangan" ? "" : guestName;
  }
  function renderEvent(prefix, eventData) {
    $(`#${prefix}`).hidden = !eventData.enabled;
    if (!eventData.enabled) return;
    ["date", "time", "location", "address"].forEach((field) =>
      setText(`#${prefix}-${field}`, eventData[field]),
    );
    const map = $(`#${prefix}-maps`);
    if (eventData.maps_url) map.href = eventData.maps_url;
    else map.hidden = true;
  }
  function renderEvents() {
    renderEvent("akad", data.akad);
    renderEvent("reception", data.reception);
    const hasAkad = data.akad.enabled;
    const hasReception = data.reception.enabled;
    $("#events").hidden = !hasAkad && !hasReception;
    $("#main-events").hidden = !hasAkad && !hasReception;
    $("#event-divider").hidden = !hasAkad || !hasReception;
  }
  function createCustomEvent(eventData) {
    if (!eventData?.enabled || !eventData.title?.trim()) return null;
    const card = document.createElement("article");
    card.className = "event-card custom-event";
    const title = document.createElement("h2");
    title.textContent = eventData.title;
    const detail = document.createElement("div");
    detail.className = "event__detail";
    [eventData.date, eventData.time].filter(Boolean).forEach((value) => {
      const line = document.createElement("p");
      line.textContent = value;
      detail.append(line);
    });
    if (eventData.location) {
      const location = document.createElement("h3");
      location.textContent = eventData.location;
      detail.append(location);
    }
    if (eventData.address) {
      const address = document.createElement("p");
      address.textContent = eventData.address;
      detail.append(address);
    }
    if (eventData.maps_url) {
      const maps = document.createElement("a");
      maps.className = "button button--soft";
      maps.href = eventData.maps_url;
      maps.target = "_blank";
      maps.rel = "noopener";
      maps.textContent = "Lihat Lokasi";
      detail.append(maps);
    }
    card.append(title, detail);
    return card;
  }
  function renderCustomEvents() {
    const before = $("#template-custom-events-before");
    const after = $("#template-custom-events-after");
    before.replaceChildren();
    after.replaceChildren();
    const events = Array.isArray(data.custom_events) ? data.custom_events : [];
    events
      .filter((event) => event.position === "before")
      .forEach((event) => {
        const card = createCustomEvent(event);
        if (card) before.append(card);
      });
    events
      .filter((event) => event.position !== "before")
      .forEach((event) => {
        const card = createCustomEvent(event);
        if (card) after.append(card);
      });
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  function renderBankAccounts() {
    const accounts = Array.isArray(data.bank_accounts)
      ? data.bank_accounts
      : [];
    if (!accounts.length) return;
    $("#digital-gift").hidden = false;
    accounts.forEach((account) => {
      const card = document.createElement("article");
      card.className = "bank-card";
      const details = document.createElement("div");
      const bank = document.createElement("strong");
      const number = document.createElement("p");
      const holder = document.createElement("p");
      bank.textContent = account.bank_name;
      number.textContent = account.account_number;
      holder.textContent = `a.n. ${account.account_holder}`;
      details.append(bank, number, holder);
      const copyButton = document.createElement("button");
      copyButton.className = "button button--soft";
      copyButton.type = "button";
      copyButton.textContent = "Salin";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(account.account_number);
          showToast("Nomor rekening berhasil disalin.");
        } catch {
          showToast("Silakan salin nomor rekening secara manual.");
        }
      });
      card.append(details, copyButton);
      $("#bank-accounts").append(card);
    });
  }
  function renderCountdown() {
    const update = () => {
      let difference = Math.max(
        0,
        new Date(data.countdown_target).getTime() - Date.now(),
      );
      const complete = difference === 0;
      [
        ["days", 86400000],
        ["hours", 3600000],
        ["minutes", 60000],
        ["seconds", 1000],
      ].forEach(([unit, milliseconds]) => {
        const value = Math.floor(difference / milliseconds);
        difference %= milliseconds;
        setText(`#countdown-${unit}`, String(value).padStart(2, "0"));
      });
      $(".countdown__complete").hidden = !complete;
    };
    update();
    window.setInterval(update, 1000);
  }
  function loadRSVPData() {
    try {
      const stored = localStorage.getItem(RSVP_STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : rsvpData
            .filter((item) => item.wedding_id === data._wedding_id)
            .map((item) => ({ ...item }));
    } catch {
      return rsvpData
        .filter((item) => item.wedding_id === data._wedding_id)
        .map((item) => ({ ...item }));
    }
  }
  // localStorage hanya untuk prototype. Pada tahap Web Admin/backend, ini diganti API/database.
  function saveRSVPData() {
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(rsvpState));
    // Adapter V1: Admin dapat membaca RSVP dengan schema terisolasi per wedding.
    if (!data._wedding_id) return;
    try {
      const key = "wedding_admin_v1";
      const admin = JSON.parse(localStorage.getItem(key)) || {
        version: 1,
        weddings: [],
        guests: [],
        rsvps: [],
      };
      admin.rsvps = admin.rsvps || [];
      rsvpState.forEach((item) => {
        if (!admin.rsvps.some((saved) => saved.id === item.id))
          admin.rsvps.push(item);
      });
      localStorage.setItem(key, JSON.stringify(admin));
    } catch {
      /* RSVP publik tetap aman di storage per wedding. */
    }
  }
  function renderMessageCount(messages) {
    setText("#message-count", `${messages.length} Ucapan`);
  }
  function renderPublicMessages() {
    const list = $("#message-list");
    list.replaceChildren();
    const messages = rsvpState
      .filter((item) => item.message && item.message.trim())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderMessageCount(messages);
    $("#message-empty").hidden = messages.length > 0;
    messages.forEach((item) => {
      const card = document.createElement("article");
      card.className = "rsvp__message";
      const name = document.createElement("h3");
      const message = document.createElement("p");
      name.className = "rsvp__message-name";
      message.className = "rsvp__message-text";
      name.textContent = item.guest_name;
      message.textContent = item.message;
      card.append(name, message);
      list.append(card);
    });
  }
  function validateRSVP(values) {
    if (!values.guest_name.trim()) return "Nama wajib diisi.";
    if (!values.attendance) return "Pilih konfirmasi kehadiran.";
    if (
      values.attendance === "hadir" &&
      (!Number.isInteger(values.guest_count) || values.guest_count < 1)
    )
      return "Jumlah tamu minimal 1 untuk konfirmasi hadir.";
    if (!values.message.trim()) return "Ucapan dan doa wajib diisi.";
    if (values.message.length > 500) return "Ucapan maksimal 500 karakter.";
    return "";
  }
  function submitRSVP(form) {
    const values = {
      guest_name: form.elements.name.value.trim(),
      attendance: form.elements.attendance.value,
      guest_count: Number(form.elements.guest_count.value),
      message: form.elements.message.value.trim(),
    };
    const error = validateRSVP(values);
    setText("#rsvp-error", error);
    setText("#rsvp-success", "");
    if (error) return false;
    const entry = {
      id: `rsvp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      wedding_id: data._wedding_id,
      ...values,
      guest_count: values.attendance === "hadir" ? values.guest_count : 0,
      created_at: new Date().toISOString(),
    };
    rsvpState.push(entry);
    saveRSVPData();
    renderPublicMessages();
    setText(
      "#rsvp-success",
      "Terima kasih ❤️ Konfirmasi kehadiran dan ucapan kamu telah berhasil dikirim.",
    );
    form.reset();
    const guestName = getGuestNameFromUrl();
    form.elements.name.value = guestName === "Tamu Undangan" ? "" : guestName;
    return true;
  }
  function initRSVP() {
    const form = $("#rsvp-form");
    const attendance = form.elements.attendance;
    const guestCountField = $("#guest-count-field");
    const guestCount = form.elements.guest_count;
    const toggleGuestCount = () => {
      const isPresent = attendance.value === "hadir";
      guestCountField.hidden = !isPresent;
      guestCount.disabled = !isPresent;
      if (!isPresent) guestCount.value = 0;
      else if (Number(guestCount.value) < 1) guestCount.value = 1;
    };
    attendance.addEventListener("change", toggleGuestCount);
    toggleGuestCount();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      submitRSVP(form);
      window.setTimeout(() => {
        button.disabled = false;
      }, 250);
    });
  }
  function initMusic() {
    if (!data.music_url) return;
    const music = $("#background-music");
    backgroundMusic = music;
    const control = $("#music-control");
    music.src = data.music_url;
    music.loop = true;
    control.hidden = false;
    control.addEventListener("click", () => {
      if (music.paused)
        music.play().catch(() => showToast("Musik tidak dapat diputar."));
      else music.pause();
    });
    music.addEventListener("play", () => {
      control.classList.add("is-playing");
      control.setAttribute("aria-label", "Jeda musik");
    });
    music.addEventListener("pause", () => {
      control.classList.remove("is-playing");
      control.setAttribute("aria-label", "Putar musik");
    });
  }
  function initInvitation() {
    $("#open-invitation").addEventListener("click", () => {
      const audio = backgroundMusic;
      if (data.music_autoplay && data.music_url && audio) {
        console.log("OPEN CLICK", {
          enabled: Boolean(data.music_url),
          autoplay: data.music_autoplay,
          url: data.music_url,
          pausedBefore: audio.paused,
        });
        audio
          .play()
          .then(() => console.log("PLAY SUCCESS", audio.paused))
          .catch((error) => console.error("PLAY FAILED", error));
        window.setTimeout(() => {
          console.log("500ms after open", {
            paused: audio.paused,
            currentTime: audio.currentTime,
          });
        }, 500);
      }
      $("#invitation-content").hidden = false;
      $("#opening").scrollIntoView({ behavior: "smooth" });
    });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element));
  }
  try {
    renderWeddingData();
    renderGuest();
    renderEvents();
    renderCustomEvents();
    renderBankAccounts();
    renderCountdown();
    rsvpState = loadRSVPData();
    renderPublicMessages();
    initRSVP();
    initMusic();
    initInvitation();
  } catch (error) {
    console.error("Template render failed:", error);
    $("main").hidden = true;
    showLoadError("Undangan gagal dimuat. Silakan coba lagi.");
  }
});
