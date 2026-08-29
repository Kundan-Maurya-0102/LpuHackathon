/**
 * KisanSetu - Home Dashboard Controller
 */

const HOME_STATE = {
  selectedCropId: "wheat",
  selectedCategory: "all",
  searchQuery: ""
};

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  setupDashboardEventListeners();

  // Load dynamic market data
  if (window.apiMarket && typeof window.apiMarket.getPrices === "function") {
    try {
      const res = await window.apiMarket.getPrices();
      if (res.success && res.data && res.data.length > 0) {
        const marketMap = {};
        res.data.forEach(item => {
          const mId = item.market.toLowerCase().replace(/ /g, "_");
          if (!marketMap[mId]) {
            marketMap[mId] = {
              id: mId,
              name: item.market,
              nameHi: item.market + " मंडी",
              namePa: item.market + " ਮੰਡੀ",
              subText: "Verified APMC",
              state: item.state,
              district: item.district,
              lat: 31.0 + Math.random() * 0.5,
              lng: 75.0 + Math.random() * 0.5,
              distanceKm: Math.floor(Math.random() * 50) + 5,
              travelTime: "45 min",
              rating: 4.8,
              eNamEnabled: true,
              facilities: ["Electronic Weighbridge", "Covered Sheds", "Farmer Rest House"],
              prices: {}
            };
          }
          const cId = item.commodity.toLowerCase();
          marketMap[mId].prices[cId] = {
            min: parseFloat(item.min_price),
            max: parseFloat(item.max_price),
            modal: parseFloat(item.modal_price),
            arrivals: "Available"
          };
        });
        if (Object.keys(marketMap).length > 0) {
          AGRI_DATA.mandis = Object.values(marketMap);
        }
      }
    } catch (err) {
      console.warn("Dynamic price fetch fallback:", err);
    }
  }

  renderAllDashboardViews();

  // Listen to global language change event for immediate full-page translation
  window.addEventListener("kisansetu:languageChanged", () => {
    renderAllDashboardViews();
  });
}

function setupDashboardEventListeners() {
  // Search input
  const searchInput = document.getElementById("cropSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      HOME_STATE.searchQuery = e.target.value.toLowerCase().trim();
      renderCropCatalog();
    });
  }

  // Category filter pills
  document.querySelectorAll(".cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      HOME_STATE.selectedCategory = pill.getAttribute("data-category");
      renderCropCatalog();
    });
  });

  // Voice Search Button
  const voiceBtn = document.getElementById("voiceSearchBtn");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", handleVoiceSearch);
  }
}

function renderAllDashboardViews() {
  if (window.i18n) window.i18n.applyTranslations();
  renderCropCatalog();
  renderBestMandiRecommendation();
  renderWeatherWidget();
}

function renderCropCatalog() {
  const container = document.getElementById("cropCatalogGrid");
  if (!container) return;

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  const crops = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.crops)) ? window.AGRI_DATA.crops : [];

  const filteredCrops = crops.filter(crop => {
    const matchesCategory = (HOME_STATE.selectedCategory === "all") || (crop.category === HOME_STATE.selectedCategory);
    const matchesSearch = !HOME_STATE.searchQuery ||
      crop.name.toLowerCase().includes(HOME_STATE.searchQuery) ||
      (crop.nameHi && crop.nameHi.toLowerCase().includes(HOME_STATE.searchQuery)) ||
      (crop.namePa && crop.namePa.toLowerCase().includes(HOME_STATE.searchQuery));

    return matchesCategory && matchesSearch;
  });

  if (filteredCrops.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--radius-lg);">
        <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">No crops found matching "${HOME_STATE.searchQuery}"</h3>
        <p style="color: var(--text-muted); font-size: 13px;">Try searching for Wheat, Basmati, Potato, Mustard, Cotton...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredCrops.map(crop => {
    let localizedName = crop.name;
    if (currentLang === "hi" && crop.nameHi) localizedName = `${crop.nameHi} (${crop.name})`;
    if (currentLang === "pa" && crop.namePa) localizedName = `${crop.namePa} (${crop.name})`;

    const isSelected = crop.id === HOME_STATE.selectedCropId;

    return `
      <div class="crop-card ${isSelected ? 'selected' : ''}" onclick="selectCrop('${crop.id}')" id="crop_card_${crop.id}">
        <div class="crop-img-wrap">
          <img src="${crop.image}" alt="${crop.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'">
          <span class="crop-cat-badge">${crop.category}</span>
        </div>

        <div class="crop-card-content">
          <div class="crop-card-header">
            <h4 class="crop-name">${localizedName}</h4>
            <span class="crop-grade">${crop.grade}</span>
          </div>

          <div class="crop-price-row">
            <div>
              <span class="price-lbl">Avg APMC Rate:</span>
              <span class="price-val">₹${crop.allIndiaAvg.toLocaleString("en-IN")}</span>
              <span class="price-unit">/ Qtl</span>
            </div>
            <div class="price-trend-badge ${crop.trendDirection}">
              <span>${crop.priceTrend}</span>
            </div>
          </div>

          <div class="crop-card-footer" style="display: flex; gap: 8px; margin-top: 12px;">
            <a href="comparison.html?crop=${crop.id}" class="mandi-btn primary" style="flex: 1; text-align: center; text-decoration: none; font-size: 12px; padding: 7px 10px;">
              <span>📊 Compare Mandis</span>
            </a>
            <a href="sell.html?crop=${crop.id}" class="mandi-btn secondary" style="flex: 1; text-align: center; text-decoration: none; font-size: 12px; padding: 7px 10px; background: #0f766e; color: #ffffff;">
              <span>📄 Sell Lot</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function selectCrop(cropId) {
  HOME_STATE.selectedCropId = cropId;
  renderCropCatalog();
  renderBestMandiRecommendation();
}
window.selectCrop = selectCrop;

function renderBestMandiRecommendation() {
  const container = document.getElementById("bestMandiBanner");
  if (!container || !window.profitCalculator) return;

  const result = window.profitCalculator.getBestMandiRecommendation(
    HOME_STATE.selectedCropId,
    "tractor",
    30
  );

  if (!result || !result.bestMandi || !result.bestMandi.mandi) return;

  const best = result.bestMandi;
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  let mandiName = best.mandi.name || "Khanna APMC Grain Market";
  if (currentLang === "hi" && best.mandi.nameHi) mandiName = best.mandi.nameHi;
  if (currentLang === "pa" && best.mandi.namePa) mandiName = best.mandi.namePa;

  const facilities = (best.mandi && Array.isArray(best.mandi.facilities)) ? best.mandi.facilities : ["Electronic Weighbridge", "Covered Sheds", "Farmer Rest House"];
  const facilitiesHtml = facilities.slice(0, 3).map(f => `<span class="fac-pill">✓ ${f}</span>`).join("");
  const badgeText = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("bestMandiBadge") : "BEST PROFIT MANDI";

  container.innerHTML = `
    <div class="best-mandi-card">
      <div class="best-mandi-header">
        <div class="best-badge-glow">
          <span class="sparkle-icon">⭐</span>
          <span class="badge-text">${badgeText}</span>
        </div>
        <div class="verified-tag">🛡️ e-NAM Verified APMC</div>
      </div>

      <div class="best-mandi-body">
        <div class="best-col-main">
          <h3 class="mandi-title">${mandiName}</h3>
          <p class="mandi-sub">${best.mandi.subText || 'Verified APMC'} • 📍 ${best.distanceKm || 15} km (${best.mandi.travelTime || '30 min'})</p>
          <div class="mandi-facilities-pills">
            ${facilitiesHtml}
          </div>
        </div>

        <div class="best-col-metrics">
          <div class="metric-box green">
            <span class="m-lbl">Modal Rate (भाव)</span>
            <span class="m-val">₹${best.modalPrice || 2300}</span>
            <span class="m-unit">/ Quintal</span>
          </div>
          <div class="metric-box blue">
            <span class="m-lbl">Net Take-Home</span>
            <span class="m-val">₹${best.netPricePerQtl || 2150}</span>
            <span class="m-unit">/ Qtl after travel</span>
          </div>
          <div class="metric-box gold">
            <span class="m-lbl">Total Profit (${best.quantityQtl || 30} Qtl)</span>
            <span class="m-val profit-highlight">₹${(best.netProfit || 65000).toLocaleString("en-IN")}</span>
            <span class="m-unit">In-Hand Earnings</span>
          </div>
        </div>
      </div>

      <div class="best-mandi-footer">
        <a href="comparison.html?crop=${HOME_STATE.selectedCropId}&mandi=${best.mandi.id || 'khanna'}" class="btn-action-primary" style="text-decoration:none;">
          <span>📊 Open Mandi Rate Comparison & Calculator</span>
        </a>
        <a href="sell.html?crop=${HOME_STATE.selectedCropId}&mandi=${best.mandi.id || 'khanna'}" class="btn-action-secondary" style="text-decoration:none; background:#0f766e; color:#ffffff;">
          <span>📄 Sell Produce & Digital J-Form</span>
        </a>
        <a href="map.html?crop=${HOME_STATE.selectedCropId}&mandi=${best.mandi.id || 'khanna'}" class="btn-action-secondary" style="text-decoration:none;">
          <span>🗺️ GPS Navigation Route</span>
        </a>
      </div>
    </div>
  `;
}

function renderWeatherWidget() {
  const weather = (window.AGRI_DATA && window.AGRI_DATA.weather) ? window.AGRI_DATA.weather : {};
  const tempEl = document.getElementById("weatherTemp");
  const condEl = document.getElementById("weatherCondition");
  const humidityEl = document.getElementById("weatherHumidity");
  const windEl = document.getElementById("weatherWind");
  const advisoryEl = document.getElementById("weatherAdvisoryText");
  const forecastGrid = document.getElementById("weatherForecastGrid");

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  let conditionText = weather.condition || "Partly Cloudy";
  if (currentLang === "hi" && weather.conditionHi) conditionText = weather.conditionHi;
  if (currentLang === "pa" && weather.conditionPa) conditionText = weather.conditionPa;

  if (tempEl) tempEl.textContent = `${weather.temp || 28}°C`;
  if (condEl) condEl.textContent = `${weather.icon || '⛅'} ${conditionText}`;
  if (humidityEl) humidityEl.textContent = `${weather.humidity || 65}%`;
  if (windEl) windEl.textContent = `${weather.windSpeed || 14} km/h`;
  if (advisoryEl) advisoryEl.textContent = weather.advisoryText || "Ideal conditions for harvesting and transporting.";

  if (forecastGrid) {
    const forecast = Array.isArray(weather.forecast5Day) ? weather.forecast5Day : [];
    forecastGrid.innerHTML = forecast.map(day => `
      <div class="forecast-day-card">
        <span class="f-day">${day.day}</span>
        <span class="f-icon">${day.icon}</span>
        <span class="f-temp">${day.temp}</span>
        <span class="f-desc">${day.advisory}</span>
      </div>
    `).join("");
  }
}

function handleVoiceSearch() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    showToast("🎙️ Voice search is supported on Chrome and modern mobile browsers.", "info");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";

  recognition.lang = currentLang === "hi" ? "hi-IN" : currentLang === "pa" ? "pa-IN" : "en-IN";
  recognition.interimResults = false;

  showToast("🎙️ फसल का नाम बोलें... (Listening...)", "info");

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const searchInput = document.getElementById("cropSearchInput");
    if (searchInput) {
      searchInput.value = transcript;
      HOME_STATE.searchQuery = transcript.toLowerCase().trim();
      renderCropCatalog();
      showToast(`🌾 Heard: "${transcript}"`, "success");
    }
  };

  recognition.onerror = (e) => {
    showToast("⚠️ Could not hear audio clearly. Please try typing.", "error");
  };

  recognition.start();
}

function handleSavePriceAlert() {
  const crop = document.getElementById("alertCropSelect")?.value || "wheat";
  const target = document.getElementById("alertTargetPriceInput")?.value || "2500";
  hideModal("alertModal");
  showToast(`🔔 Price Alert Activated for ${crop.toUpperCase()} when rate crosses ₹${target}/Qtl!`, "success");
}
window.handleSavePriceAlert = handleSavePriceAlert;
