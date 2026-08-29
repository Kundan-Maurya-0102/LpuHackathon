class PriceChartManager {
  constructor() {
    this.chartInstance = null;
    this.currentPeriod = "7d";
    this.currentCropId = "wheat";
  }

  initChart(elementId = "priceHistoryChart") {
    const canvas = document.getElementById(elementId);
    if (!canvas || typeof Chart === "undefined") return;
    this.renderChart();
  }

  renderChart(cropId = this.currentCropId, period = this.currentPeriod) {
    const canvas = document.getElementById("priceHistoryChart");
    if (!canvas || typeof Chart === "undefined") return;

    this.currentCropId = cropId;
    this.currentPeriod = period;

    const crop = AGRI_DATA.crops.find(c => c.id === cropId) || AGRI_DATA.crops[0];
    const historyData = (AGRI_DATA.priceHistory[cropId] && AGRI_DATA.priceHistory[cropId][period])
      ? AGRI_DATA.priceHistory[cropId][period]
      : this.generateDynamicHistory(crop.allIndiaAvg, period);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, "rgba(46, 125, 50, 0.35)");
    gradient.addColorStop(1, "rgba(46, 125, 50, 0.0)");

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: historyData.labels,
        datasets: [
          {
            label: "Modal (Average) Price (₹/Qtl)",
            data: historyData.modal,
            borderColor: "#2e7d32",
            backgroundColor: gradient,
            borderWidth: 3.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#1b5e20",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8
          },
          {
            label: "Max Price (₹/Qtl)",
            data: historyData.max,
            borderColor: "#0288d1",
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 3
          },
          {
            label: "Min Price (₹/Qtl)",
            data: historyData.min,
            borderColor: "#f57c00",
            borderDash: [4, 4],
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 14,
              font: {
                size: 12,
                weight: "600",
                family: "'Outfit', 'Noto Sans Devanagari', sans-serif"
              },
              color: "#374151"
            }
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.92)",
            titleFont: { size: 13, weight: "bold" },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return ` ${context.dataset.label}: ₹${context.parsed.y} / Qtl`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(0,0,0,0.04)"
            },
            ticks: {
              font: { size: 11, weight: "500" },
              color: "#6b7280"
            }
          },
          y: {
            grid: {
              color: "rgba(0,0,0,0.06)"
            },
            ticks: {
              callback: function (val) {
                return "₹" + val;
              },
              font: { size: 11, weight: "500" },
              color: "#6b7280"
            }
          }
        }
      }
    });

    this.updatePeriodButtonsUI(period);
  }

  generateDynamicHistory(basePrice, period) {
    if (period === "7d") {
      const labels = ["23 Aug", "24 Aug", "25 Aug", "26 Aug", "27 Aug", "28 Aug", "Today"];
      const modal = [
        Math.round(basePrice * 0.97),
        Math.round(basePrice * 0.975),
        Math.round(basePrice * 0.985),
        Math.round(basePrice * 0.99),
        Math.round(basePrice * 1.00),
        Math.round(basePrice * 1.01),
        Math.round(basePrice * 1.02)
      ];
      return {
        labels,
        modal,
        min: modal.map(v => Math.round(v * 0.96)),
        max: modal.map(v => Math.round(v * 1.04))
      };
    } else if (period === "30d") {
      const labels = ["1 Aug", "6 Aug", "11 Aug", "16 Aug", "21 Aug", "26 Aug", "29 Aug"];
      const modal = [
        Math.round(basePrice * 0.94),
        Math.round(basePrice * 0.95),
        Math.round(basePrice * 0.97),
        Math.round(basePrice * 0.98),
        Math.round(basePrice * 1.00),
        Math.round(basePrice * 1.015),
        Math.round(basePrice * 1.02)
      ];
      return {
        labels,
        modal,
        min: modal.map(v => Math.round(v * 0.95)),
        max: modal.map(v => Math.round(v * 1.05))
      };
    } else {
      const labels = ["June", "Mid June", "July", "Mid July", "Aug Start", "Mid Aug", "Late Aug"];
      const modal = [
        Math.round(basePrice * 0.91),
        Math.round(basePrice * 0.93),
        Math.round(basePrice * 0.95),
        Math.round(basePrice * 0.97),
        Math.round(basePrice * 0.99),
        Math.round(basePrice * 1.01),
        Math.round(basePrice * 1.02)
      ];
      return {
        labels,
        modal,
        min: modal.map(v => Math.round(v * 0.94)),
        max: modal.map(v => Math.round(v * 1.06))
      };
    }
  }

  updatePeriodButtonsUI(period) {
    document.querySelectorAll(".period-tab-btn").forEach(btn => {
      if (btn.getAttribute("data-period") === period) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

window.priceChart = new PriceChartManager();
