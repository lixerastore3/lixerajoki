
/* ==========================================
   LIXERA JOKI — SCRIPT.JS
   WhatsApp utama & cadangan
========================================== */

const WA_UTAMA = "6285212857920";
const WA_CADANGAN = "628818238236";

// true = order diarahkan ke nomor cadangan
// false = order diarahkan ke nomor utama
let gunakanNomorCadangan = false;

const $ = (id) => document.getElementById(id);

const form = $("orderForm");
const serviceType = $("serviceType");
const gendongFields = $("gendongFields");
const currentRank = $("currentRank");
const targetRank = $("targetRank");
const currentDivision = $("currentDivision");
const targetDivision = $("targetDivision");
const currentStars = $("currentStars");
const targetStars = $("targetStars");
const rankPrice = $("rankPrice");
const rankMessage = $("rankMessage");
const paymentModal = $("paymentModal");

let pesananTerakhir = null;

const urutanRank = [
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Honor",
  "Glory",
  "Immortal"
];

// Tarif contoh per bintang.
// Sesuaikan dengan daftar harga asli LIXERA JOKI.
const tarifRank = {
  Grandmaster: 3000,
  Epic: 5000,
  Legend: 7000,
  Mythic: 1000,
  Honor: 1500,
  Glory: 2000,
  Immortal: 2500
};

const tarifGendong = {
  Epic: 3000,
  Legend: 5000,
  Mythic: 7000,
  Honor: 10000,
  Glory: 15000,
  Immortal: 20000
};

function rupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(angka);
}

function getNomorWhatsApp() {
  return gunakanNomorCadangan
    ? WA_CADANGAN
    : WA_UTAMA;
}

function bukaWhatsApp(pesan) {
  const nomor = getNomorWhatsApp();
  const url =
    "https://wa.me/" +
    nomor +
    "?text=" +
    encodeURIComponent(pesan);

  window.open(url, "_blank");
}

function pilihLayanan(jenis) {
  serviceType.value = jenis;

  document.querySelectorAll("[data-service]").forEach((tombol) => {
    tombol.classList.toggle(
      "active",
      tombol.dataset.service === jenis
    );
  });

  if (gendongFields) {
    gendongFields.hidden = jenis !== "gendong";
  }

  hitungHarga();
}

document.querySelectorAll("[data-service]").forEach((tombol) => {
  tombol.addEventListener("click", () => {
    pilihLayanan(tombol.dataset.service);
  });
});

function nilaiRank(rank, divisi, bintang) {
  const index = urutanRank.indexOf(rank);

  if (index < 0) return 0;

  // Perkiraan urutan untuk estimasi harga.
  const nilaiDivisi = Math.max(
    1,
    Math.min(5, Number(divisi) || 5)
  );

  if (rank === "Grandmaster") {
    return index * 25 + (5 - nilaiDivisi) * 5 +
      Number(bintang || 0);
  }

  if (rank === "Epic" || rank === "Legend") {
    return index * 25 + (5 - nilaiDivisi) * 5 +
      Number(bintang || 0);
  }

  return index * 25 + Number(bintang || 0);
}

function formatRank(rank, divisi, bintang) {
  if (["Grandmaster", "Epic", "Legend"].includes(rank)) {
    return `${rank} ${["V", "IV", "III", "II", "I"][
      5 - Number(divisi || 5)
    ] || "V"} (${bintang} bintang)`;
  }

  return `${rank} (${bintang} bintang)`;
}

function hitungHarga() {
  if (
    !currentRank ||
    !targetRank ||
    !currentStars ||
    !targetStars
  ) return 0;

  const awal = nilaiRank(
    currentRank.value,
    currentDivision.value,
    currentStars.value
  );

  const tujuan = nilaiRank(
    targetRank.value,
    targetDivision.value,
    targetStars.value
  );

  if (serviceType.value === "gendong") {
    const harga = tarifGendong[targetRank.value] || 0;

    rankPrice.textContent = rupiah(harga);
    rankMessage.textContent =
      "Estimasi tarif joki gendong. Konfirmasi harga dengan admin.";

    return harga;
  }

  if (tujuan <= awal) {
    rankPrice.textContent = rupiah(0);
    rankMessage.textContent =
      "Target harus lebih tinggi daripada rank awal.";
    return 0;
  }

  const jumlahBintang = tujuan - awal;
  const hargaPerBintang = tarifRank[targetRank.value] || 0;
  const harga = jumlahBintang * hargaPerBintang;

  rankPrice.textContent = rupiah(harga);
  rankMessage.textContent =
    `${jumlahBintang} poin progres × ${rupiah(hargaPerBintang)}. ` +
    "Estimasi, harga final dikonfirmasi admin.";

  return harga;
}

function ubahBintang(id, perubahan) {
  const input = $(id);
  if (!input) return;

  const minimum = Number(input.min || 0);
  const maksimum = Number(input.max || 24);

  input.value = Math.max(
    minimum,
    Math.min(maksimum, Number(input.value || 0) + perubahan)
  );

  hitungHarga();
}

$("currentMinus")?.addEventListener("click", () =>
  ubahBintang("currentStars", -1)
);

$("currentPlus")?.addEventListener("click", () =>
  ubahBintang("currentStars", 1)
);

$("targetMinus")?.addEventListener("click", () =>
  ubahBintang("targetStars", -1)
);

$("targetPlus")?.addEventListener("click", () =>
  ubahBintang("targetStars", 1)
);

[
  "currentRank",
  "targetRank",
  "currentDivision",
  "targetDivision",
  "currentStars",
  "targetStars"
].forEach((id) => {
  $(id)?.addEventListener("change", hitungHarga);
  $(id)?.addEventListener("input", hitungHarga);
});

function tampilkanPesan(message) {
  const toast = $("toast");

  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    alert(message);
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const nama = $("customerName").value.trim();
  const jenis = serviceType.value;
  const harga = hitungHarga();

  if (!nama) {
    tampilkanPesan("Masukkan nama pemesan terlebih dahulu.");
    return;
  }

  if (harga <= 0) {
    tampilkanPesan("Periksa kembali target rank dan estimasi harga.");
    return;
  }

  const awal = formatRank(
    currentRank.value,
    currentDivision.value,
    currentStars.value
  );

  const tujuan = formatRank(
    targetRank.value,
    targetDivision.value,
    targetStars.value
  );

  const detail = [
    "HALO ADMIN LIXERA JOKI!",
    "",
    "Saya ingin memesan layanan.",
    `Nama: ${nama}`,
    `Layanan: ${jenis === "ranked" ? "Joki Rank" : "Joki Gendong"}`,
    `Rank awal: ${awal}`,
    `Target: ${tujuan}`
  ];

  if (jenis === "gendong") {
    detail.push(
      `ID Game: ${$("playerId").value.trim() || "-"}`,
      `Nama akun ML: ${$("playerName").value.trim() || "-"}`
    );
  }

  detail.push(
    `Estimasi harga: ${rupiah(harga)}`,
    `Catatan: ${$("notes").value.trim() || "-"}`,
    "",
    "Mohon konfirmasi harga dan instruksi pembayaran."
  );

  pesananTerakhir = {
    nama,
    jenis,
    harga,
    pesan: detail.join("\n")
  };

  if ($("paymentTotal")) {
    $("paymentTotal").textContent = rupiah(harga);
  }

  if ($("paymentOrderSummary")) {
    $("paymentOrderSummary").textContent = detail.join("\n");
  }

  if (paymentModal) {
    paymentModal.hidden = false;
  } else {
    bukaWhatsApp(pesananTerakhir.pesan);
  }
});

function tutupModal() {
  if (paymentModal) paymentModal.hidden = true;
}

$("closePaymentModal")?.addEventListener("click", tutupModal);
$("paymentBackdrop")?.addEventListener("click", tutupModal);

$("confirmPaymentButton")?.addEventListener("click", () => {
  if (!pesananTerakhir) {
    tampilkanPesan("Silakan buat pesanan terlebih dahulu.");
    return;
  }

  bukaWhatsApp(
    pesananTerakhir.pesan +
    "\n\nSaya akan mengirim bukti pembayaran setelah membayar."
  );
});

hitungHarga();
    
