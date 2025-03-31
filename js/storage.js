/**
 * Family Chore Manager - Storage Module
 * Handles data persistence using localStorage with fallback options
 */

class StorageManager {
  constructor(prefix = 'fcm_') {
    this.prefix = prefix;
    this.storage = window.localStorage;
    this.memoryFallback = new Map();
    this.initStorage();
  }

  /**
   * Initialize the storage system
   */
  initStorage() {
    // Test if localStorage is available
    try {
      const testKey = `${this.prefix}test`;
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      this.storageAvailable = true;
    } catch (e) {
      console.warn('localStorage not available, using memory fallback');
      this.storageAvailable = false;
    }
  }

  /**
   * Get the full key with prefix
   * @param {string} key - The key to prefix
   * @returns {string} The prefixed key
   */
  getFullKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set an item in storage
   * @param {string} key - The key to store under
   * @param {*} value - The value to store
   * @returns {boolean} Success state
   */
  setItem(key, value) {
    const fullKey = this.getFullKey(key);
    const valueToStore = JSON.stringify(value);

    try {
      if (this.storageAvailable) {
        this.storage.setItem(fullKey, valueToStore);
      } else {
        this.memoryFallback.set(fullKey, valueToStore);
      }
      return true;
    } catch (e) {
      console.error(`Error storing item ${key}:`, e);
      // Fallback to memory storage on error
      this.memoryFallback.set(fullKey, valueToStore);
      return false;
    }
  }

  /**
   * Get an item from storage
   * @param {string} key - The key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} The stored value or default
   */
  getItem(key, defaultValue = null) {
    const fullKey = this.getFullKey(key);
    
    try {
      let value;
      
      if (this.storageAvailable) {
        value = this.storage.getItem(fullKey);
      } else {
        value = this.memoryFallback.get(fullKey);
      }
      
      if (value === null || value === undefined) {
        return defaultValue;
      }
      
      return JSON.parse(value);
    } catch (e) {
      console.error(`Error retrieving item ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Remove an item from storage
   * @param {string} key - The key to remove
   * @returns {boolean} Success state
   */
  removeItem(key) {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.storageAvailable) {
        this.storage.removeItem(fullKey);
      }
      this.memoryFallback.delete(fullKey);
      return true;
    } catch (e) {
      console.error(`Error removing item ${key}:`, e);
      return false;
    }
  }

  /**
   * Clear all items with the current prefix
   */
  clear() {
    try {
      if (this.storageAvailable) {
        // Only clear items with our prefix
        const keysToRemove = [];
        
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          this.storage.removeItem(key);
        });
      }
      
      // Clear memory fallback
      for (const key of this.memoryFallback.keys()) {
        if (key.startsWith(this.prefix)) {
          this.memoryFallback.delete(key);
        }
      }
      
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  }

  /**
   * Get all keys in storage with current prefix
   * @returns {Array} Array of keys without prefix
   */
  keys() {
    const result = [];
    
    try {
      if (this.storageAvailable) {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key.startsWith(this.prefix)) {
            result.push(key.substring(this.prefix.length));
          }
        }
      } else {
        for (const key of this.memoryFallback.keys()) {
          if (key.startsWith(this.prefix)) {
            result.push(key.substring(this.prefix.length));
          }
        }
      }
      
      return result;
    } catch (e) {
      console.error('Error getting keys:', e);
      return [];
    }
  }

  /**
   * Check if a key exists in storage
   * @param {string} key - The key to check
   * @returns {boolean} True if key exists
   */
  hasItem(key) {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.storageAvailable) {
        return this.storage.getItem(fullKey) !== null;
      } else {
        return this.memoryFallback.has(fullKey);
      }
    } catch (e) {
      console.error(`Error checking for item ${key}:`, e);
      return false;
    }
  }

  /**
   * Get the size of storage in bytes
   * @returns {number} Size in bytes
   */
  getSize() {
    let size = 0;
    
    try {
      if (this.storageAvailable) {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key.startsWith(this.prefix)) {
            size += (key.length + this.storage.getItem(key).length) * 2; // UTF-16 uses 2 bytes per char
          }
        }
      } else {
        for (const [key, value] of this.memoryFallback.entries()) {
          if (key.startsWith(this.prefix)) {
            size += (key.length + value.length) * 2;
          }
        }
      }
      
      return size;
    } catch (e) {
      console.error('Error calculating storage size:', e);
      return 0;
    }
  }

  /**
   * Export all data as JSON
   * @returns {Object} All stored data
   */
  exportData() {
    const result = {};
    const keys = this.keys();
    
    for (const key of keys) {
      result[key] = this.getItem(key);
    }
    
    return result;
  }

  /**
   * Import data from JSON
   * @param {Object} data - Data to import
   * @param {boolean} clearFirst - Whether to clear existing data first
   * @returns {boolean} Success state
   */
  importData(data, clearFirst = true) {
    try {
      if (clearFirst) {
        this.clear();
      }
      
      for (const [key, value] of Object.entries(data)) {
        this.setItem(key, value);
      }
      
      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }
}

// Create and export a global storage instance
window.storage = new StorageManager();

// Create specialized storage sections for different data types
window.choreStorage = {
  getChores() {
    return window.storage.getItem('chores', []);
  },
  
  saveChores(chores) {
    return window.storage.setItem('chores', chores);
  },
  
  addChore(chore) {
    const chores = this.getChores();
    chores.push(chore);
    return this.saveChores(chores);
  },
  
  updateChore(updatedChore) {
    const chores = this.getChores();
    const index = chores.findIndex(c => c.id === updatedChore.id);
    
    if (index !== -1) {
      chores[index] = updatedChore;
      return this.saveChores(chores);
    }
    
    return false;
  },
  
  deleteChore(choreId) {
    const chores = this.getChores();
    const newChores = chores.filter(c => c.id !== choreId);
    
    if (newChores.length !== chores.length) {
      return this.saveChores(newChores);
    }
    
    return false;
  },
  
  getCompletedChores() {
    return window.storage.getItem('completedChores', []);
  },
  
  addCompletedChore(choreId, familyMember, completedDate = new Date()) {
    const completed = this.getCompletedChores();
    
    completed.push({
      choreId,
      familyMember,
      completedDate: completedDate.toISOString(),
      id: window.utils.generateId()
    });
    
    return window.storage.setItem('completedChores', completed);
  }
};

window.familyStorage = {
  getMembers() {
    return window.storage.getItem('familyMembers', []);
  },
  
  saveMembers(members) {
    return window.storage.setItem('familyMembers', members);
  },
  
  addMember(member) {
    const members = this.getMembers();
    members.push(member);
    return this.saveMembers(members);
  },
  
  updateMember(updatedMember) {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === updatedMember.id);
    
    if (index !== -1) {
      members[index] = updatedMember;
      return this.saveMembers(members);
    }
    
    return false;
  },
  
  deleteMember(memberId) {
    const members = this.getMembers();
    const newMembers = members.filter(m => m.id !== memberId);
    
    if (newMembers.length !== members.length) {
      return this.saveMembers(newMembers);
    }
    
    return false;
  }
};

window.settingsStorage = {
  getSettings() {
    return window.storage.getItem('settings', {
      theme: 'light',
      notificationsEnabled: true,
      reminderTime: '18:00',
      weekStartsOn: 0, // 0 = Sunday
      defaultView: 'dashboard'
    });
  },
  
  saveSettings(settings) {
    return window.storage.setItem('settings', settings);
  },
  
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  }
}; 