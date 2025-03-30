/**
 * Cozi Calendar Integration
 * Handles fetching and processing data from Cozi Calendar
 */

// Configuration and state
let coziConfig = {
  url: 'https://rest.cozi.com/api/ext/1103/b4aed401-01a9-45e7-8082-4d88db3fa35a/icalendar/feed/feed.ics',
  isConnected: false,
  lastSync: null
};

// Cache for Cozi events
let coziEventsCache = [];

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
}

// Setup Cozi configuration modal
function setupCoziModal() {
  const modal = document.getElementById('coziConfigModal');
  const btn = document.getElementById('coziConfigBtn');
  const closeBtn = modal.querySelector('.close-modal');
  const form = document.getElementById('coziConfigForm');
  const urlInput = document.getElementById('coziUrl');
  const testBtn = document.getElementById('testCoziConnection');
  const statusDiv = document.getElementById('coziConnectionStatus');
  
  // Show modal when clicking the Cozi button
  btn.addEventListener('click', () => {
    // Pre-fill with current config
    urlInput.value = coziConfig.url || '';
    modal.style.display = 'block';
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
    
    showCoziStatus('Saving configuration...', 'info');
    
    // Save configuration
    coziConfig.url = url;
    localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
    
    // Test connection and sync events
    const success = await testCoziConnection(url);
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
    
    showCoziStatus('Testing connection...', 'info');
    const success = await testCoziConnection(url);
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
async function testCoziConnection(url) {
  try {
    const params = new URLSearchParams({ url });
    const response = await fetch(`/.netlify/functions/fetch-cozi?${params}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Failed to connect: ${response.status}`);
    }
    
    const events = await response.json();
    return Array.isArray(events);
  } catch (error) {
    console.error('Cozi connection test failed:', error);
    showCoziStatus(`Connection failed: ${error.message}`, 'error');
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
    const params = new URLSearchParams({ url: coziConfig.url });
    const response = await fetch(`/.netlify/functions/fetch-cozi?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const events = await response.json();
    
    // Process events to derive assignees
    const processedEvents = events.map(event => {
      const nameMatch = event.summary.match(/(Ember|Lilly|Levi|Eva|Elijah|Kallie)[\s\-:]/i) ||
                       (event.description && event.description.match(/(Ember|Lilly|Levi|Eva|Elijah|Kallie)[\s\-:]/i));
      
      return {
        ...event,
        assignee: nameMatch ? nameMatch[1] : null,
        title: event.summary
      };
    });
    
    // Update cache and last sync time
    coziEventsCache = processedEvents;
    coziConfig.lastSync = new Date().toISOString();
    coziConfig.isConnected = true;
    
    // Save updated config
    localStorage.setItem('coziConfig', JSON.stringify(coziConfig));
    
    // Update UI
    if (window.updateWeeklyAgenda) {
      window.updateWeeklyAgenda(processedEvents);
    }
    
    if (window.updateCoziEventsChart) {
      window.updateCoziEventsChart(processedEvents);
    }
    
    console.log(`Synced ${processedEvents.length} events from Cozi`);
    return processedEvents;
  } catch (error) {
    console.error('Error syncing Cozi events:', error);
    showErrorNotification(`Failed to sync Cozi events: ${error.message}`);
    return [];
  } finally {
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Cozi';
      refreshBtn.disabled = false;
    }
  }
}

// Get cached Cozi events
function getCoziEvents() {
  return coziEventsCache;
}

// Show error notification
function showErrorNotification(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-notification';
    errorElement.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'error-close-btn';
    closeBtn.addEventListener('click', () => {
      errorElement.remove();
    });
    
    errorElement.appendChild(closeBtn);
    errorContainer.appendChild(errorElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode === errorContainer) {
        errorElement.remove();
      }
    }, 5000);
  }
}

// Expose functions to global scope
window.coziIntegration = {
  syncCoziEvents,
  getCoziEvents,
  getConfig: () => coziConfig
};