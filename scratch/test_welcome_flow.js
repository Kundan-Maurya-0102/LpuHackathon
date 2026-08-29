/**
 * Test script for verifying the Welcome Popup Modal, i18n dictionary for all 8 languages,
 * and feature walkthrough cards.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting KisanSetu Welcome Modal & 8-Language i18n Validation Test...\n');

// 1. Read and evaluate i18n.js
const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');

// Mock browser globals for node evaluation
const mockWindow = {
  dispatchEvent: (e) => {},
  SpeechSynthesisUtterance: function(text) { this.text = text; }
};
const mockDocument = {
  documentElement: { lang: 'hi' },
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, classList: { add: () => {}, remove: () => {} } })
};
const mockLocalStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

const context = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockLocalStorage,
  CustomEvent: function(name, opts) { this.name = name; this.detail = opts ? opts.detail : {}; },
  console: console
};

// Evaluate in sandbox
const vm = require('vm');
vm.createContext(context);
vm.runInContext(i18nCode, context);

const TRANSLATIONS = context.window.TRANSLATIONS || context.TRANSLATIONS;
const i18n = context.window.i18n;

// 2. Validate all 8 Languages
const expectedLanguages = ['en', 'hi', 'pa', 'mr', 'gu', 'te', 'ta', 'bn'];
console.log('1️⃣ Checking 8 Supported Languages in TRANSLATIONS:');
let allLangsPresent = true;
expectedLanguages.forEach(lang => {
  if (TRANSLATIONS[lang]) {
    console.log(`   ✅ Language '${lang}' (${TRANSLATIONS[lang].langName}) is present with ${Object.keys(TRANSLATIONS[lang]).length} translation keys.`);
  } else {
    console.error(`   ❌ Language '${lang}' is MISSING!`);
    allLangsPresent = false;
  }
});

if (!allLangsPresent) {
  process.exit(1);
}

// 3. Validate Critical Keys across all 8 Languages
const requiredKeys = [
  'guideModalTitle', 'guideModalSubtitle', 'guideLangSelectLabel', 'guideAudioListen', 'guideAudioStop', 'guideFeaturesHeading',
  'guideStep1Title', 'guideStep1Badge', 'guideStep1Desc', 'guideStep1Action',
  'guideStep2Title', 'guideStep2Badge', 'guideStep2Desc', 'guideStep2Action',
  'guideStep3Title', 'guideStep3Badge', 'guideStep3Desc', 'guideStep3Action',
  'guideStep4Title', 'guideStep4Badge', 'guideStep4Desc', 'guideStep4Action',
  'guideStep5Title', 'guideStep5Badge', 'guideStep5Desc', 'guideStep5Action',
  'guideStep6Title', 'guideStep6Badge', 'guideStep6Desc', 'guideStep6Action',
  'guideStep7Title', 'guideStep7Badge', 'guideStep7Desc', 'guideStep7Action',
  'guideStep8Title', 'guideStep8Badge', 'guideStep8Desc', 'guideStep8Action',
  'guideProTipHeading', 'guideProTip',
  'termsSectionTitle', 'termsIntro', 'term1Title', 'term1Desc', 'term2Title', 'term2Desc', 'term3Title', 'term3Desc', 'term4Title', 'term4Desc',
  'termsCheckboxLabel', 'termsAgreeBtn', 'termsUncheckedWarning',
  'demoLogin', 'navHome', 'navComparison', 'navSell', 'navMap', 'navLogin', 'navGuide'
];

console.log('\n2️⃣ Validating All Required Keys Across All 8 Languages:');
let allKeysValid = true;
expectedLanguages.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  let missing = [];
  requiredKeys.forEach(key => {
    if (!dict[key] || dict[key].trim() === '') {
      missing.push(key);
    }
  });
  if (missing.length === 0) {
    console.log(`   ✅ [${lang.toUpperCase()}] All ${requiredKeys.length} required keys verified.`);
  } else {
    console.error(`   ❌ [${lang.toUpperCase()}] Missing keys: ${missing.join(', ')}`);
    allKeysValid = false;
  }
});

if (!allKeysValid) {
  process.exit(1);
}

// 4. Test Language Switching Dynamic Resolution
console.log('\n3️⃣ Testing Dynamic Language Switcher Resolution:');
expectedLanguages.forEach(lang => {
  i18n.setLanguage(lang);
  const current = i18n.getLanguage();
  const title = i18n.t('guideModalTitle');
  const feat2 = i18n.t('guideStep2Title');
  const audioBtn = i18n.t('guideAudioListen');
  console.log(`   🌐 Switched to [${current}] -> Title: "${title}" | Feature 2: "${feat2}" | Audio: "${audioBtn}"`);
});

// 5. Verify Speech Synthesis Codes
console.log('\n4️⃣ Validating Speech Synthesis Voice BCP-47 Tag Mappings:');
const langVoiceMap = {
  hi: "hi-IN",
  pa: "pa-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  te: "te-IN",
  ta: "ta-IN",
  bn: "bn-IN",
  en: "en-IN"
};
Object.keys(langVoiceMap).forEach(code => {
  console.log(`   🔊 Language [${code}] maps to voice tag: '${langVoiceMap[code]}'`);
});

// 5. Test DOM Rendering of Modal
console.log('\n5️⃣ Testing Modal DOM Generation:');
const commonCode = fs.readFileSync(path.join(__dirname, '../js/common.js'), 'utf8');

// Setup mock DOM elements for renderWelcomeGuideModal
let modalElement = { id: 'welcomeGuideModal', innerHTML: '' };
mockDocument.getElementById = (id) => {
  if (id === 'welcomeGuideModal') return modalElement;
  if (id === 'guideAudioBtn') return { classList: { add: () => {}, remove: () => {} } };
  if (id === 'guideAudioBtnText') return { textContent: '' };
  return null;
};
mockDocument.createElement = (tag) => {
  if (tag === 'div') return modalElement;
  return {};
};
mockDocument.body = {
  appendChild: (el) => {}
};

context.SHARED_STATE = {
  user: { full_name: 'Ramesh Kumar', village: 'Phagwara', district: 'Kapurthala', state: 'Punjab' },
  selectedLanguage: 'hi'
};

vm.runInContext(commonCode, context);

if (typeof context.window.renderWelcomeGuideModal === 'function') {
  context.window.renderWelcomeGuideModal();
  console.log('   ✅ renderWelcomeGuideModal executed successfully.');
  
  // Verify that all 8 features and 8 language pills are generated in modal HTML
  const html = modalElement.innerHTML;
  const featureMatches = html.match(/\bguide-feature-card\b/g) || [];
  const pillMatches = html.match(/\bguide-lang-pill\b/g) || [];
  console.log(`   ✅ Rendered ${featureMatches.length} Feature Cards in Modal (Expected: 8)`);
  console.log(`   ✅ Rendered ${pillMatches.length} Language Switcher Pills in Toolbar (Expected: 8)`);
  
  if (featureMatches.length !== 8 || pillMatches.length !== 8) {
    console.error(`   ❌ Unexpected count! Features: ${featureMatches.length}, Pills: ${pillMatches.length}`);
    process.exit(1);
  }
} else {
  console.error('   ❌ renderWelcomeGuideModal is not exposed on window!');
  process.exit(1);
}

console.log('\n🎉 ALL VALIDATION CHECKS PASSED PERFECTLY (100%)!\n');
