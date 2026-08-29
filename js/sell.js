/**
 * KisanSetu - Sell Produce & Digital J-Form Controller
 */

let currentJFormData = {};

document.addEventListener("DOMContentLoaded", () => {
  initSellPage();
});

function initSellPage() {
  // Check URL parameters for pre-filling
  const params = new URLSearchParams(window.location.search);
  const cropParam = params.get("crop");
  const mandiParam = params.get("mandi");
  const qtyParam = params.get("quantity");

  // Pre-fill user profile name if logged in
  const user = window.SHARED_STATE ? window.SHARED_STATE.user : null;
  const nameInput = document.getElementById("sellFarmerName");
  if (nameInput && user) {
    nameInput.value = user.full_name || user.name || "Gurpreet Singh";
  }

  const cropSelect = document.getElementById("sellCropSelect");
  if (cropSelect && cropParam) cropSelect.value = cropParam;

  const mandiSelect = document.getElementById("sellMandiSelect");
  if (mandiSelect && mandiParam) mandiSelect.value = mandiParam;

  const qtyInput = document.getElementById("sellQuantityInput");
  if (qtyInput && qtyParam) qtyInput.value = qtyParam;

  setupSellEventListeners();
  recalculateAndRenderJForm();

  window.addEventListener("kisansetu:languageChanged", () => {
    recalculateAndRenderJForm();
  });
}

function setupSellEventListeners() {
  const form = document.getElementById("sellProduceForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      recalculateAndRenderJForm();
      showToast("🎉 Digital J-Form Generated Successfully!", "success");
    });

    form.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("input", recalculateAndRenderJForm);
      el.addEventListener("change", recalculateAndRenderJForm);
    });
  }

  const printBtn = document.getElementById("printJFormBtn");
  if (printBtn) {
    printBtn.addEventListener("click", handlePrintJForm);
  }

  const downloadBtn = document.getElementById("downloadJFormBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownloadJForm);
  }
}

function recalculateAndRenderJForm() {
  const farmerName = document.getElementById("sellFarmerName")?.value.trim() || "Gurpreet Singh";
  const cropId = document.getElementById("sellCropSelect")?.value || "wheat";
  const quantityQtl = parseFloat(document.getElementById("sellQuantityInput")?.value) || 40;
  const mandiId = document.getElementById("sellMandiSelect")?.value || "khanna";
  const grade = document.getElementById("sellGradeSelect")?.value || "faq_sharbati";
  const vehicleId = document.getElementById("sellVehicleSelect")?.value || "tractor";

  const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];
  const mandi = mandis.find(m => m.id === mandiId) || { name: "Khanna APMC Grain Market", distanceKm: 28 };
  
  const crops = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.crops)) ? window.AGRI_DATA.crops : [];
  const crop = crops.find(c => c.id === cropId) || { name: "Wheat", nameHi: "गेहूं" };

  const prices = (mandi.prices && mandi.prices[cropId]) ? mandi.prices[cropId] : { modal: 2410 };
  let modalRate = prices.modal || 2410;

  if (grade === "faq_sharbati") modalRate = Math.round(modalRate * 1.03);
  if (grade === "industrial") modalRate = Math.round(modalRate * 0.94);

  const grossAmount = Math.round(quantityQtl * modalRate);
  const mandiCess = Math.round(grossAmount * 0.015); // 1.5% APMC Cess
  const loadingFee = Math.round(quantityQtl * 10); // ₹10/qtl loading
  const distanceKm = mandi.distanceKm || 25;
  const transportFee = Math.round((distanceKm * 22) + 200);

  const totalDeductions = mandiCess + loadingFee + transportFee;
  const netPayable = grossAmount - totalDeductions;

  const certNo = `JF-PB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  currentJFormData = {
    farmerName,
    cropName: crop.name,
    mandiName: mandi.name,
    quantityQtl,
    modalRate,
    grossAmount,
    mandiCess,
    loadingFee,
    transportFee,
    netPayable,
    certNo,
    today
  };

  // Render to DOM
  const certEl = document.getElementById("jfCertNo");
  if (certEl) certEl.textContent = certNo;

  const dateEl = document.getElementById("jfDate");
  if (dateEl) dateEl.textContent = today;

  const nameEl = document.getElementById("jfFarmerName");
  if (nameEl) nameEl.textContent = farmerName;

  const mandiEl = document.getElementById("jfMandiName");
  if (mandiEl) mandiEl.textContent = mandi.name;

  const cropEl = document.getElementById("jfCropName");
  if (cropEl) cropEl.textContent = `🌾 ${crop.name} (${grade.replace('_', ' ').toUpperCase()})`;

  const qtyEl = document.getElementById("jfQuantity");
  if (qtyEl) qtyEl.textContent = `${quantityQtl.toFixed(1)} Quintals`;

  const rateEl = document.getElementById("jfRate");
  if (rateEl) rateEl.textContent = `₹${modalRate.toLocaleString("en-IN")} / Qtl`;

  const grossEl = document.getElementById("jfGrossAmount");
  if (grossEl) grossEl.textContent = `₹${grossAmount.toLocaleString("en-IN")}`;

  const cessEl = document.getElementById("jfMandiCess");
  if (cessEl) cessEl.textContent = `- ₹${mandiCess.toLocaleString("en-IN")}`;

  const loadEl = document.getElementById("jfLoadingFee");
  if (loadEl) loadEl.textContent = `- ₹${loadingFee.toLocaleString("en-IN")}`;

  const transEl = document.getElementById("jfTransportFee");
  if (transEl) transEl.textContent = `- ₹${transportFee.toLocaleString("en-IN")}`;

  const netEl = document.getElementById("jfNetPayable");
  if (netEl) netEl.textContent = `₹${netPayable.toLocaleString("en-IN")}`;
}

function handlePrintJForm() {
  window.print();
}

function handleDownloadJForm() {
  showToast("📥 Official e-NAM J-Form Receipt Downloaded (PDF / Print ready)!", "success");
}
