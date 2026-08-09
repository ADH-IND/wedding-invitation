(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $("#generator-form");
  const baseLinkInput = $("#base-link");
  const guestNameInput = $("#guest-name");
  const styleInput = $("#message-style");
  const result = $("#result");
  const styleDescriptions = {
    umum: "Sopan dan cocok untuk berbagai penerima.",
    teman: "Lebih santai dan hangat.",
    keluarga: "Formal dan penuh hormat.",
    rekanKerja: "Profesional namun tetap hangat."
  };
  let generated = null;
  let toastTimer;

  const showToast = (message, type = "success") => {
    const toast = $("#toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = "toast";
    }, 2500);
  };

  const showError = (message) => {
    $("#form-error").textContent = message;
  };
  const styleLabel = () => styleInput.options[styleInput.selectedIndex].text;
  const updateStyleDescription = () => {
    $("#style-description").textContent = styleDescriptions[styleInput.value] || "";
  };
  styleInput.addEventListener("change", updateStyleDescription);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const baseLink = baseLinkInput.value.trim();
    const guestName = guestNameInput.value.trim();
    showError("");
    if (!baseLink) return showError("Masukkan link undangan yang valid.");
    if (!guestName) return showError("Nama tamu wajib diisi.");
    if (guestName.length > 150)
      return showError("Nama tamu maksimal 150 karakter.");

    let personalUrl;
    try {
      personalUrl = new URL(baseLink);
      if (personalUrl.protocol !== "https:" && personalUrl.protocol !== "http:")
        throw new Error("Invalid protocol");
      personalUrl.searchParams.set("to", guestName);
    } catch {
      return showError("Masukkan link undangan yang valid.");
    }

    const invitationLink = personalUrl.toString();
    const formatter = window.ChatTemplates?.[styleInput.value];
    if (typeof formatter !== "function")
      return showError("Gaya pesan tidak tersedia.");
    const message = formatter({ guestName, invitationLink });
    generated = { invitationLink, message };
    $("#result-guest-name").textContent = guestName;
    $("#result-style").textContent = styleLabel();
    $("#result-link").textContent = invitationLink;
    $("#result-message").value = message;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#copy-message").addEventListener("click", async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.message);
      showToast("Pesan dan link berhasil disalin.");
    } catch {
      showToast("Gagal menyalin. Silakan coba lagi.", "error");
    }
  });

  $("#share-whatsapp").addEventListener("click", () => {
    if (!generated) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(generated.message)}`,
      "_blank",
      "noopener",
    );
  });

  $("#next-guest").addEventListener("click", () => {
    guestNameInput.value = "";
    styleInput.value = "umum";
    updateStyleDescription();
    generated = null;
    result.hidden = true;
    $("#result-guest-name").textContent = "";
    $("#result-style").textContent = "";
    $("#result-link").textContent = "";
    $("#result-message").value = "";
    showError("");
    guestNameInput.focus();
  });
})();
