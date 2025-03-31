/**
 * charts.js - Data visualization for Family Chore Manager
 * Creates and updates charts for displaying chore completion statistics
 */

// Chart color scheme (pink and green)
const chartColors = {
  primary: '#e83e8c', // Pink
  primaryLight: '#f8bbd0',
  primaryDark: '#d81b60',
  secondary: '#4caf50', // Green
  secondaryLight: '#c8e6c9',
  secondaryDark: '#388e3c',
  gray: '#757575',
  grayLight: '#f5f5f5',
  complete: '#4caf50',
  incomplete: '#ff9800',
  // For pie/doughnut chart segments
  segments: [
    '#e83e8c', '#4caf50', '#ff9800', '#9c27b0', 
    '#00bcd4', '#3f51b5', '#f44336', '#009688'
  ]
};

// Chart.js global defaults
Chart.defaults.font.family = '"Nunito", sans-serif';
Chart.defaults.color = '#757575';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(232, 62, 140, 0.8)';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.position = 'bottom';

// Chart instances
let completionChart;
let choreTypeChart;
let coziEventsChart;
let completionRateChart;
let choreDistributionChart;
let weeklyProgressChart;
let monthlyTrendsChart;

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initCharts();
});

// Initialize charts - called from main.js and on DOM load
function initCharts() {
  // First, check which charts are available on the current page
  if (document.getElementById('completionChart')) {
    initCompletionChart();
  }
  
  if (document.getElementById('choreTypeChart')) {
    initChoreTypeChart();
  }
  
  if (document.getElementById('coziEventsChart')) {
    initCoziEventsChart();
  }
  
  // Reports section charts
  if (document.getElementById('completionRateChart')) {
    initCompletionRateChart();
  }
  
  if (document.getElementById('choreDistributionChart')) {
    initChoreDistributionChart();
  }
  
  if (document.getElementById('weeklyProgressChart')) {
    initWeeklyProgressChart();
  }
  
  if (document.getElementById('monthlyTrendsChart')) {
    initMonthlyTrendsChart();
  }
}

// Initialize completion status chart
function initCompletionChart() {
  const ctx = document.getElementById('completionChart').getContext('2d');
  const chores = JSON.parse(localStorage.getItem('chores') || '[]');
  const currentKid = localStorage.getItem('defaultChild') || 'Ember';
  
  // Filter chores for the current kid
  const filteredChores = chores.filter(chore => 
    chore.assignedTo === currentKid || chore.assignedTo === 'All'
  );
  
  // Count completed and incomplete chores
  const completedCount = filteredChores.filter(chore => chore.completed).length;
  const incompleteCount = filteredChores.length - completedCount;
  
  // Create or update chart
  if (completionChart) {
    completionChart.data.datasets[0].data = [completedCount, incompleteCount];
    completionChart.update();
  } else {
    completionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          data: [completedCount, incompleteCount],
          backgroundColor: [chartColors.complete, chartColors.incomplete],
          borderColor: [chartColors.secondaryDark, '#f57c00'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Chore Completion Status',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom'
          }
        },
        cutout: '70%',
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  }
}

// Initialize chore type distribution chart
function initChoreTypeChart() {
  const ctx = document.getElementById('choreTypeChart').getContext('2d');
  const chores = JSON.parse(localStorage.getItem('chores') || '[]');
  const currentKid = localStorage.getItem('defaultChild') || 'Ember';
  
  // Filter chores for the current kid
  const filteredChores = chores.filter(chore => 
    chore.assignedTo === currentKid || chore.assignedTo === 'All'
  );
  
  // Count chores by schedule type
  const dailyCount = filteredChores.filter(chore => chore.schedule === 'daily').length;
  const weeklyCount = filteredChores.filter(chore => chore.schedule === 'weekly').length;
  const monthlyCount = filteredChores.filter(chore => chore.schedule === 'monthly').length;
  
  // Create or update chart
  if (choreTypeChart) {
    choreTypeChart.data.datasets[0].data = [dailyCount, weeklyCount, monthlyCount];
    choreTypeChart.update();
  } else {
    choreTypeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Daily', 'Weekly', 'Monthly'],
        datasets: [{
          data: [dailyCount, weeklyCount, monthlyCount],
          backgroundColor: [
            chartColors.primaryLight,
            chartColors.primary,
            chartColors.primaryDark
          ],
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Chore Types',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Initialize Cozi events chart
function initCoziEventsChart() {
  const ctx = document.getElementById('coziEventsChart').getContext('2d');
  
  // Get saved Cozi events
  const coziEvents = JSON.parse(localStorage.getItem('coziEvents') || '[]');
  
  // Group events by category
  const categories = {};
  
  coziEvents.forEach(event => {
    // Try to determine category from event title or description
    let category = 'Other';
    
    const title = (event.title || event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    
    if (title.includes('school') || title.includes('class') || description.includes('school')) {
      category = 'School';
    } else if (title.includes('sport') || title.includes('practice') || title.includes('game') || 
               description.includes('sport') || description.includes('practice')) {
      category = 'Sports';
    } else if (title.includes('doctor') || title.includes('medical') || title.includes('appointment') ||
               description.includes('doctor') || description.includes('medical')) {
      category = 'Appointments';
    } else if (title.includes('birthday') || title.includes('party') || title.includes('celebration') ||
               description.includes('birthday') || description.includes('party')) {
      category = 'Celebrations';
    } else if (title.includes('trip') || title.includes('vacation') || title.includes('travel') ||
               description.includes('trip') || description.includes('vacation')) {
      category = 'Travel';
    }
    
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  
  // Prepare chart data
  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const backgroundColors = chartColors.segments.slice(0, labels.length);
  
  // Create or update chart
  if (coziEventsChart) {
    coziEventsChart.data.labels = labels;
    coziEventsChart.data.datasets[0].data = data;
    coziEventsChart.data.datasets[0].backgroundColor = backgroundColors;
    coziEventsChart.update();
  } else {
    coziEventsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Cozi Calendar Events',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Initialize completion rate chart (reports section)
function initCompletionRateChart() {
  const ctx = document.getElementById('completionRateChart').getContext('2d');
  const chores = JSON.parse(localStorage.getItem('chores') || '[]');
  
  // Group by child
  const children = ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie'];
  const completionRates = [];
  
  children.forEach(child => {
    const childChores = chores.filter(chore => 
      chore.assignedTo === child || chore.assignedTo === 'All'
    );
    
    if (childChores.length > 0) {
      const completedCount = childChores.filter(chore => chore.completed).length;
      const rate = Math.round((completedCount / childChores.length) * 100);
      completionRates.push(rate);
    } else {
      completionRates.push(0);
    }
  });
  
  // Create chart
  completionRateChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: children,
      datasets: [{
        label: 'Completion Rate (%)',
        data: completionRates,
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primaryDark,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => `${value}%`
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Chore Completion Rate by Child',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  });
}

// Initialize chore distribution chart (reports section)
function initChoreDistributionChart() {
  const ctx = document.getElementById('choreDistributionChart').getContext('2d');
  const chores = JSON.parse(localStorage.getItem('chores') || '[]');
  
  // Count chores per child
  const children = ['Ember', 'Lilly', 'Levi', 'Eva', 'Elijah', 'Kallie', 'All', 'Parents'];
  const choreCounts = [];
  
  children.forEach(child => {
    const count = chores.filter(chore => chore.assignedTo === child).length;
    choreCounts.push(count);
  });
  
  // Create chart
  choreDistributionChart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: children,
      datasets: [{
        data: choreCounts,
        backgroundColor: chartColors.segments,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Chore Distribution',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// Initialize weekly progress chart (reports section)
function initWeeklyProgressChart() {
  const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
  const chores = JSON.parse(localStorage.getItem('chores') || '[]');
  
  // Get days of the week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  
  // Count daily chores
  const dailyChores = chores.filter(chore => chore.schedule === 'daily').length;
  
  // Count weekly chores per day
  const weeklyChoresByDay = Array(7).fill(0);
  chores.forEach(chore => {
    if (chore.schedule === 'weekly' && chore.days) {
      chore.days.forEach(day => {
        weeklyChoresByDay[day]++;
      });
    }
  });
  
  // Create datasets for daily and weekly chores
  const dailyDataset = Array(7).fill(dailyChores);
  
  // Mark days that have passed as completed for visualization
  const completedDailyDataset = Array(7).fill(0);
  const completedWeeklyDataset = Array(7).fill(0);
  
  for (let i = 0; i <= today; i++) {
    completedDailyDataset[i] = dailyChores;
    completedWeeklyDataset[i] = weeklyChoresByDay[i];
  }
  
  // Create chart
  weeklyProgressChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Daily Chores',
          data: dailyDataset,
          backgroundColor: chartColors.primaryLight,
          borderColor: chartColors.primary,
          borderWidth: 1,
          stack: 'Stack 0'
        },
        {
          label: 'Weekly Chores',
          data: weeklyChoresByDay,
          backgroundColor: chartColors.secondaryLight,
          borderColor: chartColors.secondary,
          borderWidth: 1,
          stack: 'Stack 0'
        },
        {
          label: 'Daily Completed',
          data: completedDailyDataset,
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryDark,
          borderWidth: 1,
          stack: 'Stack 1'
        },
        {
          label: 'Weekly Completed',
          data: completedWeeklyDataset,
          backgroundColor: chartColors.secondary,
          borderColor: chartColors.secondaryDark,
          borderWidth: 1,
          stack: 'Stack 1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Weekly Progress',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  });
}

// Initialize monthly trends chart (reports section)
function initMonthlyTrendsChart() {
  const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
  
  // Sample data for monthly trends
  // In a real app, this would be calculated from historical completion data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const completionRates = [65, 70, 75, 82, 88, 92];
  
  // Create chart
  monthlyTrendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Completion Rate (%)',
        data: completionRates,
        backgroundColor: 'rgba(232, 62, 140, 0.2)',
        borderColor: chartColors.primary,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => `${value}%`
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Completion Trends',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  });
}

// Update Cozi events chart - called from cozi-integration.js
function updateCoziEventsChart(events) {
  if (!document.getElementById('coziEventsChart')) {
    return;
  }
  
  // Group events by category
  const categories = {};
  
  events.forEach(event => {
    // Try to determine category from event title or description
    let category = 'Other';
    
    const title = (event.title || event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    
    if (title.includes('school') || title.includes('class') || description.includes('school')) {
      category = 'School';
    } else if (title.includes('sport') || title.includes('practice') || title.includes('game') || 
               description.includes('sport') || description.includes('practice')) {
      category = 'Sports';
    } else if (title.includes('doctor') || title.includes('medical') || title.includes('appointment') ||
               description.includes('doctor') || description.includes('medical')) {
      category = 'Appointments';
    } else if (title.includes('birthday') || title.includes('party') || title.includes('celebration') ||
               description.includes('birthday') || description.includes('party')) {
      category = 'Celebrations';
    } else if (title.includes('trip') || title.includes('vacation') || title.includes('travel') ||
               description.includes('trip') || description.includes('vacation')) {
      category = 'Travel';
    }
    
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  
  // Prepare chart data
  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const backgroundColors = chartColors.segments.slice(0, labels.length);
  
  // Update chart if it exists
  if (coziEventsChart) {
    coziEventsChart.data.labels = labels;
    coziEventsChart.data.datasets[0].data = data;
    coziEventsChart.data.datasets[0].backgroundColor = backgroundColors;
    coziEventsChart.update();
  } else {
    // Initialize chart if not exists
    initCoziEventsChart();
  }
}

// Update all charts
function updateAllCharts() {
  if (completionChart) {
    initCompletionChart();
  }
  
  if (choreTypeChart) {
    initChoreTypeChart();
  }
  
  if (coziEventsChart) {
    initCoziEventsChart();
  }
  
  if (completionRateChart) {
    initCompletionRateChart();
  }
  
  if (choreDistributionChart) {
    initChoreDistributionChart();
  }
  
  if (weeklyProgressChart) {
    initWeeklyProgressChart();
  }
}

// Make functions available globally
window.initCharts = initCharts;
window.updateCoziEventsChart = updateCoziEventsChart;
window.updateAllCharts = updateAllCharts;
