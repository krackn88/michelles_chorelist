/**
 * calendar.js - Professional Calendar Integration for Family Chore Manager
 * Handles calendar rendering, multiple views (day, week, month), and data integration 
 * from both chore system and Cozi calendar.
 */

const calendarManager = {
  /**
   * Initialize the calendar
   */
  init() {
    this.setupEventListeners();
    this.initializeCalendar();
  },

  /**
   * Set up event listeners for calendar actions
   */
  setupEventListeners() {
    // Refresh calendar button
    const refreshCalendarBtn = document.getElementById('refreshCalendarBtn');
    if (refreshCalendarBtn) {
      refreshCalendarBtn.addEventListener('click', this.refreshCalendar.bind(this));
    }
  },

  /**
   * Initialize the FullCalendar instance
   */
  initializeCalendar() {
    const calendarEl = document.getElementById('familyCalendar');
    if (!calendarEl) return;
    
    // Get stored Cozi events if available
    const coziEvents = window.localStorage.getItem('fcm_cozi_events');
    const parsedCoziEvents = coziEvents ? JSON.parse(coziEvents) : [];
    
    // Initialize tooltip template
    const tooltipTemplate = document.getElementById('eventTooltipTemplate');
    
    // FullCalendar options
    const calendarOptions = {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      navLinks: true,
      editable: false,
      dayMaxEvents: true,
      eventSources: [
        {
          events: this.getChoreEvents(),
          color: '#ff9baf', // Pink for chores
          textColor: '#333'
        },
        {
          events: parsedCoziEvents,
          color: '#77dd77', // Green for Cozi events
          textColor: '#333'
        }
      ],
      eventClick: this.handleEventClick.bind(this),
      eventMouseEnter: function(info) {
        if (!tooltipTemplate) return;
        
        // Create tooltip instance
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        tooltip.id = 'active-calendar-tooltip';
        
        // Clone tooltip content from template
        const tooltipContent = tooltipTemplate.querySelector('.event-tooltip').cloneNode(true);
        
        // Populate tooltip content
        const titleEl = tooltipContent.querySelector('.event-tooltip-title');
        const timeEl = tooltipContent.querySelector('.event-tooltip-time');
        const locationEl = tooltipContent.querySelector('.event-tooltip-location');
        const descriptionEl = tooltipContent.querySelector('.event-tooltip-description');
        
        if (titleEl) titleEl.textContent = info.event.title;
        
        // Format time
        if (timeEl) {
          if (info.event.allDay) {
            timeEl.textContent = 'All day';
          } else if (info.event.start) {
            const startTime = info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = info.event.end ? 
              info.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            timeEl.textContent = endTime ? `${startTime} - ${endTime}` : startTime;
          }
        }
        
        // Location
        if (locationEl) {
          const location = info.event.extendedProps.location;
          if (location) {
            locationEl.textContent = location;
            locationEl.style.display = 'block';
          } else {
            locationEl.style.display = 'none';
          }
        }
        
        // Description
        if (descriptionEl) {
          const description = info.event.extendedProps.description;
          if (description) {
            descriptionEl.textContent = description;
            descriptionEl.style.display = 'block';
          } else {
            descriptionEl.style.display = 'none';
          }
        }
        
        tooltip.appendChild(tooltipContent);
        document.body.appendChild(tooltip);
        
        // Position tooltip near the event
        const rect = info.el.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        tooltip.style.top = `${rect.top + scrollTop}px`;
        tooltip.style.left = `${rect.right + scrollLeft + 10}px`;
        
        // Check if tooltip is off-screen on right edge
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
          tooltip.style.left = `${rect.left + scrollLeft - tooltipRect.width - 10}px`;
        }
      },
      eventMouseLeave: function() {
        const activeTooltip = document.getElementById('active-calendar-tooltip');
        if (activeTooltip) {
          activeTooltip.remove();
        }
      }
    };
    
    // Create calendar instance
    this.calendar = new FullCalendar.Calendar(calendarEl, calendarOptions);
    
    // Render the calendar
    this.calendar.render();
  },

  /**
   * Get events from chores data
   * @returns {Array} Array of event objects for FullCalendar
   */
  getChoreEvents() {
    if (!window.choreManager || !window.choreManager.chores) {
      return [];
    }
    
    const choreEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // Process each chore
    window.choreManager.chores.forEach(chore => {
      // If chore has a specific due date, create a single event
      if (chore.dueDate) {
        const dueDate = new Date(chore.dueDate);
        
        // Skip if due date is more than a month ago
        if (dueDate < oneMonthAgo) return;
        
        // Create the event
        const event = {
          id: `chore-${chore.id}`,
          title: chore.title,
          start: dueDate,
          allDay: true,
          className: 'chore-event',
          extendedProps: {
            type: 'chore',
            choreId: chore.id,
            description: chore.description || '',
            points: chore.points || 0
          }
        };
        
        // Add assignee info if available
        if (chore.assignedTo && window.familyManager) {
          const assignedMember = window.familyManager.getMemberById(chore.assignedTo);
          if (assignedMember) {
            event.extendedProps.assignedTo = assignedMember.name;
            event.borderColor = assignedMember.color;
          }
        }
        
        // Check if completed
        if (window.choreManager.isChoreCompletedToday && 
            window.choreManager.isChoreCompletedToday(chore.id)) {
          event.className += ' completed-event';
        }
        
        choreEvents.push(event);
      } 
      // Otherwise create recurring events based on frequency
      else {
        const frequency = chore.frequency || 'daily';
        let recurrenceRule;
        
        switch (frequency) {
          case 'daily':
            recurrenceRule = {
              freq: 'daily',
              interval: 1
            };
            break;
          case 'weekly':
            recurrenceRule = {
              freq: 'weekly',
              interval: 1
            };
            break;
          case 'monthly':
            recurrenceRule = {
              freq: 'monthly',
              interval: 1
            };
            break;
          default:
            recurrenceRule = null;
        }
        
        if (recurrenceRule) {
          const event = {
            id: `chore-${chore.id}`,
            title: chore.title,
            startRecur: today,
            endRecur: oneYearFromNow,
            allDay: true,
            className: 'chore-event recurring-event',
            rrule: recurrenceRule,
            extendedProps: {
              type: 'chore',
              choreId: chore.id,
              description: chore.description || '',
              points: chore.points || 0,
              frequency: frequency
            }
          };
          
          // Add assignee info if available
          if (chore.assignedTo && window.familyManager) {
            const assignedMember = window.familyManager.getMemberById(chore.assignedTo);
            if (assignedMember) {
              event.extendedProps.assignedTo = assignedMember.name;
              event.borderColor = assignedMember.color;
            }
          }
          
          choreEvents.push(event);
        }
      }
    });
    
    return choreEvents;
  },

  /**
   * Handle event click in the calendar
   * @param {Object} info - FullCalendar event info
   */
  handleEventClick(info) {
    const eventType = info.event.extendedProps.type;
    
    if (eventType === 'chore') {
      const choreId = info.event.extendedProps.choreId;
      
      // Open edit modal if it's a chore event
      if (window.choreManager && window.choreManager.openEditChoreModal) {
        window.choreManager.openEditChoreModal(choreId);
      }
    } else if (eventType === 'cozi') {
      // For Cozi events, maybe show a detailed view
      const title = info.event.title;
      const startTime = info.event.start ? 
        info.event.start.toLocaleString() : 'Unknown time';
      const location = info.event.extendedProps.location || 'No location specified';
      const description = info.event.extendedProps.description || 'No description';
      
      alert(`Event: ${title}\nTime: ${startTime}\nLocation: ${location}\n\n${description}`);
    }
  },

  /**
   * Refresh the calendar with updated events
   */
  refreshCalendar() {
    if (!this.calendar) return;
    
    // Remove existing event sources
    this.calendar.getEventSources().forEach(source => source.remove());
    
    // Get stored Cozi events if available
    const coziEvents = window.localStorage.getItem('fcm_cozi_events');
    const parsedCoziEvents = coziEvents ? JSON.parse(coziEvents) : [];
    
    // Add event sources
    this.calendar.addEventSource({
      events: this.getChoreEvents(),
      color: '#ff9baf', // Pink for chores
      textColor: '#333'
    });
    
    this.calendar.addEventSource({
      events: parsedCoziEvents,
      color: '#77dd77', // Green for Cozi events
      textColor: '#333'
    });
    
    window.utils.showNotification('Calendar refreshed', 'success');
  },

  /**
   * Update the calendar with Cozi events
   * @param {Array} events - Array of calendar events
   */
  updateWithCoziEvents(events) {
    if (!this.calendar) return;
    
    // Find and remove Cozi event source
    this.calendar.getEventSources().forEach(source => {
      const sourceEvents = source.fetchEvents();
      if (sourceEvents && sourceEvents.length > 0 && 
          sourceEvents[0].extendedProps && sourceEvents[0].extendedProps.type === 'cozi') {
        source.remove();
      }
    });
    
    // Add new Cozi events
    this.calendar.addEventSource({
      events: events,
      color: '#77dd77', // Green for Cozi events
      textColor: '#333'
    });
  }
};

// Initialize calendar manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.calendarManager = calendarManager;
  calendarManager.init();
}); 