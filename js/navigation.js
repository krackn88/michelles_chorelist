/**
 * Family Chore Manager Navigation System
 * Handles section switching, mobile responsive menu, and URL hash navigation
 */

window.navigation = {
  /**
   * Initialize the navigation system
   */
  init() {
    this.setupEventListeners();
    this.handleWindowHash();
    
    // Listen for window hash changes
    window.addEventListener('hashchange', this.handleWindowHash.bind(this));
    
    // Listen for screen resize to adjust the navigation accordingly
    window.addEventListener('resize', this.handleScreenResize.bind(this));
    
    // Initial screen size check
    this.handleScreenResize();
  },
  
  /**
   * Set up all navigation event listeners
   */
  setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const section = link.getAttribute('data-section');
        if (section) {
          e.preventDefault();
          this.switchSection(section);
        }
      });
    });
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }
    
    // Listen for custom events from other modules
    document.addEventListener('sectionChange', (e) => {
      if (e.detail && e.detail.section) {
        this.switchSection(e.detail.section);
      }
    });
  },
  
  /**
   * Handle window hash for direct navigation
   */
  handleWindowHash() {
    if (window.location.hash) {
      const section = window.location.hash.substring(1);
      this.switchSection(section);
    }
  },
  
  /**
   * Switch to the specified section
   * @param {string} sectionId - ID of the section to display
   */
  switchSection(sectionId) {
    if (!sectionId) return;
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      // Update the page title
      const pageTitle = document.getElementById('currentPageTitle');
      if (pageTitle) {
        pageTitle.textContent = this.getTitleFromSection(sectionId);
      }
      
      // Update active state in navigation
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      
      // Update URL hash without scrolling
      if (window.location.hash !== `#${sectionId}`) {
        history.pushState(null, null, `#${sectionId}`);
      }
      
      // Trigger section-specific initialization if needed
      this.triggerSectionInit(sectionId);
    }
  },
  
  /**
   * Get a human-readable title from section ID
   * @param {string} sectionId - ID of the section
   * @returns {string} Human-readable title
   */
  getTitleFromSection(sectionId) {
    const titles = {
      'dashboard': 'Dashboard',
      'chores': 'Chores',
      'calendar': 'Calendar',
      'family': 'Family',
      'reports': 'Reports',
      'settings': 'Settings'
    };
    
    return titles[sectionId] || 'Dashboard';
  },
  
  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },
  
  /**
   * Handle screen resize for responsive behavior
   */
  handleScreenResize() {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.querySelector('.sidebar');
    
    if (isMobile) {
      // Ensure sidebar is closed on mobile by default
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
      document.body.classList.add('mobile-layout');
    } else {
      // Ensure sidebar is visible on desktop
      document.body.classList.remove('mobile-layout');
    }
  },
  
  /**
   * Trigger section-specific initialization
   * @param {string} sectionId - ID of the section
   */
  triggerSectionInit(sectionId) {
    // Initialize or refresh section-specific content
    switch (sectionId) {
      case 'calendar':
        if (window.calendarManager && typeof window.calendarManager.initCalendar === 'function') {
          window.calendarManager.initCalendar();
        }
        break;
        
      case 'reports':
        if (window.charts && typeof window.charts.refreshCharts === 'function') {
          window.charts.refreshCharts();
        }
        break;
        
      case 'dashboard':
        if (window.choreManager && typeof window.choreManager.refreshDashboard === 'function') {
          window.choreManager.refreshDashboard();
        }
        break;
        
      default:
        // No special initialization needed
        break;
    }
  },
  
  /**
   * Navigate to a section programmatically
   * @param {string} sectionId - ID of the section to navigate to
   * @param {boolean} [addToHistory=true] - Whether to add this navigation to browser history
   */
  navigateTo(sectionId, addToHistory = true) {
    if (addToHistory) {
      window.location.hash = sectionId;
    } else {
      this.switchSection(sectionId);
    }
  }
};

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigation.init();
});

// Add theme switcher functionality
const themeSelector = document.getElementById('themeSelector');
if (themeSelector) {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeSelector.value = 'dark';
      applyTheme('dark');
    }
  }
  
  // Theme change event
  themeSelector.addEventListener('change', function() {
    const theme = this.value;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  });
}

// Apply theme based on selection
function applyTheme(theme) {
  const body = document.body;
  body.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'light') {
    body.classList.add('theme-light');
  } else if (theme === 'dark') {
    body.classList.add('theme-dark');
  } else if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-light');
    }
  }
}

// Default child selection
const defaultChildSelector = document.getElementById('defaultChild');
if (defaultChildSelector) {
  // Load saved default child
  const savedDefaultChild = localStorage.getItem('defaultChild');
  if (savedDefaultChild) {
    defaultChildSelector.value = savedDefaultChild;
  }
  
  // Default child change event
  document.getElementById('userPreferencesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const defaultChild = defaultChildSelector.value;
    localStorage.setItem('defaultChild', defaultChild);
    
    // Update kid selector if a default is set
    if (defaultChild) {
      const kidSelector = document.getElementById('kidSelector');
      if (kidSelector) {
        kidSelector.value = defaultChild;
        // Trigger change event to update UI
        const event = new Event('change');
        kidSelector.dispatchEvent(event);
      }
    }
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = 'Preferences saved successfully!';
    this.appendChild(successMsg);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      successMsg.remove();
    }, 3000);
  });
}

// Calendar settings form
const calendarSettingsForm = document.getElementById('calendarSettingsForm');
if (calendarSettingsForm) {
  // Load saved Cozi URL
  const savedCoziUrl = localStorage.getItem('coziUrl');
  if (savedCoziUrl) {
    document.getElementById('coziUrlSettings').value = savedCoziUrl;
  }
  
  // Load saved default calendar view
  const savedDefaultView = localStorage.getItem('defaultCalendarView');
  if (savedDefaultView) {
    document.getElementById('defaultCalendarView').value = savedDefaultView;
  }
  
  // Calendar settings form submit
  calendarSettingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Save Cozi URL
    const coziUrl = document.getElementById('coziUrlSettings').value;
    if (coziUrl) {
      localStorage.setItem('coziUrl', coziUrl);
      // Update the Cozi URL input in the modal too
      const coziUrlInput = document.getElementById('coziUrl');
      if (coziUrlInput) {
        coziUrlInput.value = coziUrl;
      }
    }
    
    // Save default calendar view
    const defaultView = document.getElementById('defaultCalendarView').value;
    localStorage.setItem('defaultCalendarView', defaultView);
    
    // Apply default view if we're on the calendar section
    if (document.getElementById('calendar-section').classList.contains('active')) {
      const viewButton = document.getElementById(`calendarView${defaultView.charAt(0).toUpperCase() + defaultView.slice(1)}`);
      if (viewButton) {
        viewButton.click();
      }
    }
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = 'Calendar settings saved successfully!';
    this.appendChild(successMsg);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      successMsg.remove();
    }, 3000);
  });
} 