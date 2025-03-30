/**
 * Weekly Agenda View
 * Displays chores and Cozi events in a weekly calendar format with filtering options
 */

// Global state
let weeklyAgendaState = {
  currentWeekStart: getStartOfWeek(new Date()),
  activeView: 'all', // 'all', 'chores', 'cozi'
  chores: [],
  coziEvents: [],
  familyMembers: []
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initWeeklyAgenda();
});

// Initialize weekly agenda
function initWeeklyAgenda() {
  // Setup week navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const refreshCoziBtn = document.getElementById('refreshCoziBtn');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      navigateWeek(-1);
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      navigateWeek(1);
    });
  }
  
  if (refreshCoziBtn) {
    refreshCoziBtn.addEventListener('click', () => {
      if (window.coziIntegration && window.coziIntegration.syncCoziEvents) {
        window.coziIntegration.syncCoziEvents();
      }
    });
  }
  
  // Setup tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view');
      if (view) {
        setActiveView(view);
      }
    });
  });
  
  // Load initial data
  loadFamilyMembers();
  loadChores();
  
  // If Cozi integration is available, get events
  if (window.coziIntegration && window.coziIntegration.getCoziEvents) {
    updateCoziEvents(window.coziIntegration.getCoziEvents());
  }
  
  // Render initial view
  renderWeeklyAgenda();
}

// Get start of week (Sunday)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  return new Date(d.setDate(d.getDate() - day));
}

// Navigate week (prev/next)
function navigateWeek(direction) {
  const newWeekStart = new Date(weeklyAgendaState.currentWeekStart);
  newWeekStart.setDate(newWeekStart.getDate() + (7 * direction));
  weeklyAgendaState.currentWeekStart = newWeekStart;
  renderWeeklyAgenda();
}

// Set active view type
function setActiveView(view) {
  weeklyAgendaState.activeView = view;
  
  // Update active button UI
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    if (button.getAttribute('data-view') === view) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  renderWeeklyAgenda();
}

// Update Cozi events from integration
function updateCoziEvents(events) {
  weeklyAgendaState.coziEvents = Array.isArray(events) ? events : [];
  renderWeeklyAgenda();
}

// Load family members (children)
function loadFamilyMembers() {
  // Load from localStorage or use defaults
  const savedMembers = localStorage.getItem('familyMembers');
  if (savedMembers) {
    try {
      weeklyAgendaState.familyMembers = JSON.parse(savedMembers);
    } catch (err) {
      console.error('Error loading family members:', err);
      useDefaultFamilyMembers();
    }
  } else {
    useDefaultFamilyMembers();
  }
}

// Set default family members if none are stored
function useDefaultFamilyMembers() {
  weeklyAgendaState.familyMembers = [
    { id: 'ember', name: 'Ember', age: 14, color: '#ff9999' },
    { id: 'lilly', name: 'Lilly', age: 10, color: '#ffcc99' },
    { id: 'levi', name: 'Levi', age: 9, color: '#99ccff' },
    { id: 'eva', name: 'Eva', age: 9, color: '#cc99ff' },
    { id: 'elijah', name: 'Elijah', age: 7, color: '#99ff99' },
    { id: 'kallie', name: 'Kallie', age: 3, color: '#ff99cc' }
  ];
}

// Load chores from storage
function loadChores() {
  // Load from localStorage or use empty array
  const savedChores = localStorage.getItem('chores');
  if (savedChores) {
    try {
      const parsedChores = JSON.parse(savedChores);
      weeklyAgendaState.chores = parsedChores.map(chore => ({
        ...chore,
        dueDate: chore.dueDate ? new Date(chore.dueDate) : null,
        source: 'chore-manager'
      }));
    } catch (err) {
      console.error('Error loading chores:', err);
      weeklyAgendaState.chores = [];
    }
  } else {
    weeklyAgendaState.chores = [];
  }
}

// Generate array of dates for the current week
function getWeekDates() {
  const dates = [];
  const startDate = new Date(weeklyAgendaState.currentWeekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

// Format date as MM/DD
function formatDateShort(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Format date range for display
function formatDateRange(startDate, endDate) {
  const options = { month: 'short', day: 'numeric' };
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  return `${start} - ${end}`;
}

// Get day of week name
function getDayName(date, short = false) {
  const options = { weekday: short ? 'short' : 'long' };
  return date.toLocaleDateString('en-US', options);
}

// Get all items (chores and events) for a specific date and person
function getItemsForDateAndPerson(date, personId) {
  const dateStr = date.toISOString().split('T')[0];
  const items = [];
  
  // Only include chores if view is 'all' or 'chores'
  if (weeklyAgendaState.activeView === 'all' || weeklyAgendaState.activeView === 'chores') {
    // Add recurring chores for this day
    const dayOfWeek = date.getDay();
    weeklyAgendaState.chores.forEach(chore => {
      if (chore.assignedTo === personId) {
        // Add recurring chores scheduled for this day
        if (chore.recurring && chore.recurringDays && chore.recurringDays.includes(dayOfWeek)) {
          items.push({
            id: `${chore.id}-${dateStr}`,
            name: chore.name,
            type: 'chore',
            priority: chore.priority || 'medium',
            completed: chore.completionStatus && chore.completionStatus[dateStr] === true,
            source: 'chore-manager'
          });
        }
        // Add one-time chores due on this date
        else if (!chore.recurring && chore.dueDate) {
          const dueDate = new Date(chore.dueDate);
          if (dueDate.toISOString().split('T')[0] === dateStr) {
            items.push({
              id: chore.id,
              name: chore.name,
              type: 'chore',
              priority: chore.priority || 'medium',
              completed: chore.completed || false,
              source: 'chore-manager'
            });
          }
        }
      }
    });
  }
  
  // Only include Cozi events if view is 'all' or 'cozi'
  if ((weeklyAgendaState.activeView === 'all' || weeklyAgendaState.activeView === 'cozi') &&
      weeklyAgendaState.coziEvents.length > 0) {
    
    weeklyAgendaState.coziEvents.forEach(event => {
      if (!event.start) return;
      
      const eventDate = new Date(event.start);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      
      if (eventDateStr === dateStr) {
        // Check if event is assigned to this person
        const member = weeklyAgendaState.familyMembers.find(m => m.id === personId);
        
        if (member && event.assignee && 
            event.assignee.toLowerCase() === member.name.toLowerCase()) {
          items.push({
            id: event.id,
            name: event.title || event.summary,
            description: event.description,
            type: 'event',
            priority: 'medium',
            time: formatEventTime(event),
            location: event.location,
            completed: false,
            source: 'cozi'
          });
        }
      }
    });
  }
  
  // Sort items: completed last, then by priority, then by name
  return items.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityA = priorityOrder[a.priority] || 1;
    const priorityB = priorityOrder[b.priority] || 1;
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // Sort by time if events
    if (a.time && b.time) return a.time.localeCompare(b.time);
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
}

// Format event time for display
function formatEventTime(event) {
  if (!event.start) return '';
  
  const startTime = new Date(event.start);
  if (event.allDay) return 'All day';
  
  const options = { hour: 'numeric', minute: '2-digit' };
  return startTime.toLocaleTimeString('en-US', options);
}

// Render the weekly agenda view
function renderWeeklyAgenda() {
  const container = document.querySelector('.weekly-agenda-responsive');
  if (!container) return;
  
  // Update week display
  updateWeekDisplay();
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create grid layout
  container.classList.add('weekly-grid');
  
  // Generate week dates
  const weekDates = getWeekDates();
  
  // Add header row with days
  const headerRow = document.createElement('div');
  headerRow.className = 'weekly-grid-row header-row';
  
  // Add empty cell for the person column
  const emptyHeaderCell = document.createElement('div');
  emptyHeaderCell.className = 'weekly-grid-cell person-header';
  emptyHeaderCell.textContent = 'Family Member';
  headerRow.appendChild(emptyHeaderCell);
  
  // Add day headers
  weekDates.forEach(date => {
    const dayCell = document.createElement('div');
    dayCell.className = 'weekly-grid-cell day-header';
    
    // Highlight today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayCell.classList.add('today');
    }
    
    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = getDayName(date, true);
    
    const dayDate = document.createElement('div');
    dayDate.className = 'day-date';
    dayDate.textContent = formatDateShort(date);
    
    dayCell.appendChild(dayName);
    dayCell.appendChild(dayDate);
    headerRow.appendChild(dayCell);
  });
  
  container.appendChild(headerRow);
  
  // Add rows for each family member
  weeklyAgendaState.familyMembers.forEach(person => {
    const personRow = document.createElement('div');
    personRow.className = 'weekly-grid-row person-row';
    
    // Add person cell
    const personCell = document.createElement('div');
    personCell.className = 'weekly-grid-cell person-cell';
    personCell.textContent = person.name;
    personCell.style.borderLeftColor = person.color || '#ccc';
    personRow.appendChild(personCell);
    
    // Add cells for each day
    weekDates.forEach(date => {
      const dayCell = document.createElement('div');
      dayCell.className = 'weekly-grid-cell day-cell';
      
      // Highlight today
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        dayCell.classList.add('today');
      }
      
      // Get items for this day and person
      const items = getItemsForDateAndPerson(date, person.id);
      
      // Add items count
      if (items.length > 0) {
        const countBadge = document.createElement('div');
        countBadge.className = 'item-count';
        countBadge.textContent = items.length;
        dayCell.appendChild(countBadge);
      }
      
      // Create items list
      const itemsList = document.createElement('ul');
      itemsList.className = 'items-list';
      
      // Add items
      items.forEach(item => {
        const itemEl = document.createElement('li');
        itemEl.className = `item ${item.type} ${item.completed ? 'completed' : ''}`;
        
        // Create item content
        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';
        
        // Source badge
        const sourceBadge = document.createElement('span');
        sourceBadge.className = `source-badge ${item.source}`;
        sourceBadge.textContent = item.source === 'cozi' ? 'C' : 'CH';
        itemContent.appendChild(sourceBadge);
        
        // Item name
        const itemName = document.createElement('span');
        itemName.className = 'item-name';
        if (item.completed) {
          const strikeThrough = document.createElement('s');
          strikeThrough.textContent = item.name;
          itemName.appendChild(strikeThrough);
        } else {
          itemName.textContent = item.name;
        }
        itemContent.appendChild(itemName);
        
        // Add time for events
        if (item.type === 'event' && item.time) {
          const itemTime = document.createElement('span');
          itemTime.className = 'item-time';
          itemTime.textContent = item.time;
          itemContent.appendChild(itemTime);
        }
        
        itemEl.appendChild(itemContent);
        itemsList.appendChild(itemEl);
      });
      
      dayCell.appendChild(itemsList);
      personRow.appendChild(dayCell);
    });
    
    container.appendChild(personRow);
  });
}

// Update the current week display text
function updateWeekDisplay() {
  const display = document.getElementById('currentWeekDisplay');
  if (!display) return;
  
  const weekDates = getWeekDates();
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  
  display.textContent = formatDateRange(weekStart, weekEnd);
}

// Expose functions to global scope
window.updateWeeklyAgenda = updateCoziEvents;
