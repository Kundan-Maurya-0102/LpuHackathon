class MandiMapManager {
  constructor() {
    this.map = null;
    this.farmerMarker = null;
    this.mandiMarkers = [];
    this.routePolyline = null;
    this.defaultFarmerCoords = [31.2550, 75.7050];
    this.currentFarmerCoords = [...this.defaultFarmerCoords];
  }

  initMap(elementId = "mandiMap") {
    if (typeof L === "undefined") {
      console.warn("Leaflet (L) is not loaded yet.");
      return;
    }

    const mapContainer = document.getElementById(elementId);
    if (!mapContainer) return;
    
    // Avoid double initialization on already initialized container
    if (this.map || mapContainer._leaflet_id) {
      this.invalidateSize();
      return;
    }

    try {
      this.map = L.map(elementId, {
        center: this.currentFarmerCoords,
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.renderFarmerLocation();
      this.renderMandiMarkers();
    } catch (e) {
      console.warn("Map initialization error:", e);
    }
  }

  setFarmerLocation(lat, lng, locationName = "Your Farm") {
    this.currentFarmerCoords = [lat, lng];
    if (this.map && typeof L !== "undefined") {
      this.renderFarmerLocation(locationName);
      this.renderMandiMarkers();
      this.drawRouteToMandi(window.SHARED_STATE ? window.SHARED_STATE.selectedMandiId : "khanna");
    }
  }

  renderFarmerLocation(name = "Your Farm (ਤੁਹਾਡਾ ਖੇਤ)") {
    if (!this.map || typeof L === "undefined") return;

    try {
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
      `);
    } catch (e) {
      console.warn("Error rendering farmer location:", e);
    }
  }

  renderMandiMarkers(selectedCropId = "wheat") {
    if (!this.map || typeof L === "undefined") return;

    try {
      this.mandiMarkers.forEach(m => {
        try { this.map.removeLayer(m); } catch (e) {}
      });
      this.mandiMarkers = [];

      const bounds = [this.currentFarmerCoords];
      const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];

      mandis.forEach(mandi => {
        if (!mandi.lat || !mandi.lng) return;
        
        const price = (mandi.prices && mandi.prices[selectedCropId]) ? mandi.prices[selectedCropId].modal : 2400;
        const isKhanna = mandi.id === "khanna";

        const mandiIcon = L.divIcon({
          className: "custom-mandi-pin",
          html: `
            <div class="mandi-pin-card ${isKhanna ? 'highlight' : ''}">
              <div class="pin-title">${(mandi.name || 'Mandi').split(' ')[0]}</div>
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
            <h4 style="margin:0 0 4px 0; color:#0f5132;">🏛️ ${mandi.name || 'Mandi'}</h4>
            <p style="margin:0 0 6px 0; font-size:12px; color:#666;">${mandi.subText || 'Verified APMC'} • ${mandi.distanceKm || 15} km</p>
            <div style="background:#e8f5e9; padding:6px 10px; border-radius:6px; margin-bottom:8px;">
              <strong style="color:#2e7d32; font-size:14px;">Today's Rate: ₹${price}/Qtl</strong>
            </div>
            <div style="display:flex; gap:6px;">
              <button onclick="window.selectMandiOnMap ? window.selectMandiOnMap('${mandi.id}') : null" class="popup-btn-select" style="background:#2e7d32; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">Select Mandi</button>
              <a href="${gmapsLink}" target="_blank" style="background:#1976d2; color:#fff; padding:6px 10px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:600; display:inline-block;">🚗 Directions</a>
            </div>
          </div>
        `);

        this.mandiMarkers.push(marker);
        bounds.push([mandi.lat, mandi.lng]);
      });

      if (bounds.length > 1) {
        this.map.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (e) {
      console.warn("Error rendering mandi markers:", e);
    }
  }

  drawRouteToMandi(mandiId) {
    if (!this.map || typeof L === "undefined") return;

    try {
      const mandis = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis)) ? window.AGRI_DATA.mandis : [];
      const mandi = mandis.find(m => m.id === mandiId);
      if (!mandi || !mandi.lat || !mandi.lng) return;

      if (this.routePolyline) {
        try { this.map.removeLayer(this.routePolyline); } catch (e) {}
      }

      const start = this.currentFarmerCoords;
      const end = [mandi.lat, mandi.lng];

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
    } catch (e) {
      console.warn("Error drawing route polyline:", e);
    }
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => {
        try { this.map.invalidateSize(); } catch (e) {}
      }, 300);
    }
  }
}

window.mandiMap = new MandiMapManager();
