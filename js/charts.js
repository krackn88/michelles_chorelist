// Chart visualization functionality for Michelle's Family Chore Manager
// Using pink and lime green color scheme as requested

// Define the chart colors (matched to CSS variables)
const chartColors = {
  pink: '#f782b0',
  lightPink: '#ffd1e1',
  lime: '#b8e986',
  lightLime: '#e5ffcc',
  purple: '#b8a6df',
  yellow: '#f4b350',
  blue: '#64b5f6'
};

// Error handling helper for charts
function showChartError(message) {
  console.error("Chart error:", message);
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = "Chart Error: " + message;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeCharts();
    
    // Add event listener to update charts when kid selection changes
    const kidSelector = document.getElementById('kidSelector');
    if (kidSelector) {
      kidSelector.addEventListener('change', initializeCharts);
    }
    
    // We also want to update charts when chores are added/completed/deleted
    const choreListObserver = new MutationObserver(initializeCharts);
    const choreListElement = document.getElementById('choreList');
    if (choreListElement) {
      choreListObserver.observe(choreListElement, { childList: true, subtree: true });
    }
  } catch (error) {
    showChartError("Failed to initialize charts: " + error.message);
  }
});

// Initialize all charts
function initializeCharts() {
  updateCompletionChart();
  updateChoreTypeChart();
}

// Create the completion status chart
function updateCompletionChart() {
  try {
    const ctx = document.getElementById('completionChart').getContext('2d');
    
    // Get statistics from the current kid's chores
    const currentKid = document.getElementById('kidSelector').value;
    const kids = window.kids || {}; // Get from main.js
    
    // Handle the case where kids data isn't available yet
    if (!kids[currentKid]) {
      console.warn("Kids data not available yet for charts");
      return;
    }
    
    const kidChores = kids[currentKid].chores;
    const completed = kidChores.filter(chore => chore.completed).length;
    const incomplete = kidChores.length - completed;
    
    // Calculate completion percentage
    const completionPercentage = kidChores.length > 0 
      ? Math.round((completed / kidChores.length) * 100) 
      : 0;
    
    // Destroy existing chart if it exists
    if (window.completionChart) {
      window.completionChart.destroy();
    }
    
    // Create new chart
    window.completionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'To Do'],
        datasets: [{
          data: [completed, incomplete],
          backgroundColor: [
            chartColors.lime,
            chartColors.lightPink,
          ],
          borderColor: [
            '#a1d172',
            '#e670a1',
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Nunito'
              }
            }
          },
          title: {
            display: true,
            text: `${currentKid}'s Chore Completion - ${completionPercentage}%`,
            font: {
              size: 16,
              family: 'Nunito',
              weight: 'bold'
            },
            color: '#333'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%',
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  } catch (error) {
    showChartError("Failed to update completion chart: " + error.message);
  }
}

// Create the chore type distribution chart
function updateChoreTypeChart() {
  try {
    const ctx = document.getElementById('choreTypeChart').getContext('2d');
    
    // Get statistics
    const currentKid = document.getElementById('kidSelector').value;
    const kids = window.kids || {}; // Get from main.js
    
    // Handle the case where kids data isn't available yet
    if (!kids[currentKid]) {
      console.warn("Kids data not available yet for charts");
      return;
    }
    
    const kidChores = kids[currentKid].chores;
    const dailyChores = kidChores.filter(chore => chore.schedule === 'daily').length;
    const weeklyChores = kidChores.filter(chore => chore.schedule === 'weekly').length;
    const monthlyChores = kidChores.filter(chore => chore.schedule === 'monthly').length;
    
    // Destroy existing chart if it exists
    if (window.choreTypeChart) {
      window.choreTypeChart.destroy();
    }
    
    // Create new chart
    window.choreTypeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Daily', 'Weekly', 'Monthly'],
        datasets: [{
          label: 'Number of Chores',
          data: [dailyChores, weeklyChores, monthlyChores],
          backgroundColor: [
            chartColors.pink,
            chartColors.lime,
            chartColors.purple
          ],
          borderColor: [
            '#e670a1',
            '#a1d172',
            '#a794d1'
          ],
          borderWidth: 2,
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Chore Schedule Distribution',
            font: {
              size: 16,
              family: 'Nunito',
              weight: 'bold'
            },
            color: '#333'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                family: 'Nunito'
              }
            },
            grid: {
              display: true,
              color: '#f0f0f0'
            }
          },
          x: {
            ticks: {
              font: {
                family: 'Nunito'
              }
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  } catch (error) {
    showChartError("Failed to update chore type chart: " + error.message);
  }
}

// Update window.kids when the main.js loads
function syncWithMainJs() {
  const checkInterval = setInterval(() => {
    if (window.kids) {
      clearInterval(checkInterval);
      initializeCharts();
    }
  }, 100);
  
  // Stop checking after 5 seconds if kids data never becomes available
  setTimeout(() => clearInterval(checkInterval), 5000);
}
