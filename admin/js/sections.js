window.AdminSections = (() => {
  const trim = (value) => String(value || "").trim();
  const field = (label, name, value = "", type = "text") =>
    `<label>${label}<input type="${type}" name="${name}" value="${String(value || "").replace(/"/g, "&quot;")}"></label>`;
  const childOrderField = (name, value = "") =>
    `<label>Anak ke<input type="number" name="${name}" min="1" step="1" value="${String(value || "").replace(/"/g, "&quot;")}"></label>`;
  const photo = (label, name, value) =>
    `<div class="photo-field"><span class="photo-field__label">${label}</span><input type="hidden" name="${name}" value="${String(value || "").replace(/"/g, "&quot;")}"><div class="photo-preview-stage" data-has-photo="${value ? "true" : "false"}"><img class="image-preview" ${value ? `src="${value}"` : "hidden"}><div class="image-preview-empty" aria-hidden="true"><span>▧</span><small>Belum ada foto</small></div></div><div class="photo-actions"><label class="photo-select-button"><span class="photo-select-label">${value ? "Ganti Foto" : "Pilih Foto"}</span><input class="photo-upload" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" class="clear-photo" ${value ? "" : "hidden"}>Hapus Foto</button></div><span class="photo-field__note">JPEG, PNG, atau WEBP · Maks. 1 MB</span></div>`;
  const eventCopyFields = [
    "date",
    "start_time",
    "end_time",
    "location",
    "address",
    "maps_url",
  ];
  const sameEventDetails = (akad, reception) =>
    akad.enabled &&
    reception.enabled &&
    eventCopyFields.every((key) => akad[key] === reception[key]);
  const eventFields = (key, title, value, receptionMatchesAkad = false) =>
    `<section class="form-section ${key === "reception" ? "event-reception" : ""}"><h2>${title}</h2><label><input type="checkbox" name="${key}_enabled" ${value.enabled ? "checked" : ""}>Aktifkan ${title}</label>${key === "reception" ? `<label class="check same-as-akad"><input type="checkbox" name="reception_same_as_akad" ${receptionMatchesAkad ? "checked" : ""}> Sama dengan Akad</label><p class="same-as-akad-note">Salin dan ikuti data Akad untuk Resepsi.</p>` : ""}${field("Tanggal", `${key}_date`, value.date, "date")}${field("Waktu mulai", `${key}_start_time`, value.start_time, "time")}${field("Waktu selesai", `${key}_end_time`, value.end_time, "time")}${field("Lokasi", `${key}_location`, value.location)}${field("Alamat", `${key}_address`, value.address)}${field("Maps URL", `${key}_maps_url`, value.maps_url)}</section>`;
  const customEventId = () => `EVT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const customEventFields = (item = {}, position = "after") => `<section class="form-section custom-event-card" data-id="${item.id || customEventId()}" data-position="${position}"><div class="custom-event-card__head"><h2>Event Tambahan</h2><div class="custom-event-actions"><button type="button" class="move-custom-up" aria-label="Naikkan event">↑</button><button type="button" class="move-custom-down" aria-label="Turunkan event">↓</button><button type="button" class="remove-custom-event">Hapus</button></div></div><label><input type="checkbox" data-custom-field="enabled" ${item.enabled !== false ? "checked" : ""}> Aktifkan Event</label>${field("Nama Acara", "custom_title", item.title || "")}${field("Tanggal", "custom_date", item.date || "", "date")}${field("Waktu mulai", "custom_start_time", item.start_time || "", "time")}${field("Waktu selesai", "custom_end_time", item.end_time || "", "time")}${field("Lokasi", "custom_location", item.location || "")}${field("Alamat", "custom_address", item.address || "")}${field("Maps URL", "custom_maps_url", item.maps_url || "")}</section>`;
  const customEvents = (wedding) =>
    Array.isArray(wedding.event?.custom_events)
      ? wedding.event.custom_events
      : [];

  const renderers = {
    couple: (wedding) =>
      `<section class="form-section"><h2>Pengantin Pria</h2>${field("Nama Panggilan", "groom_name", wedding.couple.groom.name)}${field("Nama Lengkap", "groom_full_name", wedding.couple.groom.full_name)}${photo("Foto Pengantin Pria", "groom_photo", wedding.couple.groom.photo)}${childOrderField("groom_child_order", wedding.couple.groom.childOrder)}${field("Nama Ayah", "groom_father", wedding.couple.groom.father)}${field("Nama Ibu", "groom_mother", wedding.couple.groom.mother)}</section><section class="form-section"><h2>Pengantin Wanita</h2>${field("Nama Panggilan", "bride_name", wedding.couple.bride.name)}${field("Nama Lengkap", "bride_full_name", wedding.couple.bride.full_name)}${photo("Foto Pengantin Wanita", "bride_photo", wedding.couple.bride.photo)}${childOrderField("bride_child_order", wedding.couple.bride.childOrder)}${field("Nama Ayah", "bride_father", wedding.couple.bride.father)}${field("Nama Ibu", "bride_mother", wedding.couple.bride.mother)}</section>`,
    event: (wedding) =>
      `<section class="form-section event-toolbar"><div class="custom-event-card__head"><div><h2>Detail Acara</h2><p>Akad dan Resepsi tetap menjadi acara utama.</p></div><button type="button" class="add-custom-event">+ Tambah Event</button></div></section><div class="custom-events-group" id="custom-events-before">${customEvents(wedding).filter((item) => item.position === "before").map((item) => customEventFields(item, "before")).join("")}</div>${eventFields("akad", "Akad", wedding.event.akad)}${eventFields("reception", "Resepsi", wedding.event.reception, sameEventDetails(wedding.event.akad, wedding.event.reception))}<div class="custom-events-group" id="custom-events-after">${customEvents(wedding).filter((item) => item.position !== "before").map((item) => customEventFields(item, "after")).join("")}</div><section class="form-section"><label>Countdown menuju<select name="countdown_target"><option value="akad" ${wedding.event.countdown_target === "akad" ? "selected" : ""}>Akad</option><option value="reception" ${wedding.event.countdown_target === "reception" ? "selected" : ""}>Resepsi</option></select></label></section>`,
    digital_gift: (wedding) =>
      `<section class="form-section"><label><input type="checkbox" name="gift_enabled" ${wedding.digital_gift.enabled ? "checked" : ""}>Digital Gift</label><div id="accounts">${wedding.digital_gift.accounts.map((account) => `<div class="account-row">${field("Bank", "account_bank", account.bank)}${field("Nomor", "account_number", account.number)}${field("Atas Nama", "account_holder", account.holder)}<button type="button" class="remove-account">Hapus</button></div>`).join("")}</div><button type="button" class="add-account">+ Tambah Rekening</button></section>`,
    music: (wedding) =>
      `<section class="form-section"><label><input type="checkbox" name="music_enabled" ${wedding.music.enabled ? "checked" : ""}>Musik</label>${field("Music URL", "music_url", wedding.music.url)}<label><input type="checkbox" name="music_autoplay" ${wedding.music.autoplay ? "checked" : ""}>Autoplay</label></section>`,
  };

  function updateCountdownOptions(container) {
    const akad = container.querySelector('[name="akad_enabled"]');
    const reception = container.querySelector('[name="reception_enabled"]');
    const countdown = container.querySelector('[name="countdown_target"]');
    if (!akad || !reception || !countdown) return;

    const previous = countdown.value;
    const options = [];
    if (akad.checked) options.push(["akad", "Akad"]);
    if (reception.checked) options.push(["reception", "Resepsi"]);
    countdown.innerHTML = options.length
      ? options
          .map(([value, label]) => `<option value="${value}">${label}</option>`)
          .join("")
      : '<option value="">Aktifkan acara terlebih dahulu</option>';
    countdown.disabled = !options.length;
    if (options.some(([value]) => value === previous))
      countdown.value = previous;
    else if (options.length) countdown.value = options[0][0];
  }

  function setPhotoState(photoField, hasPhoto) {
    photoField.querySelector(".photo-preview-stage").dataset.hasPhoto =
      String(hasPhoto);
    photoField.querySelector(".photo-select-label").textContent = hasPhoto
      ? "Ganti Foto"
      : "Pilih Foto";
    photoField.querySelector(".clear-photo").hidden = !hasPhoto;
  }

  const readEvent = (elements, key, old) => ({
    ...old,
    enabled: elements[`${key}_enabled`].checked,
    date: elements[`${key}_date`].value,
    start_time: elements[`${key}_start_time`].value,
    end_time: elements[`${key}_end_time`].value,
    location: trim(elements[`${key}_location`].value),
    address: trim(elements[`${key}_address`].value),
    maps_url: trim(elements[`${key}_maps_url`].value),
  });
  const readCustomEvents = (form) =>
    ["before", "after"].flatMap((position) =>
      [...form.querySelectorAll(`#custom-events-${position} > .custom-event-card`)]
        .map((card) => ({
          id: card.dataset.id || customEventId(),
          type: "custom",
          position,
          enabled: card.querySelector('[data-custom-field="enabled"]').checked,
          title: trim(card.querySelector('[name="custom_title"]').value),
          date: card.querySelector('[name="custom_date"]').value,
          start_time: card.querySelector('[name="custom_start_time"]').value,
          end_time: card.querySelector('[name="custom_end_time"]').value,
          location: trim(card.querySelector('[name="custom_location"]').value),
          address: trim(card.querySelector('[name="custom_address"]').value),
          maps_url: trim(card.querySelector('[name="custom_maps_url"]').value),
        }))
        .filter((item) =>
          [
            item.title,
            item.date,
            item.start_time,
            item.end_time,
            item.location,
            item.address,
            item.maps_url,
          ].some(Boolean),
        ),
    );

  return {
    render: (sections, wedding) =>
      sections
        .map((section) =>
          renderers[section]
            ? renderers[section](wedding)
            : (section !== "rsvp" &&
                console.warn(`Section renderer belum tersedia: ${section}`),
              ""),
        )
        .join(""),

    bind: (container) => {
      container.onclick = (event) => {
        const target = event.target;
        if (target.closest(".add-custom-event")) {
          const beforeEvents = container.querySelector("#custom-events-before");
          beforeEvents.insertAdjacentHTML(
            "beforeend",
            customEventFields({}, "before"),
          );
          const customCard = beforeEvents.lastElementChild;
          customCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
          customCard.querySelector('[name="custom_title"]').focus({
            preventScroll: true,
          });
          return;
        }
        const customCard = target.closest(".custom-event-card");
        if (customCard && target.closest(".remove-custom-event")) {
          customCard.remove();
          return;
        }
        if (customCard && target.closest(".move-custom-up")) {
          const previous = customCard.previousElementSibling;
          if (previous?.classList.contains("custom-event-card"))
            customCard.parentElement.insertBefore(customCard, previous);
          else if (customCard.parentElement.id === "custom-events-after")
            container.querySelector("#custom-events-before").append(customCard);
          return;
        }
        if (customCard && target.closest(".move-custom-down")) {
          const next = customCard.nextElementSibling;
          if (next?.classList.contains("custom-event-card"))
            customCard.parentElement.insertBefore(next, customCard);
          else if (customCard.parentElement.id === "custom-events-before")
            container.querySelector("#custom-events-after").prepend(customCard);
          return;
        }
        if (target.classList.contains("remove-account"))
          target.parentElement.remove();
        if (target.classList.contains("add-account"))
          target.insertAdjacentHTML(
            "beforebegin",
            `<div class="account-row">${field("Bank", "account_bank")}${field("Nomor", "account_number")}${field("Atas Nama", "account_holder")}<button type="button" class="remove-account">Hapus</button></div>`,
          );
        if (target.classList.contains("clear-photo")) {
          const photoField = target.closest(".photo-field");
          photoField.querySelector('[type="hidden"]').value = "";
          const image = photoField.querySelector("img");
          image.removeAttribute("src");
          image.hidden = true;
          photoField.querySelector(".photo-upload").value = "";
          setPhotoState(photoField, false);
        }
      };

      container.querySelectorAll(".photo-upload").forEach((input) => {
        input.onchange = () => {
          const file = input.files[0];
          if (
            !file ||
            file.size > 1048576 ||
            !["image/jpeg", "image/png", "image/webp"].includes(file.type)
          ) {
            window.AdminUI?.showToast(
              "Foto harus JPEG, PNG, atau WEBP dengan ukuran maksimum 1 MB.",
              "error",
            );
            input.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const photoField = input.closest(".photo-field");
            photoField.querySelector('[type="hidden"]').value = reader.result;
            const image = photoField.querySelector("img");
            image.src = reader.result;
            image.hidden = false;
            setPhotoState(photoField, true);
          };
          reader.readAsDataURL(file);
        };
      });

      const akad = container.querySelector('[name="akad_enabled"]');
      const reception = container.querySelector('[name="reception_enabled"]');
      const sameAsAkad = container.querySelector(
        '[name="reception_same_as_akad"]',
      );
      const receptionFields = eventCopyFields.map((key) =>
        container.querySelector(`[name="reception_${key}"]`),
      );
      const akadFields = eventCopyFields.map((key) =>
        container.querySelector(`[name="akad_${key}"]`),
      );
      const copyAkadToReception = () =>
        eventCopyFields.forEach((key, index) => {
          if (akadFields[index] && receptionFields[index])
            receptionFields[index].value = akadFields[index].value;
        });
      const updateSameAsAkad = () => {
        if (!sameAsAkad || !akad || !reception) return;
        const available = akad.checked && reception.checked;
        if (!available) sameAsAkad.checked = false;
        sameAsAkad.disabled = !available;
        if (sameAsAkad.checked) copyAkadToReception();
        receptionFields.forEach((input) => {
          if (input) input.disabled = sameAsAkad.checked;
        });
      };
      akad?.addEventListener("change", () => updateCountdownOptions(container));
      reception?.addEventListener("change", () =>
        updateCountdownOptions(container),
      );
      akad?.addEventListener("change", updateSameAsAkad);
      reception?.addEventListener("change", updateSameAsAkad);
      sameAsAkad?.addEventListener("change", updateSameAsAkad);
      akadFields.forEach((input) =>
        input?.addEventListener("input", () => {
          if (sameAsAkad?.checked) copyAkadToReception();
        }),
      );
      akadFields.forEach((input) =>
        input?.addEventListener("change", () => {
          if (sameAsAkad?.checked) copyAkadToReception();
        }),
      );
      updateCountdownOptions(container);
      updateSameAsAkad();
    },

    read: (form, sections, old) => {
      const elements = form.elements;
      const wedding = structuredClone(old);
      if (sections.includes("couple")) {
        Object.assign(wedding.couple.groom, {
          name: trim(elements.groom_name.value),
          full_name: trim(elements.groom_full_name.value),
          photo: elements.groom_photo.value,
          childOrder: trim(elements.groom_child_order.value),
          father: trim(elements.groom_father.value),
          mother: trim(elements.groom_mother.value),
        });
        Object.assign(wedding.couple.bride, {
          name: trim(elements.bride_name.value),
          full_name: trim(elements.bride_full_name.value),
          photo: elements.bride_photo.value,
          childOrder: trim(elements.bride_child_order.value),
          father: trim(elements.bride_father.value),
          mother: trim(elements.bride_mother.value),
        });
      }
      if (sections.includes("event")) {
        wedding.event.akad = readEvent(elements, "akad", wedding.event.akad);
        wedding.event.reception = readEvent(
          elements,
          "reception",
          wedding.event.reception,
        );
        wedding.event.custom_events = readCustomEvents(form);
        wedding.event.countdown_target = elements.countdown_target.value;
      }
      if (sections.includes("digital_gift")) {
        wedding.digital_gift = {
          enabled: elements.gift_enabled.checked,
          accounts: [...form.querySelectorAll(".account-row")]
            .map((row) => ({
              bank: trim(row.querySelector('[name="account_bank"]').value),
              number: trim(row.querySelector('[name="account_number"]').value),
              holder: trim(row.querySelector('[name="account_holder"]').value),
            }))
            .filter(
              (account) => account.bank || account.number || account.holder,
            ),
        };
      }
      if (sections.includes("music"))
        wedding.music = {
          enabled: elements.music_enabled.checked,
          url: trim(elements.music_url.value),
          autoplay: elements.music_autoplay.checked,
        };
      return wedding;
    },

    validate: (form, sections) => {
      const elements = form.elements;
      if (sections.includes("couple")) {
        if (!trim(elements.groom_name.value))
          return "Nama panggilan pengantin pria wajib diisi.";
        if (!trim(elements.bride_name.value))
          return "Nama panggilan pengantin wanita wajib diisi.";
      }
      if (sections.includes("event")) {
        const akad = elements.akad_enabled.checked;
        const reception = elements.reception_enabled.checked;
        if (!akad && !reception) return "Minimal satu acara harus diaktifkan.";
        for (const [key, label, enabled] of [
          ["akad", "Akad", akad],
          ["reception", "Resepsi", reception],
        ]) {
          if (enabled) {
            if (!elements[`${key}_date`].value)
              return `Tanggal ${label} wajib diisi.`;
            if (!elements[`${key}_start_time`].value)
              return `Waktu mulai ${label} wajib diisi.`;
            if (!trim(elements[`${key}_location`].value))
              return `Lokasi ${label} wajib diisi.`;
          }
        }
        for (const item of readCustomEvents(form)) {
          if (!item.enabled) continue;
          if (!item.title) return "Nama Event Tambahan wajib diisi.";
          if (!item.date) return `Tanggal ${item.title} wajib diisi.`;
          if (!item.start_time)
            return `Waktu mulai ${item.title} wajib diisi.`;
          if (!item.location) return `Lokasi ${item.title} wajib diisi.`;
        }
        if (
          !elements.countdown_target.value ||
          !elements[`${elements.countdown_target.value}_enabled`]?.checked
        )
          return "Countdown harus mengarah ke acara yang aktif.";
      }
      if (sections.includes("digital_gift") && elements.gift_enabled.checked) {
        const rows = [...form.querySelectorAll(".account-row")];
        if (!rows.length)
          return "Digital Gift aktif membutuhkan minimal satu rekening.";
        for (const row of rows) {
          if (
            !trim(row.querySelector('[name="account_bank"]').value) ||
            !trim(row.querySelector('[name="account_number"]').value) ||
            !trim(row.querySelector('[name="account_holder"]').value)
          )
            return "Lengkapi Bank, Nomor Rekening, dan Atas Nama pada rekening Digital Gift.";
        }
      }
      if (
        sections.includes("music") &&
        elements.music_enabled.checked &&
        !trim(elements.music_url.value)
      )
        return "Music URL wajib diisi ketika Musik diaktifkan.";
      return "";
    },
  };
})();
