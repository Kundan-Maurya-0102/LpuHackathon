const KISANSETU_BACKEND_URL = window.KISANSETU_BACKEND_URL || "http://localhost:3001";
const KISANSETU_API_URL = window.KISANSETU_API_URL || `${KISANSETU_BACKEND_URL}/api/daily-prices`;

function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function textValue(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim()) || "Unknown";
}

function distanceBetween(lat1, lon1, lat2, lon2) {
  const radians = value => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeDailyPrices(payload, farmerLocation) {
  const records = Array.isArray(payload) ? payload : (payload.data || payload.records || payload.prices || []);
  const crops = new Map();
  const mandis = new Map();
  const priceHistory = {};

  records.forEach(record => {
    const cropName = textValue(record.crop, record.cropName, record.commodity, record.commodityName);
    const mandiName = textValue(record.mandi, record.mandiName, record.market, record.marketName);
    const cropId = String(record.cropId || cropName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const mandiId = String(record.mandiId || mandiName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const modal = numberValue(record.modal, record.modal_price, record.modalPrice, record.average, record.price, record.maxPrice);
    const minimum = numberValue(record.min, record.min_price, record.minPrice, modal);
    const maximum = numberValue(record.max, record.max_price, record.maxPrice, modal);
    if (!modal) return;

    if (record.history) {
      priceHistory[cropId] = record.history;
    }

    if (!crops.has(cropId)) {
      crops.set(cropId, {
        id: cropId,
        name: cropName,
        nameHi: record.cropNameHi || record.nameHi || cropName,
        namePa: record.cropNamePa || record.namePa || cropName,
        category: record.category || "all",
        image: record.image || "",
        fallbackIcon: record.fallbackIcon || "🌾",
        grade: record.grade || "Daily market grade",
        unit: "Quintal (100 kg)",
        allIndiaAvg: modal,
        priceTrend: record.trend || "Live",
        trendDirection: "flat",
        msp: numberValue(record.msp),
        description: "Live daily price from the connected market API."
      });
    }

    const latitude = numberValue(record.lat, record.latitude, record.mandiLat, record.marketLat);
    const longitude = numberValue(record.lng, record.lon, record.longitude, record.mandiLng, record.marketLng);
    if (!mandis.has(mandiId)) {
      const distanceKm = latitude && longitude ? distanceBetween(farmerLocation.lat, farmerLocation.lng, latitude, longitude) : 0;
      mandis.set(mandiId, {
        id: mandiId,
        name: mandiName,
        nameHi: record.mandiNameHi || mandiName,
        namePa: record.mandiNamePa || mandiName,
        subText: textValue(record.subText, record.marketType, "Daily market").toString(),
        state: textValue(record.state, record.stateName),
        district: textValue(record.district, record.districtName),
        lat: latitude,
        lng: longitude,
        distanceKm,
        travelTime: distanceKm ? `${Math.max(1, Math.round(distanceKm / 45))} hr` : "Distance unavailable",
        rating: numberValue(record.rating, 4),
        eNamEnabled: Boolean(record.eNamEnabled || record.enam),
        facilities: record.facilities || ["Live API market data"],
        prices: {}
      });
    }
    const mandi = mandis.get(mandiId);
    mandi.prices[cropId] = { min: minimum, max: maximum, modal, arrivals: textValue(record.arrivals, record.arrivalVolume, "Live") };
  });

  if (!crops.size || !mandis.size) throw new Error("The API returned no usable daily crop prices.");
  return { crops: [...crops.values()], mandis: [...mandis.values()], priceHistory };
}

async function loadDailyPrices(farmerLocation) {
  const query = new URLSearchParams({ limit: "100", "filters[state]": farmerLocation.state || "", "filters[district]": farmerLocation.district || "" });
  const response = await fetch(`${KISANSETU_API_URL}${KISANSETU_API_URL.includes("?") ? "&" : "?"}${query}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Market API request failed (${response.status}).`);
  return normalizeDailyPrices(await response.json(), farmerLocation);
}

window.marketApi = { loadDailyPrices, normalizeDailyPrices };
