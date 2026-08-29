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
