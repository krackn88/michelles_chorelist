/**
 * Family Chore Manager - Core Functionality
 * Manages chores, assignments, and completions
 */

const choreManager = {
  /**
   * Initialize the chore manager
   */
  init() {
    this.setupEventListeners();
    this.loadInitialData();
    this.renderDashboard();
  },

  /**
   * Set up event listeners for chore-related actions
   */
  setupEventListeners() {
    // Add chore form submission
    const addChoreForm = document.getElementById('addChoreForm');
    if (addChoreForm) {
      addChoreForm.addEventListener('submit', this.handleAddChore.bind(this));
    }

    // Chore completion toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('.chore-complete-toggle') || e.target.closest('.chore-complete-toggle')) {
        const choreElement = e.target.closest('.chore-item');
        if (choreElement) {
          const choreId = choreElement.dataset.id;
          this.toggleChoreCompletion(choreId);
        }
      }
    });

    // Edit chore button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-edit-chore') || e.target.closest('.btn-edit-chore')) {
        const choreElement = e.target.closest('.chore-item');
        if (choreElement) {
          const choreId = choreElement.dataset.id;
          this.openEditChoreModal(choreId);
        }
      }
    });

    // Delete chore button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-delete-chore') || e.target.closest('.btn-delete-chore')) {
        const choreElement = e.target.closest('.chore-item');
        if (choreElement) {
          const choreId = choreElement.dataset.id;
          this.confirmDeleteChore(choreId);
        }
      }
    });

    // Filter chores
    const choreFilterSelect = document.getElementById('choreFilter');
    if (choreFilterSelect) {
      choreFilterSelect.addEventListener('change', () => {
        this.renderChoresList();
      });
    }

    // Sort chores
    const choreSortSelect = document.getElementById('choreSort');
    if (choreSortSelect) {
      choreSortSelect.addEventListener('change', () => {
        this.renderChoresList();
      });
    }

    // Handle family member selection for assigning chores
    document.addEventListener('click', (e) => {
      if (e.target.matches('.family-member-select') || e.target.closest('.family-member-select')) {
        const memberElement = e.target.closest('.family-member-select');
        if (memberElement) {
          const choreElement = memberElement.closest('.chore-item');
          if (choreElement) {
            const choreId = choreElement.dataset.id;
            const memberId = memberElement.dataset.memberId;
            this.assignChoreToMember(choreId, memberId);
          }
        }
      }
    });
  },

  /**
   * Load initial data needed for the chore manager
   */
  loadInitialData() {
    this.chores = window.choreStorage.getChores();
    this.familyMembers = window.familyStorage.getMembers();
    this.completedChores = window.choreStorage.getCompletedChores();
    
    // If no family members exist, create a default one
    if (!this.familyMembers.length) {
      const defaultMember = {
        id: window.utils.generateId(),
        name: 'Family Member',
        color: '#ff9baf', // Pink to match theme
        avatar: 'default'
      };
      
      window.familyStorage.addMember(defaultMember);
      this.familyMembers = [defaultMember];
    }
    
    // If no chores exist, create some sample chores
    if (!this.chores.length) {
      const sampleChores = [
        {
          id: window.utils.generateId(),
          title: 'Do the dishes',
          description: 'Wash all dishes and put them away',
          frequency: 'daily',
          assignedTo: this.familyMembers[0].id,
          points: 5,
          created: new Date().toISOString()
        },
        {
          id: window.utils.generateId(),
          title: 'Take out trash',
          description: 'Empty all trash cans and take to the curb',
          frequency: 'weekly',
          assignedTo: null,
          points: 3,
          created: new Date().toISOString()
        },
        {
          id: window.utils.generateId(),
          title: 'Clean bathroom',
          description: 'Clean toilet, sink, shower, and floor',
          frequency: 'weekly',
          assignedTo: null,
          points: 10,
          created: new Date().toISOString()
        }
      ];
      
      window.choreStorage.saveChores(sampleChores);
      this.chores = sampleChores;
    }
  },

  /**
   * Get all chores
   * @returns {Array} Array of chore objects
   */
  getAllChores() {
    return this.chores;
  },

  /**
   * Get chore by ID
   * @param {string} choreId - ID of the chore to get
   * @returns {Object|null} Chore object or null if not found
   */
  getChoreById(choreId) {
    return this.chores.find(chore => chore.id === choreId) || null;
  },

  /**
   * Add a new chore
   * @param {Object} choreData - Chore data object
   * @returns {Object} The newly created chore
   */
  addChore(choreData) {
    const newChore = {
      id: window.utils.generateId(),
      title: choreData.title,
      description: choreData.description || '',
      frequency: choreData.frequency || 'daily',
      dueDate: choreData.dueDate || null,
      assignedTo: choreData.assignedTo || null,
      points: parseInt(choreData.points) || 1,
      created: new Date().toISOString()
    };
    
    window.choreStorage.addChore(newChore);
    this.chores.push(newChore);
    
    return newChore;
  },

  /**
   * Handle add chore form submission
   * @param {Event} e - Form submit event
   */
  handleAddChore(e) {
    e.preventDefault();
    const form = e.target;
    
    const choreData = {
      title: form.choreTitle.value.trim(),
      description: form.choreDescription.value.trim(),
      frequency: form.choreFrequency.value,
      assignedTo: form.choreAssignee.value !== 'none' ? form.choreAssignee.value : null,
      points: parseInt(form.chorePoints.value) || 1
    };
    
    // Optional due date
    if (form.choreDueDate && form.choreDueDate.value) {
      choreData.dueDate = new Date(form.choreDueDate.value).toISOString();
    }
    
    if (!choreData.title) {
      window.utils.showNotification('Please enter a chore title', 'error');
      return;
    }
    
    const newChore = this.addChore(choreData);
    
    // Close modal and reset form
    const modal = document.getElementById('addChoreModal');
    if (modal && typeof bootstrap !== 'undefined') {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }
    
    form.reset();
    
    // Refresh the chores list
    this.renderChoresList();
    this.renderDashboard();
    
    window.utils.showNotification(`Chore "${newChore.title}" added successfully!`, 'success');
  },

  /**
   * Update an existing chore
   * @param {string} choreId - ID of the chore to update
   * @param {Object} choreData - Updated chore data
   * @returns {boolean} Success state
   */
  updateChore(choreId, choreData) {
    const index = this.chores.findIndex(chore => chore.id === choreId);
    if (index === -1) return false;
    
    const updatedChore = {
      ...this.chores[index],
      ...choreData,
      lastUpdated: new Date().toISOString()
    };
    
    this.chores[index] = updatedChore;
    window.choreStorage.updateChore(updatedChore);
    
    return true;
  },

  /**
   * Delete a chore
   * @param {string} choreId - ID of the chore to delete
   * @returns {boolean} Success state
   */
  deleteChore(choreId) {
    const index = this.chores.findIndex(chore => chore.id === choreId);
    if (index === -1) return false;
    
    const deletedChore = this.chores[index];
    this.chores.splice(index, 1);
    window.choreStorage.deleteChore(choreId);
    
    // Also remove completed entries for this chore
    this.completedChores = this.completedChores.filter(
      completed => completed.choreId !== choreId
    );
    window.choreStorage.setItem('completedChores', this.completedChores);
    
    window.utils.showNotification(`Chore "${deletedChore.title}" deleted`, 'info');
    
    return true;
  },

  /**
   * Confirm chore deletion with the user
   * @param {string} choreId - ID of the chore to delete
   */
  confirmDeleteChore(choreId) {
    const chore = this.getChoreById(choreId);
    if (!chore) return;
    
    if (confirm(`Are you sure you want to delete the chore "${chore.title}"?`)) {
      this.deleteChore(choreId);
      this.renderChoresList();
      this.renderDashboard();
    }
  },

  /**
   * Open the edit chore modal for a specific chore
   * @param {string} choreId - ID of the chore to edit
   */
  openEditChoreModal(choreId) {
    const chore = this.getChoreById(choreId);
    if (!chore) return;
    
    const modal = document.getElementById('editChoreModal');
    if (!modal) return;
    
    // Populate form fields
    const form = modal.querySelector('form');
    if (form) {
      form.dataset.choreId = chore.id;
      form.elements.editChoreTitle.value = chore.title;
      form.elements.editChoreDescription.value = chore.description || '';
      form.elements.editChoreFrequency.value = chore.frequency || 'daily';
      form.elements.editChoreAssignee.value = chore.assignedTo || 'none';
      form.elements.editChorePoints.value = chore.points || 1;
      
      if (chore.dueDate && form.elements.editChoreDueDate) {
        // Format date as YYYY-MM-DD for input[type=date]
        const dueDate = new Date(chore.dueDate);
        const yyyy = dueDate.getFullYear();
        const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dueDate.getDate()).padStart(2, '0');
        form.elements.editChoreDueDate.value = `${yyyy}-${mm}-${dd}`;
      }
    }
    
    // Set up form submission handler
    form.onsubmit = (e) => {
      e.preventDefault();
      
      const choreData = {
        title: form.editChoreTitle.value.trim(),
        description: form.editChoreDescription.value.trim(),
        frequency: form.editChoreFrequency.value,
        assignedTo: form.editChoreAssignee.value !== 'none' ? form.editChoreAssignee.value : null,
        points: parseInt(form.editChorePoints.value) || 1
      };
      
      // Optional due date
      if (form.editChoreDueDate && form.editChoreDueDate.value) {
        choreData.dueDate = new Date(form.editChoreDueDate.value).toISOString();
      } else {
        choreData.dueDate = null;
      }
      
      if (!choreData.title) {
        window.utils.showNotification('Please enter a chore title', 'error');
        return;
      }
      
      const success = this.updateChore(chore.id, choreData);
      
      if (success) {
        // Close modal
        if (typeof bootstrap !== 'undefined') {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
        
        // Refresh views
        this.renderChoresList();
        this.renderDashboard();
        
        window.utils.showNotification(`Chore "${choreData.title}" updated successfully!`, 'success');
      } else {
        window.utils.showNotification('Error updating chore', 'error');
      }
    };
    
    // Show the modal
    if (typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  },

  /**
   * Toggle the completion status of a chore
   * @param {string} choreId - ID of the chore
   * @param {string|null} familyMemberId - ID of family member completing the chore
   */
  toggleChoreCompletion(choreId, familyMemberId = null) {
    const chore = this.getChoreById(choreId);
    if (!chore) return;
    
    // If familyMemberId not provided, use the assigned family member
    const memberId = familyMemberId || chore.assignedTo;
    
    // Check if this chore is already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isCompletedToday = this.completedChores.some(completed => {
      const completedDate = new Date(completed.completedDate);
      completedDate.setHours(0, 0, 0, 0);
      return completed.choreId === choreId && 
             (completedDate.getTime() === today.getTime()) &&
             (!memberId || completed.familyMember === memberId);
    });
    
    if (isCompletedToday) {
      // Remove the completion entry for today
      this.completedChores = this.completedChores.filter(completed => {
        const completedDate = new Date(completed.completedDate);
        completedDate.setHours(0, 0, 0, 0);
        return !(completed.choreId === choreId && 
                completedDate.getTime() === today.getTime() &&
                (!memberId || completed.familyMember === memberId));
      });
      
      window.choreStorage.setItem('completedChores', this.completedChores);
      window.utils.showNotification(`Marked "${chore.title}" as incomplete`, 'info');
    } else {
      // Add completion entry
      window.choreStorage.addCompletedChore(choreId, memberId, new Date());
      this.completedChores = window.choreStorage.getCompletedChores();
      
      window.utils.showNotification(`Completed "${chore.title}"!`, 'success');
    }
    
    // Refresh views
    this.renderChoresList();
    this.renderDashboard();
  },

  /**
   * Assign a chore to a family member
   * @param {string} choreId - ID of the chore
   * @param {string} memberId - ID of the family member
   */
  assignChoreToMember(choreId, memberId) {
    const success = this.updateChore(choreId, { assignedTo: memberId });
    
    if (success) {
      const chore = this.getChoreById(choreId);
      const member = this.familyMembers.find(m => m.id === memberId);
      
      if (chore && member) {
        window.utils.showNotification(`Assigned "${chore.title}" to ${member.name}`, 'success');
        this.renderChoresList();
        this.renderDashboard();
      }
    }
  },

  /**
   * Check if a chore is completed today
   * @param {string} choreId - ID of the chore
   * @param {string|null} memberId - Optional family member ID
   * @returns {boolean} True if completed today
   */
  isChoreCompletedToday(choreId, memberId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.completedChores.some(completed => {
      const completedDate = new Date(completed.completedDate);
      completedDate.setHours(0, 0, 0, 0);
      return completed.choreId === choreId && 
             completedDate.getTime() === today.getTime() &&
             (!memberId || completed.familyMember === memberId);
    });
  },

  /**
   * Get chores with applied filters
   * @param {Object} filters - Filters to apply
   * @returns {Array} Filtered chores
   */
  getFilteredChores(filters = {}) {
    let result = [...this.chores];
    
    // Filter by status
    if (filters.status) {
      switch (filters.status) {
        case 'completed':
          result = result.filter(chore => this.isChoreCompletedToday(chore.id));
          break;
        case 'incomplete':
          result = result.filter(chore => !this.isChoreCompletedToday(chore.id));
          break;
      }
    }
    
    // Filter by assigned member
    if (filters.memberId) {
      result = result.filter(chore => chore.assignedTo === filters.memberId);
    }
    
    // Filter by frequency
    if (filters.frequency) {
      result = result.filter(chore => chore.frequency === filters.frequency);
    }
    
    // Filter by due date
    if (filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.dueDate) {
        case 'today':
          result = result.filter(chore => {
            if (!chore.dueDate) return false;
            const dueDate = new Date(chore.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
          break;
        case 'overdue':
          result = result.filter(chore => {
            if (!chore.dueDate) return false;
            const dueDate = new Date(chore.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today && !this.isChoreCompletedToday(chore.id);
          });
          break;
        case 'upcoming':
          result = result.filter(chore => {
            if (!chore.dueDate) return false;
            const dueDate = new Date(chore.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > today;
          });
          break;
      }
    }
    
    // Sort results
    if (filters.sort) {
      switch (filters.sort) {
        case 'name':
          result.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'dueDate':
          result.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
          break;
        case 'points':
          result.sort((a, b) => (b.points || 0) - (a.points || 0));
          break;
        case 'frequency':
          const frequencyOrder = { daily: 1, weekly: 2, monthly: 3 };
          result.sort((a, b) => {
            return (frequencyOrder[a.frequency] || 99) - (frequencyOrder[b.frequency] || 99);
          });
          break;
      }
    }
    
    return result;
  },

  /**
   * Render the chores list with current filters
   */
  renderChoresList() {
    const choresList = document.getElementById('choresList');
    if (!choresList) return;
    
    // Get filter values
    const filterSelect = document.getElementById('choreFilter');
    const sortSelect = document.getElementById('choreSort');
    
    const filters = {
      status: filterSelect ? filterSelect.value : null,
      sort: sortSelect ? sortSelect.value : 'name'
    };
    
    const filteredChores = this.getFilteredChores(filters);
    
    // Clear the list
    choresList.innerHTML = '';
    
    if (filteredChores.length === 0) {
      choresList.innerHTML = `
        <div class="no-chores-message">
          <p>No chores found</p>
          <button class="btn btn-primary btn-add-chore">Add a Chore</button>
        </div>
      `;
      return;
    }
    
    // Render each chore
    filteredChores.forEach(chore => {
      const isCompleted = this.isChoreCompletedToday(chore.id);
      const assignedMember = chore.assignedTo ? 
        this.familyMembers.find(m => m.id === chore.assignedTo) : null;
      
      const choreElement = document.createElement('div');
      choreElement.className = `chore-item ${isCompleted ? 'completed' : ''}`;
      choreElement.dataset.id = chore.id;
      
      // Format due date if available
      let dueDateText = '';
      if (chore.dueDate) {
        const dueDate = new Date(chore.dueDate);
        dueDateText = `Due: ${window.utils.formatDate(dueDate)}`;
        
        // Check if overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today && !isCompleted) {
          dueDateText = `<span class="overdue">Overdue: ${window.utils.formatDate(dueDate)}</span>`;
        }
      }
      
      choreElement.innerHTML = `
        <div class="chore-header">
          <div class="chore-complete-toggle">
            <input type="checkbox" id="chore-${chore.id}" ${isCompleted ? 'checked' : ''}>
            <label for="chore-${chore.id}"></label>
          </div>
          <div class="chore-title">${chore.title}</div>
          <div class="chore-points">${chore.points} pts</div>
        </div>
        <div class="chore-details">
          <div class="chore-description">${chore.description || ''}</div>
          <div class="chore-meta">
            <span class="chore-frequency">${window.utils.capitalize(chore.frequency || 'daily')}</span>
            ${dueDateText ? `<span class="chore-due-date">${dueDateText}</span>` : ''}
          </div>
          <div class="chore-assignment">
            ${assignedMember ? 
              `<div class="assigned-member" style="border-color: ${assignedMember.color}">
                <span class="member-avatar">${assignedMember.name.charAt(0)}</span>
                <span class="member-name">${assignedMember.name}</span>
              </div>` : 
              `<div class="unassigned">Unassigned</div>`
            }
          </div>
          <div class="chore-actions">
            <button class="btn btn-sm btn-edit-chore" aria-label="Edit chore">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-delete-chore" aria-label="Delete chore">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      
      choresList.appendChild(choreElement);
    });
  },

  /**
   * Render dashboard with stats and overviews
   */
  renderDashboard() {
    const totalChores = this.chores.length;
    const completedToday = this.chores.filter(chore => this.isChoreCompletedToday(chore.id)).length;
    const completionRate = totalChores ? Math.round((completedToday / totalChores) * 100) : 0;
    
    // Update dashboard stats
    const totalChoresElement = document.getElementById('totalChores');
    const completedChoresElement = document.getElementById('completedChores');
    const completionRateElement = document.getElementById('completionRate');
    
    if (totalChoresElement) totalChoresElement.textContent = totalChores;
    if (completedChoresElement) completedChoresElement.textContent = completedToday;
    if (completionRateElement) completionRateElement.textContent = `${completionRate}%`;
    
    // Update progress bar if exists
    const progressBar = document.querySelector('.dashboard-progress-bar .progress-value');
    if (progressBar) {
      progressBar.style.width = `${completionRate}%`;
    }
    
    // Update family member stats
    this.renderFamilyStats();
    
    // Update upcoming chores
    this.renderUpcomingChores();
  },

  /**
   * Render family member statistics
   */
  renderFamilyStats() {
    const familyStatsElement = document.getElementById('familyStats');
    if (!familyStatsElement) return;
    
    familyStatsElement.innerHTML = '';
    
    this.familyMembers.forEach(member => {
      const assignedChores = this.chores.filter(chore => chore.assignedTo === member.id);
      const completedChores = assignedChores.filter(chore => this.isChoreCompletedToday(chore.id, member.id));
      const completionRate = assignedChores.length ? Math.round((completedChores.length / assignedChores.length) * 100) : 0;
      
      // Calculate points earned today
      const pointsToday = completedChores.reduce((total, chore) => total + (chore.points || 0), 0);
      
      // Calculate points earned this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const pointsThisWeek = this.completedChores
        .filter(completed => {
          const completedDate = new Date(completed.completedDate);
          return completed.familyMember === member.id && completedDate >= startOfWeek;
        })
        .reduce((total, completed) => {
          const chore = this.getChoreById(completed.choreId);
          return total + (chore ? (chore.points || 0) : 0);
        }, 0);
      
      const memberElement = document.createElement('div');
      memberElement.className = 'family-member-stat';
      memberElement.style.borderColor = member.color;
      
      memberElement.innerHTML = `
        <div class="member-header" style="background-color: ${member.color}20">
          <div class="member-avatar">${member.name.charAt(0)}</div>
          <div class="member-name">${member.name}</div>
        </div>
        <div class="member-stats">
          <div class="stat">
            <span class="stat-value">${assignedChores.length}</span>
            <span class="stat-label">Assigned</span>
          </div>
          <div class="stat">
            <span class="stat-value">${completedChores.length}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${pointsToday}</span>
            <span class="stat-label">Points Today</span>
          </div>
          <div class="stat">
            <span class="stat-value">${pointsThisWeek}</span>
            <span class="stat-label">Points This Week</span>
          </div>
        </div>
        <div class="member-progress">
          <div class="progress-bar">
            <div class="progress-value" style="width: ${completionRate}%"></div>
          </div>
          <div class="progress-label">${completionRate}% Complete</div>
        </div>
      `;
      
      familyStatsElement.appendChild(memberElement);
    });
  },

  /**
   * Render upcoming chores
   */
  renderUpcomingChores() {
    const upcomingChoresElement = document.getElementById('upcomingChores');
    if (!upcomingChoresElement) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get chores due today or in the future
    const upcomingChores = this.chores
      .filter(chore => {
        if (!chore.dueDate) return false;
        const dueDate = new Date(chore.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Take only the first 5
    const limitedChores = upcomingChores.slice(0, 5);
    
    if (limitedChores.length === 0) {
      upcomingChoresElement.innerHTML = '<p class="no-data-message">No upcoming chores</p>';
      return;
    }
    
    upcomingChoresElement.innerHTML = '';
    
    limitedChores.forEach(chore => {
      const dueDate = new Date(chore.dueDate);
      const isToday = window.utils.isToday(dueDate);
      const assignedMember = chore.assignedTo ? 
        this.familyMembers.find(m => m.id === chore.assignedTo) : null;
      
      const choreElement = document.createElement('div');
      choreElement.className = 'upcoming-chore';
      choreElement.dataset.id = chore.id;
      
      choreElement.innerHTML = `
        <div class="upcoming-chore-date ${isToday ? 'today' : ''}">
          ${isToday ? 'Today' : window.utils.formatDate(dueDate)}
        </div>
        <div class="upcoming-chore-title">${chore.title}</div>
        <div class="upcoming-chore-assignment">
          ${assignedMember ? 
            `<div class="assigned-member" style="border-color: ${assignedMember.color}">
              <span class="member-name">${assignedMember.name}</span>
            </div>` : 
            `<div class="unassigned">Unassigned</div>`
          }
        </div>
      `;
      
      upcomingChoresElement.appendChild(choreElement);
    });
  }
};

// Initialize chore manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.choreManager = choreManager;
  choreManager.init();
});

/**
 * Complete a chore
 * @param {string} choreId - The ID of the chore to complete
 * @param {string} completedBy - The name of the person completing the chore
 */
async function completeChore(choreId, completedBy) {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    // Get current user from localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.utils.showNotification('Please log in to complete chores.', 'error');
        return;
    }

    // Trigger chore completion request event
    const event = new CustomEvent('choreCompletionRequested', {
        detail: { chore, completedBy: currentUser }
    });
    document.dispatchEvent(event);

    // Update UI to show pending approval
    updateChoreUI(choreId, 'pending');
}

/**
 * Update chore UI to show pending approval
 * @param {string} choreId - The ID of the chore
 * @param {string} status - The status to show (pending, approved, denied)
 */
function updateChoreUI(choreId, status) {
    const choreElement = document.querySelector(`[data-chore-id="${choreId}"]`);
    if (!choreElement) return;

    const statusIndicator = choreElement.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>Waiting for parent approval...</span>
        `;
    }
} 