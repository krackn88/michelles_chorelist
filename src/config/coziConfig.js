/**
 * Cozi Calendar Integration Configuration
 * Created: 2025-03-28
 * Author: GitHub Copilot for krackn88
 * 
 * This module handles connection to Cozi family calendar service
 * and manages secure credential storage.
 */

import axios from 'axios';
import { decryptCredential } from './securityUtils';

// Configuration settings
let coziCredentials = null;
let configInitialized = false;

/**
 * Initialize the Cozi configuration with credentials
 * @param {Object} credentials - Encrypted credentials from the server
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeCoziConfig = async (credentials) => {
  try {
    if (!credentials || !credentials.coziUrl || !credentials.coziUsername) {
      console.error('Missing required Cozi credentials');
      return false;
    }
    
    coziCredentials = {
      url: credentials.coziUrl,
      username: credentials.coziUsername,
      password: credentials.coziPassword ? await decryptCredential(credentials.coziPassword) : null,
      apiKey: credentials.coziApiKey ? await decryptCredential(credentials.coziApiKey) : null
    };
    
    // Validate credentials by making a test API call
    const isValid = await testCoziConnection();
    configInitialized = isValid;
    
    if (!isValid) {
      console.error('Failed to validate Cozi credentials');
      return false;
    }
    
    console.log('Cozi calendar integration initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Cozi configuration:', error);
    return false;
  }
};

/**
 * Test the connection to Cozi calendar
 * @returns {Promise<boolean>} - Whether connection test was successful
 */
export const testCoziConnection = async () => {
  try {
    if (!coziCredentials) {
      return false;
    }
    
    // This is a placeholder for the actual Cozi API call
    // In a real implementation, you would use their documented API endpoints
    const response = await axios.get(`${coziCredentials.url}/api/test`, {
      headers: {
        'Authorization': coziCredentials.apiKey ? 
          `Bearer ${coziCredentials.apiKey}` : 
          `Basic ${btoa(`${coziCredentials.username}:${coziCredentials.password}`)}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.status === 200;
  } catch (error) {
    // For development, we'll return true even if the connection fails
    // This allows for development without actual Cozi credentials
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Pretending Cozi connection succeeded');
      return true;
    }
    
    console.error('Failed to connect to Cozi calendar:', error);
    return false;
  }
};

/**
 * Get calendar events from Cozi for the current week
 * @returns {Promise<Array>} - List of calendar events
 */
export const getWeeklyCalendarEvents = async () => {
  try {
    if (!configInitialized) {
      console.error('Cozi configuration not initialized');
      return [];
    }
    
    // Calculate date range for current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Format dates for API
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    
    // This is a placeholder for the actual Cozi API call
    const response = await axios.get(`${coziCredentials.url}/api/calendar/events`, {
      params: {
        startDate,
        endDate
      },
      headers: {
        'Authorization': coziCredentials.apiKey ? 
          `Bearer ${coziCredentials.apiKey}` : 
          `Basic ${btoa(`${coziCredentials.username}:${coziCredentials.password}`)}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      return getMockCalendarEvents();
    }
    
    return [];
  }
};

/**
 * Generate mock calendar events for development
 * @returns {Array} - Mock calendar events
 */
const getMockCalendarEvents = () => {
  const events = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const familyMembers = ['Mom', 'Dad', 'Emma', 'Jake', 'Lily'];
  const eventTypes = ['Doctor Appointment', 'Soccer Practice', 'Dance Class', 'School Project', 'Birthday Party'];
  
  // Generate random events for the week
  for (let i = 0; i < 12; i++) {
    const dayOffset = Math.floor(Math.random() * 7);
    const hourOffset = 9 + Math.floor(Math.random() * 8); // Between 9 AM and 5 PM
    
    const eventDate = new Date(startOfWeek);
    eventDate.setDate(startOfWeek.getDate() + dayOffset);
    eventDate.setHours(hourOffset, 0, 0, 0);
    
    const assignee = familyMembers[Math.floor(Math.random() * familyMembers.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    events.push({
      id: `mock-event-${i}`,
      title: eventType,
      description: `${eventType} for ${assignee}`,
      startDateTime: eventDate.toISOString(),
      endDateTime: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      location: 'Home',
      assignee,
      isCompleted: false
    });
  }
  
  return events;
};

export default {
  initializeCoziConfig,
  getWeeklyCalendarEvents,
  testCoziConnection
};
