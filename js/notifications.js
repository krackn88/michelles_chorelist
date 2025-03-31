/**
 * Family Chore Manager Notification System
 * Handles SMS notifications through Verizon's vText service
 */

window.notificationManager = {
  // Default settings
  settings: {
    smsNumber: '16062092345',
    notifyChoresDue: true,
    notifyChoresOverdue: true,
    notifyEvents: true,
    notifyCompletions: true,
    notificationTime: '18:00',
    reminderAdvance: 60 // minutes
  },

  /**
   * Initialize the notification system
   */
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.scheduleNotifications();
  },

  /**
   * Load saved notification settings
   */
  loadSettings() {
    const savedSettings = window.storage.getItem('notificationSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }
    this.populateSettingsForm();
  },

  /**
   * Save notification settings
   */
  saveSettings() {
    const settings = {
      smsNumber: document.getElementById('smsNumber').value,
      notifyChoresDue: document.getElementById('notifyChoresDue').checked,
      notifyChoresOverdue: document.getElementById('notifyChoresOverdue').checked,
      notifyEvents: document.getElementById('notifyEvents').checked,
      notifyCompletions: document.getElementById('notifyCompletions').checked,
      notificationTime: document.getElementById('notificationTime').value,
      reminderAdvance: parseInt(document.getElementById('reminderAdvance').value)
    };

    this.settings = settings;
    window.storage.setItem('notificationSettings', settings);
    this.scheduleNotifications();
    
    window.utils.showNotification('Notification settings saved successfully!', 'success');
  },

  /**
   * Populate the settings form with current values
   */
  populateSettingsForm() {
    document.getElementById('smsNumber').value = this.settings.smsNumber;
    document.getElementById('notifyChoresDue').checked = this.settings.notifyChoresDue;
    document.getElementById('notifyChoresOverdue').checked = this.settings.notifyChoresOverdue;
    document.getElementById('notifyEvents').checked = this.settings.notifyEvents;
    document.getElementById('notifyCompletions').checked = this.settings.notifyCompletions;
    document.getElementById('notificationTime').value = this.settings.notificationTime;
    document.getElementById('reminderAdvance').value = this.settings.reminderAdvance;
  },

  /**
   * Set up event listeners for the notification settings
   */
  setupEventListeners() {
    const saveBtn = document.getElementById('saveNotificationSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    const testBtn = document.getElementById('testNotificationBtn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.sendTestNotification());
    }

    // Listen for chore completions
    document.addEventListener('choreCompleted', (e) => {
      if (this.settings.notifyCompletions) {
        const { chore, completedBy } = e.detail;
        this.sendNotification(`${completedBy} completed the chore: ${chore.title}`);
      }
    });
  },

  /**
   * Schedule daily notifications
   */
  scheduleNotifications() {
    // Clear any existing scheduled notifications
    if (this.dailyNotificationTimeout) {
      clearTimeout(this.dailyNotificationTimeout);
    }

    // Schedule next notification
    const now = new Date();
    const [hours, minutes] = this.settings.notificationTime.split(':');
    let nextNotification = new Date(now);
    nextNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }

    const delay = nextNotification - now;
    this.dailyNotificationTimeout = setTimeout(() => {
      this.sendDailyNotifications();
      this.scheduleNotifications(); // Schedule next day's notifications
    }, delay);
  },

  /**
   * Send daily notifications
   */
  async sendDailyNotifications() {
    if (!this.settings.notifyChoresDue && !this.settings.notifyEvents) return;

    let message = 'Daily Family Update:\n\n';

    // Get today's chores
    if (this.settings.notifyChoresDue) {
      const todayChores = window.choreManager.getTodayChores();
      if (todayChores.length > 0) {
        message += 'Chores Due Today:\n';
        todayChores.forEach(chore => {
          message += `- ${chore.title} (${chore.assignedTo})\n`;
        });
        message += '\n';
      }
    }

    // Get overdue chores
    if (this.settings.notifyChoresOverdue) {
      const overdueChores = window.choreManager.getOverdueChores();
      if (overdueChores.length > 0) {
        message += 'Overdue Chores:\n';
        overdueChores.forEach(chore => {
          message += `- ${chore.title} (${chore.assignedTo})\n`;
        });
        message += '\n';
      }
    }

    // Get today's events
    if (this.settings.notifyEvents) {
      const todayEvents = window.calendarManager.getTodayEvents();
      if (todayEvents.length > 0) {
        message += 'Today\'s Events:\n';
        todayEvents.forEach(event => {
          const time = event.allDay ? 'All Day' : 
            event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          message += `- ${event.title} (${time})\n`;
        });
      }
    }

    if (message !== 'Daily Family Update:\n\n') {
      await this.sendNotification(message);
    }
  },

  /**
   * Send a test notification
   */
  async sendTestNotification() {
    const message = 'This is a test notification from Family Chore Manager. ' +
      'If you received this, your notifications are working correctly!';
    
    try {
      await this.sendNotification(message);
      window.utils.showNotification('Test notification sent successfully!', 'success');
    } catch (error) {
      window.utils.showNotification('Failed to send test notification. Please check your settings.', 'error');
    }
  },

  /**
   * Send an SMS notification through vText
   * @param {string} message - The message to send
   */
  async sendNotification(message) {
    if (!this.settings.smsNumber) return;

    try {
      // Format message for SMS
      function formatMessage(message, type) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        switch(type) {
          case 'chore':
            return `🏠 Family Chore Manager\n\n${message}\n\nSent at ${timestamp}`;
          case 'event':
            return `📅 Family Calendar Alert\n\n${message}\n\nSent at ${timestamp}`;
          case 'daily':
            return `📋 Daily Family Update\n\n${message}\n\nSent at ${timestamp}`;
          default:
            return `📱 Family Alert\n\n${message}\n\nSent at ${timestamp}`;
        }
      }

      // Send notification via Twilio
      async function sendNotification(message, type = 'info') {
        try {
          const formattedMessage = formatMessage(message, type);
          
          // In development, show in UI
          if (process.env.NODE_ENV === 'development') {
            showNotificationInUI(formattedMessage, type);
            return;
          }
          
          // In production, send via Twilio
          const response = await fetch('/.netlify/functions/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: notificationSettings.smsNumber,
              message: formattedMessage
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to send SMS');
          }
          
          console.log('SMS sent successfully');
        } catch (error) {
          console.error('Error sending SMS:', error);
          showNotificationInUI('Failed to send SMS notification', 'error');
        }
      }

      // Show notification in UI (for development)
      function showNotificationInUI(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
          <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
          notification.remove();
        });
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 5000);
      }

      await sendNotification(message);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
};

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.notificationManager.init();
}); 