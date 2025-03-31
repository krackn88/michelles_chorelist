/**
 * Family Chore Manager - Main Application Script
 * Initializes and coordinates all application modules
 */

const app = {
  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners();
    this.initializeModules();
    this.applyUserSettings();
    this.updateCurrentDate();
    this.setupAddChoreButton();
    this.initializeDadFriendlyView();
  },

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        window.utils.setTheme(theme);
        window.settingsStorage.updateSetting('theme', theme);
      });
    }

    // Add chore button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-add-chore') || e.target.closest('.btn-add-chore')) {
        this.openAddChoreModal();
      }
    });

    // Data export
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', this.exportData.bind(this));
    }

    // Data import
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
      importDataBtn.addEventListener('click', this.importData.bind(this));
    }

    // Clear data
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', this.confirmClearData.bind(this));
    }

    // Configure Cozi button
    const configureCoziBtn = document.getElementById('configureCoziBtn');
    if (configureCoziBtn) {
      configureCoziBtn.addEventListener('click', () => {
        const modal = document.getElementById('coziConfigModal');
        if (modal && typeof bootstrap !== 'undefined') {
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        }
      });
    }

    // Default view setting
    const defaultViewSelect = document.getElementById('defaultViewSelect');
    if (defaultViewSelect) {
      defaultViewSelect.addEventListener('change', () => {
        const defaultView = defaultViewSelect.value;
        window.settingsStorage.updateSetting('defaultView', defaultView);
      });
    }
  },

  /**
   * Initialize all application modules
   */
  initializeModules() {
    // Initialize notification container
    this.initializeNotificationContainer();
    
    // All other modules should initialize themselves when loaded
    // We don't need to manually initialize them here since:
    // - Navigation is initialized in navigation.js
    // - Cozi integration is initialized in cozi-integration.js 
    // - Chore manager and other modules also self-initialize
  },

  /**
   * Apply user settings from storage
   */
  applyUserSettings() {
    const settings = window.settingsStorage.getSettings();
    
    // Apply theme
    if (settings.theme) {
      window.utils.setTheme(settings.theme);
      
      const themeSelect = document.getElementById('themeSelect');
      if (themeSelect) {
        themeSelect.value = settings.theme;
      }
    }
    
    // Apply default view
    if (settings.defaultView) {
      const defaultViewSelect = document.getElementById('defaultViewSelect');
      if (defaultViewSelect) {
        defaultViewSelect.value = settings.defaultView;
      }
      
      // Navigate to default view if no hash in URL
      if (!window.location.hash && window.navigation) {
        window.navigation.navigateTo(settings.defaultView, false);
      }
    }
  },

  /**
   * Initialize notification container if it doesn't exist
   */
  initializeNotificationContainer() {
    let container = document.getElementById('notificationContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  },

  /**
   * Update the current date display in the dashboard
   */
  updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
  },

  /**
   * Set up the main "Add Chore" button in the top navigation
   */
  setupAddChoreButton() {
    const addChoreButton = document.getElementById('addChoreButton');
    if (addChoreButton) {
      addChoreButton.addEventListener('click', this.openAddChoreModal.bind(this));
    }
  },

  /**
   * Open the modal to add a new chore
   */
  openAddChoreModal() {
    const modal = document.getElementById('addChoreModal');
    if (modal && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  },

  /**
   * Export application data to a JSON file
   */
  exportData() {
    const data = {
      appVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      storage: window.storage.exportData()
    };
    
    window.utils.exportData(data);
    window.utils.showNotification('Data exported successfully', 'success');
  },

  /**
   * Import application data from a JSON file
   */
  async importData() {
    try {
      const data = await window.utils.importData();
      
      if (!data || !data.storage) {
        throw new Error('Invalid data format');
      }
      
      const success = window.storage.importData(data.storage);
      
      if (success) {
        // Reload data in all managers
        if (window.choreManager) {
          window.choreManager.loadInitialData();
          window.choreManager.renderChoresList();
          window.choreManager.renderDashboard();
        }
        
        if (window.familyManager) {
          window.familyManager.loadFamilyMembers();
          window.familyManager.renderFamilyMembers();
          window.familyManager.populateFamilyMemberDropdowns();
        }
        
        window.utils.showNotification('Data imported successfully', 'success');
      } else {
        throw new Error('Failed to import data');
      }
    } catch (error) {
      window.utils.showNotification(`Import failed: ${error.message}`, 'error');
    }
  },

  /**
   * Confirm before clearing all application data
   */
  confirmClearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      window.storage.clear();
      
      // Reload data in all managers
      if (window.choreManager) {
        window.choreManager.loadInitialData();
        window.choreManager.renderChoresList();
        window.choreManager.renderDashboard();
      }
      
      if (window.familyManager) {
        window.familyManager.loadFamilyMembers();
        window.familyManager.renderFamilyMembers();
        window.familyManager.populateFamilyMemberDropdowns();
      }
      
      window.utils.showNotification('All data has been cleared', 'info');
    }
  },

  /**
   * Initialize dad-friendly view
   */
  initializeDadFriendlyView() {
    // Implementation of initializeDadFriendlyView method
  }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Initialize dad-friendly view
dadFriendlyView.init();

// Add dad-friendly view to navigation
const dadFriendlyViewLink = document.createElement('a');
dadFriendlyViewLink.href = '#';
dadFriendlyViewLink.className = 'nav-link';
dadFriendlyViewLink.innerHTML = '<i class="fas fa-calendar-week"></i> Weekly Schedule';
dadFriendlyViewLink.onclick = (e) => {
  e.preventDefault();
  showView('dad-friendly-view');
  dadFriendlyView.renderWeeklyView();
};
document.querySelector('.nav-links').appendChild(dadFriendlyViewLink);
