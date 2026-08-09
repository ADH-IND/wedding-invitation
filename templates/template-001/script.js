/* global weddingData, rsvpData */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const previewWedding = (() => {
    try {
      return JSON.parse(localStorage.getItem("wedding_admin_v1_preview"));
    } catch {
      return null;
    }
  })();
  const data = adaptWeddingForTemplate(previewWedding || weddingData);
  const RSVP_STORAGE_KEY = data._wedding_id
    ? `wedding_rsvp_${data._wedding_id}`
    : "wedding_rsvp";
  let rsvpState = [];
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
      bride_father: wedding.couple?.bride?.father || "",
      bride_mother: wedding.couple?.bride?.mother || "",
      wedding_date_display: formatDate(target?.date),
      countdown_target:
        target?.date && target?.start_time
          ? `${target.date}T${target.start_time}:00+08:00`
          : "",
      akad: mapEvent(event.akad),
      reception: mapEvent(event.reception),
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
    setText("#bride-full-name", data.bride_full_name);
    setText("#bride-father", data.bride_father);
    setText("#bride-mother", data.bride_mother);
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
    const control = $("#music-control");
    music.src = data.music_url;
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
    if (data.music_autoplay) music.play().catch(() => {});
  }
  function initInvitation() {
    $("#open-invitation").addEventListener("click", () => {
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
  renderWeddingData();
  renderGuest();
  renderEvents();
  renderBankAccounts();
  renderCountdown();
  rsvpState = loadRSVPData();
  renderPublicMessages();
  initRSVP();
  initMusic();
  initInvitation();
});
