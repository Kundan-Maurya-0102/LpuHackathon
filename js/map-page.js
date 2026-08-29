/**
 * KisanSetu - Live Mandi Map & GPS Navigation Controller
 */

let currentMapCropId = "wheat";
let currentSelectedMandiId = "khanna";

document.addEventListener("DOMContentLoaded", () => {
  initMapPage();
});

function initMapPage() {
  const params = new URLSearchParams(window.location.search);
  const cropParam = params.get("crop");
  const mandiParam = params.get("mandi");

  if (cropParam) currentMapCropId = cropParam;
  if (mandiParam) currentSelectedMandiId = mandiParam;

  const cropSelect = document.getElementById("mapCropSelect");
  if (cropSelect) {
    cropSelect.value = currentMapCropId;
    cropSelect.addEventListener("change", (e) => {
      currentMapCropId = e.target.value;
      updateMapMarkers();
      renderSidebarMandis();
    });
  }

  // Initialize Leaflet Map
  setTimeout(() => {
    if (window.mandiMap) {
      window.mandiMap.initMap("mandiMapFull");
      const userLoc = window.SHARED_STATE ? window.SHARED_STATE.userLocation.name : "Your Farm";
      window.mandiMap.renderFarmerLocation(userLoc);
      window.mandiMap.renderMandiMarkers(currentMapCropId);
      window.mandiMap.drawRouteToMandi(currentSelectedMandiId);
    }
  }, 200);

  renderSidebarMandis();

  window.addEventListener("kisansetu:languageChanged", () => {
    renderSidebarMandis();
    if (window.mandiMap) {
      window.mandiMap.renderMandiMarkers(currentMapCropId);
    }
  });
}

function updateMapMarkers() {
  if (window.mandiMap) {
    window.mandiMap.renderMandiMarkers(currentMapCropId);
    window.mandiMap.drawRouteToMandi(currentSelectedMandiId);
  }
}

function renderSidebarMandis() {
  const container = document.getElementById("mapMandisSidebar");
  if (!container) return;

  const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  const userCoords = (window.mandiMap && window.mandiMap.currentFarmerCoords) ? window.mandiMap.currentFarmerCoords : [31.2550, 75.7050];

  container.innerHTML = mandis.map(mandi => {
    let name = mandi.name;
    if (currentLang === "hi" && mandi.nameHi) name = mandi.nameHi;
    if (currentLang === "pa" && mandi.namePa) name = mandi.namePa;

    const prices = (mandi.prices && mandi.prices[currentMapCropId]) ? mandi.prices[currentMapCropId] : { modal: 2400 };
    const isSelected = mandi.id === currentSelectedMandiId;
    const gmapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userCoords[0]},${userCoords[1]}&destination=${mandi.lat},${mandi.lng}`;

    return `
      <div class="map-mandi-item-card ${isSelected ? 'active' : ''}" onclick="selectMandiOnMap('${mandi.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <h4 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin: 0;">🏛️ ${name}</h4>
          <span style="font-size: 13px; font-weight: 800; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 6px;">₹${prices.modal}/Qtl</span>
        </div>

        <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 10px 0;">${mandi.district}, ${mandi.state} • 📍 ${mandi.distanceKm || 15} km (${mandi.travelTime || '30 min'})</p>

        <div style="display: flex; gap: 8px;">
          <button class="mandi-btn primary" style="flex: 1; padding: 6px 10px; font-size: 12px;" onclick="selectMandiOnMap('${mandi.id}')">
            <span>🗺️ Select & Route</span>
          </button>
          <a href="${gmapsLink}" target="_blank" class="mandi-btn secondary" style="flex: 1; padding: 6px 10px; font-size: 12px; text-decoration: none; display: flex; align-items: center; justify-content: center; background: #2563eb; color: #ffffff;">
            <span>🚗 Directions</span>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function selectMandiOnMap(mandiId) {
  currentSelectedMandiId = mandiId;
  if (window.mandiMap) {
    window.mandiMap.drawRouteToMandi(mandiId);
    const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];
    const target = mandis.find(m => m.id === mandiId);
    if (target && window.mandiMap.map) {
      window.mandiMap.map.panTo([target.lat, target.lng]);
    }
  }
  renderSidebarMandis();
}
window.selectMandiOnMap = selectMandiOnMap;
