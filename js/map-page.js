/**
 * KisanSetu - Live Mandi Map & GPS Navigation Controller
 * Fetches real APMC mandi prices from backend DB and renders them on the map.
 */

let currentMapCropId = "wheat";
let currentSelectedMandiId = "khanna";

// Known real GPS coordinates for Punjab APMC Mandis
const KNOWN_MANDI_COORDS = {
  "khanna apmc grain market":           { lat: 30.7047, lng: 76.2194 },
  "phagwara apmc grain market":         { lat: 31.2240, lng: 75.7736 },
  "phagwara mandi":                     { lat: 31.2240, lng: 75.7736 },
  "jalandhar city mandi":               { lat: 31.3260, lng: 75.5762 },
  "jalandhar mandi":                    { lat: 31.3260, lng: 75.5762 },
  "ludhiana apmc fruit & grain":        { lat: 30.9010, lng: 75.8573 },
  "ludhiana mandi":                     { lat: 30.9010, lng: 75.8573 },
  "amritsar bhagtanwala mandi":         { lat: 31.6340, lng: 74.8723 },
  "amritsar mandi":                     { lat: 31.6340, lng: 74.8723 },
  "patiala grain mandi":                { lat: 30.3398, lng: 76.3869 },
  "bathinda mandi":                     { lat: 30.2110, lng: 74.9455 },
  "ferozepur mandi":                    { lat: 30.9236, lng: 74.6228 },
  "moga mandi":                         { lat: 30.8148, lng: 75.1717 },
  "barnala mandi":                      { lat: 30.3780, lng: 75.5490 },
  "sangrur mandi":                      { lat: 30.2490, lng: 75.8440 }
};

function resolveMandiCoords(mandiName) {
  const key = mandiName.trim().toLowerCase();
  // Try exact match first, then partial
  if (KNOWN_MANDI_COORDS[key]) return KNOWN_MANDI_COORDS[key];
  for (const [k, coords] of Object.entries(KNOWN_MANDI_COORDS)) {
    if (key.includes(k.split(" ")[0]) || k.includes(key.split(" ")[0])) {
      return coords;
    }
  }
  // Fallback: spread around Phagwara / LPU area
  return {
    lat: 31.25 + (Math.random() - 0.5) * 0.8,
    lng: 75.70 + (Math.random() - 0.5) * 0.8
  };
}

function estimateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

document.addEventListener("DOMContentLoaded", () => {
  initMapPage();
});

async function initMapPage() {
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

  // Fetch live market prices from backend → populate AGRI_DATA.mandis with real coords
  if (window.apiMarket && typeof window.apiMarket.getPrices === "function") {
    try {
      const res = await window.apiMarket.getPrices();
      if (res.success && res.data && res.data.length > 0) {
        const farmerLat = (window.SHARED_STATE && window.SHARED_STATE.userLocation)
          ? window.SHARED_STATE.userLocation.lat : 31.2550;
        const farmerLng = (window.SHARED_STATE && window.SHARED_STATE.userLocation)
          ? window.SHARED_STATE.userLocation.lng : 75.7050;

        // Update crop prices from live data
        if (typeof window.updateCropPricesFromAPI === "function") {
          window.updateCropPricesFromAPI(res.data);
        }

        // Build mandi list with REAL GPS coordinates
        const marketMap = {};
        res.data.forEach(item => {
          const mId = item.market.toLowerCase().replace(/ /g, "_");
          if (!marketMap[mId]) {
            const coords = resolveMandiCoords(item.market);
            const distKm = estimateDistance(farmerLat, farmerLng, coords.lat, coords.lng);
            const travelMin = Math.round(distKm / 40 * 60);
            const travelStr = travelMin < 60
              ? `${travelMin} min`
              : `${Math.floor(travelMin / 60)}h ${travelMin % 60}m`;

            marketMap[mId] = {
              id: mId,
              name: item.market,
              nameHi: item.market + " मंडी",
              namePa: item.market + " ਮੰਡੀ",
              subText: `${item.district} APMC`,
              state: item.state,
              district: item.district,
              lat: coords.lat,
              lng: coords.lng,
              distanceKm: distKm,
              travelTime: travelStr,
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
            arrivals: item.arrivals || "Available"
          };
        });

        if (Object.keys(marketMap).length > 0) {
          window.AGRI_DATA.mandis = Object.values(marketMap);
          // Set default mandi to closest one
          const sorted = [...window.AGRI_DATA.mandis].sort((a, b) => a.distanceKm - b.distanceKm);
          if (sorted.length > 0 && !mandiParam) {
            currentSelectedMandiId = sorted[0].id;
          }
        }
      }
    } catch (err) {
      console.warn("Map: live data fetch failed, using cached data:", err);
    }
  }

  // Initialize Leaflet Map
  setTimeout(() => {
    if (window.mandiMap) {
      window.mandiMap.initMap("mandiMapFull");
      const userLocName = (window.SHARED_STATE && window.SHARED_STATE.userLocation)
        ? window.SHARED_STATE.userLocation.name
        : "Your Farm (ਤੁਹਾਡਾ ਖੇਤ)";
      window.mandiMap.renderFarmerLocation(userLocName);
      window.mandiMap.renderMandiMarkers(currentMapCropId);
      window.mandiMap.drawRouteToMandi(currentSelectedMandiId);
    }
  }, 300);

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

  const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis))
    ? window.AGRI_DATA.mandis
    : [];

  if (mandis.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 28px; margin-bottom: 8px;">🔄</div>
        <p>Loading live mandi data...</p>
      </div>`;
    return;
  }

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  const userCoords = (window.mandiMap && window.mandiMap.currentFarmerCoords)
    ? window.mandiMap.currentFarmerCoords
    : [31.2550, 75.7050];

  // Sort by distance
  const sorted = [...mandis].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  container.innerHTML = sorted.map(mandi => {
    let name = mandi.name;
    if (currentLang === "hi" && mandi.nameHi) name = mandi.nameHi;
    if (currentLang === "pa" && mandi.namePa) name = mandi.namePa;

    const prices = (mandi.prices && mandi.prices[currentMapCropId])
      ? mandi.prices[currentMapCropId]
      : { modal: 2400 };
    const isSelected = mandi.id === currentSelectedMandiId;
    const gmapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userCoords[0]},${userCoords[1]}&destination=${mandi.lat},${mandi.lng}`;

    return `
      <div class="map-mandi-item-card ${isSelected ? 'active' : ''}" onclick="selectMandiOnMap('${mandi.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <h4 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin: 0;">🏛️ ${name}</h4>
          <span style="font-size: 13px; font-weight: 800; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 6px;">₹${prices.modal.toLocaleString("en-IN")}/Qtl</span>
        </div>

        <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 10px 0;">${mandi.district}, ${mandi.state} • 📍 ${mandi.distanceKm || 15} km (${mandi.travelTime || '30 min'})</p>

        <div style="display: flex; gap: 8px;">
          <button class="mandi-btn primary" style="flex: 1; padding: 6px 10px; font-size: 12px;" onclick="event.stopPropagation(); selectMandiOnMap('${mandi.id}')">
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
      window.mandiMap.map.panTo([target.lat, target.lng], { animate: true });
      window.mandiMap.map.setZoom(12, { animate: true });
    }
  }
  renderSidebarMandis();
}
window.selectMandiOnMap = selectMandiOnMap;
