/**
 * Cozi Calendar Integration
 * Handles fetching and processing data from Cozi Calendar
 */

// Configuration and state
let coziConfig = {
  url: 'https://rest.cozi.com/api/ext/1103/b4aed401-01a9-45e7-8082-4d88db3fa35a/icalendar/feed/feed.ics',
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
  if (savedConfig) {
    try {
      coziConfig = { ...coziConfig, ...JSON.parse(savedConfig) };
      if (coziConfig.url) {
        console.log('Cozi configuration loaded');
        // Auto-sync if we have a URL
        syncCoziEvents();
      }
    } catch (err) {
      console.error('Error loading Cozi config:', err);
    }
  }
  
  // Set up refresh button
  const refreshBtn = document.getElementById('refreshCoziBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => syncCoziEvents());
  }
}

// Setup Cozi configuration modal
function setupCoziModal() {
  const modal = document.getElementById('coziConfigModal');
  const btn = document.getElementById('coziConfigBtn');
  const closeBtn = modal.querySelector('.modal-close-btn');
  const form = document.getElementById('coziConfigForm');
  const urlInput = document.getElementById('coziUrl');
  const testBtn = document.getElementById('testCoziConnection');
  const statusDiv = document.getElementById('coziConnectionStatus');
  
  // Show modal when clicking the Cozi button
  btn.addEventListener('click', () => {
    // Pre-fill with current config
    urlInput.value = coziConfig.url || '';
    modal.style.display = 'block';
    
    // Add proxy checkbox if it doesn't exist
    if (!document.getElementById('useProxyCheckbox')) {
      const proxyCheckboxContainer = document.createElement('div');
      proxyCheckboxContainer.className = 'form-group';
      proxyCheckboxContainer.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="useProxyCheckbox" ${coziConfig.useProxy ? 'checked' : ''}>
          <span class="checkmark"></span>
          Use CORS proxy (try this if getting 403 errors)
        </label>
      `;
      form.insertBefore(proxyCheckboxContainer, form.querySelector('.modal-actions'));
    } else {
      document.getElementById('useProxyCheckbox').checked = coziConfig.useProxy;
    }
  });
  
  // Close modal when clicking the X
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    if (!url) {
      showCoziStatus('Please enter a valid Cozi URL', 'error');
      return;
    }
    
    // Get proxy checkbox value
    const useProxyCheckbox = document.getElementById('useProxyCheckbox');
    const useProxy = useProxyCheckbox ? useProxyCheckbox.checked : coziConfig.useProxy;
    
    showCoziStatus('Saving configuration...', 'info');
    
    // Save configuration
    coziConfig.url = url;
    coziConfig.useProxy = useProxy;
    localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
    
    // Test connection and sync events
    const success = await testCoziConnection(url, useProxy);
    if (success) {
      showCoziStatus('Cozi configuration saved and connected successfully!', 'success');
      coziConfig.isConnected = true;
      syncCoziEvents();
      
      // Close modal after short delay
      setTimeout(() => {
        modal.style.display = 'none';
      }, 1500);
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
}

// Display connection status in modal
function showCoziStatus(message, type = 'info') {
  const statusDiv = document.getElementById('coziConnectionStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `connection-status ${type}`;
    statusDiv.style.display = 'block';
  }
}

// Test connection to Cozi calendar
async function testCoziConnection(url, useProxy = coziConfig.useProxy) {
  try {
    if (isNetlifyProduction()) {
      // Use Netlify function in production
      const params = new URLSearchParams({ url });
      const response = await fetch(`/.netlify/functions/fetch-cozi?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status}`);
      }
      
      const events = await response.json();
      return Array.isArray(events);
    } else {
      // Try direct fetch with optional proxy in development
      const icsData = await fetchCalendarData(url, useProxy);
      const events = parseICalendarData(icsData);
      return events.length > 0;
    }
  } catch (error) {
    console.error('Cozi connection test failed:', error);
    showCoziStatus(`Connection failed: ${error.message}. Try enabling the proxy option if you're getting a 403 error.`, 'error');
    return false;
  }
}

// Sync events from Cozi calendar
async function syncCoziEvents() {
  if (!coziConfig.url) {
    console.error('No Cozi URL configured');
    return [];
  }
  
  const refreshBtn = document.getElementById('refreshCoziBtn');
  if (refreshBtn) {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
    refreshBtn.disabled = true;
  }
  
  try {
    let events = [];
    
    if (isNetlifyProduction()) {
      // In production, use the Netlify Function
      const params = new URLSearchParams({ url: coziConfig.url });
      const response = await fetch(`/.netlify/functions/fetch-cozi?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`);
      }
      
      events = await response.json();
    } else {
      // In development, use direct fetch with optional proxy
      const icsData = await fetchCalendarData(coziConfig.url, coziConfig.useProxy);
      events = parseICalendarData(icsData);
    }
    
    // Process events to derive assignees
    const processedEvents = events.map(event => {
      // Extract child name from event title or description if available
      const nameMatch = (event.summary && event.summary.match(/(Ember|Lilly|Levi|Eva|Elijah|Kallie)[\s\-:]/i)) ||
                       (event.description && event.description.match(/(Ember|Lilly|Levi|Eva|Elijah|Kallie)[\s\-:]/i));
      
      return {
        ...event,
        assignee: nameMatch ? nameMatch[1] : null,
        title: event.summary || 'Untitled Event',
        start: event.start || new Date(),
        end: event.end || null,
        allDay: event.allDay || false,
        description: event.description || '',
        location: event.location || ''
      };
    });
    
    // Update cache and last sync time
    coziEventsCache = processedEvents;
    coziConfig.lastSync = new Date().toISOString();
    coziConfig.isConnected = true;
    
    // Save updated config and events to localStorage for persistence
    localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
    localStorage.setItem('coziEvents', JSON.stringify(processedEvents));
    
    // Update calendar
    if (window.calendar) {
      updateCalendarWithCoziEvents(processedEvents);
    }
    
    // Update charts if function exists
    if (window.updateCoziEventsChart) {
      window.updateCoziEventsChart(processedEvents);
    }
    
    showNotification(`Synced ${processedEvents.length} events from Cozi Calendar`, 'success');
    console.log(`Synced ${processedEvents.length} events from Cozi`);
    
    return processedEvents;
  } catch (error) {
    console.error('Error syncing Cozi events:', error);
    showNotification(`Failed to sync Cozi events: ${error.message}. Try enabling the proxy option in settings.`, 'error');
    return [];
  } finally {
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Cozi';
      refreshBtn.disabled = false;
    }
  }
}

// Fetch calendar data with multiple proxy fallbacks
async function fetchCalendarData(url, useProxy = true) {
  if (!useProxy) {
    // Try direct fetch first if proxy not required
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/calendar',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      // If direct fetch fails with 403, we'll try proxies
      if (response.status === 403) {
        console.log('Direct fetch got 403, trying proxies');
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      console.warn('Direct fetch failed:', error);
      // Continue to try proxies
    }
  }
  
  // Try each proxy in sequence
  for (const proxy of corsProxies) {
    try {
      console.log(`Trying proxy: ${proxy}`);
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/calendar',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Proxy fetch failed: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
      // Try next proxy
    }
  }
  
  // If all proxies fail
  throw new Error('Failed to fetch calendar data with all available methods');
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