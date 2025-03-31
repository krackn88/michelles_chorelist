/**
 * Family Chore Manager - Family Member Management
 * Handles adding, editing, and managing family members
 */

const familyManager = {
  /**
   * Initialize the family manager
   */
  init() {
    this.setupEventListeners();
    this.loadFamilyMembers();
    this.renderFamilyMembers();
    this.populateFamilyMemberDropdowns();
  },

  /**
   * Set up event listeners for family member actions
   */
  setupEventListeners() {
    // Add family member form submission
    const addFamilyMemberForm = document.getElementById('addFamilyMemberForm');
    if (addFamilyMemberForm) {
      addFamilyMemberForm.addEventListener('submit', this.handleAddFamilyMember.bind(this));
    }

    // Add family member button
    const addFamilyMemberBtn = document.getElementById('addFamilyMemberBtn');
    if (addFamilyMemberBtn) {
      addFamilyMemberBtn.addEventListener('click', () => {
        const modal = document.getElementById('addFamilyMemberModal');
        if (modal && typeof bootstrap !== 'undefined') {
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        }
      });
    }

    // Edit family member
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-edit-member') || e.target.closest('.btn-edit-member')) {
        const memberElement = e.target.closest('.family-member-card');
        if (memberElement) {
          const memberId = memberElement.dataset.id;
          this.openEditMemberModal(memberId);
        }
      }
    });

    // Delete family member
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-delete-member') || e.target.closest('.btn-delete-member')) {
        const memberElement = e.target.closest('.family-member-card');
        if (memberElement) {
          const memberId = memberElement.dataset.id;
          this.confirmDeleteMember(memberId);
        }
      }
    });
  },

  /**
   * Load family members from storage
   */
  loadFamilyMembers() {
    this.familyMembers = window.familyStorage.getMembers();
    
    // Create default member if none exist
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
  },

  /**
   * Render the family members list
   */
  renderFamilyMembers() {
    const familyMembersList = document.getElementById('familyMembersList');
    if (!familyMembersList) return;
    
    familyMembersList.innerHTML = '';
    
    if (this.familyMembers.length === 0) {
      familyMembersList.innerHTML = `
        <div class="no-members-message">
          <p>No family members found</p>
          <button class="btn btn-primary" id="addFamilyMemberBtn">
            <i class="fas fa-user-plus"></i> Add Member
          </button>
        </div>
      `;
      return;
    }
    
    // Create a container for the grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'family-members-grid';
    
    // Render each family member
    this.familyMembers.forEach(member => {
      const memberElement = document.createElement('div');
      memberElement.className = 'family-member-card';
      memberElement.dataset.id = member.id;
      memberElement.style.borderColor = member.color;
      
      // Get assigned chores count
      const assignedChoresCount = window.choreManager ? 
        window.choreManager.chores.filter(chore => chore.assignedTo === member.id).length : 0;
      
      // Get completed chores count
      const completedChoresCount = window.choreManager ? 
        window.choreManager.completedChores.filter(completed => 
          completed.familyMember === member.id && 
          window.utils.isToday(new Date(completed.completedDate))
        ).length : 0;
      
      // Get total points for the member
      const totalPoints = window.choreManager ? 
        window.choreManager.completedChores
          .filter(completed => completed.familyMember === member.id)
          .reduce((total, completed) => {
            const chore = window.choreManager.getChoreById(completed.choreId);
            return total + (chore ? (chore.points || 0) : 0);
          }, 0) : 0;
      
      memberElement.innerHTML = `
        <div class="member-header" style="background-color: ${member.color}20">
          <div class="member-avatar" style="background-color: ${member.color}">
            ${member.name.charAt(0).toUpperCase()}
          </div>
          <div class="member-name">${member.name}</div>
        </div>
        <div class="member-stats">
          <div class="stat">
            <span class="stat-value">${assignedChoresCount}</span>
            <span class="stat-label">Assigned</span>
          </div>
          <div class="stat">
            <span class="stat-value">${completedChoresCount}</span>
            <span class="stat-label">Today</span>
          </div>
          <div class="stat">
            <span class="stat-value">${totalPoints}</span>
            <span class="stat-label">Points</span>
          </div>
        </div>
        <div class="member-actions">
          <button class="btn btn-sm btn-edit-member" aria-label="Edit member">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-delete-member" aria-label="Delete member">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      gridContainer.appendChild(memberElement);
    });
    
    familyMembersList.appendChild(gridContainer);
  },

  /**
   * Populate family member dropdown selects throughout the app
   */
  populateFamilyMemberDropdowns() {
    // Find all dropdowns for family members
    const familyMemberSelects = document.querySelectorAll('select[id$="Assignee"]');
    
    familyMemberSelects.forEach(select => {
      // Clear existing options except the first one (which is usually "Unassigned")
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add an option for each family member
      this.familyMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
      });
    });
  },

  /**
   * Handle adding a new family member
   * @param {Event} e - Form submit event
   */
  handleAddFamilyMember(e) {
    e.preventDefault();
    const form = e.target;
    
    const memberData = {
      name: form.memberName.value.trim(),
      color: form.memberColor.value || '#ff9baf'
    };
    
    if (!memberData.name) {
      window.utils.showNotification('Please enter a name for the family member', 'error');
      return;
    }
    
    const newMember = this.addFamilyMember(memberData);
    
    // Close modal and reset form
    const modal = document.getElementById('addFamilyMemberModal');
    if (modal && typeof bootstrap !== 'undefined') {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }
    
    form.reset();
    form.memberColor.value = '#ff9baf'; // Reset to default pink
    
    window.utils.showNotification(`Family member "${newMember.name}" added successfully!`, 'success');
  },

  /**
   * Add a new family member
   * @param {Object} memberData - Family member data
   * @returns {Object} Newly created family member
   */
  addFamilyMember(memberData) {
    const newMember = {
      id: window.utils.generateId(),
      name: memberData.name,
      color: memberData.color,
      avatar: memberData.avatar || 'default',
      created: new Date().toISOString()
    };
    
    window.familyStorage.addMember(newMember);
    this.familyMembers.push(newMember);
    
    // Update UI
    this.renderFamilyMembers();
    this.populateFamilyMemberDropdowns();
    
    // If we have the chore manager available, refresh it
    if (window.choreManager) {
      window.choreManager.familyMembers = this.familyMembers;
      window.choreManager.renderDashboard();
    }
    
    return newMember;
  },

  /**
   * Open a modal to edit a family member
   * @param {string} memberId - ID of the family member to edit
   */
  openEditMemberModal(memberId) {
    const member = this.familyMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Create a modal dynamically if it doesn't exist
    let editModal = document.getElementById('editFamilyMemberModal');
    
    if (!editModal) {
      editModal = document.createElement('div');
      editModal.className = 'modal fade';
      editModal.id = 'editFamilyMemberModal';
      editModal.setAttribute('tabindex', '-1');
      editModal.setAttribute('aria-hidden', 'true');
      
      editModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Family Member</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="editFamilyMemberForm">
                <input type="hidden" id="editMemberId">
                <div class="mb-3">
                  <label for="editMemberName" class="form-label">Name</label>
                  <input type="text" class="form-control" id="editMemberName" required>
                </div>
                <div class="mb-3">
                  <label for="editMemberColor" class="form-label">Color</label>
                  <input type="color" class="form-control form-control-color" id="editMemberColor">
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(editModal);
      
      // Add event listener for the form
      const editForm = document.getElementById('editFamilyMemberForm');
      if (editForm) {
        editForm.addEventListener('submit', this.handleEditFamilyMember.bind(this));
      }
    }
    
    // Populate form fields
    const form = document.getElementById('editFamilyMemberForm');
    if (form) {
      form.editMemberId.value = member.id;
      form.editMemberName.value = member.name;
      form.editMemberColor.value = member.color;
    }
    
    // Show the modal
    if (typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(editModal);
      bsModal.show();
    }
  },

  /**
   * Handle editing a family member
   * @param {Event} e - Form submit event
   */
  handleEditFamilyMember(e) {
    e.preventDefault();
    const form = e.target;
    
    const memberId = form.editMemberId.value;
    const memberData = {
      name: form.editMemberName.value.trim(),
      color: form.editMemberColor.value
    };
    
    if (!memberData.name) {
      window.utils.showNotification('Please enter a name for the family member', 'error');
      return;
    }
    
    const success = this.updateFamilyMember(memberId, memberData);
    
    if (success) {
      // Close modal
      const modal = document.getElementById('editFamilyMemberModal');
      if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      
      window.utils.showNotification(`Family member "${memberData.name}" updated successfully!`, 'success');
    } else {
      window.utils.showNotification('Error updating family member', 'error');
    }
  },

  /**
   * Update a family member's information
   * @param {string} memberId - ID of the family member to update
   * @param {Object} memberData - Updated family member data
   * @returns {boolean} Success state
   */
  updateFamilyMember(memberId, memberData) {
    const index = this.familyMembers.findIndex(m => m.id === memberId);
    if (index === -1) return false;
    
    const updatedMember = {
      ...this.familyMembers[index],
      ...memberData,
      lastUpdated: new Date().toISOString()
    };
    
    this.familyMembers[index] = updatedMember;
    window.familyStorage.updateMember(updatedMember);
    
    // Update UI
    this.renderFamilyMembers();
    this.populateFamilyMemberDropdowns();
    
    // If we have the chore manager available, refresh it
    if (window.choreManager) {
      window.choreManager.familyMembers = this.familyMembers;
      window.choreManager.renderDashboard();
    }
    
    return true;
  },

  /**
   * Confirm deletion of a family member
   * @param {string} memberId - ID of the family member to delete
   */
  confirmDeleteMember(memberId) {
    const member = this.familyMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Check if any chores are assigned to this member
    const hasAssignedChores = window.choreManager ? 
      window.choreManager.chores.some(chore => chore.assignedTo === memberId) : false;
    
    let confirmMessage = `Are you sure you want to delete the family member "${member.name}"?`;
    
    if (hasAssignedChores) {
      confirmMessage += `\n\nWarning: This member has assigned chores. Those chores will be unassigned.`;
    }
    
    if (confirm(confirmMessage)) {
      this.deleteFamilyMember(memberId);
    }
  },

  /**
   * Delete a family member
   * @param {string} memberId - ID of the family member to delete
   * @returns {boolean} Success state
   */
  deleteFamilyMember(memberId) {
    const member = this.familyMembers.find(m => m.id === memberId);
    if (!member) return false;
    
    // First unassign any chores assigned to this member
    if (window.choreManager) {
      window.choreManager.chores.forEach(chore => {
        if (chore.assignedTo === memberId) {
          window.choreManager.updateChore(chore.id, { assignedTo: null });
        }
      });
    }
    
    // Remove the member
    const success = window.familyStorage.deleteMember(memberId);
    
    if (success) {
      this.familyMembers = this.familyMembers.filter(m => m.id !== memberId);
      
      // Update UI
      this.renderFamilyMembers();
      this.populateFamilyMemberDropdowns();
      
      // If we have the chore manager available, refresh it
      if (window.choreManager) {
        window.choreManager.familyMembers = this.familyMembers;
        window.choreManager.renderDashboard();
      }
      
      window.utils.showNotification(`Family member "${member.name}" has been deleted`, 'info');
    }
    
    return success;
  },

  /**
   * Get a family member by ID
   * @param {string} memberId - ID of the family member
   * @returns {Object|null} Family member object or null if not found
   */
  getMemberById(memberId) {
    return this.familyMembers.find(member => member.id === memberId) || null;
  },

  /**
   * Get all family members
   * @returns {Array} Array of family member objects
   */
  getAllMembers() {
    return this.familyMembers;
  }
};

// Initialize family manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.familyManager = familyManager;
  familyManager.init();
}); 