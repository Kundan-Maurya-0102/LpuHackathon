from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/guide", tags=["User Guide & Multilingual Feature Tour"])

GUIDE_DATA = {
    "hi": {
        "welcome_title": "किसानसेतु (KisanSetu) में आपका स्वागत है!",
        "welcome_subtitle": "भारतीय किसानों के लिए आधुनिक डिजिटल मंडी व मुनाफा खोज मंच। नीचे सभी मुख्य सुविधाओं के उपयोग की सरल मार्गदर्शिका दी गई है:",
        "lang_switch_hint": "भाषा बदलें (Change Language):",
        "start_btn": "🚀 KisanSetu का उपयोग शुरू करें",
        "features": [
            {
                "id": "live_prices",
                "icon": "🌾",
                "badge": "लाइव डेटा",
                "title": "1. लाइव मंडी भाव व फसलें (Live APMC Mandi Rates)",
                "description": "विभिन्न फसलों (गेहूं, धान, सरसों, मक्का, आलू, टमाटर आदि) के ताज़ा दैनिक मंडी भाव देखें जो सीधे e-NAM और Agmarknet से अपडेट होते हैं।",
                "action": "होम पेज पर फसल कार्ड पर क्लिक करके विभिन्न मंडियों के भाव देखें।"
            },
            {
                "id": "calculator",
                "icon": "📊",
                "badge": "स्मार्ट कैलकुलेटर",
                "title": "2. मंडी तुलना व मुनाफा कैलकुलेटर (Profit & Transport Calculator)",
                "description": "अपने खेत से दूरी, वाहन प्रकार (ट्रैक्टर ट्रॉली, पिकअप, टेम्पो, ट्रक) और फसल मात्रा के अनुसार वास्तविक डीजल खर्च काटकर सबसे ज्यादा शुद्ध बचत वाली मंडी का पता लगाएं।",
                "action": "Mandi Rates पेज पर जाएं, मात्रा और वाहन चुनें और AI सिफारिश देखें।"
            },
            {
                "id": "sell_jform",
                "icon": "💰",
                "badge": "डिजिटल जे-फॉर्म",
                "title": "3. फसल बिक्री व सरकारी जे-फॉर्म रसीद (Sell Crop & J-Form)",
                "description": "पारदर्शी मंडी शुल्क (1.5% मंडी सेस, लोडिंग चार्ज) की गणना के साथ अपनी बिक्री का डिजिटल रिकॉर्ड दर्ज करें और सरकारी जे-फॉर्म रसीद तुरंत प्रिंट/डाउनलोड करें।",
                "action": "Sell & J-Form पेज पर जाकर अपनी फसल बेचें और रसीद पाएं।"
            },
            {
                "id": "map_navigation",
                "icon": "🗺️",
                "badge": "जीपीएस नेविगेशन",
                "title": "4. लाइव जीपीएस मंडी मैप व रास्ता (Interactive Mandi Map & GPS)",
                "description": "अपने खेत के आसपास की प्रमाणित APMC मंडियों की सटीक लोकेशन, दूरी, अनुमानित समय देखें और सीधे गूगल मैप्स द्वारा टर्न-बाय-टर्न दिशा-निर्देश पाएं।",
                "action": "Live Map पेज पर जाएं और अपनी पसंदीदा मंडी के लिए रूट देखें।"
            },
            {
                "id": "voice_search",
                "icon": "🎙️",
                "badge": "आवाज़ से खोजें",
                "title": "5. वॉइस असिस्टेंट व मातृभाषा में खोज (Voice Assistant)",
                "description": "सर्च बार में माइक आइकन पर क्लिक करके अपनी भाषा (हिंदी या पंजाबी) में फसल का नाम बोलें और ऑडियो द्वारा भाव सुनें।",
                "action": "माइक बटन दबाएं और फसल का नाम बोलें।"
            },
            {
                "id": "weather_alerts",
                "icon": "⛅",
                "badge": "अलर्ट व मौसम",
                "title": "6. मौसम पूर्वानुमान व भाव अलर्ट (Weather & Price Alerts)",
                "description": "5-दिवसीय मौसम पूर्वानुमान देखकर फसल कटाई और परिवहन की योजना बनाएं। साथ ही मनपसंद भाव पहुंचने पर मुफ्त एसएमएस अलर्ट सेट करें।",
                "action": "घंटी आइकन पर क्लिक करके अपना लक्षित भाव सेट करें।"
            }
        ]
    },
    "pa": {
        "welcome_title": "ਕਿਸਾਨਸੇਤੂ (KisanSetu) ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ!",
        "welcome_subtitle": "ਭਾਰਤੀ ਕਿਸਾਨਾਂ ਲਈ ਆਧੁਨਿਕ ਡਿਜੀਟਲ ਮੰਡੀ ਅਤੇ ਮੁਨਾਫਾ ਖੋਜ ਪਲੇਟਫਾਰਮ। ਹੇਠਾਂ ਵੈੱਬਸਾਈਟ ਦੇ ਸਾਰੇ ਫੀਚਰਾਂ ਦੀ ਸਰਲ ਗਾਈਡ ਦਿੱਤੀ ਗਈ ਹੈ:",
        "lang_switch_hint": "ਬੋਲੀ ਬਦਲੋ (Change Language):",
        "start_btn": "🚀 ਕਿਸਾਨਸੇਤੂ ਸ਼ੁਰੂ ਕਰੋ",
        "features": [
            {
                "id": "live_prices",
                "icon": "🌾",
                "badge": "ਲਾਈਵ ਡੇਟਾ",
                "title": "1. ਲਾਈਵ ਮੰਡੀ ਭਾਅ ਅਤੇ ਫਸਲਾਂ (Live APMC Rates)",
                "description": "ਵੱਖ-ਵੱਖ ਫਸਲਾਂ (ਕਣਕ, ਬਾਸਮਤੀ ਝੋਨਾ, ਸਰ੍ਹੋਂ, ਮੱਕੀ, ਆਲੂ ਆਦਿ) ਦੇ ਰੋਜ਼ਾਨਾ ਪ੍ਰਮਾਣਿਤ ਮੰਡੀ ਭਾਅ ਦੇਖੋ ਜੋ e-NAM ਅਤੇ Agmarknet ਤੋਂ ਪ੍ਰਾਪਤ ਹੁੰਦੇ ਹਨ।",
                "action": "ਹੋਮ ਪੇਜ 'ਤੇ ਫਸਲ ਕਾਰਡ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਮੰਡੀ ਰੇਟ ਦੇਖੋ।"
            },
            {
                "id": "calculator",
                "icon": "📊",
                "badge": "ਮੁਨਾਫਾ ਕੈਲਕੁਲੇਟਰ",
                "title": "2. ਮੰਡੀ ਤੁਲਨਾ ਅਤੇ ਢੋਆ-ਢੁਆਈ ਖਰਚਾ (Profit & Transport Calculator)",
                "description": "ਆਪਣੇ ਵਾਹਨ (ਟਰੈਕਟਰ ਟਰਾਲੀ, ਪਿਕਅੱਪ, ਟਰੱਕ) ਅਤੇ ਦੂਰੀ ਦੇ ਆਧਾਰ 'ਤੇ ਤੇਲ ਦਾ ਖਰਚਾ ਕੱਟ ਕੇ ਸਭ ਤੋਂ ਵੱਧ ਸ਼ੁੱਧ ਮੁਨਾਫਾ ਦੇਣ ਵਾਲੀ ਮੰਡੀ ਲੱਭੋ।",
                "action": "Mandi Rates ਪੇਜ 'ਤੇ ਜਾਓ, ਮਾਤਰਾ ਅਤੇ ਵਾਹਨ ਚੁਣੋ।"
            },
            {
                "id": "sell_jform",
                "icon": "💰",
                "badge": "ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ",
                "title": "3. ਫਸਲ ਵਿਕਰੀ ਅਤੇ ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ ਰਸੀਦ (Sell Crop & J-Form)",
                "description": "ਪਾਰਦਰਸ਼ੀ ਮੰਡੀ ਫੀਸ (1.5% ਸੈੱਸ, ਲਦਾਈ ਖਰਚਾ) ਦੇ ਹਿਸਾਬ ਨਾਲ ਆਪਣੀ ਵਿਕਰੀ ਦਰਜ ਕਰੋ ਅਤੇ ਸਰਕਾਰੀ ਜੇ-ਫਾਰਮ ਰਸੀਦ ਡਾਊਨਲੋਡ ਜਾਂ ਪ੍ਰਿੰਟ ਕਰੋ।",
                "action": "Sell & J-Form ਪੇਜ 'ਤੇ ਜਾ ਕੇ ਵਿਕਰੀ ਦਰਜ ਕਰੋ।"
            },
            {
                "id": "map_navigation",
                "icon": "🗺️",
                "badge": "ਜੀਪੀਐਸ ਨਕਸ਼ਾ",
                "title": "4. ਲਾਈਵ ਮੰਡੀ ਨਕਸ਼ਾ ਅਤੇ ਰਸਤਾ (Live Mandi Map & GPS Navigation)",
                "description": "ਆਪਣੇ ਖੇਤ ਤੋਂ ਨੇੜਲੀਆਂ ਪ੍ਰਮਾਣਿਤ APMC ਮੰਡੀਆਂ ਦੀ ਦੂਰੀ, ਸਮਾਂ ਅਤੇ ਗੂਗਲ ਮੈਪਸ ਰਾਹੀਂ ਸਿੱਧਾ ਰਸਤਾ ਪ੍ਰਾਪਤ ਕਰੋ।",
                "action": "Live Map ਪੇਜ 'ਤੇ ਜਾ ਕੇ ਮੰਡੀ ਦਾ ਰਸਤਾ ਦੇਖੋ।"
            },
            {
                "id": "voice_search",
                "icon": "🎙️",
                "badge": "ਬੋਲ ਕੇ ਖੋਜੋ",
                "title": "5. ਆਵਾਜ਼ ਸਹਾਇਕ (Voice Assistant in Punjabi)",
                "description": "ਮਾਈਕ ਬਟਨ ਦਬਾ ਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਫਸਲ ਦਾ ਨਾਮ ਬੋਲੋ ਅਤੇ ਆਡੀਓ ਰਾਹੀਂ ਭਾਅ ਸੁਣੋ।",
                "action": "ਮਾਈਕ ਆਈਕਨ 'ਤੇ ਟੈਪ ਕਰੋ ਅਤੇ ਫਸਲ ਦਾ ਨਾਮ ਬੋਲੋ।"
            },
            {
                "id": "weather_alerts",
                "icon": "⛅",
                "badge": "ਮੌਸਮ ਤੇ ਅਲਰਟ",
                "title": "6. ਮੌਸਮ ਜਾਣਕਾਰੀ ਅਤੇ ਭਾਅ ਅਲਰਟ (Weather & Price Alerts)",
                "description": "5-ਦਿਨਾਂ ਮੌਸਮ ਜਾਣਕਾਰੀ ਦੇਖੋ ਅਤੇ ਫਸਲ ਦਾ ਮਨਚਾਹਿਆ ਭਾਅ ਪਹੁੰਚਣ 'ਤੇ ਮੁਫਤ ਐਸਐਮਐਸ ਅਲਰਟ ਸੈੱਟ ਕਰੋ।",
                "action": "ਘੰਟੀ ਆਈਕਨ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਟਾਰਗੇਟ ਭਾਅ ਸੈੱਟ ਕਰੋ।"
            }
        ]
    },
    "en": {
        "welcome_title": "Welcome to KisanSetu Platform!",
        "welcome_subtitle": "Empowering Indian farmers with real-time APMC mandi prices, intelligent profit discovery, and seamless J-Form receipts. Here is your step-by-step feature guide:",
        "lang_switch_hint": "Change Guide Language:",
        "start_btn": "🚀 Explore KisanSetu Now",
        "features": [
            {
                "id": "live_prices",
                "icon": "🌾",
                "badge": "Real-Time Data",
                "title": "1. Live APMC Mandi Rates & Crops",
                "description": "Discover live, verified modal, minimum, and maximum prices for Wheat, Basmati Paddy, Mustard, Potato, and more, updated directly from Agmarknet & data.gov.in.",
                "action": "Browse crop cards on Home page to view today's benchmark rates."
            },
            {
                "id": "calculator",
                "icon": "📊",
                "badge": "Smart Calculator",
                "title": "2. Multi-Mandi Profit & Transport Calculator",
                "description": "Compare net take-home earnings across all regional mandis after calculating real vehicle transport (Tractor, Pickup, Tempo, Truck) and road fuel expenses.",
                "action": "Visit Mandi Rates page to select your harvest quantity and vehicle type."
            },
            {
                "id": "sell_jform",
                "icon": "💰",
                "badge": "Digital J-Form",
                "title": "3. Sell Produce & Official Digital J-Form",
                "description": "Record crop sales with transparent APMC mandi cess (1.5%) and loading fee deductions. Generate and print instant verified e-NAM J-Form receipts.",
                "action": "Open Sell & J-Form page to generate a legal sale certificate."
            },
            {
                "id": "map_navigation",
                "icon": "🗺️",
                "badge": "GPS Navigation",
                "title": "4. Interactive Mandi Map & GPS Directions",
                "description": "View all verified APMC grain markets around your farm location on a high-precision Leaflet map with pin rates and one-click Google Maps navigation.",
                "action": "Navigate to Live Map to plan your transit route."
            },
            {
                "id": "voice_search",
                "icon": "🎙️",
                "badge": "Voice Enabled",
                "title": "5. Multilingual Voice Assistant & Search",
                "description": "Tap the microphone icon to speak crop names in your mother tongue (Hindi, Punjabi, English) and hear audio rate announcements.",
                "action": "Click the mic icon in search bar or speaker buttons on cards."
            },
            {
                "id": "weather_alerts",
                "icon": "⛅",
                "badge": "Smart Advisory",
                "title": "6. Live Weather Advisory & SMS Price Alerts",
                "description": "Plan harvesting and grain transport safely with a 5-day weather forecast. Set automated SMS/WhatsApp alerts when market prices cross your target rate.",
                "action": "Tap the bell icon in the top navbar to set free alerts."
            }
        ]
    }
}

@router.get("")
@router.get("/")
def get_features_guide(lang: Optional[str] = "hi"):
    """
    Returns multilingual feature tour and instructions for KisanSetu.
    Supports 'hi' (Hindi), 'pa' (Punjabi), and 'en' (English).
    """
    selected_lang = lang.lower() if lang else "hi"
    if selected_lang not in GUIDE_DATA:
        selected_lang = "hi"
    
    return {
        "success": True,
        "language": selected_lang,
        "data": GUIDE_DATA[selected_lang],
        "available_languages": [
            {"code": "hi", "label": "🇮🇳 हिंदी (Hindi)"},
            {"code": "pa", "label": "🌾 ਪੰਜਾਬੀ (Punjabi)"},
            {"code": "en", "label": "🌐 English"}
        ]
    }
