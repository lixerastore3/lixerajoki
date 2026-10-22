
"use strict";

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

const RANK_BASE = {
  Grandmaster: 0,
  Epic: 25,
  Legend: 50
};

const DIVISION_NAMES = {
  5: "V",
  4: "IV",
  3: "III",
  2: "II",
  1: "I"
};

const $ = id => document.getElementById(id);

let latestPrice = 0;
let latestOrder = null;
let toastTimer = null;

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function isDivisional(rank) {
  return ["Grandmaster", "Epic", "Legend"].includes(rank);
}

function rankProgress(rank, stars, division) {
  const count = Number(stars || 0);

  if (isDivisional(rank)) {
    const div = Number(division || 5);
    return RANK_BASE[rank] + (5 - div) * 5 + count;
  }

  // Mythic 0–24, Honor 25–49,
  // Glory 50–99, Immortal 100+
  return 75 + count;
}

function rankLabel(rank, division, stars) {
  if (isDivisional(rank)) {
    const div = DIVISION_NAMES[Number(division)] || "V";
    return `${rank} ${div}, ${stars} bintang`;
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

function calculatePrice(service, start, target) {
  const prices = PRICES[service];

  if (!prices || target <= start) return null;

  let total = 0;

  for (let progress = start; progress < target; progress++) {
    const rank = rankAtProgress(progress);
    total += prices[rank] || 0;
  }

  return total;
}

function updateImage(id, rank) {
  const image = $(id);
  if (!image) return;

  image.onerror = () => {
    image.onerror = null;
    image.style.visibility = "hidden";
  };

  image.onload = () => {
    image.style.visibility = "visible";
  };

  image.src = RANK_IMAGES[rank];
  image.alt = `Rank ${rank}`;
  image.style.visibility = "visible";
}

function updateRankControls(which) {
  const rank = $(`${which}Rank`).value;
  const stars = $(`${which}Stars`);
  const divisionWrap = $(`${which}DivisionWrap`);
  const hint = $(`${which}StarHint`);

  const divisional = isDivisional(rank);

  divisionWrap.hidden = !divisional;

  if (divisional) {
    stars.min = "0";
    stars.max = "5";

    if (Number(stars.value) > 5) stars.value = "5";
    if (Number(stars.value) < 0) stars.value = "0";

    hint.textContent = "0–5 bintang per divisi";
  } else {
    let min = 0;
    let max = 24;

    if (rank === "Honor") {
      min = 25;
      max = 49;
    } else if (rank === "Glory") {
      min = 50;
      max = 99;
    } else if (rank === "Immortal") {
      min = 100;
      max = 999;
    }

    stars.min = String(min);
    stars.max = String(max);

    let value = Number(stars.value);

    if (!Number.isFinite(value)) value = min;
    if (value < min) value = min;
    if (value > max) value = max;

    stars.value = String(value);

    hint.textContent =
      rank === "Mythic" ? "Mythic: 0–24 bintang" :
      rank === "Honor" ? "Honor: 25–49 bintang" :
      rank === "Glory" ? "Glory: 50–99 bintang" :
      "Immortal: 100 bintang ke atas";
  }

  updateImage(`${which}RankImage`, rank);
}

function getProgress(which) {
  return rankProgress(
    $(`${which}Rank`).value,
    $(`${which}Stars`).value,
    $(`${which}Division`).value
  );
}

function toast(message) {
  const element = $("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2800);
}

function updateCalculator() {
  updateRankControls("current");
  updateRankControls("target");

  const startRank = $("currentRank").value;
  const targetRank = $("targetRank").value;

  const start = getProgress("current");
  const target = getProgress("target");

  const service = $("serviceType").value;

  const startLabel = rankLabel(
    startRank,
    $("currentDivision").value,
    $("currentStars").value
  );

  const targetLabel = rankLabel(
    targetRank,
    $("targetDivision").value,
    $("targetStars").value
  );

  $("rankMessage").textContent = `${startLabel} → ${targetLabel}`;

  if (target <= start) {
    latestPrice = 0;
    $("rankPrice").textContent = "Target tidak valid";
    $("rankMessage").textContent =
      "Rank tujuan harus lebih tinggi dari rank awal.";
    return;
  }

  latestPrice = calculatePrice(service, start, target);

  $("rankPrice").textContent = rupiah(latestPrice);
}

function openPaymentModal() {
  $("paymentModal").hidden = false;
  document.body.classList.add("modal-open");
  $("closePaymentModal").focus();
}

function closePaymentModal() {
  $("paymentModal").hidden = true;
  document.body.classList.remove("modal-open");
}

function makeWhatsAppLink(message) {
  return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
}

function createOrder(event) {
  event.preventDefault();

  const playerId = $("playerId").value.trim();
  const playerName = $("playerName").value.trim();
  const notes = $("notes").value.trim();
  const service = $("serviceType").value;

  if (!playerId || !playerName) {
    toast("Isi ID game dan nama akun terlebih dahulu.");
    return;
  }

  updateCalculator();

  const start = getProgress("current");
  const target = getProgress("target");

  if (target <= start || latestPrice <= 0) {
    toast("Rank tujuan harus lebih tinggi dari rank awal.");
    return;
  }

  const startRank = $("currentRank").value;
  const targetRank = $("targetRank").value;

  const startLabel = rankLabel(
    startRank,
    $("currentDivision").value,
    $("currentStars").value
  );

  const targetLabel = rankLabel(
    targetRank,
    $("targetDivision").value,
    $("targetStars").value
  );

  const serviceName =
    service === "gendong" ? "Joki Gendong" : "Joki Rank";

  latestOrder = {
    serviceName,
    playerId,
    playerName,
    notes,
    startLabel,
    targetLabel,
    price: latestPrice,
    priceText: rupiah(latestPrice)
  };

  $("paymentOrderSummary").textContent =
    `Layanan: ${serviceName}\n` +
    `ID Game: ${playerId}\n` +
    `Nama akun: ${playerName}\n` +
    `Rank awal: ${startLabel}\n` +
    `Rank tujuan: ${targetLabel}\n` +
    `Catatan: ${notes || "-"}\n\n` +
    `Total: ${rupiah(latestPrice)}`;

  $("paymentTotal").textContent = rupiah(latestPrice);

  openPaymentModal();
}

function confirmPayment() {
  if (!latestOrder) {
    toast("Buat pesanan terlebih dahulu.");
    return;
  }

  const order = latestOrder;

  const message =
    `Halo Admin LIXERA JOKI, saya ingin konfirmasi pesanan.\n\n` +
    `Layanan: ${order.serviceName}\n` +
    `ID Game: ${order.playerId}\n` +
    `Nama akun: ${order.playerName}\n` +
    `Rank awal: ${order.startLabel}\n` +
    `Rank tujuan: ${order.targetLabel}\n` +
    `Total: ${order.priceText}\n` +
    `Catatan: ${order.notes || "-"}\n\n` +
    `Saya sudah melakukan pembayaran melalui QRIS. ` +
    `Mohon konfirmasi pesanan saya. Saya akan mengirim bukti pembayaran di chat ini.`;

  window.location.href = makeWhatsAppLink(message);
}

function setupStarButtons(which) {
  $(`${which}Minus`).addEventListener("click", () => {
    const input = $(`${which}Stars`);
    const min = Number(input.min || 0);

    input.value = String(
      Math.max(min, Number(input.value || 0) - 1)
    );

    updateCalculator();
  });

  $(`${which}Plus`).addEventListener("click", () => {
    const input = $(`${which}Stars`);
    const max = Number(input.max || 999);

    input.value = String(
      Math.min(max, Number(input.value || 0) + 1)
    );

    updateCalculator();
  });

  [`${which}Rank`, `${which}Division`, `${which}Stars`]
    .forEach(id => {
      $(id).addEventListener("input", updateCalculator);
      $(id).addEventListener("change", updateCalculator);
    });
}

function setupNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(
        link.getAttribute("href")
      );

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupStarButtons("current");
  setupStarButtons("target");

  $("serviceType").addEventListener("change", updateCalculator);

  $("orderForm").addEventListener("submit", createOrder);

  $("confirmPaymentButton").addEventListener(
    "click",
    confirmPayment
  );

  $("closePaymentModal").addEventListener(
    "click",
    closePaymentModal
  );

  $("paymentBackdrop").addEventListener(
    "click",
    closePaymentModal
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("paymentModal").hidden) {
      closePaymentModal();
    }
  });

  setupNavigation();
  updateCalculator();
});
      
