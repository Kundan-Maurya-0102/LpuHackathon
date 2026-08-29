/**
 * KisanSetu - Common Shared Module for Multi-Page Architecture
 * Manages Navigation, Language Switching, User Session, Modals, Themes, and GPS across all pages.
 */

const SHARED_STATE = {
  user: null,
  selectedLanguage: "hi",
  theme: "light",
  userLocation: {
    lat: 31.2550,
    lng: 75.7050,
    name: "Phagwara / Jalandhar, Punjab (Near LPU)",
    state: "Punjab",
    district: "Kapurthala"
  }
};

window.SHARED_STATE = SHARED_STATE;

document.addEventListener("DOMContentLoaded", () => {
  initSharedComponents();
});

function initSharedComponents() {
  // 1. Language Initialization
  const storedLang = localStorage.getItem("kisansetu_lang") || "hi";
  SHARED_STATE.selectedLanguage = storedLang;
  if (window.i18n) {
    window.i18n.setLanguage(storedLang);
  }

  // 2. Theme Initialization
  const storedTheme = localStorage.getItem("kisansetu_theme") || "light";
  SHARED_STATE.theme = storedTheme;
  document.documentElement.setAttribute("data-theme", storedTheme);
  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    themeIcon.textContent = storedTheme === "dark" ? "☀️" : "🌙";
  }

  // 3. User Session Initialization
  const storedUser = localStorage.getItem("kisansetu_user");
  if (storedUser) {
    try {
      SHARED_STATE.user = JSON.parse(storedUser);
      if (SHARED_STATE.user.village || SHARED_STATE.user.district) {
        SHARED_STATE.userLocation.name = `${SHARED_STATE.user.village || ''}, ${SHARED_STATE.user.district || ''}, ${SHARED_STATE.user.state || 'Punjab'}`;
        SHARED_STATE.userLocation.state = SHARED_STATE.user.state || "Punjab";
        SHARED_STATE.userLocation.district = SHARED_STATE.user.district || "Kapurthala";
      }
    } catch (e) {
      console.warn("Error parsing stored user:", e);
    }
  }

  // 4. Highlight Active Navigation Item
  highlightActiveNavLink();

  // 5. Setup Event Listeners
  setupSharedEventListeners();

  // 6. Update UI
  renderSharedUserUI();
  updateLiveTimestamp();

  // 7. Check for First-Login or Tour Trigger to popup guide modal
  const justLoggedIn = localStorage.getItem("kisansetu_just_logged_in") === "true";
  const params = new URLSearchParams(window.location.search);
  const welcomeParam = params.get("welcome") === "1" || params.get("tour") === "1";

  if (justLoggedIn || welcomeParam) {
    localStorage.removeItem("kisansetu_just_logged_in");
    if (welcomeParam) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    setTimeout(() => {
      openWelcomeGuideModal();
    }, 450);
  }
}

function highlightActiveNavLink() {
  const path = window.location.pathname.toLowerCase();
  let currentPage = "home";

  if (path.includes("comparison.html")) {
    currentPage = "comparison";
  } else if (path.includes("sell.html")) {
    currentPage = "sell";
  } else if (path.includes("map.html")) {
    currentPage = "map";
  } else if (path.includes("login.html")) {
    currentPage = "login";
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    const pageAttr = link.getAttribute("data-page");
    if (pageAttr === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function setupSharedEventListeners() {
  // Language Selectors
  document.querySelectorAll(".header-lang-select, #headerLangSelect").forEach(sel => {
    sel.addEventListener("change", (e) => {
      if (window.i18n) {
        window.i18n.setLanguage(e.target.value);
        showToast(`🌐 Language changed to ${sel.options[sel.selectedIndex].text}`, "info");
      }
    });
  });

  // Language Modal Cards
  document.querySelectorAll(".lang-card, .lang-select-option").forEach(card => {
    card.addEventListener("click", () => {
      const lang = card.getAttribute("data-lang");
      if (lang && window.i18n) {
        window.i18n.setLanguage(lang);
        document.querySelectorAll(".lang-card, .lang-select-option").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
      }
    });
  });

  const confirmLangBtn = document.getElementById("confirmLangBtn");
  if (confirmLangBtn) {
    confirmLangBtn.addEventListener("click", () => {
      hideModal("langModal");
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const newTheme = SHARED_STATE.theme === "light" ? "dark" : "light";
      SHARED_STATE.theme = newTheme;
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("kisansetu_theme", newTheme);
      const themeIcon = document.getElementById("themeIcon");
      if (themeIcon) themeIcon.textContent = newTheme === "dark" ? "☀️" : "🌙";
      showToast(newTheme === "dark" ? "🌙 Dark Mode Enabled" : "☀️ Light Mode Enabled", "info");
    });
  }

  // GPS Auto-detect Button
  const locBtn = document.getElementById("navLocationButton");
  if (locBtn) {
    locBtn.addEventListener("click", handleLocationAutoDetect);
  }

  // User Profile Button
  const userProfileBtn = document.getElementById("userProfileBtn");
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", handleProfileButtonClick);
  }

  // Profile Edit Form Submit
  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleSaveProfile);
  }

  // Global Modal Close Buttons (data-close="modalId")
  document.querySelectorAll(".modal-close-btn, [data-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modalId = btn.getAttribute("data-close") || btn.closest(".modal-overlay")?.id;
      if (modalId) hideModal(modalId);
    });
  });

  // Modal Backdrop Click
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideModal(modal.id);
      }
    });
  });

  // Price Alert Notification Bell
  const bellBtn = document.getElementById("notificationBellBtn");
  if (bellBtn) {
    bellBtn.addEventListener("click", () => {
      showModal("alertModal");
    });
  }

  // Guide / How to Use Button
  document.querySelectorAll("#navGuideBtn, [data-action='open-guide']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openWelcomeGuideModal();
    });
  });
}

function renderSharedUserUI() {
  const u = SHARED_STATE.user;
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userProfileBtn = document.getElementById("userProfileBtn");
  const currentLocationDisplay = document.getElementById("currentLocationDisplay");

  if (u) {
    const displayName = u.full_name || u.name || "Farmer";
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    if (userProfileBtn) {
      userProfileBtn.title = `Logged in as ${displayName} (${u.mobile || u.phone || ''})`;
      userProfileBtn.classList.add("logged-in");
    }

    if (u.village || u.district) {
      if (currentLocationDisplay) {
        currentLocationDisplay.textContent = `${u.village || ''}, ${u.district || ''}`;
      }
    }

    // Populate Profile Modal fields
    const profName = document.getElementById("profNameDisplay");
    if (profName) profName.textContent = `${displayName} (${u.farmer_id || 'Verified Farmer'})`;

    const profKisanId = document.getElementById("profKisanId");
    if (profKisanId) profKisanId.textContent = `Kisan ID: ${u.farmer_id || 'PB-2026-LIVE'}`;

    const profAddress = document.getElementById("profAddressDisplay");
    if (profAddress) profAddress.textContent = `📍 ${u.village || 'Phagwara'}, ${u.district || 'Kapurthala'}, ${u.state || 'Punjab'}`;

    const profPhone = document.getElementById("profPhoneDisplay");
    if (profPhone) profPhone.textContent = `📞 +91 ${u.mobile || u.phone || '9876543210'}`;

    const profLand = document.getElementById("profLandDisplay");
    if (profLand) profLand.textContent = `${u.land_acres || 8.5} Acres (एकड़)`;

    const profMandi = document.getElementById("profMandiDisplay");
    if (profMandi) profMandi.textContent = u.primary_mandi || "Khanna APMC Grain Market";

    const profVehicle = document.getElementById("profVehicleDisplay");
    if (profVehicle) profVehicle.textContent = u.preferred_vehicle || "Tractor Trolley (40 Qtl)";

    const profCropsList = document.getElementById("profCropsList");
    if (profCropsList) {
      let crops = ["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"];
      if (Array.isArray(u.crops) && u.crops.length > 0) {
        crops = u.crops;
      } else if (typeof u.crops === "string" && u.crops.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(u.crops);
          if (Array.isArray(parsed) && parsed.length > 0) crops = parsed;
        } catch (e) {}
      } else if (typeof u.crops === "string" && u.crops.trim()) {
        crops = u.crops.split(",").map(s => s.trim()).filter(Boolean);
      }
      profCropsList.innerHTML = crops.map(c => `<span class="profile-crop-badge">🌱 ${c}</span>`).join(" ");
    }
  } else {
    if (userNameDisplay) {
      const loginText = (window.i18n && typeof window.i18n.t === "function") ? window.i18n.t("navLogin") : "Farmer Login";
      userNameDisplay.textContent = loginText;
    }
    if (userProfileBtn) {
      userProfileBtn.title = "Click to Login";
      userProfileBtn.classList.remove("logged-in");
    }
  }
}

function handleProfileButtonClick() {
  if (SHARED_STATE.user) {
    renderSharedUserUI();
    showModal("profileModal");
  } else {
    // If on a page other than login, open login.html or show modal
    window.location.href = "login.html";
  }
}
window.handleProfileButtonClick = handleProfileButtonClick;

function openEditProfileModal() {
  hideModal("profileModal");
  const u = SHARED_STATE.user || {};

  const nameInp = document.getElementById("editNameInput");
  const phoneInp = document.getElementById("editPhoneInput");
  const stateInp = document.getElementById("editStateSelect");
  const distInp = document.getElementById("editDistrictInput");
  const villInp = document.getElementById("editVillageInput");
  const landInp = document.getElementById("editLandInput");

  if (nameInp) nameInp.value = u.full_name || u.name || "";
  if (phoneInp) phoneInp.value = (u.mobile || u.phone || "").replace(/[^0-9]/g, "").slice(-10);
  if (stateInp) stateInp.value = u.state || "Punjab";
  if (distInp) distInp.value = u.district || "Kapurthala";
  if (villInp) villInp.value = u.village || "Phagwara";
  if (landInp) landInp.value = u.land_acres || 8.5;

  showModal("editProfileModal");
}
window.openEditProfileModal = openEditProfileModal;

async function handleSaveProfile(e) {
  if (e) e.preventDefault();
  const name = document.getElementById("editNameInput")?.value.trim();
  const state = document.getElementById("editStateSelect")?.value;
  const district = document.getElementById("editDistrictInput")?.value.trim();
  const village = document.getElementById("editVillageInput")?.value.trim();
  const land_acres = parseFloat(document.getElementById("editLandInput")?.value) || 8.5;

  const updatedUser = {
    ...SHARED_STATE.user,
    full_name: name || SHARED_STATE.user?.full_name || "Farmer",
    state: state || "Punjab",
    district: district || "Kapurthala",
    village: village || "Phagwara",
    land_acres
  };

  SHARED_STATE.user = updatedUser;
  localStorage.setItem("kisansetu_user", JSON.stringify(updatedUser));

  if (window.apiAuth && typeof window.apiAuth.updateProfile === "function") {
    try {
      await window.apiAuth.updateProfile({ full_name: name, state, district, village, land_acres });
    } catch (err) {
      console.warn("Backend updateProfile sync error:", err);
    }
  }

  renderSharedUserUI();
  hideModal("editProfileModal");
  showToast("✅ Farmer profile updated successfully!", "success");
}
window.handleSaveProfile = handleSaveProfile;

function logoutFarmer() {
  if (window.apiAuth && typeof window.apiAuth.logout === "function") {
    window.apiAuth.logout();
  }
  SHARED_STATE.user = null;
  localStorage.removeItem("kisansetu_user");
  hideAllModals();
  renderSharedUserUI();
  showToast("👋 Logged out successfully. जय जवान, जय किसान!", "info");
}
window.logoutFarmer = logoutFarmer;

function handleLocationAutoDetect() {
  const locDisplay = document.getElementById("currentLocationDisplay");
  if (locDisplay) locDisplay.textContent = "📍 Detecting GPS location...";

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        SHARED_STATE.userLocation.lat = latitude;
        SHARED_STATE.userLocation.lng = longitude;
        SHARED_STATE.userLocation.name = `GPS: ${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E (Near Phagwara)`;
        if (locDisplay) locDisplay.textContent = SHARED_STATE.userLocation.name;
        showToast("📍 Real Farm GPS Location Updated!", "success");

        if (window.mandiMap && typeof window.mandiMap.setFarmerLocation === "function") {
          window.mandiMap.setFarmerLocation(latitude, longitude, "Your Verified Farm");
        }
      },
      () => {
        SHARED_STATE.userLocation.lat = 31.2550;
        SHARED_STATE.userLocation.lng = 75.7050;
        SHARED_STATE.userLocation.name = "Phagwara / Jalandhar, Punjab (Near LPU)";
        if (locDisplay) locDisplay.textContent = SHARED_STATE.userLocation.name;
        showToast("📍 Using Verified Mandi Hub GPS (Phagwara Region)", "info");
      },
      { timeout: 8000 }
    );
  }
}
window.handleLocationAutoDetect = handleLocationAutoDetect;

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    modal.style.display = "flex";
  }
}
window.showModal = showModal;

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    modal.style.display = "none";
  }
}
window.hideModal = hideModal;

function hideAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.classList.remove("open");
    m.style.display = "none";
  });
}
window.hideAllModals = hideAllModals;

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
window.showToast = showToast;

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

function updateLiveTimestamp() {
  const el = document.getElementById("liveSyncTimestamp");
  if (el) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    el.textContent = `🟢 Live e-NAM Synced Today (${timeStr})`;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   WELCOME FEATURE GUIDE MODAL & MULTILINGUAL INSTRUCTION ENGINE
   ═══════════════════════════════════════════════════════════════════ */

let guideAudioPlaying = false;

function openWelcomeGuideModal() {
  renderWelcomeGuideModal();
  showModal("welcomeGuideModal");
}
window.openWelcomeGuideModal = openWelcomeGuideModal;

function closeWelcomeGuideModal() {
  if (guideAudioPlaying && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    guideAudioPlaying = false;
  }
  hideModal("welcomeGuideModal");
}
window.closeWelcomeGuideModal = closeWelcomeGuideModal;

function changeGuideLanguage(langCode) {
  if (window.i18n) {
    window.i18n.setLanguage(langCode);
    SHARED_STATE.selectedLanguage = langCode;
    renderWelcomeGuideModal();
    renderSharedUserUI();
    
    // Announce language change
    const langNames = {
      hi: "हिन्दी (Hindi)",
      pa: "ਪੰਜਾਬੀ (Punjabi)",
      en: "English",
      mr: "मराठी (Marathi)",
      gu: "ગુજરાતી (Gujarati)",
      te: "తెలుగు (Telugu)",
      ta: "தமிழ் (Tamil)",
      bn: "বাংলা (Bengali)"
    };
    showToast(`🌐 Guide language switched to ${langNames[langCode] || langCode}`, "info");

    // If audio was playing, re-speak in new language
    if (guideAudioPlaying) {
      speakGuideInstructions();
    }
  }
}
window.changeGuideLanguage = changeGuideLanguage;

function handleAgreeTerms() {
  const checkbox = document.getElementById("termsAgreeCheckbox");
  const t = (k) => window.i18n ? window.i18n.t(k) : k;

  if (checkbox && !checkbox.checked) {
    checkbox.classList.add("pulse-attention");
    showToast(t("termsUncheckedWarning") || "⚠️ Please check the agreement box to accept terms and continue.", "error");
    checkbox.focus();
    return;
  }

  localStorage.setItem("kisansetu_terms_agreed", "true");
  showToast("✅ Terms of Service accepted. Welcome to KisanSetu!", "success");
  closeWelcomeGuideModal();
}
window.handleAgreeTerms = handleAgreeTerms;

function renderWelcomeGuideModal() {
  let modal = document.getElementById("welcomeGuideModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "welcomeGuideModal";
    modal.className = "modal-overlay welcome-guide-overlay";
    document.body.appendChild(modal);
  }

  const lang = window.i18n ? window.i18n.getLanguage() : (localStorage.getItem("kisansetu_lang") || "hi");
  const t = (key) => window.i18n ? window.i18n.t(key) : key;
  const u = SHARED_STATE.user || JSON.parse(localStorage.getItem("kisansetu_user") || "null");
  const farmerName = u ? (u.full_name || u.name || "Kisan Brother") : "Kisan Brother";

  const languages = [
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "en", name: "English", flag: "🌐" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" }
  ];

  const features = [
    {
      icon: "🌾",
      stepNum: "1",
      badgeKey: "guideStep1Badge",
      titleKey: "guideStep1Title",
      descKey: "guideStep1Desc",
      actionTextKey: "guideStep1Action",
      actionHref: "comparison.html"
    },
    {
      icon: "🤖",
      stepNum: "2",
      badgeKey: "guideStep2Badge",
      titleKey: "guideStep2Title",
      descKey: "guideStep2Desc",
      actionTextKey: "guideStep2Action",
      actionHref: "index.html"
    },
    {
      icon: "🧮",
      stepNum: "3",
      badgeKey: "guideStep3Badge",
      titleKey: "guideStep3Title",
      descKey: "guideStep3Desc",
      actionTextKey: "guideStep3Action",
      actionHref: "comparison.html#calcSection"
    },
    {
      icon: "📊",
      stepNum: "4",
      badgeKey: "guideStep4Badge",
      titleKey: "guideStep4Title",
      descKey: "guideStep4Desc",
      actionTextKey: "guideStep4Action",
      actionHref: "comparison.html"
    },
    {
      icon: "📄",
      stepNum: "5",
      badgeKey: "guideStep5Badge",
      titleKey: "guideStep5Title",
      descKey: "guideStep5Desc",
      actionTextKey: "guideStep5Action",
      actionHref: "sell.html"
    },
    {
      icon: "🗺️",
      stepNum: "6",
      badgeKey: "guideStep6Badge",
      titleKey: "guideStep6Title",
      descKey: "guideStep6Desc",
      actionTextKey: "guideStep6Action",
      actionHref: "map.html"
    },
    {
      icon: "🎙️",
      stepNum: "7",
      badgeKey: "guideStep7Badge",
      titleKey: "guideStep7Title",
      descKey: "guideStep7Desc",
      actionTextKey: "guideStep7Action",
      actionHref: "javascript:void(0)",
      onclick: "closeWelcomeGuideModal(); if(window.speechEngine){window.speechEngine.toggleVoiceSearch();}"
    },
    {
      icon: "🔔",
      stepNum: "8",
      badgeKey: "guideStep8Badge",
      titleKey: "guideStep8Title",
      descKey: "guideStep8Desc",
      actionTextKey: "guideStep8Action",
      actionHref: "javascript:void(0)",
      onclick: "closeWelcomeGuideModal(); showModal('alertModal');"
    }
  ];

  const terms = [
    {
      icon: "🏛️",
      titleKey: "term1Title",
      descKey: "term1Desc"
    },
    {
      icon: "🚚",
      titleKey: "term2Title",
      descKey: "term2Desc"
    },
    {
      icon: "📄",
      titleKey: "term3Title",
      descKey: "term3Desc"
    },
    {
      icon: "🔒",
      titleKey: "term4Title",
      descKey: "term4Desc"
    }
  ];

  const hasAgreed = localStorage.getItem("kisansetu_terms_agreed") === "true";

  modal.innerHTML = `
    <div class="modal-card guide-modal-card">
      
      <!-- Modal Header -->
      <div class="guide-modal-header">
        <div class="guide-header-left">
          <div class="guide-header-badge">
            <span>✨</span>
            <span>Welcome / स्वागतम् / ਜੀ ਆਇਆਂ ਨੂੰ</span>
          </div>
          <h2 class="guide-title">${t("guideModalTitle")}</h2>
          <p class="guide-subtitle">
            <strong>${farmerName} जी</strong> • ${t("guideModalSubtitle")}
          </p>
        </div>
        <button class="guide-close-btn" onclick="closeWelcomeGuideModal()" title="Close Guide">✕</button>
      </div>

      <!-- Language Switcher Bar with Voice Narration Button -->
      <div class="guide-toolbar-strip">
        <div class="guide-lang-section">
          <span class="guide-lang-label">${t("guideLangSelectLabel")}</span>
          <div class="guide-lang-pills">
            ${languages.map(l => `
              <button type="button" class="guide-lang-pill ${l.code === lang ? 'active' : ''}" onclick="changeGuideLanguage('${l.code}')">
                <span>${l.flag}</span>
                <span>${l.name}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="guide-audio-section">
          <button type="button" class="guide-audio-btn ${guideAudioPlaying ? 'playing' : ''}" id="guideAudioBtn" onclick="toggleGuideAudio()">
            <span class="audio-icon">${guideAudioPlaying ? '⏹️' : '🔊'}</span>
            <span id="guideAudioBtnText">${guideAudioPlaying ? t("guideAudioStop") : t("guideAudioListen")}</span>
            <span class="audio-wave-anim">
              <span></span><span></span><span></span><span></span>
            </span>
          </button>
        </div>
      </div>

      <!-- Features Instruction Grid -->
      <div class="guide-modal-body">
        <div class="guide-section-label">
          <span>${t("guideFeaturesHeading")}</span>
        </div>

        <div class="guide-features-grid">
          ${features.map(f => `
            <div class="guide-feature-card ${f.stepNum === '2' ? 'featured-gold' : ''}">
              <div class="guide-card-top">
                <div class="guide-icon-badge">${f.icon}</div>
                <div class="guide-step-tag">Step ${f.stepNum}</div>
                <div class="guide-badge-pill">${t(f.badgeKey)}</div>
              </div>
              <h4 class="guide-feature-title">${t(f.titleKey)}</h4>
              <p class="guide-feature-desc">${t(f.descKey)}</p>
              <div class="guide-card-footer">
                <a href="${f.actionHref}" ${f.onclick ? `onclick="${f.onclick}"` : `onclick="closeWelcomeGuideModal()"`} class="guide-feature-link">
                  <span>${t(f.actionTextKey)}</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Pro-Tip Banner -->
        <div class="guide-protip-box">
          <div class="protip-icon">💡</div>
          <div class="protip-content">
            <strong class="protip-title">${t("guideProTipHeading")}</strong>
            <p class="protip-text">${t("guideProTip")}</p>
          </div>
        </div>

        <!-- Terms of Service & Farmer Protections Section -->
        <div class="guide-terms-section">
          <div class="guide-terms-header">
            <h3 class="guide-terms-title">${t("termsSectionTitle")}</h3>
            <p class="guide-terms-intro">${t("termsIntro")}</p>
          </div>

          <div class="guide-terms-grid">
            ${terms.map(tm => `
              <div class="guide-term-item">
                <div class="term-icon">${tm.icon}</div>
                <div class="term-info">
                  <h4 class="term-title">${t(tm.titleKey)}</h4>
                  <p class="term-desc">${t(tm.descKey)}</p>
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Agreement Checkbox Box -->
          <div class="terms-agreement-card">
            <label class="terms-checkbox-label" for="termsAgreeCheckbox">
              <input type="checkbox" id="termsAgreeCheckbox" class="terms-checkbox" ${hasAgreed ? 'checked' : ''}>
              <span class="terms-checkbox-text">${t("termsCheckboxLabel")}</span>
            </label>
          </div>
        </div>

      </div>

      <!-- Footer CTA Buttons -->
      <div class="guide-modal-footer">
        <div class="guide-footer-links">
          <a href="comparison.html" onclick="closeWelcomeGuideModal()" class="guide-quick-link">
            <span>📊 ${t("guideExploreMandiRates")}</span>
          </a>
          <a href="sell.html" onclick="closeWelcomeGuideModal()" class="guide-quick-link">
            <span>💰 ${t("guideExploreSellJForm")}</span>
          </a>
          <a href="map.html" onclick="closeWelcomeGuideModal()" class="guide-quick-link">
            <span>🗺️ ${t("guideExploreMap")}</span>
          </a>
        </div>

        <button type="button" class="guide-primary-cta" id="termsAcceptBtn" onclick="handleAgreeTerms()">
          <span>${t("termsAgreeBtn")}</span>
        </button>
      </div>

    </div>
  `;
}
window.renderWelcomeGuideModal = renderWelcomeGuideModal;

function toggleGuideAudio() {
  if (guideAudioPlaying) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    guideAudioPlaying = false;
    updateGuideAudioButtonState(false);
  } else {
    speakGuideInstructions();
  }
}
window.toggleGuideAudio = toggleGuideAudio;

function speakGuideInstructions() {
  if (!("speechSynthesis" in window)) {
    showToast("⚠️ Audio read-aloud is not supported in this browser.", "info");
    return;
  }
  window.speechSynthesis.cancel();

  const lang = window.i18n ? window.i18n.getLanguage() : (localStorage.getItem("kisansetu_lang") || "hi");
  const t = (k) => window.i18n ? window.i18n.t(k) : k;
  const u = SHARED_STATE.user || JSON.parse(localStorage.getItem("kisansetu_user") || "null");
  const farmerName = u ? (u.full_name || u.name || "Kisan Brother") : "Kisan Brother";

  const textToSpeak = `${t("guideModalTitle")}. ${farmerName} जी. ${t("guideModalSubtitle")}. ${t("guideStep1Title")}: ${t("guideStep1Desc")}. ${t("guideStep2Title")}: ${t("guideStep2Desc")}. ${t("guideStep3Title")}: ${t("guideStep3Desc")}. ${t("guideStep4Title")}: ${t("guideStep4Desc")}. ${t("guideStep5Title")}: ${t("guideStep5Desc")}. ${t("guideStep6Title")}: ${t("guideStep6Desc")}. ${t("guideStep7Title")}: ${t("guideStep7Desc")}. ${t("guideStep8Title")}: ${t("guideStep8Desc")}. ${t("guideProTipHeading")} ${t("guideProTip")}`;

  const langCodes = {
    hi: "hi-IN",
    pa: "pa-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    te: "te-IN",
    ta: "ta-IN",
    bn: "bn-IN",
    en: "en-IN"
  };

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = langCodes[lang] || "hi-IN";
  utterance.rate = 0.95;

  utterance.onstart = () => {
    guideAudioPlaying = true;
    updateGuideAudioButtonState(true);
  };

  utterance.onend = () => {
    guideAudioPlaying = false;
    updateGuideAudioButtonState(false);
  };

  utterance.onerror = () => {
    guideAudioPlaying = false;
    updateGuideAudioButtonState(false);
  };

  window.speechSynthesis.speak(utterance);
}

function updateGuideAudioButtonState(isPlaying) {
  const btn = document.getElementById("guideAudioBtn");
  const txt = document.getElementById("guideAudioBtnText");
  const t = (k) => window.i18n ? window.i18n.t(k) : k;

  if (btn && txt) {
    if (isPlaying) {
      btn.classList.add("playing");
      txt.textContent = t("guideAudioStop");
    } else {
      btn.classList.remove("playing");
      txt.textContent = t("guideAudioListen");
    }
  }
}

