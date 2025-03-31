/**
 * Dad-Friendly Weekly View
 * Combines chores and Cozi events in an easy-to-read format
 */

const dadFriendlyView = {
  /**
   * Initialize the dad-friendly view
   */
  init() {
    this.setupEventListeners();
    this.renderWeeklyView();
  },

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Print button
    const printBtn = document.getElementById('printWeeklyView');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printWeeklyView());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshWeeklyView');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.renderWeeklyView());
    }
  },

  /**
   * Render the weekly view
   */
  renderWeeklyView() {
    const container = document.getElementById('dadFriendlyContainer');
    if (!container) return;

    // Get current week's dates
    const weekDates = this.getWeekDates();
    
    // Get chores and Cozi events
    const chores = JSON.parse(localStorage.getItem('chores') || '[]');
    const coziEvents = JSON.parse(localStorage.getItem('coziEvents') || '[]');
    const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');

    // Create the view
    let html = `
      <div class="dad-friendly-header">
        <h2>Weekly Schedule (${this.formatDateRange(weekDates[0], weekDates[6])})</h2>
        <div class="view-controls">
          <button id="printWeeklyView" class="btn btn-primary">
            <i class="fas fa-print"></i> Print View
          </button>
          <button id="refreshWeeklyView" class="btn btn-secondary">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>
    `;

    // Create table for each child
    familyMembers.forEach(member => {
      html += this.createChildSchedule(member, weekDates, chores, coziEvents);
    });

    container.innerHTML = html;
    this.setupEventListeners();
  },

  /**
   * Create schedule for a specific child
   */
  createChildSchedule(member, weekDates, chores, coziEvents) {
    let html = `
      <div class="child-schedule">
        <h3>${member.name}'s Schedule</h3>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Chores</th>
              <th>Events</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayChores = this.getChoresForDate(chores, member.id, date);
      const dayEvents = this.getEventsForDate(coziEvents, member.name, date);
      const status = this.getDayStatus(dayChores);

      html += `
        <tr class="${status}">
          <td>${this.formatDate(date)}</td>
          <td>
            <ul class="chores-list">
              ${dayChores.map(chore => `
                <li class="${chore.completed ? 'completed' : ''}">
                  ${chore.title}
                  ${chore.completed ? ' ✓' : ''}
                </li>
              `).join('')}
            </ul>
          </td>
          <td>
            <ul class="events-list">
              ${dayEvents.map(event => `
                <li>
                  ${event.title}
                  ${event.location ? `<br><small>${event.location}</small>` : ''}
                </li>
              `).join('')}
            </ul>
          </td>
          <td>
            <div class="status-indicator">
              ${this.getStatusIcon(status)}
              ${status}
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  },

  /**
   * Get chores for a specific date and child
   */
  getChoresForDate(chores, childId, date) {
    const dateStr = date.toISOString().split('T')[0];
    return chores.filter(chore => {
      if (chore.assignedTo !== childId) return false;
      
      if (chore.dueDate) {
        return chore.dueDate === dateStr;
      }
      
      // Handle recurring chores
      const dayOfWeek = date.getDay();
      if (chore.frequency === 'daily') return true;
      if (chore.frequency === 'weekly' && chore.days.includes(dayOfWeek)) return true;
      if (chore.frequency === 'monthly' && chore.days.includes(date.getDate())) return true;
      
      return false;
    });
  },

  /**
   * Get Cozi events for a specific date and child
   */
  getEventsForDate(events, childName, date) {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr && 
             event.assignee && 
             event.assignee.toLowerCase() === childName.toLowerCase();
    });
  },

  /**
   * Get status for a day's chores
   */
  getDayStatus(chores) {
    if (chores.length === 0) return 'no-chores';
    const completed = chores.filter(chore => chore.completed).length;
    if (completed === 0) return 'not-started';
    if (completed < chores.length) return 'in-progress';
    return 'completed';
  },

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    const icons = {
      'no-chores': '<i class="fas fa-minus-circle"></i>',
      'not-started': '<i class="fas fa-times-circle"></i>',
      'in-progress': '<i class="fas fa-clock"></i>',
      'completed': '<i class="fas fa-check-circle"></i>'
    };
    return icons[status] || '';
  },

  /**
   * Get dates for current week
   */
  getWeekDates() {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  },

  /**
   * Format date range
   */
  formatDateRange(start, end) {
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  },

  /**
   * Format date
   */
  formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  },

  /**
   * Print the weekly view
   */
  printWeeklyView() {
    const container = document.getElementById('dadFriendlyContainer');
    if (!container) return;

    // Create print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #dadFriendlyContainer, #dadFriendlyContainer * {
          visibility: visible;
        }
        #dadFriendlyContainer {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .view-controls {
          display: none;
        }
        .schedule-table {
          page-break-inside: auto;
        }
        .child-schedule {
          page-break-before: always;
        }
      }
    `;
    document.head.appendChild(style);

    // Print
    window.print();

    // Remove print styles
    document.head.removeChild(style);
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  dadFriendlyView.init();
}); 