class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.currentVoice = null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "hi-IN";

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (window.handleVoiceSearchResult) {
          window.handleVoiceSearchResult(transcript);
        }
        this.stopListening();
      };

      this.recognition.onerror = (event) => {
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.stopListening();
      };
    }
  }

  startListening(callback) {
    if (!this.recognition) {
      alert("Voice search is supported in Chrome, Edge, and Android browsers.");
      return;
    }
    try {
      const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
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
      this.recognition.lang = langCodes[currentLang] || "hi-IN";
      this.recognition.start();
      this.isListening = true;
      if (callback) callback(true);
    } catch (e) {
      this.stopListening();
    }
  }

  stopListening(callback) {
    this.isListening = false;
    try {
      if (this.recognition) this.recognition.stop();
    } catch (e) {}
    if (callback) callback(false);
    const micBtn = document.getElementById("voiceSearchBtn");
    if (micBtn) micBtn.classList.remove("recording");
  }

  toggleVoiceSearch() {
    const micBtn = document.getElementById("voiceSearchBtn");
    if (this.isListening) {
      this.stopListening();
      if (micBtn) micBtn.classList.remove("recording");
    } else {
      if (micBtn) micBtn.classList.add("recording");
      this.startListening(() => {
        if (window.showToast) {
          window.showToast("🎤 बोलिए... (Speaking now... Searching crop)", "info");
        }
      });
    }
  }

  speak(text, langCode = "hi") {
    if (!this.synth) return;
    
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      hi: "hi-IN",
      pa: "pa-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      te: "te-IN",
      ta: "ta-IN",
      bn: "bn-IN",
      en: "en-IN"
    };

    utterance.lang = langMap[langCode] || "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    document.querySelectorAll(".speak-btn.speaking").forEach(b => b.classList.remove("speaking"));

    this.synth.speak(utterance);
  }

  speakMandiRate(mandiName, cropName, modalPrice, minPrice, maxPrice, distanceKm, extraText = "") {
    const currentLang = window.i18n ? window.i18n.getLanguage() : "hi";
    let text = "";

    if (currentLang === "pa") {
      text = `${mandiName} ਵਿੱਚ ${cropName} ਦਾ ਔਸਤ ਭਾਅ ₹${modalPrice} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ। ਘੱਟੋ-ਘੱਟ ਭਾਅ ₹${minPrice} ਅਤੇ ਵੱਧ ਤੋਂ ਵੱਧ ₹${maxPrice} ਹੈ। ਦੂਰੀ ${distanceKm} ਕਿਲੋਮੀਟਰ ਹੈ। ${extraText}`;
    } else if (currentLang === "en") {
      text = `In ${mandiName}, the modal price for ${cropName} is ${modalPrice} rupees per quintal. Minimum price is ${minPrice} and maximum is ${maxPrice}. Distance is ${distanceKm} kilometers. ${extraText}`;
    } else if (currentLang === "mr") {
      text = `${mandiName} मध्ये ${cropName} चा सरासरी भाव ₹${modalPrice} प्रति क्विंटल आहे. अंतर ${distanceKm} किलोमीटर आहे. ${extraText}`;
    } else if (currentLang === "gu") {
      text = `${mandiName} માં ${cropName} નો સરેਰਾશ ભાવ ₹${modalPrice} પ્રતિ ક્વિન્ટલ છે. અંતર ${distanceKm} કિલોમીટર છે. ${extraText}`;
    } else {
      text = `${mandiName} में ${cropName} का औसत भाव ₹${modalPrice} प्रति क्विंटल है। न्यूनतम भाव ₹${minPrice} और अधिकतम भाव ₹${maxPrice} है। आपके खेत से दूरी ${distanceKm} किलोमीटर है। ${extraText}`;
    }

    this.speak(text, currentLang);
  }
}

window.speechEngine = new SpeechEngine();
