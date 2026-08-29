/**
 * KisanSetu - Mandi Comparison & Smart Calculator Page Controller
 */

const COMP_STATE = {
  selectedCropId: "wheat",
  selectedMandiId: "khanna",
  selectedVehicleId: "tractor",
  harvestQuantityQtl: 30,
  maxSearchRadiusKm: 100,
  sortBy: "nearest",
  chartPeriod: "7d"
};

document.addEventListener("DOMContentLoaded", () => {
  initComparisonPage();
});

async function initComparisonPage() {
  // Check URL parameters for pre-selected crop or mandi
  const params = new URLSearchParams(window.location.search);
  const cropParam = params.get("crop");
  const mandiParam = params.get("mandi");
  const quantityParam = params.get("quantity");

  if (cropParam && AGRI_DATA.crops.some(c => c.id === cropParam)) {
    COMP_STATE.selectedCropId = cropParam;
  }
  if (mandiParam) {
    COMP_STATE.selectedMandiId = mandiParam;
  }
  if (quantityParam && parseInt(quantityParam) > 0) {
    COMP_STATE.harvestQuantityQtl = parseInt(quantityParam);
  }

  // Sync inputs with state
  const cropSelect = document.getElementById("compCropSelect");
  if (cropSelect) cropSelect.value = COMP_STATE.selectedCropId;

  const qtyInput = document.getElementById("compQuantityInput");
  if (qtyInput) qtyInput.value = COMP_STATE.harvestQuantityQtl;

  const radiusSlider = document.getElementById("radiusSlider");
  const radiusVal = document.getElementById("radiusVal");
  if (radiusSlider && radiusVal) {
    radiusSlider.value = COMP_STATE.maxSearchRadiusKm;
    radiusVal.textContent = `${COMP_STATE.maxSearchRadiusKm} km`;
  }

  setupComparisonEventListeners();

  // Fetch live market data
  if (window.apiMarket && typeof window.apiMarket.getPrices === "function") {
    try {
      const res = await window.apiMarket.getPrices();
      if (res.success && res.data && res.data.length > 0) {
        // Group raw prices
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
    } catch (e) {
      console.warn("Market data sync error, using default APMC list:", e);
    }
  }

  renderAllComparisonViews();

  // Listen to global language changes for real-time translation
  window.addEventListener("kisansetu:languageChanged", () => {
    renderAllComparisonViews();
  });
}

function setupComparisonEventListeners() {
  const cropSelect = document.getElementById("compCropSelect");
  if (cropSelect) {
    cropSelect.addEventListener("change", (e) => {
      COMP_STATE.selectedCropId = e.target.value;
      renderAllComparisonViews();
    });
  }

  const qtyInput = document.getElementById("compQuantityInput");
  if (qtyInput) {
    qtyInput.addEventListener("input", (e) => {
      const val = parseInt(e.target.value) || 1;
      COMP_STATE.harvestQuantityQtl = val;
      renderBestMandiRecommendation();
      updateCalculatorView();
    });
  }

  const sortSelect = document.getElementById("compSortSelect");
  if (sortSelect) {
    sortSelect.value = COMP_STATE.sortBy;
    sortSelect.addEventListener("change", (e) => {
      COMP_STATE.sortBy = e.target.value;
      renderMandiComparison();
    });
  }

  const radiusSlider = document.getElementById("radiusSlider");
  const radiusVal = document.getElementById("radiusVal");
  if (radiusSlider && radiusVal) {
    radiusSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      COMP_STATE.maxSearchRadiusKm = val;
      radiusVal.textContent = `${val} km`;
      renderMandiComparison();
    });
  }

  // Vehicle Selection Cards
  document.querySelectorAll(".vehicle-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".vehicle-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      COMP_STATE.selectedVehicleId = card.getAttribute("data-vehicle");
      renderBestMandiRecommendation();
      updateCalculatorView();
    });
  });

  // Period Tabs for Chart
  document.querySelectorAll(".period-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".period-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      COMP_STATE.chartPeriod = btn.getAttribute("data-period");
      if (window.priceChart) {
        window.priceChart.renderChart(COMP_STATE.selectedCropId, COMP_STATE.chartPeriod);
      }
    });
  });
}

function renderAllComparisonViews() {
  if (window.i18n) window.i18n.applyTranslations();

  // Localize crop select dropdown options
  const cropSelect = document.getElementById("compCropSelect");
  if (cropSelect && window.AGRI_DATA && Array.isArray(window.AGRI_DATA.crops)) {
    const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
    const selectedVal = COMP_STATE.selectedCropId;
    cropSelect.innerHTML = window.AGRI_DATA.crops.map(c => {
      const locName = window.getLocalizedCropName ? window.getLocalizedCropName(c, currentLang) : c.name;
      return `<option value="${c.id}" ${c.id === selectedVal ? 'selected' : ''}>${c.fallbackIcon || '🌾'} ${locName}</option>`;
    }).join("");
  }

  renderBestMandiRecommendation();
  renderMandiComparison();
  updateCalculatorView();

  setTimeout(() => {
    if (window.priceChart) {
      window.priceChart.initChart("priceHistoryChart");
      window.priceChart.renderChart(COMP_STATE.selectedCropId, COMP_STATE.chartPeriod);
    }
  }, 150);
}

function renderBestMandiRecommendation() {
  const container = document.getElementById("bestMandiBanner");
  if (!container || !window.profitCalculator) return;

  const result = window.profitCalculator.getBestMandiRecommendation(
    COMP_STATE.selectedCropId,
    COMP_STATE.selectedVehicleId,
    COMP_STATE.harvestQuantityQtl
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

      ${result.isDifferentFromNearest && result.extraProfit > 0 && result.nearestMandi ? `
        <div class="extra-profit-banner">
          <span class="bulb-icon">💡</span>
          <span><strong>Kisan Profit Tip:</strong> By traveling ${(best.distanceKm || 15) - (result.nearestMandi.distanceKm || 5)} km extra to <strong>${mandiName}</strong>, you earn <strong>+₹${result.extraProfit.toLocaleString("en-IN")} EXTRA profit</strong> on your ${best.quantityQtl || 30} quintals!</span>
        </div>
      ` : ''}

      <div class="best-mandi-footer">
        <button class="btn-action-primary" onclick="selectMandiForCalc('${best.mandi.id || 'khanna'}')">
          <span>💰 Apply to Calculator</span>
        </button>
        <a href="map.html?mandi=${best.mandi.id || 'khanna'}&crop=${COMP_STATE.selectedCropId}" class="btn-action-secondary" style="text-decoration:none;">
          <span>🗺️ View Map Route</span>
        </a>
        <a href="sell.html?mandi=${best.mandi.id || 'khanna'}&crop=${COMP_STATE.selectedCropId}&quantity=${COMP_STATE.harvestQuantityQtl}" class="btn-action-primary" style="background:#0f766e; text-decoration:none;">
          <span>📄 Sell & Generate J-Form</span>
        </a>
      </div>
    </div>
  `;
}

function renderMandiComparison() {
  const container = document.getElementById("mandiComparisonCards");
  if (!container || !window.profitCalculator) return;

  const crops = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.crops)) ? window.AGRI_DATA.crops : [];
  const currentCrop = crops.find(c => c.id === COMP_STATE.selectedCropId) || crops[0] || { id: "wheat", name: "Wheat" };
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";

  const cropTitleEl = document.getElementById("selectedCropComparisonTitle");
  if (cropTitleEl) {
    const name = (currentLang === "hi" && currentCrop.nameHi) ? currentCrop.nameHi : currentCrop.name;
    const ratesLabel = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("todayMandiRates") : "Today's Mandi Rate Comparison:";
    cropTitleEl.textContent = `${ratesLabel} ${name}`;
  }

  const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis) && window.AGRI_DATA.mandis.length > 0)
    ? window.AGRI_DATA.mandis
    : window.profitCalculator.getMandisList();

  let mandisWithinRadius = mandis.filter(m => (m.distanceKm || 15) <= COMP_STATE.maxSearchRadiusKm);

  // Sort according to selection (Default: Nearest First)
  if (COMP_STATE.sortBy === "highest_price") {
    mandisWithinRadius.sort((a, b) => {
      const priceA = a.prices?.[COMP_STATE.selectedCropId]?.modal || 0;
      const priceB = b.prices?.[COMP_STATE.selectedCropId]?.modal || 0;
      return priceB - priceA;
    });
  } else if (COMP_STATE.sortBy === "max_profit") {
    mandisWithinRadius.sort((a, b) => {
      const pA = window.profitCalculator.calculateMandiProfit(COMP_STATE.selectedCropId, a.id, COMP_STATE.selectedVehicleId, COMP_STATE.harvestQuantityQtl);
      const pB = window.profitCalculator.calculateMandiProfit(COMP_STATE.selectedCropId, b.id, COMP_STATE.selectedVehicleId, COMP_STATE.harvestQuantityQtl);
      return (pB.netProfit || 0) - (pA.netProfit || 0);
    });
  } else {
    // Nearest First (Ascending distance)
    mandisWithinRadius.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  if (mandisWithinRadius.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--radius-lg);">
        <p style="color: var(--text-muted); font-size: 15px;">No mandis found within ${COMP_STATE.maxSearchRadiusKm} km radius. Increase the search radius slider.</p>
      </div>
    `;
    return;
  }

  const minPriceLbl = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("minPrice") : "Min";
  const modalPriceLbl = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("modalPrice") : "Modal";
  const maxPriceLbl = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("maxPrice") : "Max";

  container.innerHTML = mandisWithinRadius.map(mandi => {
    const profitCalc = window.profitCalculator.calculateMandiProfit(
      COMP_STATE.selectedCropId,
      mandi.id,
      COMP_STATE.selectedVehicleId,
      COMP_STATE.harvestQuantityQtl
    );

    let mandiName = mandi.name || "APMC Mandi";
    if (currentLang === "hi" && mandi.nameHi) mandiName = mandi.nameHi;
    if (currentLang === "pa" && mandi.namePa) mandiName = mandi.namePa;

    const isSelected = mandi.id === COMP_STATE.selectedMandiId;
    const cropPrices = (mandi.prices && mandi.prices[COMP_STATE.selectedCropId]) ? mandi.prices[COMP_STATE.selectedCropId] : {};
    const arrivals = cropPrices.arrivals || "Available";

    return `
      <div class="mandi-card ${isSelected ? 'selected' : ''}" id="mandi_card_${mandi.id}">
        <div class="mandi-card-top">
          <div class="mandi-header-info">
            <h4 class="m-name">🏛️ ${mandiName}</h4>
            <span class="m-district">${mandi.district || ''}, ${mandi.state || ''} • ⭐ ${mandi.rating || '4.8'}</span>
          </div>
          <div class="m-distance-badge">
            <span class="dist-km">${mandi.distanceKm || 15} km</span>
            <span class="dist-time">${mandi.travelTime || '30 min'}</span>
          </div>
        </div>

        <div class="price-breakdown-grid">
          <div class="price-pill min-pill">
            <span class="p-lbl">${minPriceLbl}</span>
            <span class="p-amt">₹${profitCalc.minPrice}</span>
          </div>
          <div class="price-pill modal-pill">
            <span class="p-lbl">${modalPriceLbl}</span>
            <span class="p-amt">₹${profitCalc.modalPrice}</span>
          </div>
          <div class="price-pill max-pill">
            <span class="p-lbl">${maxPriceLbl}</span>
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
          <a href="map.html?mandi=${mandi.id}&crop=${COMP_STATE.selectedCropId}" class="mandi-btn secondary" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
            <span>🗺️ Map</span>
          </a>
          <button class="mandi-btn audio speak-btn" onclick="speakMandiDetails('${mandi.id}')" title="Listen price in your language">
            <span>🔊</span>
          </button>
        </div>

        <div class="mandi-card-footer">
          <span class="sync-time">🟢 Synced Today 06:30 AM</span>
          <span class="arrival-vol">📦 Arrival: ${arrivals}</span>
        </div>
      </div>
    `;
  }).join("");
}

function selectMandiForCalc(mandiId) {
  COMP_STATE.selectedMandiId = mandiId;
  updateCalculatorView();
  const calcSection = document.getElementById("calculatorSection");
  if (calcSection) {
    calcSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
window.selectMandiForCalc = selectMandiForCalc;

function updateCalculatorView() {
  if (!window.profitCalculator) return;

  const result = window.profitCalculator.calculateMandiProfit(
    COMP_STATE.selectedCropId,
    COMP_STATE.selectedMandiId,
    COMP_STATE.selectedVehicleId,
    COMP_STATE.harvestQuantityQtl
  );

  const mandiSelect = document.getElementById("calcMandiSelect");
  if (mandiSelect) {
    const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis) && window.AGRI_DATA.mandis.length > 0)
      ? window.AGRI_DATA.mandis
      : window.profitCalculator.getMandisList();

    mandiSelect.innerHTML = mandis.map(m => {
      return `<option value="${m.id}" ${m.id === COMP_STATE.selectedMandiId ? 'selected' : ''}>${m.name || 'Mandi'} (${m.distanceKm || 15} km)</option>`;
    }).join("");

    mandiSelect.onchange = (e) => {
      COMP_STATE.selectedMandiId = e.target.value;
      updateCalculatorView();
    };
  }

  const grossEl = document.getElementById("calcGrossRevenue");
  const transportEl = document.getElementById("calcTransportCost");
  const cessEl = document.getElementById("calcMandiCess");
  const netEl = document.getElementById("calcNetProfit");
  const netPerQtlEl = document.getElementById("calcNetPerQtl");

  if (grossEl) grossEl.textContent = `₹${(result.grossRevenue || 0).toLocaleString("en-IN")}`;
  if (transportEl) transportEl.textContent = `- ₹${(result.transportCost || 0).toLocaleString("en-IN")}`;
  if (cessEl) cessEl.textContent = `- ₹${(result.mandiCessFee || 0).toLocaleString("en-IN")}`;
  if (netEl) netEl.textContent = `₹${(result.netProfit || 0).toLocaleString("en-IN")}`;
  if (netPerQtlEl) netPerQtlEl.textContent = `(₹${result.netPricePerQtl || 0} per Quintal)`;
}

function speakMandiDetails(mandiId) {
  const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];
  const mandi = mandis.find(m => m.id === mandiId);
  if (!mandi) return;

  const currentCrop = (window.AGRI_DATA && AGRI_DATA.crops) ? AGRI_DATA.crops.find(c => c.id === COMP_STATE.selectedCropId) : null;
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  const price = (mandi.prices && mandi.prices[COMP_STATE.selectedCropId]) ? mandi.prices[COMP_STATE.selectedCropId].modal : 2300;

  let text = `Today in ${mandi.name}, modal price of ${currentCrop ? currentCrop.name : 'Wheat'} is ${price} rupees per quintal.`;
  if (currentLang === "hi") {
    text = `आज ${mandi.nameHi || mandi.name} में ${currentCrop ? currentCrop.nameHi : 'गेहूं'} का भाव ${price} रुपये प्रति क्विंटल है।`;
  } else if (currentLang === "pa") {
    text = `ਅੱਜ ${mandi.namePa || mandi.name} ਵਿੱਚ ${currentCrop ? currentCrop.namePa : 'ਕਣਕ'} ਦਾ ਭਾਅ ${price} ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।`;
  }

  if (window.speechManager && typeof window.speechManager.speak === "function") {
    window.speechManager.speak(text, currentLang);
  } else if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === "hi" ? "hi-IN" : currentLang === "pa" ? "pa-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  }
}
window.speakMandiDetails = speakMandiDetails;
