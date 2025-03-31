/**
 * Family Chore Manager - Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Format a date to a friendly string format
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  };
  
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format a time from a date object
 * @param {Date|string} date - Date to extract time from
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() && 
         dateObj.getMonth() === today.getMonth() && 
         dateObj.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is within the current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is within current week
 */
function isThisWeek(date) {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Show a notification message to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;
  
  const notificationId = `notification-${generateId()}`;
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.id = notificationId;
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">
        ${getNotificationIcon(type)}
      </span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  container.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Setup close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    dismissNotification(notificationId);
  });
  
  // Auto dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(notificationId);
    }, duration);
  }
  
  return notificationId;
}

/**
 * Dismiss a notification
 * @param {string} id - ID of notification to dismiss
 */
function dismissNotification(id) {
  const notification = document.getElementById(id);
  if (!notification) return;
  
  notification.classList.remove('show');
  notification.classList.add('hide');
  
  // Remove from DOM after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

/**
 * Get the icon for a notification type
 * @param {string} type - Notification type
 * @returns {string} HTML for the icon
 */
function getNotificationIcon(type) {
  switch(type) {
    case 'success':
      return '<i class="fas fa-check-circle"></i>';
    case 'error':
      return '<i class="fas fa-exclamation-circle"></i>';
    case 'warning':
      return '<i class="fas fa-exclamation-triangle"></i>';
    case 'info':
    default:
      return '<i class="fas fa-info-circle"></i>';
  }
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pluralize a word based on count
 * @param {string} word - Word to pluralize
 * @param {number} count - Count to check
 * @returns {string} Pluralized word
 */
function pluralize(word, count) {
  if (count === 1) return word;
  return `${word}s`;
}

/**
 * Truncate a string to a maximum length
 * @param {string} str - String to truncate 
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Format a number as a percentage
 * @param {number} value - Value to format
 * @param {number} total - Total value
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, total) {
  if (!total) return '0%';
  return Math.round((value / total) * 100) + '%';
}

/**
 * Create a throttled function that only invokes the provided function at most once per specified period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle period in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  
  return function() {
    const args = arguments;
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Create a debounced function that delays invoking the provided function until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Debounce wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  
  return function() {
    const context = this;
    const args = arguments;
    
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get the current theme from local storage or system preference
 * @returns {string} Current theme ('light' or 'dark')
 */
function getCurrentTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Set the application theme
 * @param {string} theme - Theme to set ('light' or 'dark')
 */
function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

/**
 * Export data as a JSON file
 * @param {Object} data - Data to export
 * @param {string} fileName - Name of the export file
 */
function exportData(data, fileName = 'family-chore-manager-data.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON file
 * @returns {Promise<Object>} Imported data
 */
function importData() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return reject(new Error('No file selected'));
      
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    };
    
    input.click();
  });
}

// Export utilities to global scope
window.utils = {
  formatDate,
  formatTime,
  isToday,
  isThisWeek,
  generateId,
  showNotification,
  dismissNotification,
  capitalize,
  pluralize,
  truncate,
  formatPercentage,
  throttle,
  debounce,
  getCurrentTheme,
  setTheme,
  exportData,
  importData
}; 