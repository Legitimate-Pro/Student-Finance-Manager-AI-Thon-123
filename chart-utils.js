let spendingChart;

function initSpendingChart(data = {}) {
  const ctx = document.getElementById('spendingChart').getContext('2d');
  if (spendingChart) spendingChart.destroy();

  spendingChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: 'Spending by Category',
        data: Object.values(data),
        backgroundColor: [
          '#00ffaa', '#ff6f61', '#6a67ce', '#ffcc00', '#00c2cb', '#ff007f', '#d8ff00'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}
