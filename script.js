
const ADMIN_WA = "628818238317";

const rankPrices = {
  ranked: {
    "Grandmaster": 5000,
    "Epic": 6000,
    "Legend": 8000,
    "Mythic": 17000,
    "Honor": 20000,
    "Glory": 25000,
    "Immortal": 32000
  },
  gendong: {
    "Grandmaster": 7000,
    "Epic": 8000,
    "Legend": 10000,
    "Mythic": 20000,
    "Honor": 23000,
    "Glory": 28000,
    "Immortal": 25000
  }
};

const rankImages = {
  "Grandmaster": "Granpmaster.jpg",
  "Epic": "Efic.jpg",
  "Legend": "Legend.jpg",
  "Mythic": "Mythic.jpg",
  "Honor": "Honor.jpg",
  "Glory": "Glory.jpg",
  "Immortal": "Immortal.jpg"
};

// Urutan bintang untuk kalkulator.
// GM, Epic, dan Legend masing-masing terdiri dari 25 bintang.
// Mythic 0–24, Honor 25–49, Glory 50–99, Immortal 100+.
function rankProgress(rank, stars) {
  const base = {
    "Grandmaster": 0,
    "Epic": 25,
    "Legend": 50,
    "Mythic": 75,
    "Honor": 100,
    "Glory": 125,
    "Immortal": 175
  };

  return (base[rank] ?? 0) + Number(stars || 0);
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

function getRankFromProgress(progress) {
  if (progress < 25) return "Grandmaster";
  if (progress < 50) return "Epic";
  if (progress < 75) return "Legend";
  if (progress < 100) return "Mythic";
  if (progress < 125) return "Honor";
  if (progress < 175) return "Glory";
  return "Immortal";
}

function getStarPrice(service, progress) {
  const rank = getRankFromProgress(progress);
  return rankPrices[service]?.[rank] ?? 0;
}

function calculateRankPrice(service, startProgress, targetProgress) {
  if (!rankPrices[service]) return null;
  if (targetProgress <= startProgress) return 0;

  let total = 0;

  for (let star = startProgress; star < targetProgress; star++) {
    total += getStarPrice(service, star);
  }

  return total;
}

function getValue(id) {
  return document.getElementById(id)?.value;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function updateRankImage(id, rank) {
  const image = document.getElementById(id);
  if (image && rankImages[rank]) {
    image.src = rankImages[rank];
    image.alt = rank;
  }
}

function updateRankCalculator() {
  const currentRank = getValue("currentRank");
  const targetRank = getValue("targetRank");
  const currentStars = Number(getValue("currentStars") || 0);
  const targetStars = Number(getValue("targetStars") || 0);

  if (!currentRank || !targetRank) return;

  const serviceElement = document.querySelector(
    '[data-service].active, [data-service][aria-pressed="true"]'
  );

  const service = serviceElement?.dataset.service || "ranked";

  if (!rankPrices[service]) {
    setText("rankPrice", "Hubungi admin");
    setText("rankMessage", "Harga layanan ini dikonfirmasi oleh admin.");
    return;
  }

  const start = rankProgress(currentRank, currentStars);
  const target = rankProgress(targetRank, targetStars);

  updateRankImage("currentRankImage", currentRank);
  updateRankImage("targetRankImage", targetRank);

  if (target <= start) {
    setText("rankPrice", "Rp0");
    setText("rankMessage", "Pilih rank tujuan yang lebih tinggi dari rank awal.");
    return;
  }

  const price = calculateRankPrice(service, start, target);
  setText("rankPrice", formatRupiah(price));
  setText(
    "rankMessage",
    `${currentRank} ${currentStars} bintang → ${targetRank} ${targetStars} bintang`
  );
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  } else {
    alert(message);
  }
}

function openWhatsApp(message) {
  const url =
    `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

function setupRankCalculator() {
  [
    "currentRank",
    "targetRank",
    "currentStars",
    "targetStars",
    "expressCheck"
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateRankCalculator);
    document.getElementById(id)?.addEventListener("input", updateRankCalculator);
  });

  document.getElementById("currentMinus")?.addEventListener("click", () => {
    const input = document.getElementById("currentStars");
    if (!input) return;
    input.value = Math.max(0, Number(input.value || 0) - 1);
    updateRankCalculator();
  });

  document.getElementById("currentPlus")?.addEventListener("click", () => {
    const input = document.getElementById("currentStars");
    if (!input) return;
    input.value = Number(input.value || 0) + 1;
    updateRankCalculator();
  });

  document.getElementById("targetMinus")?.addEventListener("click", () => {
    const input = document.getElementById("targetStars");
    if (!input) return;
    input.value = Math.max(0, Number(input.value || 0) - 1);
    updateRankCalculator();
  });

  document.getElementById("targetPlus")?.addEventListener("click", () => {
    const input = document.getElementById("targetStars");
    if (!input) return;
    input.value = Number(input.value || 0) + 1;
    updateRankCalculator();
  });

  document.querySelectorAll("[data-service]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-service]").forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      updateRankCalculator();
    });
  });

  document.getElementById("orderRankButton")?.addEventListener("click", () => {
    updateRankCalculator();

    const currentRank = getValue("currentRank") || "Belum dipilih";
    const targetRank = getValue("targetRank") || "Belum dipilih";
    const currentStars = getValue("currentStars") || "0";
    const targetStars = getValue("targetStars") || "0";
    const price = document.getElementById("rankPrice")?.textContent || "Tanya admin";

    openWhatsApp(
      `Halo Admin LIXERA JOKI!\n\nSaya ingin order joki rank.\nRank awal: ${currentRank} ${currentStars} bintang\nRank tujuan: ${targetRank} ${targetStars} bintang\nEstimasi harga: ${price}\n\nMohon konfirmasi order saya.`
    );
  });

  updateRankCalculator();
}

function setupOrderForm() {
  const form = document.getElementById("orderForm");

  form?.addEventListener("submit", event => {
    event.preventDefault();

    const playerId = getValue("playerId") || "";
    const serverId = getValue("serverId") || "";
    const playerName = getValue("playerName") || "";
    const contact = getValue("contact") || "";
    const notes = getValue("notes") || "";
    const selectedName = getValue("selectedName") || "Layanan belum dipilih";
    const selectedPrice = getValue("selectedPrice") || "Tanya admin";

    if (!playerId.trim() || !playerName.trim()) {
      showToast("Isi ID game dan nama akun terlebih dahulu.");
      return;
    }

    const message =
      `Halo Admin LIXERA JOKI!\n\n` +
      `Saya ingin order layanan.\n` +
      `Layanan: ${selectedName}\n` +
      `Harga: ${selectedPrice}\n` +
      `ID Game: ${playerId}\n` +
      `Server: ${serverId || "-"}\n` +
      `Nama akun: ${playerName}\n` +
      `Kontak: ${contact || "-"}\n` +
      `Catatan: ${notes || "-"}\n\n` +
      `Mohon konfirmasi pesanan saya.`;

    openWhatsApp(message);
  });
}

function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    document.querySelectorAll(
      "[data-search], .service-card, .product-card, [data-product]"
    ).forEach(card => {
      const text = (
        card.dataset.search ||
        card.textContent ||
        ""
      ).toLowerCase();

      card.hidden = query !== "" && !text.includes(query);
    });
  });
}

function setupNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function setupCheckoutButtons() {
  document.querySelectorAll(".checkoutButton, #checkoutButton").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(
        ".product-card, [data-product], .service-card"
      );

      const name =
        card?.dataset.name ||
        card?.querySelector("h2, h3, h4")?.textContent?.trim() ||
        "Layanan LIXERA JOKI";

      const price =
        card?.dataset.price ||
        card?.querySelector(".price, .product-price")?.textContent?.trim() ||
        "Konfirmasi harga ke admin";

      const selectedName = document.getElementById("selectedName");
      const selectedPrice = document.getElementById("selectedPrice");

      if (selectedName) selectedName.value = name;
      if (selectedPrice) selectedPrice.value = price;

      const form = document.getElementById("orderForm");

      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        showToast(`Layanan dipilih: ${name}`);
      } else {
        openWhatsApp(
          `Halo Admin LIXERA JOKI!\nSaya ingin order ${name}.\nHarga: ${price}\nMohon konfirmasi.`
        );
      }
    });
  });
}

function setupHistoryButton() {
  document.getElementById("historyButton")?.addEventListener("click", () => {
    showToast("Riwayat order dapat ditanyakan kepada admin melalui WhatsApp.");
    openWhatsApp("Halo Admin LIXERA JOKI, saya ingin mengecek riwayat order.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupRankCalculator();
  setupOrderForm();
  setupSearch();
  setupNavigation();
  setupCheckoutButtons();
  setupHistoryButton();
});
      
