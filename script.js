
const ADMIN_WA = "628818238317";

const PRICES = {
  ranked: {
    Grandmaster: 5000,
    Epic: 6000,
    Legend: 8000,
    Mythic: 17000,
    Honor: 20000,
    Glory: 25000,
    Immortal: 32000
  },
  gendong: {
    Grandmaster: 7000,
    Epic: 8000,
    Legend: 10000,
    Mythic: 20000,
    Honor: 23000,
    Glory: 28000,
    Immortal: 25000
  }
};

const RANK_IMAGES = {
  Grandmaster: "Granpmaster.jpg",
  Epic: "Efic.jpg",
  Legend: "Legend.jpg",
  Mythic: "Mythic.jpg",
  Honor: "Honor.jpg",
  Glory: "Glory.jpg",
  Immortal: "Immortal.jpg"
};

// GM, Epic, Legend: 5 divisi x 5 bintang.
// Mythic: 0–24, Honor: 25–49,
// Glory: 50–99, Immortal: 100+.
const RANK_BASE = {
  Grandmaster: 0,
  Epic: 25,
  Legend: 50,
  Mythic: 75,
  Honor: 100,
  Glory: 125,
  Immortal: 175
};

const DIVISION_NAMES = {
  5: "V",
  4: "IV",
  3: "III",
  2: "II",
  1: "I"
};

let selectedService = "ranked";
let latestPrice = 0;
let latestOrder = null;

const $ = id => document.getElementById(id);

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function rankIsDivisional(rank) {
  return ["Grandmaster", "Epic", "Legend"].includes(rank);
}

function rankBase(rank) {
  return RANK_BASE[rank] ?? 0;
}

function rankProgress(rank, stars, division) {
  if (rankIsDivisional(rank)) {
    // Divisi V dimulai dari 0; setiap divisi memiliki 5 bintang.
    const div = Number(division || 5);
    return rankBase(rank) + (5 - div) * 5 + Number(stars || 0);
  }

  return rankBase(rank) + Number(stars || 0);
}

function rankLabel(rank, division, stars) {
  if (rankIsDivisional(rank)) {
    return `${rank} ${DIVISION_NAMES[Number(division)] || "V"}, ${stars} bintang`;
  }
  return `${rank} ${stars} bintang`;
}

function rankAtProgress(progress) {
  if (progress < 25) return "Grandmaster";
  if (progress < 50) return "Epic";
  if (progress < 75) return "Legend";
  if (progress < 100) return "Mythic";
  if (progress < 125) return "Honor";
  if (progress < 175) return "Glory";
  return "Immortal";
}

function priceForProgress(service, progress) {
  const rank = rankAtProgress(progress);
  return PRICES[service]?.[rank] || 0;
}

function calculatePrice(service, start, target) {
  if (!PRICES[service] || target <= start) return null;

  let total = 0;

  for (let p = start; p < target; p++) {
    total += priceForProgress(service, p);
  }

  return total;
}

function updateImage(id, rank) {
  const img = $(id);
  if (!img) return;

  img.src = RANK_IMAGES[rank] || "";
  img.alt = rank;
  img.onerror = () => {
    img.style.display = "none";
  };
  img.style.display = "block";
}

function updateRankControls(which) {
  const rank = $(`${which}Rank`)?.value;
  if (!rank) return;

  const isDivisional = rankIsDivisional(rank);
  const divisionWrap = $(`${which}DivisionWrap`);
  const stars = $(`${which}Stars`);
  const hint = $(`${which}StarHint`);

  if (divisionWrap) {
    divisionWrap.hidden = !isDivisional;
  }

  if (!stars) return;

  if (isDivisional) {
    stars.min = "0";
    stars.max = "5";
    if (Number(stars.value) > 5) stars.value = "5";
    if (hint) hint.textContent = "0–5 bintang per divisi";
  } else {
    const maximum = rank === "Mythic" ? 24 :
      rank === "Honor" ? 49 :
      rank === "Glory" ? 99 : 999;

    stars.min = rank === "Honor" ? "25" :
      rank === "Glory" ? "50" :
      rank === "Immortal" ? "100" : "0";

    stars.max = String(maximum);

    if (rank === "Mythic" && Number(stars.value) > 24) {
      stars.value = "24";
    }
    if (rank === "Honor" && Number(stars.value) < 25) {
      stars.value = "25";
    }
    if (rank === "Honor" && Number(stars.value) > 49) {
      stars.value = "49";
    }
    if (rank === "Glory" && Number(stars.value) < 50) {
      stars.value = "50";
    }
    if (rank === "Glory" && Number(stars.value) > 99) {
      stars.value = "99";
    }
    if (rank === "Immortal" && Number(stars.value) < 100) {
      stars.value = "100";
    }

    if (hint) {
      hint.textContent =
        rank === "Mythic" ? "Mythic: 0–24 bintang" :
        rank === "Honor" ? "Honor: 25–49 bintang" :
        rank === "Glory" ? "Glory: 50–99 bintang" :
        "Immortal: 100 bintang ke atas";
    }
  }

  updateImage(`${which}RankImage`, rank);
}

function getCurrentProgress() {
  return rankProgress(
    $("currentRank").value,
    $("currentStars").value,
    $("currentDivision")?.value
  );
}

function getTargetProgress() {
  return rankProgress(
    $("targetRank").value,
    $("targetStars").value,
    $("targetDivision")?.value
  );
}

function updateServiceButtons() {
  document.querySelectorAll("[data-service]").forEach(button => {
    const active = button.dataset.service === selectedService;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const name = $("selectedName");
  if (name) {
    name.value = selectedService === "ranked" ? "Joki Ranked" :
      selectedService === "gendong" ? "Joki Gendong" :
      "Joki Classic";
  }
}

function updateCalculator() {
  updateRankControls("current");
  updateRankControls("target");

  const currentRank = $("currentRank").value;
  const targetRank = $("targetRank").value;
  const start = getCurrentProgress();
  const target = getTargetProgress();

  updateImage("currentRankImage", currentRank);
  updateImage("targetRankImage", targetRank);

  if (selectedService === "classic") {
    latestPrice = 0;
    $("rankPrice").textContent = "Hubungi admin";
    $("rankMessage").textContent = "Harga Joki Classic dikonfirmasi admin.";
    return;
  }

  if (target <= start) {
    latestPrice = 0;
    $("rankPrice").textContent = "Target tidak valid";
    $("rankMessage").textContent = "Rank tujuan harus lebih tinggi dari rank awal.";
    return;
  }

  latestPrice = calculatePrice(selectedService, start, target);

  if (latestPrice === null) {
    $("rankPrice").textContent = "Hubungi admin";
    return;
  }

  $("rankPrice").textContent = rupiah(latestPrice);
  $("rankMessage").textContent =
    `${rankLabel(currentRank, $("currentDivision")?.value, $("currentStars").value)} → ` +
    `${rankLabel(targetRank, $("targetDivision")?.value, $("targetStars").value)}`;

  if ($("selectedPrice")) {
    $("selectedPrice").value = rupiah(latestPrice);
  }
}

function toast(message) {
  const element = $("toast");
  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2500);
}

function makeWhatsAppLink(message) {
  return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
  window.location.href = makeWhatsAppLink(message);
}

function setupStars(which) {
  $(`${which}Minus`)?.addEventListener("click", () => {
    const input = $(`${which}Stars`);
    const min = Number(input.min || 0);
    input.value = String(Math.max(min, Number(input.value || 0) - 1));
    updateCalculator();
  });

  $(`${which}Plus`)?.addEventListener("click", () => {
    const input = $(`${which}Stars`);
    const max = Number(input.max || 999);
    input.value = String(Math.min(max, Number(input.value || 0) + 1));
    updateCalculator();
  });

  [`${which}Rank`, `${which}Division`, `${which}Stars`].forEach(id => {
    $(id)?.addEventListener("change", updateCalculator);
    $(id)?.addEventListener("input", updateCalculator);
  });
}

function createOrder() {
  const playerId = $("playerId").value.trim();
  const serverId = $("serverId").value.trim();
  const playerName = $("playerName").value.trim();
  const contact = $("contact").value.trim();
  const notes = $("notes").value.trim();

  if (!playerId || !serverId || !playerName) {
    toast("Isi ID Game, Server ID, dan nama akun terlebih dahulu.");
    $("order").scrollIntoView({ behavior: "smooth" });
    return;
  }

  updateCalculator();

  if (selectedService !== "classic" && latestPrice <= 0) {
    toast("Periksa rank awal dan rank tujuan.");
    return;
  }

  const currentRank = $("currentRank").value;
  const targetRank = $("targetRank").value;
  const currentLabel = rankLabel(
    currentRank,
    $("currentDivision")?.value,
    $("currentStars").value
  );
  const targetLabel = rankLabel(
    targetRank,
    $("targetDivision")?.value,
    $("targetStars").value
  );

  const serviceName = selectedService === "ranked" ? "Joki Ranked" :
    selectedService === "gendong" ? "Joki Gendong" : "Joki Classic";

  const priceText = selectedService === "classic"
    ? "Konfirmasi admin"
    : rupiah(latestPrice);

  latestOrder = {
    serviceName,
    currentLabel,
    targetLabel,
    playerId,
    serverId,
    playerName,
    contact,
    notes,
    priceText,
    price: latestPrice
  };

  $("paymentOrderSummary").textContent =
    `${serviceName} | ${currentLabel} → ${targetLabel} | ` +
    `ID ${playerId} (${serverId}) | Akun ${playerName}`;

  $("paymentTotal").textContent = priceText;
  $("paymentPanel").hidden = false;
  $("paymentPanel").scrollIntoView({ behavior: "smooth", block: "start" });

  const selectedName = $("selectedName");
  const selectedPrice = $("selectedPrice");

  if (selectedName) selectedName.value = serviceName;
  if (selectedPrice) selectedPrice.value = priceText;
}

function confirmPayment() {
  if (!latestOrder) {
    toast("Buat pesanan terlebih dahulu.");
    return;
  }

  const o = latestOrder;
  const message =
    `Halo Min, saya ingin konfirmasi pesanan LIXERA JOKI.\n\n` +
    `Layanan: ${o.serviceName}\n` +
    `Rank awal: ${o.currentLabel}\n` +
    `Rank tujuan: ${o.targetLabel}\n` +
    `ID Game: ${o.playerId}\n` +
    `Server ID: ${o.serverId}\n` +
    `Nama akun: ${o.playerName}\n` +
    `Kontak: ${o.contact || "-"}\n` +
    `Harga: ${o.priceText}\n` +
    `Catatan: ${o.notes || "-"}\n\n` +
    `Saya sudah melakukan pembayaran / ingin konfirmasi pembayaran. ` +
    `Mohon cek dan konfirmasi pesanan saya. Terima kasih.`;

  openWhatsApp(message);
}

function setupServices() {
  document.querySelectorAll("[data-service]").forEach(button => {
    button.addEventListener("click", () => {
      selectedService = button.dataset.service;
      updateServiceButtons();
      updateCalculator();

      $("calculator").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function setupForm() {
  $("orderForm")?.addEventListener("submit", event => {
    event.preventDefault();
    createOrder();
  });

  $("orderRankButton")?.addEventListener("click", () => {
    $("order").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Lengkapi data akun untuk membuat pesanan.");
  });

  $("confirmPaymentButton")?.addEventListener("click", confirmPayment);
}

function setupNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupStars("current");
  setupStars("target");
  setupServices();
  setupForm();
  setupNavigation();
  updateServiceButtons();
  updateCalculator();
});
        
