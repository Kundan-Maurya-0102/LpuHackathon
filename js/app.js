/**
 * KisanSetu - Main Application Coordinator & Controller
 * Controls state, modals, events, filters, and audio/visual interactions.
 */

const APP_STATE = {
  user: null,
  selectedLanguage: "hi",
  selectedCropId: "wheat",
  selectedCategory: "all",
  searchQuery: "",
  selectedMandiId: "khanna",
  selectedVehicleId: "tractor",
  harvestQuantityQtl: 30,
  maxSearchRadiusKm: 100,
  userLocation: {
    lat: 31.2550,
    lng: 75.7050,
    name: "Phagwara / Jalandhar, Punjab (Near LPU)",
    state: "Punjab",
    district: "Kapurthala"
  },
  alerts: [...AGRI_DATA.sampleAlerts],
  theme: "light"
};

window.appState = APP_STATE;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // Check stored preferences
  const storedUser = localStorage.getItem("kisansetu_user");
  const storedLang = localStorage.getItem("kisansetu_lang");
  const storedTheme = localStorage.getItem("kisansetu_theme");

  if (storedLang) {
    APP_STATE.selectedLanguage = storedLang;
    if (window.i18n) window.i18n.setLanguage(storedLang);
  }

  if (storedTheme) {
    APP_STATE.theme = storedTheme;
    document.documentElement.setAttribute("data-theme", storedTheme);
  }

  // Setup Event Listeners
  setupEventListeners();

  // Show Language Modal first if not selected, or Auth Modal if not logged in
  if (!storedLang) {
    showLanguageModal();
  } else if (!storedUser) {
    showAuthModal();
  } else {
    APP_STATE.user = JSON.parse(storedUser);
    renderUserUI();
    hideAllModals();
    renderAllViews();
  }

  // Live timestamp ticker update
  updateLiveTimestamp();
}

function setupEventListeners() {
  // Language Select Cards in Onboarding Modal
  document.querySelectorAll(".lang-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".lang-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      const lang = card.getAttribute("data-lang");
      APP_STATE.selectedLanguage = lang;
      if (window.i18n) window.i18n.setLanguage(lang);
    });
  });

  // Language Audio Preview Button in modal
  const langSpeakerBtn = document.getElementById("langSpeakerBtn");
  if (langSpeakerBtn) {
    langSpeakerBtn.addEventListener("click", () => {
      const prompts = {
        hi: "नमस्ते किसान भाई, किसान सेतु में आपका स्वागत है।",
        pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ, ਕਿਸਾਨ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।",
        en: "Welcome to KisanSetu, your smart mandi price discovery platform.",
        mr: "नमस्कार शेतकरी बंधूंनो, किसान सेतू मध्ये आपले स्वागत आहे.",
        gu: "નમસ્તે ખેડૂત મિત્રો, કિસાન સેતુમાં તમારું સ્વાગત છે.",
        te: "రైతు సోదరులకు నమస్కారం, కిసాన్ సేతుకు స్వాగతం.",
        ta: "வணக்கம் விவசாய நண்பர்களே, கிசான் சேதுவிற்கு நல்வரவு.",
        bn: "নমস্কার কৃষক ভাই, কিষান সেতুতে আপনাকে স্বাগতম।"
      };
      const text = prompts[APP_STATE.selectedLanguage] || prompts["hi"];
      window.speechEngine.speak(text, APP_STATE.selectedLanguage);
    });
  }

  // Language Modal Confirm Button
  const confirmLangBtn = document.getElementById("confirmLangBtn");
  if (confirmLangBtn) {
    confirmLangBtn.addEventListener("click", () => {
      hideModal("langModal");
      if (!APP_STATE.user) {
        showAuthModal();
      } else {
        renderAllViews();
      }
    });
  }

  // Header Language Switcher Dropdown
  const headerLangSelect = document.getElementById("headerLangSelect");
  if (headerLangSelect) {
    headerLangSelect.value = APP_STATE.selectedLanguage;
    headerLangSelect.addEventListener("change", (e) => {
      const lang = e.target.value;
      APP_STATE.selectedLanguage = lang;
      if (window.i18n) window.i18n.setLanguage(lang);
      renderAllViews();
    });
  }

  // 1-Click Demo Login Button
  const demoLoginBtn = document.getElementById("demoLoginBtn");
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", () => {
      loginFarmer({
        name: "Ramesh Kumar (ਰਮੇਸ਼ ਕੁਮਾਰ)",
        phone: "+91 98765 43210",
        state: "Punjab",
        district: "Kapurthala",
        village: "Near Phagwara, LPU Region",
        crops: ["Wheat", "Basmati Paddy", "Potato"]
      });
    });
  }

  // Guest Login Button
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener("click", () => {
      loginFarmer({
        name: "Kisan Guest",
        phone: "+91 99999 00000",
        state: "Punjab",
        district: "Jalandhar",
        village: "Village Farm",
        crops: ["Wheat", "Mustard"]
      });
    });
  }

  // Phone OTP Flow
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const phoneInput = document.getElementById("phoneInput");
  const otpSection = document.getElementById("otpSection");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", () => {
      const phone = phoneInput ? phoneInput.value.trim() : "";
      if (phone.length < 10) {
        showToast("कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Enter 10-digit mobile number)", "error");
        return;
      }
      otpSection.style.display = "block";
      sendOtpBtn.style.display = "none";
      showToast("✅ OTP भेजा गया: 1234 (Demo OTP: 1234)", "success");
      document.getElementById("otpInput").value = "1234";
    });
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener("click", () => {
      const phone = phoneInput.value.trim() || "+91 98765 12345";
      loginFarmer({
        name: "Kisan Brother",
        phone: phone,
        state: "Punjab",
        district: "Ludhiana",
        village: "Agro Farm",
        crops: ["Wheat", "Paddy"]
      });
    });
  }

  // Search Input for Crops
  const cropSearchInput = document.getElementById("cropSearchInput");
  if (cropSearchInput) {
    cropSearchInput.addEventListener("input", (e) => {
      APP_STATE.searchQuery = e.target.value.toLowerCase().trim();
      renderCropCatalog();
    });
  }

  // Voice Search Button
  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  if (voiceSearchBtn) {
    voiceSearchBtn.addEventListener("click", () => {
      window.speechEngine.toggleVoiceSearch();
    });
  }

  // Category Filter Pills
  document.querySelectorAll(".category-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      APP_STATE.selectedCategory = pill.getAttribute("data-category");
      renderCropCatalog();
    });
  });

  // GPS Auto-Detect Location Button
  const detectLocationBtn = document.getElementById("detectLocationBtn");
  if (detectLocationBtn) {
    detectLocationBtn.addEventListener("click", handleLocationAutoDetect);
  }

  // Radius Slider
  const radiusSlider = document.getElementById("radiusSlider");
  const radiusValue = document.getElementById("radiusValue");
  if (radiusSlider) {
    radiusSlider.addEventListener("input", (e) => {
      APP_STATE.maxSearchRadiusKm = parseInt(e.target.value);
      if (radiusValue) radiusValue.textContent = `${APP_STATE.maxSearchRadiusKm} km`;
      renderMandiComparison();
    });
  }

  // Quantity Input in Calculator
  const quantityInput = document.getElementById("quantityInput");
  const quantityUnitSelect = document.getElementById("quantityUnitSelect");
  if (quantityInput) {
    quantityInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value) || 1;
      if (quantityUnitSelect && quantityUnitSelect.value === "bags") {
        val = val * 0.5; // 50kg bag = 0.5 quintal
      }
      APP_STATE.harvestQuantityQtl = val;
      updateCalculatorView();
    });
  }

  if (quantityUnitSelect) {
    quantityUnitSelect.addEventListener("change", () => {
      let rawVal = parseFloat(quantityInput.value) || 1;
      if (quantityUnitSelect.value === "bags") {
        APP_STATE.harvestQuantityQtl = rawVal * 0.5;
      } else {
        APP_STATE.harvestQuantityQtl = rawVal;
      }
      updateCalculatorView();
    });
  }

  // Calculator Vehicle Selection
  document.querySelectorAll(".vehicle-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".vehicle-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      APP_STATE.selectedVehicleId = card.getAttribute("data-vehicle");
      updateCalculatorView();
    });
  });

  // Price History Tab Buttons
  document.querySelectorAll(".period-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const period = btn.getAttribute("data-period");
      window.priceChart.renderChart(APP_STATE.selectedCropId, period);
    });
  });

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Price Alert Modal Form
  const saveAlertBtn = document.getElementById("saveAlertBtn");
  if (saveAlertBtn) {
    saveAlertBtn.addEventListener("click", handleSavePriceAlert);
  }

  // Notification Bell Click
  const notificationBellBtn = document.getElementById("notificationBellBtn");
  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", () => {
      showModal("alertModal");
      renderAlertsList();
    });
  }
}

function loginFarmer(userData) {
  APP_STATE.user = userData;
  localStorage.setItem("kisansetu_user", JSON.stringify(userData));
  hideModal("authModal");
  renderUserUI();
  renderAllViews();
  showToast(`🌾 राम राम ${userData.name}! Welcome to KisanSetu`, "success");
}

function logoutFarmer() {
  localStorage.removeItem("kisansetu_user");
  APP_STATE.user = null;
  showAuthModal();
}

function renderUserUI() {
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay && APP_STATE.user) {
    userNameDisplay.textContent = APP_STATE.user.name;
  }
  const userLocDisplay = document.getElementById("currentLocationDisplay");
  if (userLocDisplay) {
    userLocDisplay.textContent = APP_STATE.userLocation.name;
  }
}

function showLanguageModal() {
  showModal("langModal");
}

function showAuthModal() {
  showModal("authModal");
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    modal.style.display = "flex";
  }
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    modal.style.display = "none";
  }
}

function hideAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.classList.remove("open");
    m.style.display = "none";
  });
}

function renderAllViews() {
  if (window.i18n) window.i18n.applyTranslations();
  renderCropCatalog();
  renderBestMandiRecommendation();
  renderMandiComparison();
  updateCalculatorView();
  renderWeatherWidget();
  
  // Render Map and Charts
  setTimeout(() => {
    if (window.mandiMap) {
      window.mandiMap.initMap("mandiMap");
      window.mandiMap.renderFarmerLocation(APP_STATE.userLocation.name);
      window.mandiMap.renderMandiMarkers(APP_STATE.selectedCropId);
      window.mandiMap.drawRouteToMandi(APP_STATE.selectedMandiId);
    }
    if (window.priceChart) {
      window.priceChart.initChart("priceHistoryChart");
      window.priceChart.renderChart(APP_STATE.selectedCropId, "7d");
    }
  }, 200);
}

/**
 * Renders the Visual Crop Grid with real crop images & fallback handling
 */
function renderCropCatalog() {
  const container = document.getElementById("cropCatalogGrid");
  if (!container) return;

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";

  const filteredCrops = AGRI_DATA.crops.filter(crop => {
    // Category filter
    const matchesCategory = (APP_STATE.selectedCategory === "all") || (crop.category === APP_STATE.selectedCategory);
    
    // Search query filter
    const matchesSearch = !APP_STATE.searchQuery ||
      crop.name.toLowerCase().includes(APP_STATE.searchQuery) ||
      (crop.nameHi && crop.nameHi.toLowerCase().includes(APP_STATE.searchQuery)) ||
      (crop.namePa && crop.namePa.toLowerCase().includes(APP_STATE.searchQuery));

    return matchesCategory && matchesSearch;
  });

  if (filteredCrops.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No crops found matching "${APP_STATE.searchQuery}"</h3>
        <p>Try searching for Wheat, Basmati, Potato, Mustard, Cotton...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredCrops.map(crop => {
    const isSelected = crop.id === APP_STATE.selectedCropId;
    let localizedName = crop.name;
    if (currentLang === "hi" && crop.nameHi) localizedName = `${crop.nameHi} (${crop.name})`;
    if (currentLang === "pa" && crop.namePa) localizedName = `${crop.namePa} (${crop.name})`;

    return `
      <div class="crop-card ${isSelected ? 'selected' : ''}" onclick="selectCrop('${crop.id}')" id="crop_card_${crop.id}">
        <div class="crop-img-wrap">
          <img src="${crop.image}" alt="${crop.name}" class="crop-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
          <div class="crop-icon-fallback" style="display:none;">
            <span>${crop.fallbackIcon}</span>
          </div>
          <div class="crop-trend-badge ${crop.trendDirection}">
            <span>${crop.priceTrend}</span>
          </div>
        </div>
        <div class="crop-info">
          <h4 class="crop-name">${localizedName}</h4>
          <div class="crop-price-row">
            <span class="price-lbl">Avg Rate:</span>
            <span class="crop-price">₹${crop.allIndiaAvg}</span>
            <span class="crop-unit">/Qtl</span>
          </div>
          <div class="crop-grade-tag">${crop.grade}</div>
          <button class="btn-check-mandi">
            <span>${isSelected ? '✓ Selected (चुना गया)' : '🔍 Check Mandi Rates'}</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function selectCrop(cropId) {
  APP_STATE.selectedCropId = cropId;
  renderCropCatalog();
  renderBestMandiRecommendation();
  renderMandiComparison();
  updateCalculatorView();
  
  if (window.priceChart) {
    window.priceChart.renderChart(cropId, window.priceChart.currentPeriod);
  }
  if (window.mandiMap) {
    window.mandiMap.renderMandiMarkers(cropId);
  }

  // Smooth scroll to Mandi Rates section
  const section = document.getElementById("mandiComparisonSection");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const selectedCrop = AGRI_DATA.crops.find(c => c.id === cropId);
  showToast(`🌾 Selected: ${selectedCrop ? selectedCrop.name : cropId}`, "info");
}

/**
 * Computes and renders the AI Top Mandi Recommendation Banner
 */
function renderBestMandiRecommendation() {
  const container = document.getElementById("bestMandiBanner");
  if (!container) return;

  const result = window.profitCalculator.getBestMandiRecommendation(
    APP_STATE.selectedCropId,
    APP_STATE.selectedVehicleId,
    APP_STATE.harvestQuantityQtl
  );

  const best = result.bestMandi;
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  let mandiName = best.mandi.name;
  if (currentLang === "hi" && best.mandi.nameHi) mandiName = best.mandi.nameHi;
  if (currentLang === "pa" && best.mandi.namePa) mandiName = best.mandi.namePa;

  const cropName = (currentLang === "hi" && best.crop.nameHi) ? best.crop.nameHi : best.crop.name;

  container.innerHTML = `
    <div class="best-mandi-card">
      <div class="best-mandi-header">
        <div class="best-badge-glow">
          <span class="sparkle-icon">⭐</span>
          <span class="badge-text" data-i18n="bestMandiBadge">${window.i18n.t("bestMandiBadge")}</span>
        </div>
        <div class="verified-tag">🛡️ e-NAM Verified</div>
      </div>

      <div class="best-mandi-body">
        <div class="best-col-main">
          <h3 class="mandi-title">${mandiName}</h3>
          <p class="mandi-sub">${best.mandi.subText} • 📍 ${best.distanceKm} km (${best.mandi.travelTime})</p>
          <div class="mandi-facilities-pills">
            ${best.mandi.facilities.slice(0, 3).map(f => `<span class="fac-pill">✓ ${f}</span>`).join("")}
          </div>
        </div>

        <div class="best-col-metrics">
          <div class="metric-box green">
            <span class="m-lbl">Modal Rate (भाव)</span>
            <span class="m-val">₹${best.modalPrice}</span>
            <span class="m-unit">/ Quintal</span>
          </div>
          <div class="metric-box blue">
            <span class="m-lbl">Net Take-Home</span>
            <span class="m-val">₹${best.netPricePerQtl}</span>
            <span class="m-unit">/ Qtl after travel</span>
          </div>
          <div class="metric-box gold">
            <span class="m-lbl">Total Profit (${best.quantityQtl} Qtl)</span>
            <span class="m-val profit-highlight">₹${best.netProfit.toLocaleString("en-IN")}</span>
            <span class="m-unit">In-Hand Savings</span>
          </div>
        </div>
      </div>

      ${result.isDifferentFromNearest && result.extraProfit > 0 ? `
        <div class="extra-profit-banner">
          <span class="bulb-icon">💡</span>
          <span><strong>Kisan Profit Tip:</strong> By traveling ${best.distanceKm - result.nearestMandi.distanceKm} km extra to <strong>${mandiName}</strong>, you earn <strong>+₹${result.extraProfit.toLocaleString("en-IN")} EXTRA profit</strong> on your ${best.quantityQtl} quintals!</span>
        </div>
      ` : ''}

      <div class="best-mandi-footer">
        <button class="btn-action-primary" onclick="selectMandiForCalc('${best.mandi.id}')">
          <span>💰 Open Profit Calculator</span>
        </button>
        <button class="btn-action-secondary" onclick="viewMandiOnMap('${best.mandi.id}')">
          <span>🗺️ View Navigation Route</span>
        </button>
        <button class="btn-action-audio speak-btn" onclick="speakMandiDetails('${best.mandi.id}')">
          <span>🔊 Listen in Audio</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Side-by-side Mandi Price Comparison Cards
 */
function renderMandiComparison() {
  const container = document.getElementById("mandiComparisonCards");
  if (!container) return;

  const currentCrop = AGRI_DATA.crops.find(c => c.id === APP_STATE.selectedCropId) || AGRI_DATA.crops[0];
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  
  // Title update
  const cropTitleEl = document.getElementById("selectedCropComparisonTitle");
  if (cropTitleEl) {
    const name = (currentLang === "hi" && currentCrop.nameHi) ? currentCrop.nameHi : currentCrop.name;
    cropTitleEl.textContent = `${window.i18n.t("todayMandiRates")} ${name}`;
  }

  const mandisWithinRadius = AGRI_DATA.mandis.filter(m => m.distanceKm <= APP_STATE.maxSearchRadiusKm);

  if (mandisWithinRadius.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No mandis found within ${APP_STATE.maxSearchRadiusKm} km radius. Increase the search radius slider.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = mandisWithinRadius.map(mandi => {
    const profitCalc = window.profitCalculator.calculateMandiProfit(
      APP_STATE.selectedCropId,
      mandi.id,
      APP_STATE.selectedVehicleId,
      APP_STATE.harvestQuantityQtl
    );

    let mandiName = mandi.name;
    if (currentLang === "hi" && mandi.nameHi) mandiName = mandi.nameHi;
    if (currentLang === "pa" && mandi.namePa) mandiName = mandi.namePa;

    const isSelected = mandi.id === APP_STATE.selectedMandiId;

    return `
      <div class="mandi-card ${isSelected ? 'selected' : ''}" id="mandi_card_${mandi.id}">
        <div class="mandi-card-top">
          <div class="mandi-header-info">
            <h4 class="m-name">🏛️ ${mandiName}</h4>
            <span class="m-district">${mandi.district}, ${mandi.state} • ⭐ ${mandi.rating}</span>
          </div>
          <div class="m-distance-badge">
            <span class="dist-km">${mandi.distanceKm} km</span>
            <span class="dist-time">${mandi.travelTime}</span>
          </div>
        </div>

        <div class="price-breakdown-grid">
          <div class="price-pill min-pill">
            <span class="p-lbl">${window.i18n.t("minPrice")}</span>
            <span class="p-amt">₹${profitCalc.minPrice}</span>
          </div>
          <div class="price-pill modal-pill">
            <span class="p-lbl">${window.i18n.t("modalPrice")}</span>
            <span class="p-amt">₹${profitCalc.modalPrice}</span>
          </div>
          <div class="price-pill max-pill">
            <span class="p-lbl">${window.i18n.t("maxPrice")}</span>
            <span class="p-amt">₹${profitCalc.maxPrice}</span>
          </div>
        </div>

        <div class="mandi-calc-summary">
          <div class="summary-row">
            <span class="s-lbl">Est. Transport Cost:</span>
            <span class="s-val">₹${profitCalc.transportCost} (₹${profitCalc.transportPerQtl}/qtl)</span>
          </div>
          <div class="summary-row highlight">
            <span class="s-lbl">Net Take-Home Price:</span>
            <span class="s-val green">₹${profitCalc.netPricePerQtl} / Quintal</span>
          </div>
        </div>

        <div class="mandi-card-actions">
          <button class="mandi-btn primary" onclick="selectMandiForCalc('${mandi.id}')">
            <span>💰 Calculate (${profitCalc.quantityQtl} Qtl)</span>
          </button>
          <button class="mandi-btn secondary" onclick="viewMandiOnMap('${mandi.id}')">
            <span>🗺️ Map</span>
          </button>
          <button class="mandi-btn audio speak-btn" onclick="speakMandiDetails('${mandi.id}')" title="Listen price in your language">
            <span>🔊</span>
          </button>
        </div>

        <div class="mandi-card-footer">
          <span class="sync-time">🟢 Synced Today 06:30 AM</span>
          <span class="arrival-vol">📦 Arrival: ${mandi.prices[APP_STATE.selectedCropId] ? mandi.prices[APP_STATE.selectedCropId].arrivals : 'N/A'}</span>
        </div>
      </div>
    `;
  }).join("");
}

function selectMandiForCalc(mandiId) {
  APP_STATE.selectedMandiId = mandiId;
  updateCalculatorView();
  if (window.mandiMap) {
    window.mandiMap.drawRouteToMandi(mandiId);
  }
  
  // Scroll to calculator
  const calcSection = document.getElementById("calculatorSection");
  if (calcSection) {
    calcSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  showToast(`Selected Mandi for Profit Calculation`, "info");
}

function viewMandiOnMap(mandiId) {
  APP_STATE.selectedMandiId = mandiId;
  const mapSection = document.getElementById("mapSection");
  if (mapSection) {
    mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (window.mandiMap) {
    window.mandiMap.drawRouteToMandi(mandiId);
    window.mandiMap.invalidateSize();
  }
}

function windowSelectMandiFromMap(mandiId) {
  selectMandiForCalc(mandiId);
}
window.selectMandiFromMap = windowSelectMandiFromMap;

function speakMandiDetails(mandiId) {
  const mandi = AGRI_DATA.mandis.find(m => m.id === mandiId);
  const crop = AGRI_DATA.crops.find(c => c.id === APP_STATE.selectedCropId);
  if (!mandi || !crop) return;

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  const mandiName = (currentLang === "hi" && mandi.nameHi) ? mandi.nameHi : mandi.name;
  const cropName = (currentLang === "hi" && crop.nameHi) ? crop.nameHi : crop.name;

  const priceInfo = mandi.prices[crop.id] || { modal: 2400, min: 2300, max: 2500 };

  window.speechEngine.speakMandiRate(
    mandiName,
    cropName,
    priceInfo.modal,
    priceInfo.min,
    priceInfo.max,
    mandi.distanceKm
  );
}

/**
 * Updates the Transportation & Profit Calculator
 */
function updateCalculatorView() {
  const result = window.profitCalculator.calculateMandiProfit(
    APP_STATE.selectedCropId,
    APP_STATE.selectedMandiId,
    APP_STATE.selectedVehicleId,
    APP_STATE.harvestQuantityQtl
  );

  const mandiSelect = document.getElementById("calcMandiSelect");
  if (mandiSelect && mandiSelect.options.length === 0) {
    mandiSelect.innerHTML = AGRI_DATA.mandis.map(m => {
      return `<option value="${m.id}" ${m.id === APP_STATE.selectedMandiId ? 'selected' : ''}>${m.name} (${m.distanceKm} km)</option>`;
    }).join("");

    mandiSelect.addEventListener("change", (e) => {
      APP_STATE.selectedMandiId = e.target.value;
      updateCalculatorView();
      if (window.mandiMap) window.mandiMap.drawRouteToMandi(e.target.value);
    });
  }

  // Update Summary Numbers
  const grossEl = document.getElementById("calcGrossRevenue");
  const transportEl = document.getElementById("calcTransportCost");
  const cessEl = document.getElementById("calcMandiCess");
  const netEl = document.getElementById("calcNetProfit");
  const netPerQtlEl = document.getElementById("calcNetPerQtl");

  if (grossEl) grossEl.textContent = `₹${result.grossRevenue.toLocaleString("en-IN")}`;
  if (transportEl) transportEl.textContent = `- ₹${result.transportCost.toLocaleString("en-IN")}`;
  if (cessEl) cessEl.textContent = `- ₹${result.mandiCessFee.toLocaleString("en-IN")}`;
  if (netEl) netEl.textContent = `₹${result.netProfit.toLocaleString("en-IN")}`;
  if (netPerQtlEl) netPerQtlEl.textContent = `(₹${result.netPricePerQtl} per Quintal)`;

  // Update vehicle cards active state
  document.querySelectorAll(".vehicle-card").forEach(card => {
    if (card.getAttribute("data-vehicle") === APP_STATE.selectedVehicleId) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

/**
 * Live Weather & Transport Advisory Widget
 */
function renderWeatherWidget() {
  const weather = AGRI_DATA.weather;
  const tempEl = document.getElementById("weatherTemp");
  const condEl = document.getElementById("weatherCondition");
  const humidityEl = document.getElementById("weatherHumidity");
  const windEl = document.getElementById("weatherWind");
  const advisoryEl = document.getElementById("weatherAdvisoryText");
  const forecastGrid = document.getElementById("weatherForecastGrid");

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  let conditionText = weather.condition;
  if (currentLang === "hi" && weather.conditionHi) conditionText = weather.conditionHi;
  if (currentLang === "pa" && weather.conditionPa) conditionText = weather.conditionPa;

  if (tempEl) tempEl.textContent = `${weather.temp}°C`;
  if (condEl) condEl.textContent = `${weather.icon} ${conditionText}`;
  if (humidityEl) humidityEl.textContent = `${weather.humidity}%`;
  if (windEl) windEl.textContent = `${weather.windSpeed} km/h`;
  if (advisoryEl) advisoryEl.textContent = weather.advisoryText;

  if (forecastGrid) {
    forecastGrid.innerHTML = weather.forecast5Day.map(day => `
      <div class="forecast-day-card">
        <span class="f-day">${day.day}</span>
        <span class="f-icon">${day.icon}</span>
        <span class="f-temp">${day.temp}</span>
        <span class="f-desc">${day.advisory}</span>
      </div>
    `).join("");
  }
}

/**
 * Price Alerts Manager
 */
function renderAlertsList() {
  const container = document.getElementById("activeAlertsContainer");
  if (!container) return;

  if (APP_STATE.alerts.length === 0) {
    container.innerHTML = `<p style="color:#666; font-size:13px;">No active alerts set yet.</p>`;
    return;
  }

  container.innerHTML = APP_STATE.alerts.map(alert => `
    <div class="alert-item-card">
      <div class="alert-info">
        <strong>${alert.crop}</strong> in <strong>${alert.mandi}</strong>
        <div class="alert-sub">Target: &gt; ₹${alert.targetPrice} | ${alert.channel}</div>
      </div>
      <div class="alert-status-badge ${alert.status.includes('Triggered') ? 'triggered' : 'active'}">
        ${alert.status}
      </div>
    </div>
  `).join("");
}

function handleSavePriceAlert() {
  const cropSelect = document.getElementById("alertCropSelect");
  const mandiSelect = document.getElementById("alertMandiSelect");
  const priceInput = document.getElementById("alertPriceInput");
  const phoneInput = document.getElementById("alertPhoneInput");

  const crop = cropSelect ? cropSelect.value : "Wheat";
  const mandi = mandiSelect ? mandiSelect.value : "Khanna APMC";
  const price = parseInt(priceInput.value) || 2500;
  const phone = phoneInput.value.trim() || "+91 98765 43210";

  const newAlert = {
    id: "alt_" + Date.now(),
    crop,
    mandi,
    targetPrice: price,
    condition: "above",
    phone,
    channel: "WhatsApp & SMS",
    status: "Active (Watching)",
    active: true
  };

  APP_STATE.alerts.unshift(newAlert);
  renderAlertsList();
  showToast(`🔔 Price Alert Set for ${crop} (> ₹${price})! Notification will arrive on WhatsApp/SMS.`, "success");

  // Simulate instant WhatsApp test trigger
  setTimeout(() => {
    showToast(`📱 [WhatsApp Alert Simulation]: ${crop} has crossed ₹${price} at ${mandi}! Current Rate: ₹${price + 20}. Check KisanSetu.`, "success");
  }, 4000);
}

function handleLocationAutoDetect() {
  showToast("📍 Detecting GPS coordinates...", "info");
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        APP_STATE.userLocation = {
          lat: lat,
          lng: lng,
          name: "📍 Detected Live Location (Punjab)",
          state: "Punjab",
          district: "Ludhiana"
        };
        updateLocationUI();
        showToast("✅ Location Detected successfully!", "success");
      },
      (err) => {
        // Fallback to high-precision Punjab coordinates
        APP_STATE.userLocation = {
          lat: 31.2550,
          lng: 75.7050,
          name: "Phagwara / Jalandhar, Punjab (Near LPU Campus)",
          state: "Punjab",
          district: "Kapurthala"
        };
        updateLocationUI();
        showToast("✅ Farm Location set to Phagwara / LPU Region, Punjab", "success");
      },
      { timeout: 5000 }
    );
  } else {
    updateLocationUI();
  }
}

function updateLocationUI() {
  const display = document.getElementById("currentLocationDisplay");
  if (display) display.textContent = APP_STATE.userLocation.name;
  if (window.mandiMap) {
    window.mandiMap.setFarmerLocation(
      APP_STATE.userLocation.lat,
      APP_STATE.userLocation.lng,
      APP_STATE.userLocation.name
    );
  }
  renderMandiComparison();
  renderBestMandiRecommendation();
}

function toggleTheme() {
  const newTheme = APP_STATE.theme === "light" ? "dark" : "light";
  APP_STATE.theme = newTheme;
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("kisansetu_theme", newTheme);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = newTheme === "dark" ? "☀️" : "🌙";
  showToast(`Switched to ${newTheme === "dark" ? 'High-Contrast Night Mode' : 'Daylight Mode'}`, "info");
}

function updateLiveTimestamp() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const liveSyncTime = document.getElementById("liveSyncTimestamp");
  if (liveSyncTime) {
    liveSyncTime.textContent = `Today ${timeStr} IST (e-NAM Sync)`;
  }
}

function handleVoiceSearchResult(transcript) {
  const searchInput = document.getElementById("cropSearchInput");
  if (searchInput) {
    searchInput.value = transcript;
    APP_STATE.searchQuery = transcript.toLowerCase();
    renderCropCatalog();
    showToast(`🎤 Voice Recognized: "${transcript}"`, "success");
  }
}
window.handleVoiceSearchResult = handleVoiceSearchResult;

function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast-pill ${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
window.showToast = showToast;
