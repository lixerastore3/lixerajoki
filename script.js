
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

const DIVISION_NAMES = {
  5: "V",
  4: "IV",
  3: "III",
  2: "II",
  1: "I"
};

const RANK_BASE = {
  Grandmaster: 0,
  Epic: 25,
  Legend: 50
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

  return 75 + count;
}

function rankLabel(rank, division, stars) {
  const rankNames = {
    Honor: "Mythical Honor",
    Glory: "Mythical Glory",
    Immortal: "Mythical Immortal"
  };

  if (isDivisional(rank)) {
    const div = DIVISION_NAMES[Number(division)] || "V";
    return `${rank} ${div}, ${stars} bintang`;
  }

  return `${rankNames[rank] || rank} ${stars} bintang`;
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

  if (!prices || target <= start) return 0;

  let total = 0;

  for (let progress = start; progress < target; progress++) {
    const rank = rankAtProgress(progress);
    total += prices[rank] || 0;
  }

  return total;
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
    return;
  }

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

  if (rank === "Mythic") {
    hint.textContent = "Mythic: 0–24 bintang";
  } else if (rank === "Honor") {
    hint.textContent = "Honor: 25–49 bintang";
  } else if (rank === "Glory") {
    hint.textContent = "Glory: 50–99 bintang";
  } else {
    hint.textContent = "Immortal: 100 bintang ke atas";
  }
}

function getProgress(which) {
  return rankProgress(
    $(`${which}Rank`).value,
    $(`${which}Stars`).value,
    $(`${which}Division`).value
  );
}

function updateCalculator() {
  updateRankControls("current");
  updateRankControls("target");

  const start = getProgress("current");
  const target = getProgress("target");
  const service = $("serviceType").value;

  const startLabel = rankLabel(
    $("currentRank").value,
    $("currentDivision").value,
    $("currentStars").value
  );

  const targetLabel = rankLabel(
    $("targetRank").value,
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

function selectService(service) {
  $("serviceType").value = service;

  const isGendong = service === "gendong";

  $("gendongFields").hidden = !isGendong;
  $("playerId").required = isGendong;
  $("playerName").required = isGendong;

  document.querySelectorAll(".service-card").forEach(card => {
    card.classList.toggle(
      "active",
      card.dataset.service === service
    );
  });

  updateCalculator();
}

function openPaymentModal() {
  $("paymentModal").hidden = false;
  document.body.classList.add("modal-open");
}

function closePaymentModal() {
  $("paymentModal").hidden = true;
  document.body.classList.remove("modal-open");
}

function createOrder(event) {
  event.preventDefault();

  const customerName = $("customerName").value.trim();
  const service = $("serviceType").value;
  const playerId = $("playerId").value.trim();
  const playerName = $("playerName").value.trim();
  const notes = $("notes").value.trim();

  if (!customerName) {
    toast("Isi nama pemesan terlebih dahulu.");
    return;
  }

  if (service === "gendong" && (!playerId || !playerName)) {
    toast("Isi ID Game dan Name ML terlebih dahulu.");
    return;
  }

  updateCalculator();

  const start = getProgress("current");
  const target = getProgress("target");

  if (target <= start || latestPrice <= 0) {
    toast("Rank tujuan harus lebih tinggi dari rank awal.");
    return;
  }

  const startLabel = rankLabel(
    $("currentRank").value,
    $("currentDivision").value,
    $("currentStars").value
  );

  const targetLabel = rankLabel(
    $("targetRank").value,
    $("targetDivision").value,
    $("targetStars").value
  );

  const serviceName =
    service === "gendong" ? "Joki Gendong" : "Joki Rank";

  latestOrder = {
    serviceName,
    customerName,
    playerId,
    playerName,
    startLabel,
    targetLabel,
    notes,
    price: latestPrice,
    priceText: rupiah(latestPrice)
  };

  let summary =
    `Layanan: ${serviceName}\n` +
    `Nama pemesan: ${customerName}\n`;

  if (service === "gendong") {
    summary +=
      `ID Game: ${playerId}\n` +
      `Name ML: ${playerName}\n`;
  }

  summary +=
    `Rank awal: ${startLabel}\n` +
    `Rank tujuan: ${targetLabel}\n` +
    `Catatan: ${notes || "-"}\n\n` +
    `TOTAL HARGA: ${rupiah(latestPrice)}`;

  $("paymentOrderSummary").textContent = summary;
  $("paymentTotal").textContent = rupiah(latestPrice);

  openPaymentModal();
}

function confirmPayment() {
  if (!latestOrder) {
    toast("Buat pesanan terlebih dahulu.");
    return;
  }

  const order = latestOrder;

  let message =
    `Halo Admin LIXERA JOKI, saya ingin konfirmasi pesanan.\n\n` +
    `Layanan: ${order.serviceName}\n` +
    `Nama pemesan: ${order.customerName}\n`;

  if (order.serviceName === "Joki Gendong") {
    message +=
      `ID Game: ${order.playerId}\n` +
      `Name ML: ${order.playerName}\n`;
  }

  message +=
    `Rank awal: ${order.startLabel}\n` +
    `Rank tujuan: ${order.targetLabel}\n` +
    `Catatan: ${order.notes || "-"}\n` +
    `TOTAL HARGA: ${order.priceText}\n\n` +
    `Saya ingin memesan layanan tersebut. Mohon konfirmasi pesanan saya.`;

  const url =
    `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
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

  [
    `${which}Rank`,
    `${which}Division`,
    `${which}Stars`
  ].forEach(id => {
    $(id).addEventListener("input", updateCalculator);
    $(id).addEventListener("change", updateCalculator);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupStarButtons("current");
  setupStarButtons("target");

  document.querySelectorAll(".service-card").forEach(card => {
    card.addEventListener("click", () => {
      selectService(card.dataset.service);
    });
  });

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
    if (
      event.key === "Escape" &&
      !$("paymentModal").hidden
    ) {
      closePaymentModal();
    }
  });

  selectService("ranked");
  updateCalculator();
});
    
