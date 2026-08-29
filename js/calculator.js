class ProfitCalculator {
  constructor() {
    this.defaultQuantityQtl = 30;
    this.selectedVehicleId = "tractor";
    this.selectedMandiId = "khanna";
    this.selectedCropId = "wheat";
  }

  calculateMandiProfit(cropId, mandiId, vehicleId, quantityQtl) {
    const crop = AGRI_DATA.crops.find(c => c.id === cropId) || AGRI_DATA.crops[0];
    const mandi = AGRI_DATA.mandis.find(m => m.id === mandiId) || AGRI_DATA.mandis[0];
    const vehicle = AGRI_DATA.vehicles.find(v => v.id === vehicleId) || AGRI_DATA.vehicles[0];

    const priceInfo = mandi.prices[cropId] || { min: 2000, max: 2300, modal: 2150 };
    const modalPrice = priceInfo.modal;
    const minPrice = priceInfo.min;
    const maxPrice = priceInfo.max;

    const distanceKm = mandi.distanceKm || 15;
    const transportCost = Math.round((distanceKm * vehicle.ratePerKm) + vehicle.baseLoadingFee);
    const transportPerQtl = Math.round(transportCost / quantityQtl);
    const mandiCessFee = Math.round(quantityQtl * 15);
    const grossRevenue = Math.round(quantityQtl * modalPrice);
    const totalDeductions = transportCost + mandiCessFee;
    const netProfit = grossRevenue - totalDeductions;
    const netPricePerQtl = Math.round(netProfit / quantityQtl);

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
    const allEvaluations = AGRI_DATA.mandis.map(m => {
      return this.calculateMandiProfit(cropId, m.id, vehicleId, quantityQtl);
    });

    allEvaluations.sort((a, b) => b.netProfit - a.netProfit);
    const bestMandi = allEvaluations[0];
    
    const sortedByDistance = [...allEvaluations].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestMandi = sortedByDistance[0];

    const extraProfit = bestMandi.netProfit - nearestMandi.netProfit;
    const isDifferentFromNearest = bestMandi.mandi.id !== nearestMandi.mandi.id;

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
