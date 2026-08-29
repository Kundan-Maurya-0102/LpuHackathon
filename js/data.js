const AGRI_DATA = {
  crops: [
    {
      id: "wheat",
      name: "Wheat",
      nameHi: "गेहूं",
      namePa: "ਕਣਕ",
      nameMr: "गहू",
      nameGu: "ઘઉં",
      nameTe: "గోధుమలు",
      nameTa: "கோதுமை",
      nameBn: "গম",
      category: "cereals",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🌾",
      grade: "FAQ Sharbati / HD-2967",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 2380,
      priceTrend: "+ ₹65 (2.8%)",
      trendDirection: "up",
      msp: 2275,
      season: "Rabi (रबी)",
      bestSowing: "Nov - Dec",
      harvestTime: "Mar - Apr",
      description: "High quality golden grain wheat with good protein and luster."
    },
    {
      id: "paddy",
      name: "Basmati Paddy",
      nameHi: "बासमती धान",
      namePa: "ਬਾਸਮਤੀ ਝੋਨਾ",
      nameMr: "बासमती भात",
      nameGu: "બાસમતી ડાંગર",
      nameTe: "బాస్మతి వరి",
      nameTa: "பாசுமதி நெல்",
      nameBn: "বাসমতী ধান",
      category: "cereals",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🌾",
      grade: "Pusa 1121 / 1509",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 3750,
      priceTrend: "+ ₹120 (3.3%)",
      trendDirection: "up",
      msp: 2203,
      season: "Kharif (खरीफ)",
      bestSowing: "Jun - Jul",
      harvestTime: "Oct - Nov",
      description: "Aromatic long grain premium basmati paddy."
    },
    {
      id: "mustard",
      name: "Mustard",
      nameHi: "सरसों",
      namePa: "ਸਰ੍ਹੋਂ",
      nameMr: "मोहरी",
      nameGu: "રાઈ / સરસવ",
      nameTe: "ఆవాలు",
      nameTa: "கடுகு",
      nameBn: "সর্ষে",
      category: "oilseeds",
      image: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🌼",
      grade: "42% Oil Content Black",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 5420,
      priceTrend: "+ ₹90 (1.7%)",
      trendDirection: "up",
      msp: 5650,
      season: "Rabi (रबी)",
      bestSowing: "Sep - Oct",
      harvestTime: "Feb - Mar",
      description: "High oil content bold black mustard seeds."
    },
    {
      id: "potato",
      name: "Potato",
      nameHi: "आलू",
      namePa: "ਆਲੂ",
      nameMr: "बटाटा",
      nameGu: "બટાકા",
      nameTe: "బంగాళాదుంప",
      nameTa: "உருளைக்கிழங்கு",
      nameBn: "আলু",
      category: "vegetables",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🥔",
      grade: "Kufri Jyoti / Pukhraj",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 1450,
      priceTrend: "- ₹30 (-2.0%)",
      trendDirection: "down",
      msp: 0,
      season: "Rabi / Winter",
      bestSowing: "Oct - Nov",
      harvestTime: "Jan - Mar",
      description: "Fresh table potato, smooth skin, medium to large size."
    },
    {
      id: "onion",
      name: "Red Onion",
      nameHi: "लाल प्याज",
      namePa: "ਲਾਲ ਪਿਆਜ਼",
      nameMr: "लाल कांदा",
      nameGu: "લાલ ડુંગળી",
      nameTe: "ఎర్ర ఉల్లిపాయ",
      nameTa: "வெங்காயம்",
      nameBn: "লাল পেঁয়াজ",
      category: "vegetables",
      image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🧅",
      grade: "Nasik / Garhwa Red",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 2650,
      priceTrend: "+ ₹180 (7.3%)",
      trendDirection: "up",
      msp: 0,
      season: "Kharif / Late Rabi",
      bestSowing: "May - Jun & Oct - Nov",
      harvestTime: "Dec - Jan & Apr - May",
      description: "Dry firm red onions, high shelf life."
    },
    {
      id: "tomato",
      name: "Tomato",
      nameHi: "टमाटर",
      namePa: "ਟਮਾਟਰ",
      nameMr: "टोमॅटो",
      nameGu: "ટામેટા",
      nameTe: "టమోటా",
      nameTa: "தக்காளி",
      nameBn: "টমেটো",
      category: "vegetables",
      image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🍅",
      grade: "Hybrid Desi / Himsona",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 1850,
      priceTrend: "+ ₹110 (6.3%)",
      trendDirection: "up",
      msp: 0,
      season: "All seasons",
      bestSowing: "Jul - Aug & Nov - Dec",
      harvestTime: "90 days after sowing",
      description: "Glossy red firm round tomatoes."
    },
    {
      id: "cotton",
      name: "Cotton",
      nameHi: "कपास / नरमा",
      namePa: "ਕਪਾਹ / ਨਰਮਾ",
      nameMr: "कापूस",
      nameGu: "કપાસ",
      nameTe: "పత్తి",
      nameTa: "பருத்தி",
      nameBn: "তুলা / কার্পাস",
      category: "cash_crops",
      image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "☁️",
      grade: "Medium / Long Staple BT",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 7150,
      priceTrend: "- ₹40 (-0.6%)",
      trendDirection: "down",
      msp: 6620,
      season: "Kharif (खरीफ)",
      bestSowing: "Apr - May",
      harvestTime: "Oct - Dec",
      description: "Clean white long staple cotton free from trash."
    },
    {
      id: "maize",
      name: "Maize / Corn",
      nameHi: "मक्का",
      namePa: "ਮੱਕੀ",
      nameMr: "मका",
      nameGu: "મકાઈ",
      nameTe: "మొక్కజొన్న",
      nameTa: "மக்காச்சோளம்",
      nameBn: "ভুট্টা",
      category: "cereals",
      image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🌽",
      grade: "Yellow Hybrid Feed Grade",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 2150,
      priceTrend: "+ ₹40 (1.9%)",
      trendDirection: "up",
      msp: 2090,
      season: "Kharif & Rabi",
      bestSowing: "Jun - Jul & Oct - Nov",
      harvestTime: "Sep - Oct & Feb - Mar",
      description: "Bright yellow dried corn kernels with low moisture."
    },
    {
      id: "soybean",
      name: "Soybean",
      nameHi: "सोयाबीन",
      namePa: "ਸੋਇਆਬੀਨ",
      nameMr: "सोयाबीन",
      nameGu: "સોયાબીન",
      nameTe: "సోయాబీన్",
      nameTa: "சோயாபீன்",
      nameBn: "সয়াবিন",
      category: "oilseeds",
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🌱",
      grade: "Yellow Bold JS-9560",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 4680,
      priceTrend: "+ ₹75 (1.6%)",
      trendDirection: "up",
      msp: 4600,
      season: "Kharif (खरीफ)",
      bestSowing: "Jun - Jul",
      harvestTime: "Oct - Nov",
      description: "Clean yellow bold soybean seed, moisture < 10%."
    },
    {
      id: "chana",
      name: "Gram / Chana",
      nameHi: "चना",
      namePa: "ਛੋਲੇ",
      nameMr: "हरभरा / चणा",
      nameGu: "ચણા",
      nameTe: "శనగలు",
      nameTa: "கொண்டைக்கடலை",
      nameBn: "ছোলা",
      category: "pulses",
      image: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🧆",
      grade: "Desi Chana Bold",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 6100,
      priceTrend: "+ ₹150 (2.5%)",
      trendDirection: "up",
      msp: 5440,
      season: "Rabi (रबी)",
      bestSowing: "Oct - Nov",
      harvestTime: "Mar - Apr",
      description: "High grade brown desi chana."
    },
    {
      id: "sugarcane",
      name: "Sugarcane",
      nameHi: "गन्ना",
      namePa: "ਗੰਨਾ",
      nameMr: "ऊस",
      nameGu: "શેરડી",
      nameTe: "చెరకు",
      nameTa: "கரும்பு",
      nameBn: "আখ",
      category: "cash_crops",
      image: "https://images.unsplash.com/photo-1589135233689-d41a766c1eb9?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🎋",
      grade: "Early Maturing CO-0238",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 380,
      priceTrend: "0 (0%)",
      trendDirection: "flat",
      msp: 315,
      season: "Annual",
      bestSowing: "Feb - Mar & Oct",
      harvestTime: "Nov - Apr",
      description: "High recovery sweet thick sugarcane."
    },
    {
      id: "garlic",
      name: "Garlic",
      nameHi: "लहसुन",
      namePa: "ਲਸਣ",
      nameMr: "लसूण",
      nameGu: "લસણ",
      nameTe: "వెల్లుల్లి",
      nameTa: "பூண்டு",
      nameBn: "রসুন",
      category: "vegetables",
      image: "https://images.unsplash.com/photo-1588615419957-462725e2e858?auto=format&fit=crop&w=600&q=80",
      fallbackIcon: "🧄",
      grade: "Ooty / Desi G-282",
      unit: "Quintal (100 kg)",
      allIndiaAvg: 11200,
      priceTrend: "+ ₹450 (4.2%)",
      trendDirection: "up",
      msp: 0,
      season: "Rabi",
      bestSowing: "Sep - Nov",
      harvestTime: "Feb - Apr",
      description: "White bold tight cloves garlic, dry cured."
    }
  ],

  mandis: [], // Will be populated dynamically via API

  vehicles: [
    {
      id: "tractor",
      name: "Tractor Trolley",
      nameHi: "ट्रैक्टर ट्रॉली",
      namePa: "ਟਰੈਕਟਰ ਟਰਾਲੀ",
      icon: "🚜",
      capacityQtl: 40,
      capacityBags: 80,
      ratePerKm: 28,
      baseLoadingFee: 400,
      speedKmh: 30,
      description: "Best for village roads & loads between 20 to 50 quintals.",
      badge: "Farmer Favorite"
    },
    {
      id: "pickup",
      name: "Pickup Bolero Camper",
      nameHi: "पिकअप बोलेरो",
      namePa: "ਪਿਕਅੱਪ ਬੋਲੇਰੋ",
      icon: "🛻",
      capacityQtl: 20,
      capacityBags: 40,
      ratePerKm: 18,
      baseLoadingFee: 250,
      speedKmh: 50,
      description: "Fast transit, ideal for perishables (vegetables & fruits) up to 25 quintals.",
      badge: "Fast & Safe"
    },
    {
      id: "auto",
      name: "3-Wheeler Cargo Auto",
      nameHi: "3-पहिया ऑटो रिक्शा",
      namePa: "3-ਪਹੀਆ ਆਟੋ",
      icon: "🛺",
      capacityQtl: 8,
      capacityBags: 16,
      ratePerKm: 12,
      baseLoadingFee: 120,
      speedKmh: 35,
      description: "Economical for small quantities up to 10 quintals to nearby mandis.",
      badge: "Lowest Cost"
    },
    {
      id: "truck",
      name: "10-Wheeler Heavy Truck",
      nameHi: "10-टायर बड़ा ट्रक",
      namePa: "10-ਟਾਇਰ ਵੱਡਾ ਟਰੱਕ",
      icon: "🚛",
      capacityQtl: 160,
      capacityBags: 320,
      ratePerKm: 52,
      baseLoadingFee: 1200,
      speedKmh: 45,
      description: "Heavy bulk transport for 100+ quintals across long interstate distances.",
      badge: "Bulk Transport"
    }
  ],

  priceHistory: {}, // Fetched via API
  weather: {}, // Fetched via API
  sampleAlerts: [] // Fetched via API
};

/**
 * updateCropPricesFromAPI
 * Takes the flat array from /api/market-prices and patches each crop in
 * AGRI_DATA.crops with the live average modal price from the database.
 * Also calculates the price change vs the static baseline and sets
 * trendDirection ('up', 'down', 'flat') for the UI badge.
 *
 * @param {Array} pricesData - Array of market_price rows from the backend
 */
function updateCropPricesFromAPI(pricesData) {
  if (!Array.isArray(pricesData) || pricesData.length === 0) return;

  // Commodity name → crop.id mapping (normalize DB commodity names to our IDs)
  const commodityToCropId = {
    "wheat":        "wheat",
    "basmati paddy": "paddy",
    "paddy":        "paddy",
    "mustard":      "mustard",
    "potato":       "potato",
    "onion":        "onion",
    "red onion":    "onion",
    "tomato":       "tomato",
    "cotton":       "cotton",
    "maize":        "maize",
    "corn":         "maize",
    "soybean":      "soybean",
    "chana":        "chana",
    "gram":         "chana",
    "sugarcane":    "sugarcane",
    "garlic":       "garlic"
  };

  // Build per-cropId aggregation: sum modal prices and count them
  const aggregation = {}; // cropId → { sum, count, min_modal, max_modal }

  pricesData.forEach(item => {
    const rawCommodity = (item.commodity || "").trim().toLowerCase();
    const cropId = commodityToCropId[rawCommodity];
    if (!cropId) return;

    const modal = parseFloat(item.modal_price);
    if (!modal || isNaN(modal)) return;

    if (!aggregation[cropId]) {
      aggregation[cropId] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    }
    aggregation[cropId].sum += modal;
    aggregation[cropId].count += 1;
    aggregation[cropId].min = Math.min(aggregation[cropId].min, modal);
    aggregation[cropId].max = Math.max(aggregation[cropId].max, modal);
  });

  // Patch each crop in AGRI_DATA.crops
  AGRI_DATA.crops.forEach(crop => {
    const agg = aggregation[crop.id];
    if (!agg || agg.count === 0) return;

    const liveAvg = Math.round(agg.sum / agg.count);
    const prevAvg = crop.allIndiaAvg;
    const diff = liveAvg - prevAvg;
    const pct = prevAvg > 0 ? ((diff / prevAvg) * 100).toFixed(1) : "0.0";

    crop.allIndiaAvg = liveAvg;

    if (Math.abs(diff) < 5) {
      crop.trendDirection = "flat";
      crop.priceTrend = "0 (0%)";
    } else if (diff > 0) {
      crop.trendDirection = "up";
      crop.priceTrend = `+ ₹${Math.abs(diff)} (${pct}%)`;
    } else {
      crop.trendDirection = "down";
      crop.priceTrend = `- ₹${Math.abs(diff)} (${Math.abs(pct)}%)`;
    }
  });

  console.log(`[KisanSetu] ✅ Live APMC prices applied to ${Object.keys(aggregation).length} crops from DB.`);
}

function getLocalizedCropName(crop, lang) {
  if (!crop) return "";
  const currentLang = lang || (window.i18n ? window.i18n.getLanguage() : "hi");
  if (typeof crop === "string") {
    crop = (AGRI_DATA.crops || []).find(c => c.id === crop) || { name: crop };
  }
  const langKeyMap = {
    hi: "nameHi",
    pa: "namePa",
    mr: "nameMr",
    gu: "nameGu",
    te: "nameTe",
    ta: "nameTa",
    bn: "nameBn"
  };
  const key = langKeyMap[currentLang];
  if (key && crop[key]) {
    return `${crop[key]} (${crop.name})`;
  }
  return crop.name;
}

function getLocalizedVehicleName(vehicle, lang) {
  if (!vehicle) return "";
  const currentLang = lang || (window.i18n ? window.i18n.getLanguage() : "hi");
  if (typeof vehicle === "string") {
    vehicle = (AGRI_DATA.vehicles || []).find(v => v.id === vehicle) || { name: vehicle };
  }
  if (currentLang === "hi" && vehicle.nameHi) return vehicle.nameHi;
  if (currentLang === "pa" && vehicle.namePa) return vehicle.namePa;
  return vehicle.name;
}

if (typeof window !== "undefined") {
  window.AGRI_DATA = AGRI_DATA;
  window.updateCropPricesFromAPI = updateCropPricesFromAPI;
  window.getLocalizedCropName = getLocalizedCropName;
  window.getLocalizedVehicleName = getLocalizedVehicleName;
}
