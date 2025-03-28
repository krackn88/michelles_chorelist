/**
 * Cozi Calendar Integration Service
 * Handles fetching and processing data from Cozi Calendar
 */
import axios from 'axios';
import credentialManager from '../utils/credentialManager';

class CoziIntegrationService {
  constructor() {
    this.baseUrl = '';
    this.apiToken = '';
    this.isInitialized = false;
  }

  /**
   * Initialize the Cozi integration with saved credentials
   * @returns {boolean} - True if initialization successful
   */
  initialize() {
    const coziConfig = credentialManager.getCredential('coziConfig');
    if (!coziConfig) return false;

    this.baseUrl = coziConfig.url;
    this.apiToken = coziConfig.token;
    this.isInitialized = true;
    return true;
  }

  /**
   * Setup Cozi integration with new credentials
   * @param {Object} config - Configuration object with url and token
   * @returns {Promise<boolean>} - True if setup and validation successful
   */
  async setupIntegration(config) {
    try {
      // Validate the credentials by making a test request
      const testResult = await this.testConnection(config);
      if (!testResult.success) {
        return { success: false, message: testResult.message };
      }

      // Store credentials securely
      credentialManager.saveCredential('coziConfig', {
        url: config.url,
        token: config.token
      });

      // Initialize with new credentials
      this.baseUrl = config.url;
      this.apiToken = config.token;
      this.isInitialized = true;

      return { success: true };
    } catch (error) {
      console.error('Failed to setup Cozi integration:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to setup Cozi integration' 
      };
    }
  }

  /**
   * Test the connection to Cozi Calendar
   * @param {Object} config - Configuration with url and token
   * @returns {Promise<Object>} - Result of connection test
   */
  async testConnection(config) {
    try {
      const response = await axios.get(`${config.url}/api/calendar/test`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Received unexpected response: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Connection test failed' 
      };
    }
  }

  /**
   * Get all events for a given date range
   * @param {Date} startDate - Start date for events
   * @param {Date} endDate - End date for events
   * @returns {Promise<Array>} - Array of calendar events
   */
  async getEvents(startDate, endDate) {
    if (!this.isInitialized) {
      if (!this.initialize()) {
        throw new Error('Cozi integration not initialized');
      }
    }

    try {
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      const response = await axios.get(`${this.baseUrl}/api/calendar/events`, {
        params: {
          start: formatDate(startDate),
          end: formatDate(endDate)
        },
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      return this.processEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch Cozi events:', error);
      throw error;
    }
  }

  /**
   * Process raw events from Cozi into a standardized format
   * @param {Array} rawEvents - Raw events from Cozi API
   * @returns {Array} - Processed events in standard format
   */
  processEvents(rawEvents) {
    if (!rawEvents || !Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents.map(event => ({
      id: event.id || `cozi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay || false,
      location: event.location || '',
      assignee: event.assignee || '',
      category: event.category || 'other',
      source: 'cozi'
    }));
  }
}

export default new CoziIntegrationService();
