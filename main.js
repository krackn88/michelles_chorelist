// Main JavaScript for Michelle's Family Chore Manager
// Interactive chore management system with analytics and printing options

// Global Variables
let currentKid = "Ember"; // Default selected kid
window.kids = {}; // Will store all kids and their chores

// Fun facts for each child - randomly shown in printed outputs
const interestingFacts = {
  "Ember": [
    "Ember has a great eye for detail!",
    "Ember is the most responsible kid in the family.",
    "Ember can complete chores 25% faster than the average teenager!",
    "Ember has completed over 500 chores this year!",
    "Ember's favorite chore is organizing the bookshelf."
  ],
  "Lilly": [
    "Lilly loves helping in the kitchen!",
    "Lilly has the neatest bedroom in the house.",
    "Lilly can fold laundry faster than anyone else!",
    "Lilly invented a new way to organize the toy room.",
    "Lilly's favorite chore is watering the plants."
  ],
  "Levi": [
    "Levi is the family's recycling expert!",
    "Levi never forgets to feed the pets.",
    "Levi has the most consistent chore streak in the family!",
    "Levi can take out all the trash in record time.",
    "Levi's favorite chore is sweeping the floor."
  ],
  "Eva": [
    "Eva is the best at making beds in the house!",
    "Eva keeps her toys perfectly organized.",
    "Eva always volunteers for extra chores!",
    "Eva has the cleanest desk area of all the kids.",
    "Eva's favorite chore is dusting the shelves."
  ],
  "Elijah": [
    "Elijah is the quickest dish washer in the family!",
    "Elijah never has to be reminded to do his chores.",
    "Elijah loves to help younger siblings with their chores!",
    "Elijah keeps the bathroom spotless.",
    "Elijah's favorite chore is clearing the table."
  ],
  "Kallie": [
    "Kallie loves to match socks when helping with laundry!",
    "Kallie always puts away toys without being asked.",
    "Kallie has the brightest smile when helping out!",
    "Kallie can put away books faster than anyone.",
    "Kallie's favorite chore is helping feed the pets."
  ]
};

// Initialize data for each kid
function initializeData() {
  // Get stored data from localStorage if available
  const storedData = localStorage.getItem('choreMasterData');
  
  if (storedData) {
    try {
      window.kids = JSON.parse(storedData);
      console.log("Loaded saved chore data");
    } catch (error) {
      console.error("Error loading saved data:", error);
      createDefaultData();
    }
  } else {
    console.log("No saved data found, creating defaults");
    createDefaultData();
  }
  
  // Set current kid from URL parameter if available
  const urlParams = new URLSearchParams(window.location.search);
  const kidParam = urlParams.get('kid');
  if (kidParam && window.kids[kidParam]) {
    currentKid = kidParam;
    document.getElementById('kidSelector').value = currentKid;
  }
}

// Create default data if no saved data exists
function createDefaultData() {
  window.kids = {
    "Ember": {
      chores: [
        { task: "Unload dishwasher", completed: false, schedule: "daily" },
        { task: "Take out recycling", completed: false, schedule: "weekly" },
        { task: "Clean bathroom sink", completed: false, schedule: "weekly" }
      ]
    },
    "Lilly": {
      chores: [
        { task: "Feed pets", completed: false, schedule: "daily" },
        { task: "Water plants", completed: false, schedule: "weekly" },
        { task: "Fold laundry", completed: false, schedule: "weekly" }
      ]
    },
    "Levi": {
      chores: [
        { task: "Set dinner table", completed: false, schedule: "daily" },
        { task: "Take out trash", completed: false, schedule: "weekly" },
        { task: "Sweep kitchen floor", completed: false, schedule: "weekly" }
      ]
    },
    "Eva": {
      chores: [
        { task: "Make bed", completed: false, schedule: "daily" },
        { task: "Dust shelves", completed: false, schedule: "weekly" },
        { task: "Organize toys", completed: false, schedule: "weekly" }
      ]
    },
    "Elijah": {
      chores: [
        { task: "Clear table after dinner", completed: false, schedule: "daily" },
        { task: "Wipe bathroom counter", completed: false, schedule: "weekly" },
        { task: "Put away clean clothes", completed: false, schedule: "weekly" }
      ]
    },
    "Kallie": {
      chores: [
        { task: "Put toys away", completed: false, schedule: "daily" },
        { task: "Help sort socks", completed: false, schedule: "weekly" },
        { task: "Put books on shelf", completed: false, schedule: "weekly" }
      ]
    }
  };
  
  saveData();
}

// Save data to localStorage
function saveData() {
  try {
    localStorage.setItem('choreMasterData', JSON.stringify(window.kids));
    console.log("Saved chore data successfully");
  } catch (error) {
    showError("Error saving data: " + error.message);
    console.error("Error saving data:", error);
  }
}

// Display error message
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}

// Add a new chore
function addChore() {
  try {
    const choreInput = document.getElementById('newChoreInput');
    const scheduleSelect = document.getElementById('scheduleSelect');
    
    const newChoreText = choreInput.value.trim();
    const schedule = scheduleSelect.value;
    
    if (newChoreText === "") {
      showError("Please enter a chore description.");
      return;
    }
    
    // Add the new chore to the current kid's list
    window.kids[currentKid].chores.push({
      task: newChoreText,
      completed: false,
      schedule: schedule
    });
    
    // Clear the input
    choreInput.value = "";
    
    // Re-render the list and save
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

// Render the chore list for the current kid
function renderChoreList() {
  try {
    const choreList = document.getElementById('choreList');
    choreList.innerHTML = '';
    
    const currentKidChores = window.kids[currentKid].chores;
    
    if (currentKidChores.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = "No chores added yet. Add a chore above!";
      emptyItem.style.textAlign = 'center';
      emptyItem.style.fontStyle = 'italic';
      choreList.appendChild(emptyItem);
      return;
    }
    
    // Create list items for each chore
    currentKidChores.forEach((chore, index) => {
      const li = document.createElement('li');
      li.setAttribute('draggable', 'true');
      li.dataset.index = index;
      
      // Create task text
      const taskSpan = document.createElement('span');
      taskSpan.classList.add('task');
      if (chore.completed) {
        taskSpan.classList.add('completed');
      }
      taskSpan.textContent = chore.task;
      
      // Create schedule tag
      const scheduleTag = document.createElement('span');
      scheduleTag.classList.add('schedule-tag');
      scheduleTag.dataset.schedule = chore.schedule;
      scheduleTag.textContent = chore.schedule;
      
      // Create button group
      const buttonGroup = document.createElement('div');
      buttonGroup.classList.add('button-group');
      
      // Complete button
      const completeBtn = document.createElement('button');
      completeBtn.classList.add('complete-btn');
      completeBtn.textContent = chore.completed ? 'Undo' : 'Done';
      completeBtn.addEventListener('click', () => toggleChoreCompletion(index));
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.classList.add('edit-btn');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editChore(index));
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('delete-btn');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteChore(index));
      
      // Append all elements
      buttonGroup.appendChild(completeBtn);
      buttonGroup.appendChild(editBtn);
      buttonGroup.appendChild(deleteBtn);
      
      li.appendChild(taskSpan);
      li.appendChild(scheduleTag);
      li.appendChild(buttonGroup);
      
      // Add drag and drop event listeners
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
      
      choreList.appendChild(li);
    });
  } catch (error) {
    showError("Error rendering chore list. Please refresh the page.");
    console.error("Error rendering chore list:", error);
  }
}

// Toggle a chore's completion status
function toggleChoreCompletion(index) {
  try {
    const currentChore = window.kids[currentKid].chores[index];
    currentChore.completed = !currentChore.completed;
    
    renderChoreList();
    saveData();
    
    // Update charts if they exist
    if (typeof initializeCharts === 'function') {
      initializeCharts();
    }
  } catch (error) {
    showError("Error updating chore status. Please try again.");
    console.error("Error toggling completion:", error);
  }
}

// Delete a chore
function deleteChore(index) {
  try {
    if (confirm("Are you sure you want to delete this chore?")) {
      window.kids[currentKid].chores.splice(index, 1);
      renderChoreList();
      saveData();
      
      // Update charts if they exist
      if (typeof initializeCharts === 'function') {
        initializeCharts();
      }
    }
  } catch (error) {
    showError("Error deleting chore. Please try again.");
    console.error("Error deleting chore:", error);
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

// Drag and Drop Functionality
let draggedItem = null;

function handleDragStart(e) {
  this.classList.add('dragging');
  draggedItem = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  
  if (draggedItem !== this) {
    // Get the indices
    const fromIndex = parseInt(draggedItem.dataset.index);
    const toIndex = parseInt(this.dataset.index);
    
    // Reorder in the data structure
    const movedChore = window.kids[currentKid].chores.splice(fromIndex, 1)[0];
    window.kids[currentKid].chores.splice(toIndex, 0, movedChore);
    
    // Re-render and save
    renderChoreList();
    saveData();
  }
  
  return false;
}

function handleDragEnd() {
  this.classList.remove('dragging');
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
  // Initialize data
  initializeData();
  
  // Set up event listeners
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