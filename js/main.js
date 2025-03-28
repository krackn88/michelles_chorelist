// Updated default kids data structure with base chores
const defaultKids = {
  "Ember": {
    age: 14,
    chores: [
      { task: "Clean kitchen after dinner", schedule: "daily", completed: false }
    ]
  },
  "Lilly": {
    age: 10,
    chores: [
      { task: "Wipe down the bathroom counter and sink every night before bed", schedule: "daily", completed: false }
    ]
  },
  "Levi": {
    age: 9,
    chores: [
      { task: "Wipe table and chairs off every night", schedule: "daily", completed: false }
    ]
  },
  "Eva": {
    age: 9,
    chores: [
      { task: "Load and start dishwasher every night after dinner", schedule: "daily", completed: false }
    ]
  },
  "Elijah": {
    age: 7,
    chores: [
      { task: "Sweep kitchen/dining room floor every night after dinner", schedule: "daily", completed: false }
    ]
  },
  "Kallie": {
    age: 3,
    chores: [
      { task: "Pick up shoes", schedule: "daily", completed: false }
    ]
  }
};

// Add interesting facts for each child
const interestingFacts = {
  "Ember": [
    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion!",
    "The human brain uses the same amount of power as a 10-watt light bulb.",
    "There are more possible iterations of a game of chess than there are atoms in the known universe.",
    "The Great Wall of China is not visible from space without aid."
  ],
  "Lilly": [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
    "Butterflies taste with their feet!",
    "Cats can jump up to six times their length.",
    "The shortest war in history was between Britain and Zanzibar in 1896, lasting only 38 minutes."
  ],
  "Levi": [
    "A group of flamingos is called a 'flamboyance'!",
    "The heart of a shrimp is located in its head.",
    "Dolphins give each other names and can call to each other specifically.",
    "Cows have best friends and get stressed when they're separated."
  ],
  "Eva": [
    "Octopuses have three hearts and blue blood!",
    "There are more trees on Earth than stars in the Milky Way galaxy.",
    "A day on Venus is longer than a year on Venus.",
    "Koalas sleep for up to 22 hours a day."
  ],
  "Elijah": [
    "Bananas are berries, but strawberries aren't!",
    "Elephants are the only animals that can't jump.",
    "The total weight of all the ants on Earth is roughly equal to the total weight of all humans.",
    "Astronauts grow about 2 inches taller in space due to less gravity."
  ],
  "Kallie": [
    "A baby octopus is about the size of a flea when it is born!",
    "Polar bears' fur isn't actually white - it's transparent!",
    "Giraffes only need 5-30 minutes of sleep in a 24-hour period.",
    "Butterflies can see colors that humans can't even imagine!"
  ]
};

// Error handling helper
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}

// Load data from localStorage (or use default data)
function loadData() {
  try {
    const savedData = localStorage.getItem('kidsChoreData');
    return savedData ? JSON.parse(savedData) : defaultKids;
  } catch (error) {
    showError("Error loading saved data. Using default data instead.");
    console.error("Error loading data:", error);
    return defaultKids;
  }
}

// Expose kids data globally for charts.js
window.kids = loadData();
let currentKid = document.getElementById('kidSelector').value;

// Save current kids data to localStorage
function saveData() {
  try {
    localStorage.setItem('kidsChoreData', JSON.stringify(window.kids));
  } catch (error) {
    showError("Failed to save your changes. Your browser may have storage restrictions.");
    console.error("Error saving data:", error);
  }
}

// Render the chore list for the selected kid
function renderChoreList() {
  const choreListEl = document.getElementById('choreList');
  choreListEl.innerHTML = "";
  
  try {
    const kidChores = window.kids[currentKid].chores;
    
    if (kidChores.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = "No chores found. Add some using the form above!";
      emptyMessage.style.padding = "1rem";
      emptyMessage.style.color = "#6c757d";
      choreListEl.appendChild(emptyMessage);
      return;
    }

    kidChores.forEach((chore, index) => {
      const li = document.createElement('li');
      li.setAttribute('data-index', index);
      li.setAttribute('draggable', true);

      // Drag events for reordering
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        li.classList.add('dragging');
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedIndex = Number(e.dataTransfer.getData('text/plain'));
        const targetIndex = Number(e.currentTarget.getAttribute('data-index'));
        moveChore(draggedIndex, targetIndex);
      });

      // Create chore text span with inline edit on double-click
      const taskSpan = document.createElement('span');
      taskSpan.className = 'task';
      taskSpan.textContent = chore.task;
      if (chore.completed) {
        taskSpan.classList.add('completed');
      }
      taskSpan.addEventListener('dblclick', () => editChore(index));
      li.appendChild(taskSpan);

      // Schedule tag
      const scheduleTag = document.createElement('span');
      scheduleTag.className = 'schedule-tag';
      scheduleTag.setAttribute('data-schedule', chore.schedule);
      scheduleTag.textContent = chore.schedule.charAt(0).toUpperCase() + chore.schedule.slice(1);
      li.appendChild(scheduleTag);

      // Action buttons
      const btnGroup = document.createElement('div');
      btnGroup.className = 'button-group';
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editChore(index));
      btnGroup.appendChild(editBtn);

      const completeBtn = document.createElement('button');
      completeBtn.textContent = chore.completed ? 'Undo' : 'Complete';
      completeBtn.className = 'complete-btn';
      completeBtn.addEventListener('click', () => toggleChore(index));
      btnGroup.appendChild(completeBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteChore(index));
      btnGroup.appendChild(deleteBtn);

      li.appendChild(btnGroup);
      choreListEl.appendChild(li);
    });
  } catch (error) {
    showError("Error displaying chores. Please refresh the page.");
    console.error("Error rendering chore list:", error);
  }
}

// Move a chore from one position to another
function moveChore(oldIndex, newIndex) {
  if (oldIndex === newIndex) return;
  
  try {
    const chores = window.kids[currentKid].chores;
    const [movedChore] = chores.splice(oldIndex, 1);
    chores.splice(newIndex, 0, movedChore);
    renderChoreList();
    saveData();
    
    // Update charts if they exist
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
  } catch (error) {
    showError("Error moving chore. Please try again.");
    console.error("Error moving chore:", error);
  }
}

// Add a new chore for the selected kid
function addChore() {
  const choreInput = document.getElementById('newChoreInput');
  const scheduleSelect = document.getElementById('scheduleSelect');
  const newTask = choreInput.value.trim();
  const schedule = scheduleSelect.value;
  
  if (newTask === "") {
    showError("Please enter a chore description.");
    choreInput.focus();
    return;
  }
  
  try {
    window.kids[currentKid].chores.push({ task: newTask, schedule: schedule, completed: false });
    choreInput.value = "";
    renderChoreList();
    saveData();
    
    // Update charts if they exist
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
  } catch (error) {
    showError("Error adding chore. Please try again.");
    console.error("Error adding chore:", error);
  }
}

// Toggle the completion state of a chore
function toggleChore(index) {
  try {
    window.kids[currentKid].chores[index].completed = !window.kids[currentKid].chores[index].completed;
    renderChoreList();
    saveData();
    
    // Update charts if they exist
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
  } catch (error) {
    showError("Error updating chore status. Please try again.");
    console.error("Error toggling chore:", error);
  }
}

// Delete a chore with confirmation
function deleteChore(index) {
  if (confirm("Are you sure you want to delete this chore?")) {
    try {
      window.kids[currentKid].chores.splice(index, 1);
      renderChoreList();
      saveData();
      
      // Update charts if they exist
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      }
    } catch (error) {
      showError("Error deleting chore. Please try again.");
      console.error("Error deleting chore:", error);
    }
  }
}

// Edit a chore with better UI
function editChore(index) {
  try {
    const currentChore = window.kids[currentKid].chores[index];
    const updatedTask = prompt("Edit chore:", currentChore.task);
    
    if (updatedTask !== null) {
      const trimmedTask = updatedTask.trim();
      if (trimmedTask === "") {
        showError("Chore description cannot be empty.");
        return;
      }
      
      window.kids[currentKid].chores[index].task = trimmedTask;
      renderChoreList();
      saveData();
      
      // Update charts if they exist
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      }
    }
  } catch (error) {
    showError("Error editing chore. Please try again.");
    console.error("Error editing chore:", error);
  }
}

// Reset all completion statuses
function resetCompletionStatus() {
  if (confirm("Are you sure you want to reset all chore completion statuses to incomplete?")) {
    try {
      window.kids[currentKid].chores.forEach(chore => {
        chore.completed = false;
      });
      renderChoreList();
      saveData();
      
      // Update charts if they exist
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      }
      
      showError("All chores have been reset to incomplete status.");
    } catch (error) {
      showError("Error resetting chores. Please try again.");
      console.error("Error resetting chores:", error);
    }
  }
}

// Function to get a random fact for the current kid
function getRandomFact(kidName) {
  const facts = interestingFacts[kidName];
  return facts[Math.floor(Math.random() * facts.length)];
}

// Print chores using the selected filter and format
function printChores() {
  const printFilter = document.getElementById('printFilter').value;
  const printFormat = document.getElementById('printFormat').value;
  
  try {
    const kidChores = window.kids[currentKid].chores;
    let filteredChores = [];

    // Filter chores based on selection
    if (printFilter === "all") {
      filteredChores = kidChores;
    } else if (printFilter === "completed") {
      filteredChores = kidChores.filter(chore => chore.completed);
    } else if (printFilter === "incomplete") {
      filteredChores = kidChores.filter(chore => !chore.completed);
    } else {
      filteredChores = kidChores.filter(chore => chore.schedule === printFilter);
    }

    if (filteredChores.length === 0) {
      showError(`No ${printFilter} chores found for ${currentKid}.`);
      return;
    }

    // Generate print content based on selected format
    let printContent = '';
    
    if (printFormat === "agenda") {
      printContent = generateAgendaView(filteredChores);
    } else if (printFormat === "checklist") {
      printContent = generateChecklistView(filteredChores);
    } else {
      printContent = generateStandardView(filteredChores, printFilter);
    }
    
    // Open print window
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a slight delay to ensure content is fully loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } catch (error) {
    showError("Error generating printable view. Please try again.");
    console.error("Error printing chores:", error);
  }
}

// Generate standard printable view
function generateStandardView(filteredChores, printFilter) {
  const randomFact = getRandomFact(currentKid);
  const today = new Date().toLocaleDateString();
  
  return `
    <html>
      <head>
        <title>${currentKid}'s Chore List</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
          body { 
            font-family: 'Nunito', sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          .header { 
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 3px solid #f782b0;
            padding-bottom: 1rem;
          }
          h1 { 
            color: #333;
            margin-bottom: 0.5rem;
          }
          .subtitle {
            color: #666;
            font-size: 1.1rem;
          }
          ul { 
            list-style: none; 
            padding: 0;
          }
          li { 
            margin-bottom: 15px; 
            padding: 10px 15px;
            border-left: 4px solid #b8e986;
            background: #f8f9fa;
          }
          .completed { 
            text-decoration: line-through; 
            color: #6c757d;
          }
          .schedule-tag {
            display: inline-block;
            margin-left: 10px;
            font-size: 0.85rem;
            background: #f0f0f0;
            padding: 3px 8px;
            border-radius: 12px;
          }
          .fact-box {
            margin-top: 2rem;
            padding: 1rem;
            background: #ffd1e1;
            border-radius: 10px;
            font-style: italic;
            color: #333;
          }
          .footer {
            margin-top: 3rem;
            text-align: center;
            font-size: 0.9rem;
            color: #6c757d;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }
          @media print {
            body { padding: 0; }
            li { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentKid}'s Chore List</h1>
          <div class="subtitle">
            ${printFilter.charAt(0).toUpperCase() + printFilter.slice(1)} Chores
            <span style="font-size: 0.9rem; color: #6c757d;">
              (Printed on ${today})
            </span>
          </div>
        </div>
        <ul>
          ${filteredChores.map(chore => `
            <li class="${chore.completed ? 'completed' : ''}">
              ${chore.task}
              <span class="schedule-tag">${chore.schedule}</span>
            </li>`).join('')}
        </ul>
        <div class="fact-box">
          <strong>Today's Fun Fact:</strong> ${randomFact}
        </div>
        <div class="footer">
          Remember: Completing chores helps our family work together as a team!
        </div>
      </body>
    </html>`;
}

// Generate agenda view
function generateAgendaView(filteredChores) {
  // Group chores by schedule
  const dailyChores = filteredChores.filter(chore => chore.schedule === "daily");
  const weeklyChores = filteredChores.filter(chore => chore.schedule === "weekly");
  const monthlyChores = filteredChores.filter(chore => chore.schedule === "monthly");
  
  // Create days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const randomFact = getRandomFact(currentKid);
  
  return `
    <html>
      <head>
        <title>${currentKid}'s Weekly Chore Agenda</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
          body { 
            font-family: 'Nunito', sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          .header { 
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 3px solid #f782b0;
            padding-bottom: 1rem;
          }
          h1 { 
            color: #333;
            margin-bottom: 0.5rem;
          }
          .subtitle {
            color: #666;
            font-size: 1.1rem;
          }
          .day-header {
            background: #b8e986;
            padding: 8px 15px;
            margin: 1.5rem 0 0.5rem;
            border-radius: 5px;
            color: #333;
            font-weight: bold;
          }
          .day-chores {
            padding-left: 20px;
          }
          .chore-item {
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
            display: flex;
            align-items: center;
          }
          .checkbox {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid #999;
            margin-right: 10px;
          }
          .schedule-label {
            margin-left: auto;
            font-size: 0.85rem;
            color: #666;
          }
          .fact-box {
            margin-top: 2rem;
            padding: 1rem;
            background: #ffd1e1;
            border-radius: 10px;
            font-style: italic;
            color: #333;
          }
          .footer {
            margin-top: 3rem;
            text-align: center;
            font-size: 0.9rem;
            color: #6c757d;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }
          @media print {
            .day-header { break-after: avoid; }
            .chore-item { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentKid}'s Weekly Chore Agenda</h1>
          <div class="subtitle">
            Week of ${getMonday(new Date()).toLocaleDateString()} to ${getSunday(new Date()).toLocaleDateString()}
          </div>
        </div>
        
        <div class="agenda-view">
          ${daysOfWeek.map(day => `
            <div class="day-header">${day}</div>
            <div class="day-chores">
              ${dailyChores.map(chore => `
                <div class="chore-item">
                  <span class="checkbox"></span>
                  ${chore.task}
                  <span class="schedule-label">Daily</span>
                </div>
              `).join('')}
              
              ${day === 'Monday' || day === 'Thursday' ? weeklyChores.map(chore => `
                <div class="chore-item">
                  <span class="checkbox"></span>
                  ${chore.task}
                  <span class="schedule-label">Weekly</span>
                </div>
              `).join('') : ''}
              
              ${day === 'Tuesday' ? monthlyChores.map(chore => `
                <div class="chore-item">
                  <span class="checkbox"></span>
                  ${chore.task}
                  <span class="schedule-label">Monthly</span>
                </div>
              `).join('') : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="fact-box">
          <strong>This Week's Fun Fact:</strong> ${randomFact}
        </div>
        
        <div class="footer">
          Have a great week, ${currentKid}! Remember to check off each chore when completed.
        </div>
      </body>
    </html>`;
}

// Generate checklist view
function generateChecklistView(filteredChores) {
  const randomFact = getRandomFact(currentKid);
  
  return `
    <html>
      <head>
        <title>${currentKid}'s Chore Checklist</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
          body { 
            font-family: 'Nunito', sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          .header { 
            text-align: center;
            margin-bottom: 2rem;
          }
          h1 { 
            color: #333;
            margin-bottom: 0.5rem;
            border-bottom: 3px solid #f782b0;
            padding-bottom: 10px;
          }
          .date {
            color: #666;
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
          }
          .checklist-container {
            border: 2px solid #b8e986;
            border-radius: 10px;
            padding: 20px;
            background: #f8f9fa;
          }
          .checklist-item {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 10px;
          }
          .checklist-checkbox {
            width: 25px;
            height: 25px;
            border: 2px solid #333;
            margin-right: 15px;
            flex-shrink: 0;
          }
          .checklist-text {
            font-size: 1.1rem;
            flex-grow: 1;
          }
          .schedule-badge {
            background: #f0f0f0;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            margin-left: 10px;
          }
          .fact-box {
            margin-top: 2rem;
            padding: 1rem;
            background: #ffd1e1;
            border-radius: 10px;
            font-style: italic;
            color: #333;
          }
          .instructions {
            margin-top: 2rem;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 5px;
            font-size: 0.9rem;
            color: #555;
          }
          .footer {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.9rem;
            color: #6c757d;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }
          @media print {
            .checklist-item { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentKid}'s Chore Checklist</h1>
          <div class="date">
            For the week of ${getMonday(new Date()).toLocaleDateString()}
          </div>
        </div>
        
        <div class="checklist-view">
          <div class="checklist-container">
            ${filteredChores.map(chore => `
              <div class="checklist-item">
                <div class="checklist-checkbox"></div>
                <div class="checklist-text">
                  ${chore.task}
                  <span class="schedule-badge">${chore.schedule}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="fact-box">
            <strong>Did You Know?</strong> ${randomFact}
          </div>
          
          <div class="instructions">
            <strong>Instructions:</strong> Check each box when you complete a chore. Remember that daily chores 
            need to be done every day, weekly chores once a week, and monthly chores once a month.
            This checklist helps you keep track of your responsibilities!
          </div>
        </div>
        
        <div class="footer">
          Great work ${currentKid}! You're helping make our home a better place.
        </div>
      </body>
    </html>`;
}

// Helper function to get Monday of current week
function getMonday(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Helper function to get Sunday of current week
function getSunday(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(d.setDate(diff));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('addChoreButton').addEventListener('click', addChore);
  document.getElementById('newChoreInput').addEventListener('keyup', (e) => {
    if (e.key === "Enter") addChore();
  });
  document.getElementById('printButton').addEventListener('click', printChores);
  document.getElementById('resetButton').addEventListener('click', resetCompletionStatus);
  document.getElementById('kidSelector').addEventListener('change', (e) => {
    currentKid = e.target.value;
    renderChoreList();
    
    // Update charts if they exist
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
  });
  
  // Initial render
  renderChoreList();
});
