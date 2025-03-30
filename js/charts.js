/**
 * Charts and Visualizations
 * Creates various charts and graphs for the Family Chore Manager
 */

// Chart instances
let completionChart = null;
let choreTypeChart = null;
let coziEventsChart = null;

// Chart colors
const chartColors = {
  primary: '#4a6da7',
  secondary: '#f7cd59',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  gray: '#95a5a6',
  coziOrange: '#ff7a59',
  kids: {
    'Ember': '#ff9999',
    'Lilly': '#ffcc99',
    'Levi': '#99ccff',
    'Eva': '#cc99ff',
    'Elijah': '#99ff99',
    'Kallie': '#ff99cc'
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
});

// Initialize all charts
function initCharts() {
  // Chart.js global settings
  Chart.defaults.font.family = "'Nunito', sans-serif";
  Chart.defaults.color = '#2c3e50';
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  
  // Initialize completion chart
  initCompletionChart();
  
  // Initialize chore type chart
  initChoreTypeChart();
  
  // Initialize Cozi events chart
  initCoziEventsChart();
  
  // Update charts with current data
  updateCharts();
}

// Initialize completion chart
function initCompletionChart() {
  const ctx = document.getElementById('completionChart');
  if (!ctx) return;
  
  completionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie'],
      datasets: [
        {
          label: 'Completed',
          backgroundColor: chartColors.success,
          data: [0, 0, 0, 0, 0, 0]
        },
        {
          label: 'Pending',
          backgroundColor: chartColors.warning,
          data: [0, 0, 0, 0, 0, 0]
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Chore Completion Status by Child',
          padding: 20,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.raw + ' chores';
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Child'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Chores'
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Initialize chore type chart
function initChoreTypeChart() {
  const ctx = document.getElementById('choreTypeChart');
  if (!ctx) return;
  
  choreTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Daily', 'Weekly', 'Monthly'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.warning
        ],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Chore Distribution by Type',
          padding: 20,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} chores (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    }
  });
}

// Initialize Cozi events chart
function initCoziEventsChart() {
  const ctx = document.getElementById('coziEventsChart');
  if (!ctx) return;
  
  coziEventsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie'],
      datasets: [{
        label: 'Cozi Events',
        backgroundColor: chartColors.coziOrange,
        data: [0, 0, 0, 0, 0, 0]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Upcoming Cozi Calendar Events',
          padding: 20,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.raw + ' events';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Child'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Events'
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Update all charts with current data
function updateCharts() {
  // Load chores from localStorage
  const savedChores = localStorage.getItem('chores');
  let chores = [];
  
  if (savedChores) {
    try {
      chores = JSON.parse(savedChores);
    } catch (err) {
      console.error('Error parsing chores:', err);
    }
  }
  
  // Update completion chart
  updateCompletionChart(chores);
  
  // Update chore type chart
  updateChoreTypeChart(chores);
  
  // Update Cozi events chart if integration available
  if (window.coziIntegration && window.coziIntegration.getCoziEvents) {
    const coziEvents = window.coziIntegration.getCoziEvents();
    updateCoziEventsChart(coziEvents);
  }
}

// Update completion chart with chore data
function updateCompletionChart(chores) {
  if (!completionChart) return;
  
  // Group chores by child and completion status
  const kidNames = ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie'];
  const completed = Array(kidNames.length).fill(0);
  const pending = Array(kidNames.length).fill(0);
  
  chores.forEach(chore => {
    if (!chore.assignedTo) return;
    
    const kidName = kidName = chore.assignedTo.charAt(0).toUpperCase() + chore.assignedTo.slice(1);
    const kidIndex = kidNames.indexOf(kidName);
    
    if (kidIndex !== -1) {
      if (chore.completed) {
        completed[kidIndex]++;
      } else {
        pending[kidIndex]++;
      }
    }
  });
  
  // Update chart data
  completionChart.data.datasets[0].data = completed;
  completionChart.data.datasets[1].data = pending;
  completionChart.update();
}

// Update chore type chart with chore data
function updateChoreTypeChart(chores) {
  if (!choreTypeChart) return;
  
  // Count chores by type
  const counts = {
    daily: 0,
    weekly: 0,
    monthly: 0
  };
  
  chores.forEach(chore => {
    if (chore.recurring && chore.recurringType) {
      counts[chore.recurringType] = (counts[chore.recurringType] || 0) + 1;
    }
  });
  
  // Update chart data
  choreTypeChart.data.datasets[0].data = [
    counts.daily,
    counts.weekly,
    counts.monthly
  ];
  choreTypeChart.update();
}

// Update Cozi events chart with event data
function updateCoziEventsChart(events) {
  if (!coziEventsChart || !Array.isArray(events)) return;
  
  // Count events by child
  const kidNames = ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie'];
  const counts = Array(kidNames.length).fill(0);
  
  // Count events for this week and next
  const today = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(today.getDate() + 14);
  
  events.forEach(event => {
    if (!event.assignee) return;
    
    // Check if event is in the next two weeks
    const eventDate = new Date(event.start);
    if (eventDate < today || eventDate > twoWeeksLater) return;
    
    // Find matching child name (case insensitive)
    const kidIndex = kidNames.findIndex(
      name => name.toLowerCase() === event.assignee.toLowerCase()
    );
    
    if (kidIndex !== -1) {
      counts[kidIndex]++;
    }
  });
  
  // Update chart data
  coziEventsChart.data.datasets[0].data = counts;
  
  // Update chart title to reflect date range
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  coziEventsChart.options.plugins.title.text = 
    `Cozi Events (${formatDate(today)} - ${formatDate(endDate)})`;
  
  coziEventsChart.update();
}

// Expose functions to global scope
window.updateCharts = updateCharts;
window.updateCoziEventsChart = updateCoziEventsChart;
