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
  marketDataStatus: "idle",
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

async function initApp() {
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

  setupEventListeners();

  if (!storedLang) {
    showLanguageModal();
  } else if (!storedUser) {
    showAuthModal();
  } else {
    APP_STATE.user = JSON.parse(storedUser);
    renderUserUI();
    hideAllModals();
  }

  updateLiveTimestamp();
  
  // Fetch dynamic market data before rendering views
  await loadMarketData();
  
  renderAllViews();
}

async function loadMarketData() {
    try {
        const res = await apiMarket.getPrices();
        if (res.success) {
            // Group raw prices by market
            const marketMap = {};
            const rawPrices = res.data;
            
            rawPrices.forEach(item => {
              if (!item || !item.market || !item.commodity) return;
              const mandiId = String(item.market).toLowerCase().replace(/[^a-z0-9]+/g, "_");
              const coordinates = {
                "telangana": [17.3850, 78.4867],
                "karnataka": [14.4644, 75.9218],
                "punjab": [31.3260, 75.5762],
                "keralam": [11.2588, 75.7804]
              };
              const locationCoordinates = coordinates[String(item.state || "").toLowerCase()] || [20.5937, 78.9629];
                if (!marketMap[mandiId]) {
                    marketMap[mandiId] = {
                        id: mandiId,
                        name: item.market,
                        nameHi: item.market + " मंडी",
                        namePa: item.market + " ਮੰਡੀ",
                        subText: "Verified Market",
                        state: item.state,
                        district: item.district,
                        // Fallback coordinates since our DB doesn't have them yet
                        lat: locationCoordinates[0],
                        lng: locationCoordinates[1],
                        distanceKm: 0,
                        travelTime: "45 min",
                        rating: 4.5,
                        eNamEnabled: true,
                        facilities: ["Weighbridge", "Covered Shed", "Canteen"],
                        contact: "+91 99999 99999",
                        secretary: "Mandi Secretary",
                        timing: "06:00 AM - 06:00 PM",
                        prices: {}
                    };
                }
                
                const cropId = String(item.commodity).toLowerCase().replace(/[^a-z0-9]+/g, "-");
                marketMap[mandiId].prices[cropId] = {
                  min: Number(item.min_price) || 0,
                  max: Number(item.max_price) || 0,
                  modal: Number(item.modal_price) || 0,
                    arrivals: "Available",
                    trend: "+0" // Can be calculated based on history
                };
            });
            
            const liveMandis = Object.values(marketMap);
              const liveCrops = [...new Map(rawPrices.filter(item => item?.commodity && Number(item.modal_price) > 0 && cropImageUrl(item.commodity)).map(item => {
                const id = String(item.commodity).toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return [id, { id, name: item.commodity, nameHi: item.commodity, namePa: item.commodity, category: "all", image: cropImageUrl(item.commodity), fallbackIcon: "🌾", unit: "Quintal (100 kg)", allIndiaAvg: Number(item.modal_price), priceTrend: "Live", trendDirection: "flat", msp: 0, description: "Live price from data.gov.in." }];
              })).values()];
                if (!liveCrops.length || !liveMandis.length) throw new Error("No usable mandi records returned by the market API.");
                AGRI_DATA.mandis.splice(0, AGRI_DATA.mandis.length, ...liveMandis);
                AGRI_DATA.crops.splice(0, AGRI_DATA.crops.length, ...liveCrops);
                AGRI_DATA.priceHistory = {};
                APP_STATE.selectedCropId = AGRI_DATA.crops[0].id;
                APP_STATE.selectedMandiId = AGRI_DATA.mandis.find(m => m.prices[APP_STATE.selectedCropId])?.id || AGRI_DATA.mandis[0].id;
              APP_STATE.marketDataStatus = "ready";
        }
    } catch (err) {
        console.error("Failed to load market data:", err);
            APP_STATE.marketDataStatus = AGRI_DATA.crops.length && AGRI_DATA.mandis.length ? "ready" : "error";
    }
}

function cropImageUrl(name) {
  const value = String(name || "").toLowerCase();
  const imageByCrop = {
    wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
    rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    paddy: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    mustard: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80",
    potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    onion: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    cotton: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80",
    maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80",
    corn: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80",
    soybean: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    chana: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80",
    gram: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80",
    sugarcane: "https://images.unsplash.com/photo-1589135233689-d41a766c1eb9?auto=format&fit=crop&w=600&q=80",
    garlic: "https://images.unsplash.com/photo-1588615419957-462725e2e858?auto=format&fit=crop&w=600&q=80"
  };
  const key = Object.keys(imageByCrop).find(crop => value.includes(crop));
  return key ? imageByCrop[key] : "";
}

function setupEventListeners() {
  document.querySelectorAll(".lang-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".lang-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      const lang = card.getAttribute("data-lang");
      APP_STATE.selectedLanguage = lang;
      if (window.i18n) window.i18n.setLanguage(lang);
    });
  });

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

  const headerLangSelect = document.getElementById("headerLangSelect");
  if (headerLangSelect) {
    headerLangSelect.value = APP_STATE.selectedLanguage;
    headerLangSelect.addEventListener("change", (e) => {
      const lang = e.target.value;
      APP_STATE.selectedLanguage = lang;
      if (window.i18n) window.i18n.setLanguage(lang);
      updateTickerLanguage(lang);
      renderAllViews();
      if (APP_STATE.user && document.getElementById("profileModal") && document.getElementById("profileModal").classList.contains("active")) {
        renderProfileModal();
      }
    });
  }

  if (window.i18n) {
    window.i18n.subscribe((lang) => {
      updateTickerLanguage(lang);
    });
  }



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

  // Login button handler
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("loginPhoneInput")?.value.trim();
      const password = document.getElementById("loginPasswordInput")?.value.trim();
      
      if (!mobile || mobile.length < 10) {
        showToast("Please enter valid 10-digit mobile number", "error");
        return;
      }
      if (!password) {
        showToast("Please enter password", "error");
        return;
      }
      
      const originalText = loginBtn.innerText;
      loginBtn.innerText = "Logging in...";
      loginBtn.disabled = true;
      
      try {
        const res = await apiAuth.login(mobile, password);
        if (res.success) {
          APP_STATE.user = res.data.user;
          localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
          renderUserUI();
          hideAllModals();
          renderAllViews();
          showToast("✅ Login successful!", "success");
        }
      } catch (err) {
        showToast("❌ " + (err.message || "Login failed"), "error");
      } finally {
        loginBtn.innerText = originalText;
        loginBtn.disabled = false;
      }
    });
  }

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  if (sendOtpBtn && verifyOtpBtn) {
    sendOtpBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("loginPhoneInput")?.value.trim();
      if (!/^\d{10}$/.test(mobile || "")) {
        showToast("Please enter valid 10-digit mobile number", "error");
        return;
      }
      try {
        const result = await apiAuth.sendOtp(mobile);
        verifyOtpBtn.style.display = "block";
        showToast(`OTP sent. Demo OTP: ${result.debug_otp || "check SMS"}`, "success");
      } catch (error) {
        showToast("❌ " + (error.message || "Could not send OTP"), "error");
      }
    });

    verifyOtpBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("loginPhoneInput")?.value.trim();
      const otp = document.getElementById("loginOtpInput")?.value.trim();
      if (!/^\d{10}$/.test(mobile || "") || !/^\d{6}$/.test(otp || "")) {
        showToast("Enter mobile number and 6-digit OTP", "error");
        return;
      }
      try {
        const result = await apiAuth.verifyOtp(mobile, otp);
        if (result.success && result.data?.token) {
          APP_STATE.user = result.data.user;
          localStorage.setItem("kisansetu_user", JSON.stringify(result.data.user));
          hideAllModals();
          renderUserUI();
          renderAllViews();
          showToast("✅ OTP login successful!", "success");
        }
      } catch (error) {
        showToast("❌ " + (error.message || "OTP verification failed"), "error");
      }
    });
  }

  const cropSearchInput = document.getElementById("cropSearchInput");
  if (cropSearchInput) {
    cropSearchInput.addEventListener("input", (e) => {
      APP_STATE.searchQuery = e.target.value.toLowerCase().trim();
      renderCropCatalog();
    });
  }

  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  if (voiceSearchBtn) {
    voiceSearchBtn.addEventListener("click", () => {
      window.speechEngine.toggleVoiceSearch();
    });
  }

  document.querySelectorAll(".category-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      APP_STATE.selectedCategory = pill.getAttribute("data-category");
      renderCropCatalog();
    });
  });

  const detectLocationBtn = document.getElementById("detectLocationBtn");
  if (detectLocationBtn) {
    detectLocationBtn.addEventListener("click", handleLocationAutoDetect);
  }

  const radiusSlider = document.getElementById("radiusSlider");
  const radiusValue = document.getElementById("radiusValue");
  if (radiusSlider) {
    radiusSlider.addEventListener("input", (e) => {
      APP_STATE.maxSearchRadiusKm = parseInt(e.target.value);
      if (radiusValue) radiusValue.textContent = `${APP_STATE.maxSearchRadiusKm} km`;
      renderMandiComparison();
    });
  }

  const quantityInput = document.getElementById("quantityInput");
  const quantityUnitSelect = document.getElementById("quantityUnitSelect");
  if (quantityInput) {
    quantityInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value) || 1;
      if (quantityUnitSelect && quantityUnitSelect.value === "bags") {
        val = val * 0.5;
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

  document.querySelectorAll(".vehicle-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".vehicle-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      APP_STATE.selectedVehicleId = card.getAttribute("data-vehicle");
      updateCalculatorView();
    });
  });

  document.querySelectorAll(".period-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const period = btn.getAttribute("data-period");
      window.priceChart.renderChart(APP_STATE.selectedCropId, period);
    });
  });

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  const saveAlertBtn = document.getElementById("saveAlertBtn");
  if (saveAlertBtn) {
    saveAlertBtn.addEventListener("click", handleSavePriceAlert);
  }

  const notificationBellBtn = document.getElementById("notificationBellBtn");
  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", () => {
      showModal("alertModal");
      renderAlertsList();
    });
  }

  window.addEventListener("resize", () => {
    if (window.mandiMap) window.mandiMap.invalidateSize();
  });
}

function handleProfileButtonClick() {
  if (APP_STATE.user) {
    renderProfileModal();
    showModal("profileModal");
  } else {
    showAuthModal();
  }
}

function loginFarmer(userData) {
  APP_STATE.user = {
    name: userData.name || "Ramesh Kumar",
    phone: userData.phone || "+91 98765 43210",
    state: userData.state || "Punjab",
    district: userData.district || "Kapurthala",
    village: userData.village || "Near Phagwara, LPU Region",
    landAcres: userData.landAcres || 8.5,
    kisanId: userData.kisanId || "PB-2026-8941",
    primaryMandi: userData.primaryMandi || "Khanna APMC Market",
    preferredVehicle: userData.preferredVehicle || "Tractor Trolley (40 Qtl)",
    crops: userData.crops || ["Wheat (गेहूं)", "Basmati Paddy (धान)", "Potato (आलू)"]
  };
  localStorage.setItem("kisansetu_user", JSON.stringify(APP_STATE.user));
  hideModal("authModal");
  renderUserUI();
  handleLocationAutoDetect();
  showToast(`🌾 राम राम ${APP_STATE.user.name}! Welcome to KisanSetu`, "success");
}

async function loadMarketDataLegacy() {
  APP_STATE.marketDataStatus = "loading";
  renderMarketDataState();
  try {
    const marketData = await window.marketApi.loadDailyPrices(APP_STATE.userLocation);
    AGRI_DATA.crops.splice(0, AGRI_DATA.crops.length, ...marketData.crops);
    AGRI_DATA.mandis.splice(0, AGRI_DATA.mandis.length, ...marketData.mandis);
    AGRI_DATA.priceHistory = marketData.priceHistory || {};
    APP_STATE.selectedCropId = AGRI_DATA.crops[0].id;
    APP_STATE.selectedMandiId = AGRI_DATA.mandis[0].id;
    APP_STATE.marketDataStatus = "ready";
    renderAllViews();
    showToast("Live daily mandi prices loaded for your location.", "success");
  } catch (error) {
    APP_STATE.marketDataStatus = "error";
    renderMarketDataState(error.message);
  }
}

function renderMarketDataState(message = "Loading live mandi prices...") {
  const catalog = document.getElementById("cropCatalogGrid");
  const mandis = document.getElementById("mandiComparisonCards");
  const recommendation = document.getElementById("bestMandiBanner");
  if (APP_STATE.marketDataStatus === "loading") {
    if (catalog) catalog.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><h3>Loading live crop prices</h3><p>Finding today's prices and nearest mandis for your location.</p></div>`;
    if (mandis) mandis.innerHTML = "";
    if (recommendation) recommendation.innerHTML = "";
  } else if (APP_STATE.marketDataStatus === "error") {
    const content = `<div class="empty-state"><div class="empty-icon">📡</div><h3>Live market data unavailable</h3><p>${message}</p><button class="modal-footer-btn" onclick="loadMarketData()">Retry</button></div>`;
    if (catalog) catalog.innerHTML = content;
    if (mandis) mandis.innerHTML = "";
    if (recommendation) recommendation.innerHTML = "";
  }
}

function openSellCropModal() {
  if (!APP_STATE.user) {
    showAuthModal();
    showToast("Login with your Farmer ID before recording a sale.", "info");
    return;
  }
  const cropSelect = document.getElementById("saleCropSelect");
  const mandiSelect = document.getElementById("saleMandiSelect");
  if (!cropSelect || !mandiSelect) return;
  cropSelect.innerHTML = AGRI_DATA.crops.map(crop => `<option value="${crop.id}" ${crop.id === APP_STATE.selectedCropId ? "selected" : ""}>${crop.name} (${crop.nameHi})</option>`).join("");
  mandiSelect.innerHTML = AGRI_DATA.mandis.map(mandi => `<option value="${mandi.id}" ${mandi.id === APP_STATE.selectedMandiId ? "selected" : ""}>${mandi.name}</option>`).join("");
  updateSaleRatePreview();
  showModal("sellCropModal");
}

function getSaleDetails() {
  const cropId = document.getElementById("saleCropSelect").value;
  const mandiId = document.getElementById("saleMandiSelect").value;
  const quantity = parseFloat(document.getElementById("saleQuantityInput").value) || 0;
  const crop = AGRI_DATA.crops.find(item => item.id === cropId);
  const mandi = AGRI_DATA.mandis.find(item => item.id === mandiId);
  const rate = mandi && mandi.prices[cropId] ? mandi.prices[cropId].modal : crop.allIndiaAvg;
  return { crop, mandi, quantity, rate, buyer: document.getElementById("saleBuyerInput").value.trim() };
}

function updateSaleRatePreview() {
  const preview = document.getElementById("saleRatePreview");
  if (!preview || !document.getElementById("saleCropSelect").value) return;
  const sale = getSaleDetails();
  preview.innerHTML = `<span>Current modal rate</span><strong>₹${sale.rate.toLocaleString("en-IN")} / quintal</strong><span>Estimated trade value</span><strong>₹${(sale.rate * sale.quantity).toLocaleString("en-IN")}</strong>`;
}

function handleCropSale(event) {
  event.preventDefault();
  const sale = getSaleDetails();
  if (!sale.buyer || sale.quantity <= 0) return;
  const receipt = { ...sale, receiptId: `KS-${Date.now().toString().slice(-8)}`, date: new Date().toLocaleDateString("en-IN") };
  localStorage.setItem("kisansetu_last_trade", JSON.stringify(receipt));
  document.getElementById("tradeReceiptContent").innerHTML = `<div class="trade-receipt-heading"><span>🌾 KisanSetu</span><strong>Trade Receipt</strong><small>${receipt.receiptId} · ${receipt.date}</small></div><div class="trade-receipt-grid"><span>Farmer</span><strong>${APP_STATE.user.name} (${APP_STATE.user.kisanId})</strong><span>Buyer / trader</span><strong>${receipt.buyer}</strong><span>Crop</span><strong>${receipt.crop.name}</strong><span>Mandi</span><strong>${receipt.mandi.name}</strong><span>Quantity</span><strong>${receipt.quantity} quintals</strong><span>Rate</span><strong>₹${receipt.rate.toLocaleString("en-IN")} / quintal</strong></div><div class="trade-total"><span>Total trade value</span><strong>₹${(receipt.rate * receipt.quantity).toLocaleString("en-IN")}</strong></div><p class="receipt-note">Rate source: current KisanSetu mandi modal rate. Keep this receipt for your records.</p>`;
  hideModal("sellCropModal");
  showModal("tradeReceiptModal");
}

function logoutFarmer() {
  localStorage.removeItem("kisansetu_user");
  APP_STATE.user = null;
  hideModal("profileModal");
  hideModal("editProfileModal");
  renderUserUI();
  renderAllViews();
  showToast("👋 राम राम किसान भाई! Successfully Logged Out (लॉगआउट हो गए)", "info");
  showAuthModal();
}

function renderUserUI() {
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userProfileBtn = document.getElementById("userProfileBtn");
  
  if (APP_STATE.user) {
    const displayName = String(APP_STATE.user.full_name || APP_STATE.user.name || "Farmer").trim();
    if (userNameDisplay) userNameDisplay.textContent = displayName.split(/\s+/)[0] + " (Profile)";
    if (userProfileBtn) userProfileBtn.title = "View Farmer Profile";
  } else {
    if (userNameDisplay) userNameDisplay.textContent = "Farmer Login";
    if (userProfileBtn) userProfileBtn.title = "Login / Register";
  }
  
  const userLocDisplay = document.getElementById("currentLocationDisplay");
  if (userLocDisplay) {
    userLocDisplay.textContent = APP_STATE.userLocation.name;
  }
}

function updateTickerLanguage(lang) {
  const marquee = document.querySelector(".ticker-marquee");
  if (!marquee) return;

  const tickerData = {
    en: [
      "🌾 <strong>Wheat:</strong> Khanna Mandi ₹2,510/Qtl (+₹80)",
      "🌾 <strong>Basmati Paddy:</strong> Amritsar Mandi ₹4,080/Qtl (+₹160)",
      "🌼 <strong>Mustard:</strong> Jalandhar Mandi ₹5,490/Qtl (+₹75)",
      "🥔 <strong>Potato:</strong> Phagwara Mandi ₹1,450/Qtl (-₹10)",
      "🧅 <strong>Red Onion:</strong> Ludhiana Mandi ₹2,790/Qtl (+₹140)",
      "☁️ <strong>Cotton:</strong> Khanna Mandi ₹7,350/Qtl (+₹60)"
    ],
    hi: [
      "🌾 <strong>गेहूं:</strong> खन्ना मंडी ₹2,510/क्विंटल (+₹80)",
      "🌾 <strong>बासमती धान:</strong> अमृतसर मंडी ₹4,080/क्विंटल (+₹160)",
      "🌼 <strong>सरसों:</strong> जालंधर मंडी ₹5,490/क्विंटल (+₹75)",
      "🥔 <strong>आलू:</strong> फगवाड़ा मंडी ₹1,450/क्विंटल (-₹10)",
      "🧅 <strong>लाल प्याज:</strong> लुधियाना मंडी ₹2,790/क्विंटल (+₹140)",
      "☁️ <strong>कपास:</strong> खन्ना मंडी ₹7,350/क्विंटल (+₹60)"
    ],
    pa: [
      "🌾 <strong>ਕਣਕ:</strong> ਖੰਨਾ ਮੰਡੀ ₹2,510/ਕੁਇੰਟਲ (+₹80)",
      "🌾 <strong>ਬਾਸਮਤੀ ਝੋਨਾ:</strong> ਅੰਮ੍ਰਿਤਸਰ ਮੰਡੀ ₹4,080/ਕੁਇੰਟਲ (+₹160)",
      "🌼 <strong>ਸਰ੍ਹੋਂ:</strong> ਜਲੰਧਰ ਮੰਡੀ ₹5,490/ਕੁਇੰਟਲ (+₹75)",
      "🥔 <strong>ਆਲੂ:</strong> ਫਗਵਾੜਾ ਮੰਡੀ ₹1,450/ਕੁਇੰਟਲ (-₹10)",
      "🧅 <strong>ਲਾਲ ਪਿਆਜ਼:</strong> ਲੁਧਿਆਣਾ ਮੰਡੀ ₹2,790/ਕੁਇੰਟਲ (+₹140)",
      "☁️ <strong>ਕਪਾਹ:</strong> ਖੰਨਾ ਮੰਡੀ ₹7,350/ਕੁਇੰਟਲ (+₹60)"
    ],
    mr: [
      "🌾 <strong>गहू:</strong> खन्ना मंडी ₹2,510/क्विंटल (+₹80)",
      "🌾 <strong>बासमती भात:</strong> अमृतसर मंडी ₹4,080/क्विंटल (+₹160)",
      "🌼 <strong>मोहरी:</strong> जालंधर मंडी ₹5,490/क्विंटल (+₹75)",
      "🥔 <strong>बटाटा:</strong> फगवाडा मंडी ₹1,450/क्विंटल (-₹10)",
      "🧅 <strong>लाल कांदा:</strong> लुधियाना मंडी ₹2,790/क्विंटल (+₹140)",
      "☁️ <strong>कापूस:</strong> खन्ना मंडी ₹7,350/क्विंटल (+₹60)"
    ],
    gu: [
      "🌾 <strong>ઘઉં:</strong> ખન્ના મંડી ₹2,510/ક્વિન્ટલ (+₹80)",
      "🌾 <strong>બાસમતી ડાંગર:</strong> અમૃતસર મંડી ₹4,080/ક્વિન્ટલ (+₹160)",
      "🌼 <strong>સરસવ:</strong> જાલંધર મંડી ₹5,490/ક્વિન્ટલ (+₹75)",
      "🥔 <strong>બટાટા:</strong> ફગવારા મંડી ₹1,450/ક્વિન્ટલ (-₹10)",
      "🧅 <strong>લાલ ડુંગળી:</strong> લુધિયાણા મંડી ₹2,790/ક્વિન્ટલ (+₹140)",
      "☁️ <strong>કપાસ:</strong> ખન્ના મંડી ₹7,350/ક્વિન્ટલ (+₹60)"
    ],
    te: [
      "🌾 <strong>గోధుమ:</strong> ఖన్నా మండి ₹2,510/క్వింటాల్ (+₹80)",
      "🌾 <strong>బాస్మతి వరి:</strong> అమృత్‌సర్ మండి ₹4,080/క్వింటాల్ (+₹160)",
      "🌼 <strong>ఆవాలు:</strong> జలంధర్ మండి ₹5,490/క్వింటాల్ (+₹75)",
      "🥔 <strong>బంగాళాదుంప:</strong> ఫగ్వారా మండి ₹1,450/క్వింటాల్ (-₹10)",
      "🧅 <strong>ఎరుపు ఉల్లిపాయ:</strong> లూథియానా మండి ₹2,790/క్వింటాల్ (+₹140)",
      "☁️ <strong>పత్తి:</strong> ఖన్నా మండి ₹7,350/క్వింటాల్ (+₹60)"
    ],
    ta: [
      "🌾 <strong>கோதுமை:</strong> கன்னா மண்டி ₹2,510/குவிண்டால் (+₹80)",
      "🌾 <strong>பாஸ்மதி நெல்:</strong> அமிர்தசர் மண்டி ₹4,080/குவிண்டால் (+₹160)",
      "🌼 <strong>கடுகு:</strong> ஜலந்தர் மண்டி ₹5,490/குவிண்டால் (+₹75)",
      "🥔 <strong>உருளைக்கிழங்கு:</strong> பகுவாரா மண்டி ₹1,450/குவிண்டால் (-₹10)",
      "🧅 <strong>சிவப்பு வெங்காயம்:</strong> லூதியானா மண்டி ₹2,790/குவிண்டால் (+₹140)",
      "☁️ <strong>பருத்தி:</strong> கன்னா மண்டி ₹7,350/குவிண்டால் (+₹60)"
    ],
    bn: [
      "🌾 <strong>গম:</strong> খান্না মান্ডি ₹2,510/কুইন্টাল (+₹80)",
      "🌾 <strong>বাসমতি ধান:</strong> অমৃতসর মান্ডি ₹4,080/কুইন্টাল (+₹160)",
      "🌼 <strong>সরিষা:</strong> জলন্ধর মান্ডি ₹5,490/কুইন্টাল (+₹75)",
      "🥔 <strong>আলু:</strong> ফগওয়ারা মান্ডি ₹1,450/কুইন্টাল (-₹10)",
      "🧅 <strong>লাল পেঁয়াজ:</strong> লুধিয়ানা মান্ডি ₹2,790/কুইন্টাল (+₹140)",
      "☁️ <strong>তুলা:</strong> খান্না মান্ডি ₹7,350/কুইন্টাল (+₹60)"
    ]
  };

  const items = tickerData[lang] || tickerData["en"];
  const doubled = [...items, ...items];
  marquee.innerHTML = doubled.map(txt => `<span>${txt}</span>`).join("");
}

function renderProfileModal() {
  if (!APP_STATE.user) return;
  const u = APP_STATE.user;

  const nameEl = document.getElementById("profNameDisplay");
  const idEl = document.getElementById("profKisanId");
  const addrEl = document.getElementById("profAddressDisplay");
  const phoneEl = document.getElementById("profPhoneDisplay");
  const landEl = document.getElementById("profLandDisplay");
  const mandiEl = document.getElementById("profMandiDisplay");
  const vehEl = document.getElementById("profVehicleDisplay");
  const harvestEl = document.getElementById("profHarvestValDisplay");
  const cropsListEl = document.getElementById("profCropsList");

  if (nameEl) nameEl.textContent = u.name;
  if (idEl) idEl.textContent = u.kisanId || "Kisan ID: PB-2026-8941";
  if (addrEl) addrEl.textContent = `📍 ${u.village}, ${u.district}, ${u.state}`;
  if (phoneEl) phoneEl.textContent = `📞 ${u.phone}`;
  if (landEl) landEl.textContent = `${u.landAcres || 8.5} Acres (एकड़)`;
  if (mandiEl) mandiEl.textContent = u.primaryMandi || "Khanna APMC Market";
  if (vehEl) vehEl.textContent = u.preferredVehicle || "Tractor Trolley (40 Qtl)";
  
  const estVal = Math.round((u.landAcres || 8.5) * 28000);
  if (harvestEl) harvestEl.textContent = `₹${estVal.toLocaleString("en-IN")}`;

  if (cropsListEl) {
    const crops = u.crops || ["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"];
    cropsListEl.innerHTML = crops.map(c => `<span class="crop-tag-pill">🌾 ${c}</span>`).join("");
  }
}

function openEditProfileModal() {
  hideModal("profileModal");
  if (!APP_STATE.user) return;
  const u = APP_STATE.user;

  const nameInp = document.getElementById("editNameInput");
  const phoneInp = document.getElementById("editPhoneInput");
  const stateSel = document.getElementById("editStateSelect");
  const distInp = document.getElementById("editDistrictInput");
  const villInp = document.getElementById("editVillageInput");
  const landInp = document.getElementById("editLandInput");

  if (nameInp) nameInp.value = u.name;
  if (phoneInp) phoneInp.value = u.phone.replace(/[^0-9]/g, "").slice(-10);
  if (stateSel) stateSel.value = u.state;
  if (distInp) distInp.value = u.district;
  if (villInp) villInp.value = u.village;
  if (landInp) landInp.value = u.landAcres || 8.5;

  showModal("editProfileModal");
}

function handleSaveProfile(e) {
  if (e) e.preventDefault();

  const nameInp = document.getElementById("editNameInput");
  const phoneInp = document.getElementById("editPhoneInput");
  const stateSel = document.getElementById("editStateSelect");
  const distInp = document.getElementById("editDistrictInput");
  const villInp = document.getElementById("editVillageInput");
  const landInp = document.getElementById("editLandInput");

  const updatedUser = {
    ...APP_STATE.user,
    name: nameInp.value.trim() || APP_STATE.user.name,
    phone: `+91 ${phoneInp.value.trim() || '9876543210'}`,
    state: stateSel.value,
    district: distInp.value.trim(),
    village: villInp.value.trim(),
    landAcres: parseFloat(landInp.value) || 8.5
  };

  APP_STATE.user = updatedUser;
  localStorage.setItem("kisansetu_user", JSON.stringify(updatedUser));

  APP_STATE.userLocation.name = `${updatedUser.village}, ${updatedUser.district}, ${updatedUser.state}`;
  APP_STATE.userLocation.state = updatedUser.state;
  APP_STATE.userLocation.district = updatedUser.district;

  hideModal("editProfileModal");
  renderUserUI();
  renderProfileModal();
  showModal("profileModal");
  renderAllViews();

  showToast("✅ किसान प्रोफाइल सफलतापूर्वक अपडेट हुई (Profile updated successfully)!", "success");
}

function switchFarmerProfile(profileKey) {
  document.querySelectorAll(".switch-pill").forEach(p => p.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");

  const sampleProfiles = {
    ramesh: {
      name: "Ramesh Kumar (ਰਮੇਸ਼ ਕੁਮਾਰ)",
      phone: "+91 98765 43210",
      state: "Punjab",
      district: "Kapurthala",
      village: "Near Phagwara, LPU Region",
      landAcres: 8.5,
      kisanId: "PB-2026-8941",
      primaryMandi: "Khanna APMC Grain Market",
      preferredVehicle: "Tractor Trolley (40 Qtl)",
      crops: ["Wheat (गेहूं)", "Basmati Paddy (धान)", "Potato (आलू)"]
    },
    balwinder: {
      name: "Sardar Balwinder Singh (ਬਲਵਿੰਦਰ ਸਿੰਘ)",
      phone: "+91 98140 55678",
      state: "Punjab",
      district: "Amritsar",
      village: "Majitha Road, Amritsar",
      landAcres: 14.0,
      kisanId: "PB-2026-3312",
      primaryMandi: "Amritsar Bhagtanwala Mandi",
      preferredVehicle: "10-Wheeler Heavy Truck",
      crops: ["Basmati Paddy (1121)", "Wheat", "Mustard (सरसों)"]
    },
    suresh: {
      name: "Suresh Bhai Patel (સુરેશભાઈ પટેલ)",
      phone: "+91 99099 33221",
      state: "Gujarat",
      district: "Rajkot",
      village: "Gondal Road, Rajkot",
      landAcres: 6.5,
      kisanId: "GJ-2026-7781",
      primaryMandi: "Gondal APMC Market Yard",
      preferredVehicle: "Bolero Pickup Maxi",
      crops: ["Cotton (कपास)", "Groundnut (मूंगफली)", "Wheat (गेहूं)"]
    },
    shivam: {
      name: "Shivam Yadav (शिवम यादव)",
      phone: "+91 94500 77889",
      state: "Uttar Pradesh",
      district: "Varanasi",
      village: "Raja Talab, Varanasi",
      landAcres: 5.0,
      kisanId: "UP-2026-1145",
      primaryMandi: "Chandauli APMC Mandi",
      preferredVehicle: "3-Wheeler Cargo Auto",
      crops: ["Wheat (गेहूं)", "Potato (आलू)", "Mustard (सरसों)"]
    }
  };

  const selectedProf = sampleProfiles[profileKey] || sampleProfiles.ramesh;
  loginFarmer(selectedProf);
  renderProfileModal();
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
  if (APP_STATE.marketDataStatus !== "ready" || !AGRI_DATA.crops.length || !AGRI_DATA.mandis.length) {
    renderMarketDataState();
    return;
  }
  if (window.i18n) window.i18n.applyTranslations();
  renderCropCatalog();
  renderBestMandiRecommendation();
  renderMandiComparison();
  updateCalculatorView();
  renderWeatherWidget();
  
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

function renderCropCatalog() {
  const container = document.getElementById("cropCatalogGrid");
  if (!container) return;

  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";

  const filteredCrops = AGRI_DATA.crops.filter(crop => {
    const matchesCategory = (APP_STATE.selectedCategory === "all") || (crop.category === APP_STATE.selectedCategory);
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
          <img src="${crop.image || cropImageUrl(crop.name)}" alt="${crop.name}" class="crop-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
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

  const section = document.getElementById("mandiComparisonSection");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const selectedCrop = AGRI_DATA.crops.find(c => c.id === cropId);
  showToast(`🌾 Selected: ${selectedCrop ? selectedCrop.name : cropId}`, "info");
}

function renderBestMandiRecommendation() {
  const container = document.getElementById("bestMandiBanner");
  if (!container) return;

  const result = window.profitCalculator.getBestMandiRecommendation(
    APP_STATE.selectedCropId,
    APP_STATE.selectedVehicleId,
    APP_STATE.harvestQuantityQtl
  );
  if (!result || !result.bestMandi) {
    container.innerHTML = `<div class="empty-state"><p>Live price is not available for this crop yet. Select another live crop.</p></div>`;
    return;
  }

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

function renderMandiComparison() {
  const container = document.getElementById("mandiComparisonCards");
  if (!container) return;

  const currentCrop = AGRI_DATA.crops.find(c => c.id === APP_STATE.selectedCropId) || AGRI_DATA.crops[0];
  const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
  
  const cropTitleEl = document.getElementById("selectedCropComparisonTitle");
  if (cropTitleEl) {
    const name = (currentLang === "hi" && currentCrop.nameHi) ? currentCrop.nameHi : currentCrop.name;
    cropTitleEl.textContent = `${window.i18n.t("todayMandiRates")} ${name}`;
  }

  const mandisWithinRadius = AGRI_DATA.mandis.filter(m =>
    m.distanceKm <= APP_STATE.maxSearchRadiusKm && m.prices?.[APP_STATE.selectedCropId]
  );

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

  const priceInfo = mandi.prices[crop.id];
  if (!priceInfo) return;

  window.speechEngine.speakMandiRate(
    mandiName,
    cropName,
    priceInfo.modal,
    priceInfo.min,
    priceInfo.max,
    mandi.distanceKm
  );
}

function updateCalculatorView() {
  const result = window.profitCalculator.calculateMandiProfit(
    APP_STATE.selectedCropId,
    APP_STATE.selectedMandiId,
    APP_STATE.selectedVehicleId,
    APP_STATE.harvestQuantityQtl
  );
  if (!result) return;

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

  document.querySelectorAll(".vehicle-card").forEach(card => {
    if (card.getAttribute("data-vehicle") === APP_STATE.selectedVehicleId) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

function renderWeatherWidget() {
  const weather = AGRI_DATA.weather || {
    temp: 29,
    icon: "⛅",
    condition: "Partly Sunny & Clear Sky",
    humidity: 58,
    windSpeed: 12,
    advisoryText: "Weather is clear today. Recommended to transport produce before afternoon heat.",
    forecast5Day: []
  };
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
    forecastGrid.innerHTML = (weather.forecast5Day || []).map(day => `
      <div class="forecast-day-card">
        <span class="f-day">${day.day}</span>
        <span class="f-icon">${day.icon}</span>
        <span class="f-temp">${day.temp}</span>
        <span class="f-desc">${day.advisory}</span>
      </div>
    `).join("");
  }
}

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
          name: `📍 Detected Live Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          state: APP_STATE.user ? APP_STATE.user.state : "",
          district: APP_STATE.user ? APP_STATE.user.district : ""
        };
        updateLocationUI();
        showToast("✅ Location Detected successfully!", "success");
      },
      (err) => {
        APP_STATE.userLocation = {
          lat: 31.2550,
          lng: 75.7050,
          name: "Phagwara / Jalandhar, Punjab (Near LPU Campus)",
          state: "Punjab",
          district: APP_STATE.user ? APP_STATE.user.district : "Kapurthala"
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
  if (APP_STATE.user && window.marketApi) {
    loadMarketData();
    return;
  }
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

function openSellModal() {
  if (!APP_STATE.user) {
    showToast("Please login first to generate a digital receipt.", "info");
    showAuthModal();
    return;
  }
  
  // Pre-fill some data if available
  const cropSelect = document.getElementById("sellCommodityInput");
  if (cropSelect && APP_STATE.selectedCropId) {
    cropSelect.value = APP_STATE.selectedCropId;
  }
  
  const qtyInput = document.getElementById("sellQuantityInput");
  if (qtyInput && APP_STATE.harvestQuantityQtl) {
    qtyInput.value = APP_STATE.harvestQuantityQtl;
  }

  showModal("sellModal");
}
window.openSellModal = openSellModal;

async function handleSellSubmit(event) {
  event.preventDefault();
  if (!APP_STATE.user) {
    showToast("Session expired. Please login again.", "error");
    return;
  }

  const btn = document.getElementById("sellSubmitBtn");
  const originalText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

  try {
    const commodity = document.getElementById("sellCommodityInput").value;
    const quantity = document.getElementById("sellQuantityInput").value;
    const unit = document.getElementById("sellUnitInput").value;
    const price_per_unit = document.getElementById("sellPriceInput").value;
    const mandi_name = document.getElementById("sellMandiInput").value;
    const buyer_name = document.getElementById("sellBuyerInput").value;

    const saleData = {
      commodity,
      quantity,
      unit,
      price_per_unit,
      mandi_name,
      buyer_name
    };

    const res = await apiSales.createSale(saleData);
    
    if (res.success) {
      hideModal("sellModal");
      showToast("✅ Produce sold successfully!", "success");
      
      // Fetch the full receipt to show
      const receiptRes = await apiSales.getReceipt(res.data.receipt_id);
      if (receiptRes.success) {
        showReceipt(receiptRes.data);
      }
    } else {
      showToast("❌ Failed: " + res.message, "error");
    }
  } catch (err) {
    showToast("❌ " + err.message, "error");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}
window.handleSellSubmit = handleSellSubmit;

function showReceipt(sale) {
  const content = document.getElementById("receiptContent");
  
  const date = new Date(sale.transaction_date).toLocaleString('en-IN');
  
  content.innerHTML = `
    <h2 style="color:#2e7d32; margin:0 0 10px 0;">KisanSetu J-Form</h2>
    <p style="font-size:12px; color:#666; margin:0 0 20px 0;">Receipt ID: <strong>${sale.receipt_id}</strong><br>Date: ${date}</p>
    
    <table style="width:100%; text-align:left; border-collapse:collapse; margin-bottom:20px;">
      <tr style="border-bottom:1px solid #ddd;">
        <th style="padding:8px 0; color:#555;">Farmer Name</th>
        <td style="padding:8px 0; text-align:right; font-weight:bold;">${APP_STATE.user.name}</td>
      </tr>
      <tr style="border-bottom:1px solid #ddd;">
        <th style="padding:8px 0; color:#555;">Commodity</th>
        <td style="padding:8px 0; text-align:right;">${sale.commodity.toUpperCase()}</td>
      </tr>
      <tr style="border-bottom:1px solid #ddd;">
        <th style="padding:8px 0; color:#555;">Quantity</th>
        <td style="padding:8px 0; text-align:right;">${sale.quantity} ${sale.unit}</td>
      </tr>
      <tr style="border-bottom:1px solid #ddd;">
        <th style="padding:8px 0; color:#555;">Rate</th>
        <td style="padding:8px 0; text-align:right;">₹${sale.price_per_unit} / ${sale.unit}</td>
      </tr>
      <tr style="border-bottom:1px solid #ddd;">
        <th style="padding:8px 0; color:#555;">Market</th>
        <td style="padding:8px 0; text-align:right;">${sale.mandi_name || 'N/A'}</td>
      </tr>
    </table>
    
    <div style="background:#e8f5e9; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:600; color:#1b5e20;">Total Amount:</span>
      <span style="font-size:24px; font-weight:700; color:#2e7d32;">₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}</span>
    </div>
    
    <p style="margin-top:20px; font-size:11px; color:#888;">This is a digitally generated e-receipt by KisanSetu.</p>
  `;
  
  showModal("receiptModal");
}
window.showReceipt = showReceipt;

