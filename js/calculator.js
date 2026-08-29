class ProfitCalculator {
  constructor() {
    this.defaultQuantityQtl = 30;
    this.selectedVehicleId = "tractor";
    this.selectedMandiId = "khanna";
    this.selectedCropId = "wheat";
  }

  getMandisList() {
    if (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.mandis) && window.AGRI_DATA.mandis.length > 0) {
      return window.AGRI_DATA.mandis;
    }
    return [
      {
        id: "khanna",
        name: "Khanna APMC Grain Market",
        nameHi: "खन्ना अनाज मंडी",
        namePa: "ਖੰਨਾ ਅਨਾਜ ਮੰਡੀ",
        subText: "Asia's Largest Grain Market",
        state: "Punjab",
        district: "Ludhiana",
        lat: 30.7072,
        lng: 76.2167,
        distanceKm: 28,
        travelTime: "45 min",
        rating: 4.9,
        eNamEnabled: true,
        facilities: ["Electronic Weighbridge", "Covered Sheds", "Farmer Rest House"],
        prices: {
          wheat: { min: 2320, max: 2460, modal: 2410, arrivals: "Heavy (3,400 Qtl)" },
          paddy: { min: 3600, max: 3950, modal: 3820, arrivals: "Moderate (1,800 Qtl)" },
          mustard: { min: 5350, max: 5600, modal: 5500, arrivals: "Low (450 Qtl)" }
        }
      }
    ];
  }

  calculateMandiProfit(cropId, mandiId, vehicleId, quantityQtl = 30) {
    const crops = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.crops)) ? window.AGRI_DATA.crops : [];
    const vehicles = (window.AGRI_DATA && Array.isArray(window.AGRI_DATA.vehicles)) ? window.AGRI_DATA.vehicles : [];
    const mandis = this.getMandisList();

    const crop = crops.find(c => c.id === cropId) || crops[0] || { id: cropId, name: "Wheat", nameHi: "गेहूं", unit: "Quintal" };
    const mandi = mandis.find(m => m.id === mandiId) || mandis[0];
    const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0] || { id: "tractor", name: "Tractor Trolley", ratePerKm: 22, baseLoadingFee: 200, capacityQtl: 40 };

    const prices = (mandi && mandi.prices) ? mandi.prices : {};
    const priceInfo = prices[cropId] || { min: 2150, max: 2400, modal: 2300 };
    const modalPrice = priceInfo.modal || 2300;
    const minPrice = priceInfo.min || Math.round(modalPrice * 0.95);
    const maxPrice = priceInfo.max || Math.round(modalPrice * 1.05);

    const distanceKm = mandi.distanceKm || 15;
    const transportCost = Math.round((distanceKm * (vehicle.ratePerKm || 20)) + (vehicle.baseLoadingFee || 150));
    const transportPerQtl = Math.round(transportCost / (quantityQtl || 1));
    const mandiCessFee = Math.round((quantityQtl || 1) * 15);
    const grossRevenue = Math.round((quantityQtl || 1) * modalPrice);
    const totalDeductions = transportCost + mandiCessFee;
    const netProfit = grossRevenue - totalDeductions;
    const netPricePerQtl = Math.round(netProfit / (quantityQtl || 1));

    return {
      crop,
      mandi,
      vehicle,
      quantityQtl,
      distanceKm,
      modalPrice,
      minPrice,
      maxPrice,
      grossRevenue,
      transportCost,
      transportPerQtl,
      mandiCessFee,
      totalDeductions,
      netProfit,
      netPricePerQtl
    };
  }

  getBestMandiRecommendation(cropId, vehicleId, quantityQtl = 30) {
    const mandis = this.getMandisList();
    const allEvaluations = mandis.map(m => {
      return this.calculateMandiProfit(cropId, m.id, vehicleId, quantityQtl);
    });

    if (allEvaluations.length === 0) {
      const fallback = this.calculateMandiProfit(cropId, "khanna", vehicleId, quantityQtl);
      return {
        bestMandi: fallback,
        nearestMandi: fallback,
        extraProfit: 0,
        isDifferentFromNearest: false,
        allEvaluations: [fallback]
      };
    }

    allEvaluations.sort((a, b) => b.netProfit - a.netProfit);
    const bestMandi = allEvaluations[0];
    
    const sortedByDistance = [...allEvaluations].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestMandi = sortedByDistance[0] || bestMandi;

    const extraProfit = (bestMandi && nearestMandi) ? (bestMandi.netProfit - nearestMandi.netProfit) : 0;
    const isDifferentFromNearest = (bestMandi && nearestMandi && bestMandi.mandi && nearestMandi.mandi) 
      ? (bestMandi.mandi.id !== nearestMandi.mandi.id) 
      : false;

    return {
      bestMandi,
      nearestMandi,
      extraProfit: extraProfit > 0 ? extraProfit : 0,
      isDifferentFromNearest,
      allEvaluations
    };
  }
}

window.profitCalculator = new ProfitCalculator();
