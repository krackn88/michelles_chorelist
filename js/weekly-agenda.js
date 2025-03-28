// Weekly Agenda View JavaScript for Michelle's Family Chore Manager
// Generates a comprehensive weekly view of all children's chores

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the weekly agenda after the main data is loaded
  setTimeout(initializeWeeklyAgenda, 500);
  
  // Add event listener to update the weekly agenda when chores change
  const choreList = document.getElementById('choreList');
  if (choreList) {
    const observer = new MutationObserver(initializeWeeklyAgenda);
    observer.observe(choreList, { childList: true, subtree: true });
  }
  
  // Also listen for kid selection changes
  const kidSelector = document.getElementById('kidSelector');
  if (kidSelector) {
    kidSelector.addEventListener('change', initializeWeeklyAgenda);
  }
});

// Main function to initialize the weekly agenda
function initializeWeeklyAgenda() {
  try {
    // Make sure we have the kids data
    if (!window.kids) {
      console.warn("Kids data not available yet for weekly agenda");
      return;
    }
    
    // Clear all agenda containers
    clearAgendaContainers();
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend'];
    
    // For each kid, distribute their chores across the week
    Object.keys(window.kids).forEach(kidName => {
      const kidChores = window.kids[kidName].chores;
      
      // Sort chores by schedule type and completion status
      const dailyChores = kidChores.filter(chore => chore.schedule === 'daily');
      const weeklyChores = kidChores.filter(chore => chore.schedule === 'weekly');
      const monthlyChores = kidChores.filter(chore => chore.schedule === 'monthly');
      
      // Add cards for each day
      days.forEach((day, dayIndex) => {
        // Each kid's daily chores appear every day
        const choresToShow = [...dailyChores];
        
        // Distribute weekly chores across weekdays
        if (day === 'monday' || day === 'thursday') {
          // Split weekly chores between Monday and Thursday
          const startIndex = day === 'monday' ? 0 : Math.ceil(weeklyChores.length / 2);
          const endIndex = day === 'monday' ? Math.ceil(weeklyChores.length / 2) : weeklyChores.length;
          
          for (let i = startIndex; i < endIndex; i++) {
            if (weeklyChores[i]) {
              choresToShow.push(weeklyChores[i]);
            }
          }
        }
        
        // Monthly chores get assigned to Tuesday
        if (day === 'tuesday') {
          choresToShow.push(...monthlyChores);
        }
        
        // Only create a card if the kid has chores on this day
        if (choresToShow.length > 0) {
          createKidAgendaCard(day, kidName, choresToShow);
        }
      });
    });
    
  } catch (error) {
    console.error("Error initializing weekly agenda:", error);
    showWeeklyAgendaError("Failed to initialize weekly agenda: " + error.message);
  }
}

// Clear all agenda containers
function clearAgendaContainers() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend'];
  days.forEach(day => {
    const container = document.getElementById(`${day}Agenda`);
    if (container) {
      container.innerHTML = '';
    }
  });
}

// Create a kid's agenda card for a specific day
function createKidAgendaCard(day, kidName, chores) {
  try {
    const dayContainer = document.getElementById(`${day}Agenda`);
    if (!dayContainer) return;
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'kid-agenda-card';
    
    // Set different border colors for different kids
    const kidColors = {
      'Ember': '#f782b0',    // Pink
      'Lilly': '#b8e986',    // Green
      'Levi': '#64b5f6',     // Blue
      'Eva': '#b8a6df',      // Purple
      'Elijah': '#f4b350',   // Yellow
      'Kallie': '#ff7f7f'    // Red
    };
    
    if (kidColors[kidName]) {
      card.style.borderLeftColor = kidColors[kidName];
    }
    
    // Create the header
    const header = document.createElement('h4');
    header.textContent = `${kidName}`;
    card.appendChild(header);
    
    // Create the chore list
    const choreList = document.createElement('ul');
    choreList.className = 'kid-agenda-chores';
    
    // Add each chore to the list
    chores.forEach(chore => {
      const choreItem = document.createElement('li');
      
      // Create checkbox
      const checkbox = document.createElement('span');
      checkbox.className = 'agenda-checkbox';
      if (chore.completed) {
        checkbox.style.backgroundColor = '#b8e986';
        checkbox.style.borderColor = '#b8e986';
      }
      choreItem.appendChild(checkbox);
      
      // Create task text
      const taskText = document.createElement('span');
      taskText.className = 'agenda-task';
      taskText.textContent = chore.task;
      if (chore.completed) {
        taskText.style.textDecoration = 'line-through';
        taskText.style.color = '#6c757d';
      }
      choreItem.appendChild(taskText);
      
      // Create schedule tag
      const scheduleTag = document.createElement('span');
      scheduleTag.className = 'agenda-schedule';
      scheduleTag.textContent = chore.schedule;
      choreItem.appendChild(scheduleTag);
      
      // Add the chore item to the list
      choreList.appendChild(choreItem);
    });
    
    card.appendChild(choreList);
    dayContainer.appendChild(card);
    
  } catch (error) {
    console.error("Error creating kid agenda card:", error);
  }
}

// Display error for weekly agenda
function showWeeklyAgendaError(message) {
  console.error("Weekly agenda error:", message);
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}
