/**
 * KisanSetu - Interactive Mandi Map Engine
 * Powered by Leaflet.js & OpenStreetMap (Zero external API keys required).
 */

class MandiMapManager {
  constructor() {
    this.map = null;
    this.farmerMarker = null;
    this.mandiMarkers = [];
    this.routePolyline = null;
    this.defaultFarmerCoords = [31.2550, 75.7050]; // Near LPU Phagwara / Jalandhar, Punjab
    this.currentFarmerCoords = [...this.defaultFarmerCoords];
  }

  initMap(elementId = "mandiMap") {
    const mapContainer = document.getElementById(elementId);
    if (!mapContainer || this.map) return;

    // Initialize Leaflet map
    this.map = L.map(elementId, {
      center: this.currentFarmerCoords,
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Add high quality tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.renderFarmerLocation();
    this.renderMandiMarkers();
  }

  setFarmerLocation(lat, lng, locationName = "Your Farm") {
    this.currentFarmerCoords = [lat, lng];
    if (this.map) {
      this.renderFarmerLocation(locationName);
      this.renderMandiMarkers();
      this.drawRouteToMandi(window.appState ? window.appState.selectedMandiId : "khanna");
    }
  }

  renderFarmerLocation(name = "Your Farm (ਤੁਹਾਡਾ ਖੇਤ)") {
    if (!this.map) return;

    if (this.farmerMarker) {
      this.map.removeLayer(this.farmerMarker);
    }

    const farmerIcon = L.divIcon({
      className: "custom-farmer-pin",
      html: `
        <div class="farmer-pulse-ring"></div>
        <div class="farmer-marker-badge">
          <span>👨‍🌾</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -40]
    });

    this.farmerMarker = L.marker(this.currentFarmerCoords, { icon: farmerIcon }).addTo(this.map);
    this.farmerMarker.bindPopup(`
      <div class="map-popup-farmer">
        <h4 style="margin:0 0 4px 0; color:#1b5e20;">🏡 ${name}</h4>
        <p style="margin:0; font-size:12px; color:#555;">GPS Location: ${this.currentFarmerCoords[0].toFixed(4)}, ${this.currentFarmerCoords[1].toFixed(4)}</p>
      </div>
    `).openPopup();
  }

  renderMandiMarkers(selectedCropId = "wheat") {
    if (!this.map) return;

    // Clear existing markers
    this.mandiMarkers.forEach(m => this.map.removeLayer(m));
    this.mandiMarkers = [];

    const bounds = [this.currentFarmerCoords];

    AGRI_DATA.mandis.forEach(mandi => {
      const price = mandi.prices[selectedCropId] ? mandi.prices[selectedCropId].modal : 2400;
      const isKhanna = mandi.id === "khanna"; // Top rated

      const mandiIcon = L.divIcon({
        className: "custom-mandi-pin",
        html: `
          <div class="mandi-pin-card ${isKhanna ? 'highlight' : ''}">
            <div class="pin-title">${mandi.name.split(' ')[0]}</div>
            <div class="pin-price">₹${price}</div>
          </div>
        `,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([mandi.lat, mandi.lng], { icon: mandiIcon }).addTo(this.map);
      
      const gmapsLink = `https://www.google.com/maps/dir/?api=1&origin=${this.currentFarmerCoords[0]},${this.currentFarmerCoords[1]}&destination=${mandi.lat},${mandi.lng}`;

      marker.bindPopup(`
        <div class="map-popup-mandi">
          <h4 style="margin:0 0 4px 0; color:#0f5132;">🏛️ ${mandi.name}</h4>
          <p style="margin:0 0 6px 0; font-size:12px; color:#666;">${mandi.subText} • ${mandi.distanceKm} km</p>
          <div style="background:#e8f5e9; padding:6px 10px; border-radius:6px; margin-bottom:8px;">
            <strong style="color:#2e7d32; font-size:14px;">Today's Rate: ₹${price}/Qtl</strong>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="window.selectMandiFromMap('${mandi.id}')" class="popup-btn-select" style="background:#2e7d32; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">Select Mandi</button>
            <a href="${gmapsLink}" target="_blank" style="background:#1976d2; color:#fff; padding:6px 10px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:600; display:inline-block;">🚗 Directions</a>
          </div>
        </div>
      `);

      this.mandiMarkers.push(marker);
      bounds.push([mandi.lat, mandi.lng]);
    });

    this.map.fitBounds(bounds, { padding: [40, 40] });
  }

  drawRouteToMandi(mandiId) {
    if (!this.map) return;

    const mandi = AGRI_DATA.mandis.find(m => m.id === mandiId);
    if (!mandi) return;

    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    const start = this.currentFarmerCoords;
    const end = [mandi.lat, mandi.lng];

    // Create a smooth curved route visualization
    const midPoint = [
      (start[0] + end[0]) / 2 + 0.02,
      (start[1] + end[1]) / 2 - 0.03
    ];

    const latlngs = [start, midPoint, end];

    this.routePolyline = L.polyline(latlngs, {
      color: "#2e7d32",
      weight: 5,
      opacity: 0.85,
      dashArray: "10, 8",
      lineJoin: "round"
    }).addTo(this.map);
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 300);
    }
  }
}

window.mandiMap = new MandiMapManager();
