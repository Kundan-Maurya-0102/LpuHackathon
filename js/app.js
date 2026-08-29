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
  
  if (APP_STATE.user) {
     renderAllViews();
  }
}

async function loadMarketData() {
    try {
        const res = await apiMarket.getPrices();
        if (res.success) {
            // Group raw prices by market
            const marketMap = {};
            const rawPrices = res.data;
            
            rawPrices.forEach(item => {
                const mandiId = item.market.toLowerCase().replace(/ /g, "_");
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
                        lat: 31.0 + Math.random() * 0.5,
                        lng: 75.0 + Math.random() * 0.5,
                        distanceKm: Math.floor(Math.random() * 50) + 5,
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
                
                const cropId = item.commodity.toLowerCase();
                marketMap[mandiId].prices[cropId] = {
                    min: parseFloat(item.min_price),
                    max: parseFloat(item.max_price),
                    modal: parseFloat(item.modal_price),
                    arrivals: "Available",
                    trend: "+0" // Can be calculated based on history
                };
            });
            
            AGRI_DATA.mandis = Object.values(marketMap);
        }
    } catch (err) {
        console.error("Failed to load market data:", err);
    }
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
      renderAllViews();
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

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("loginPhoneInput").value.trim();
      const password = document.getElementById("loginPasswordInput").value.trim();
      
      if (mobile.length < 10 || !password) {
        showToast("Please enter valid mobile and password", "error");
        return;
      }
      
      const originalText = loginBtn.innerText;
      loginBtn.innerText = "Logging in...";
      
      try {
        const res = await apiAuth.login(mobile, password);
        if (res.success) {
          APP_STATE.user = res.data.user;
          renderUserUI();
          hideAllModals();
          renderAllViews();
          showToast("✅ Login successful!", "success");
        }
      } catch (err) {
        showToast("❌ " + err.message, "error");
      } finally {
        loginBtn.innerText = originalText;
      }
    });
  }

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("signupPhoneInput").value.trim();
      if (mobile.length < 10) {
        showToast("Please enter a valid 10-digit mobile number", "error");
        return;
      }
      
      const originalText = sendOtpBtn.innerText;
      sendOtpBtn.innerText = "Sending...";
      sendOtpBtn.disabled = true;
      
      try {
        const res = await apiAuth.sendOtp(mobile);
        if (res.success) {
          showToast("✅ OTP Sent to your mobile number!", "success");
        } else {
          showToast("❌ " + res.message, "error");
        }
      } catch (err) {
        showToast("❌ " + err.message, "error");
      } finally {
        sendOtpBtn.innerText = originalText;
        sendOtpBtn.disabled = false;
      }
    });
  }

  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const mobile = document.getElementById("signupPhoneInput").value.trim();
      const farmer_id = document.getElementById("signupFarmerIdInput").value.trim();
      const otp = document.getElementById("signupOtpInput").value.trim();
      
      if (mobile.length < 10 || !farmer_id || !otp) {
        showToast("Please fill all fields (Mobile, Farmer ID, OTP)", "error");
        return;
      }
      
      const originalText = signupBtn.innerText;
      signupBtn.innerText = "Registering...";
      
      try {
        const res = await apiAuth.signup({ mobile, farmer_id, otp });
        if (res.success) {
          APP_STATE.user = res.data.user;
          renderUserUI();
          hideAllModals();
          renderAllViews();
          showToast("✅ Registration successful!", "success");
        }
      } catch (err) {
        showToast("❌ " + err.message, "error");
      } finally {
        signupBtn.innerText = originalText;
      }
    });
  }
  
  window.toggleAuthMode = function(mode) {
    if (mode === 'signup') {
        document.getElementById('loginFormSection').style.display = 'none';
        document.getElementById('signupFormSection').style.display = 'block';
        document.getElementById('authModalTitle').innerText = 'Create Account / नया खाता';
        document.getElementById('authModalSub').innerText = 'Register in 10 seconds to access live mandi rates';
    } else {
        document.getElementById('signupFormSection').style.display = 'none';
        document.getElementById('loginFormSection').style.display = 'block';
        document.getElementById('authModalTitle').innerText = 'Farmer Login / किसान प्रवेश';
        document.getElementById('authModalSub').innerText = 'Access verified APMC mandi rates & maximize your farm profits';
    }
  };

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
  renderAllViews();
  showToast(`🌾 राम राम ${APP_STATE.user.name}! Welcome to KisanSetu`, "success");
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
    if (userNameDisplay) userNameDisplay.textContent = APP_STATE.user.name.split(" ")[0] + " (Profile)";
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
          name: "📍 Detected Live Location (Punjab)",
          state: "Punjab",
          district: "Ludhiana"
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

