/**
 * Cozi Calendar Integration
 * Handles fetching and processing data from Cozi Calendar
 */

// Configuration and state
let coziConfig = {
  url: '',  // Remove hardcoded URL
  isConnected: false,
  lastSync: null,
  useProxy: true  // Default to using a proxy
};

// Cache for Cozi events
let coziEventsCache = [];

// Available CORS proxies (we'll try these in order)
const corsProxies = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initCoziIntegration();
  setupCoziModal();
});

// Initialize Cozi integration
function initCoziIntegration() {
  // Load saved configuration from localStorage if available
  const savedConfig = localStorage.getItem('coziConfig');
  const savedUrl = localStorage.getItem('coziUrl'); // Check for URL in both places
  
  if (savedConfig) {
    try {
      coziConfig = { ...coziConfig, ...JSON.parse(savedConfig) };
    } catch (err) {
      console.error('Error loading Cozi config:', err);
    }
  }
  
  // If URL exists in either place, use it and sync
  if (savedUrl && !coziConfig.url) {
    coziConfig.url = savedUrl;
    localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
  }
  
  if (coziConfig.url) {
    console.log('Cozi configuration loaded, attempting auto-sync');
    // Enable the configure button
    const configBtn = document.getElementById('configureCoziBtn');
    if (configBtn) {
      configBtn.disabled = false;
    }
    // Attempt immediate sync
    syncCoziEvents().catch(err => {
      console.error('Auto-sync failed:', err);
      showCoziStatus('Auto-sync failed. Please check your configuration.', 'error');
    });
  }
  
  // Set up refresh button
  const refreshBtn = document.getElementById('refreshCoziBtn');
  if (refreshBtn) {
    refreshBtn.disabled = !coziConfig.url;
    refreshBtn.addEventListener('click', () => syncCoziEvents());
  }
}

// Setup Cozi configuration modal
function setupCoziModal() {
  const modal = document.getElementById('coziConfigModal');
  const btn = document.getElementById('configureCoziBtn');
  const form = document.getElementById('coziConfigForm');
  const urlInput = document.getElementById('coziUrl');
  const testBtn = document.getElementById('testCoziConnectionBtn');
  const statusDiv = document.getElementById('coziConnectionStatus');
  
  if (!modal || !btn || !form || !urlInput || !testBtn) {
    console.error('Required Cozi modal elements not found');
    return;
  }
  
  // Initialize Bootstrap modal
  const bsModal = new bootstrap.Modal(modal);
  
  // Enable the configure button if we have a URL
  btn.disabled = !coziConfig.url;
  
  // Show modal when clicking the Cozi button
  btn.addEventListener('click', () => {
    // Pre-fill with current config
    urlInput.value = coziConfig.url || '';
    
    // Reset any previous status messages
    const statusDiv = document.getElementById('coziConnectionStatus');
    if (statusDiv) {
      statusDiv.style.display = 'none';
    }
    
    bsModal.show();
  });
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    if (!url) {
      showCoziStatus('Please enter a valid Cozi URL', 'error');
      return;
    }
    
    showCoziStatus('Testing connection...', 'info');
    
    try {
      // Test connection first
      const success = await testCoziConnection(url, true); // Always use proxy for initial test
      
      if (success) {
        // Save configuration in both places
        coziConfig.url = url;
        coziConfig.isConnected = true;
        localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
        localStorage.setItem('coziUrl', url);
        
        // Enable buttons
        const configBtn = document.getElementById('configureCoziBtn');
        const refreshBtn = document.getElementById('refreshCoziBtn');
        if (configBtn) configBtn.disabled = false;
        if (refreshBtn) refreshBtn.disabled = false;
        
        showCoziStatus('Connection successful! Syncing events...', 'success');
        
        // Sync events
        await syncCoziEvents();
        
        // Close modal after short delay
        setTimeout(() => {
          bsModal.hide();
        }, 1500);
      }
    } catch (error) {
      console.error('Cozi setup failed:', error);
      showCoziStatus(`Setup failed: ${error.message}. Please check your URL and try again.`, 'error');
    }
  });
  
  // Test connection button
  testBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showCoziStatus('Please enter a valid Cozi URL', 'error');
      return;
    }
    
    // Get proxy checkbox value
    const useProxyCheckbox = document.getElementById('useProxyCheckbox');
    const useProxy = useProxyCheckbox ? useProxyCheckbox.checked : coziConfig.useProxy;
    
    showCoziStatus('Testing connection...', 'info');
    const success = await testCoziConnection(url, useProxy);
    if (success) {
      showCoziStatus('Connection successful!', 'success');
    }
  });
  
  // Reset form and status when modal is hidden
  modal.addEventListener('hidden.bs.modal', () => {
    form.reset();
    const statusDiv = document.getElementById('coziConnectionStatus');
    if (statusDiv) {
      statusDiv.style.display = 'none';
    }
  });
}

// Display connection status in modal
function showCoziStatus(message, type = 'info') {
  const statusDiv = document.getElementById('coziConnectionStatus');
  if (!statusDiv) {
    // Create status div if it doesn't exist
    const newStatusDiv = document.createElement('div');
    newStatusDiv.id = 'coziConnectionStatus';
    document.getElementById('coziConfigForm').insertBefore(
      newStatusDiv,
      document.querySelector('.d-grid')
    );
    return showCoziStatus(message, type); // Retry now that div exists
  }
  
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.style.display = 'block';
}

// Test connection to Cozi calendar
async function testCoziConnection(url, useProxy = true) {
  try {
    if (!url) {
      throw new Error('No URL provided');
    }

    if (isNetlifyProduction()) {
      // Use Netlify function in production
      const params = new URLSearchParams({ url });
      const response = await fetch(`/.netlify/functions/fetch-cozi?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to connect: ${response.status} - ${errorText}`);
      }
      
      const events = await response.json();
      return Array.isArray(events) && events.length > 0;
    } else {
      // In development, always try with proxy first
      let icsData;
      let proxyError;
      
      // Try each proxy in sequence
      for (const proxy of corsProxies) {
        try {
          icsData = await fetchCalendarData(url, true, proxy);
          if (icsData) break;
        } catch (err) {
          proxyError = err;
          continue;
        }
      }
      
      // If all proxies failed and useProxy is false, try direct
      if (!icsData && !useProxy) {
        try {
          icsData = await fetchCalendarData(url, false);
        } catch (err) {
          throw proxyError || err; // Throw the proxy error if we have one
        }
      }
      
      if (!icsData) {
        throw new Error('Could not fetch calendar data');
      }
      
      const events = parseICalendarData(icsData);
      return events.length > 0;
    }
  } catch (error) {
    console.error('Cozi connection test failed:', error);
    showCoziStatus(`Connection failed: ${error.message}`, 'error');
    throw error; // Re-throw to handle in caller
  }
}

// Fetch calendar data with optional proxy
async function fetchCalendarData(url, useProxy = true, specificProxy = null) {
  let fetchUrl = url;
  
  if (useProxy) {
    const proxy = specificProxy || corsProxies[0];
    fetchUrl = `${proxy}${encodeURIComponent(url)}`;
  }
  
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.text();
}

// Check if we're running in Netlify production environment
function isNetlifyProduction() {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         window.location.protocol !== 'file:' &&
         window.location.host.includes('netlify.app');
}

// Parse iCalendar data into event objects
function parseICalendarData(icsData) {
  const events = [];
  const lines = icsData.split('\n');
  let currentEvent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.uid) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      // Handle line continuations
      let fullLine = line;
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(' ')) {
        i++;
        fullLine += lines[i].trim();
      }
      
      // Parse event property
      const colonIndex = fullLine.indexOf(':');
      if (colonIndex > 0) {
        const key = fullLine.substring(0, colonIndex).split(';')[0]; // Ignore parameters
        const value = fullLine.substring(colonIndex + 1);
        
        switch (key) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value;
            break;
          case 'LOCATION':
            currentEvent.location = value;
            break;
          case 'DTSTART':
            currentEvent.start = parseICalDate(value);
            currentEvent.allDay = !value.includes('T'); // If no time component, it's all day
            break;
          case 'DTEND':
            currentEvent.end = parseICalDate(value);
            break;
          case 'CATEGORIES':
            currentEvent.categories = value.split(',').map(cat => cat.trim());
            break;
        }
      }
    }
  }
  
  return events;
}

// Parse iCal date format
function parseICalDate(dateStr) {
  if (!dateStr) return null;
  
  // Remove any timezone identifier
  dateStr = dateStr.replace(/Z$/, '');
  
  // Format: YYYYMMDD or YYYYMMDDTHHMMSS
  if (dateStr.includes('T')) {
    // With time component
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2)) - 1; // JS months are 0-11
    const day = parseInt(dateStr.substr(6, 2));
    const hour = parseInt(dateStr.substr(9, 2));
    const minute = parseInt(dateStr.substr(11, 2));
    const second = parseInt(dateStr.substr(13, 2));
    
    return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
  } else {
    // Date only
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2)) - 1;
    const day = parseInt(dateStr.substr(6, 2));
    
    return new Date(Date.UTC(year, month, day)).toISOString();
  }
}

// Update calendar with Cozi events
function updateCalendarWithCoziEvents(events) {
  if (!window.calendar) return;
  
  // Remove existing Cozi events
  const existingEvents = window.calendar.getEvents();
  existingEvents.forEach(event => {
    if (event.source && event.source.id === 'cozi') {
      event.remove();
    }
  });
  
  // Only add if "showCozi" checkbox is checked
  const showCozi = document.getElementById('showCozi') ? 
                 document.getElementById('showCozi').checked : true;
  
  if (!showCozi) return;
  
  // Filter by person if needed
  const filterPerson = document.getElementById('filterByPerson') ?
                     document.getElementById('filterByPerson').value : 'all';
  
  const filteredEvents = events.filter(event => {
    if (filterPerson === 'all') return true;
    if (filterPerson === 'Parents' && !event.assignee) return true;
    return event.assignee === filterPerson;
  });
  
  // Add filtered events to calendar
  filteredEvents.forEach(event => {
    window.calendar.addEvent({
      id: event.uid || `cozi-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      classNames: ['cozi-event'],
      extendedProps: {
        description: event.description,
        location: event.location,
        source: 'cozi',
        assignee: event.assignee
      }
    });
  });
  
  window.calendar.render();
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Handle close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}

// Get cached Cozi events
function getCoziEvents() {
  return coziEventsCache.length > 0 ? coziEventsCache : JSON.parse(localStorage.getItem('coziEvents') || '[]');
}

// Show error notification
function showErrorNotification(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}

// Export functions for external use
window.syncCoziEvents = syncCoziEvents;
window.getCoziEvents = getCoziEvents;