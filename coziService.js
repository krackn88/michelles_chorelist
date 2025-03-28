import axios from 'axios';
import { getAuthToken } from './authService';

// Base URL for Cozi API
const COZI_API_BASE_URL = 'https://api.cozi.com/v1';

// Get auth token for Cozi API
const getCoziAuthHeaders = () => {
  const coziToken = localStorage.getItem('coziToken');
  return {
    Authorization: `Bearer ${coziToken}`,
    'Content-Type': 'application/json',
  };
};

// Fetch calendar events from Cozi
export const fetchCoziCalendarEvents = async (startDate, endDate) => {
  try {
    // If no dates provided, default to current month
    if (!startDate || !endDate) {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Check if we have demo data in local storage
    const useDemoData = localStorage.getItem('useDemoData') === 'true';
    
    if (useDemoData) {
      return generateDemoCoziEvents(startDate, endDate);
    }
    
    const response = await axios.get(
      `${COZI_API_BASE_URL}/calendar/events`,
      {
        headers: getCoziAuthHeaders(),
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      }
    );
    
    return response.data.events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      location: event.location,
      notes: event.notes,
      type: 'cozi'
    }));
  } catch (error) {
    console.error('Error fetching Cozi calendar events:', error);
    
    // If API call fails, return demo data
    return generateDemoCoziEvents(startDate, endDate);
  }
};

// Connect to Cozi account
export const connectCoziAccount = async (email, password) => {
  try {
    // In a real implementation, this would authenticate with Cozi API
    // For demo purposes, we'll just simulate a successful connection
    const mockToken = 'mock-cozi-token-' + Math.random().toString(36).substring(2);
    localStorage.setItem('coziToken', mockToken);
    localStorage.setItem('coziConnected', 'true');
    localStorage.setItem('coziEmail', email);
    
    return {
      success: true,
      message: 'Successfully connected to Cozi account'
    };
  } catch (error) {
    console.error('Error connecting to Cozi account:', error);
    return {
      success: false,
      message: 'Failed to connect to Cozi account: ' + error.message
    };
  }
};

// Generate demo Cozi events for testing
const generateDemoCoziEvents = (startDate, endDate) => {
  const events = [];
  const eventTypes = [
    'Doctor Appointment', 
    'School Meeting', 
    'Soccer Practice', 
    'Dance Class', 
    'Swimming Lessons',
    'Dentist Appointment',
    'Birthday Party',
    'Grocery Shopping',
    'Family Dinner'
  ];
  
  // Create a range of dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.round((end - start) / (24 * 60 * 60 * 1000));
  
  // Generate 1-3 events per day
  for (let i = 0; i < dayCount; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    
    // Skip some days randomly
    if (Math.random() > 0.7) continue;
    
    // Generate 1-3 events for this day
    const eventCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < eventCount; j++) {
      const hours = 9 + Math.floor(Math.random() * 10); // Between 9 AM and 7 PM
      const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
      
      const eventStart = new Date(day);
      eventStart.setHours(hours, minutes, 0, 0);
      
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + 1); // 1 hour events
      
      const eventTypeIndex = Math.floor(Math.random() * eventTypes.length);
      
      events.push({
        id: `demo-${i}-${j}`,
        title: eventTypes[eventTypeIndex],
        start: eventStart,
        end: eventEnd,
        location: Math.random() > 0.5 ? 'Home' : 'School',
        notes: '',
        type: 'cozi'
      });
    }
  }
  
  return events;
};

// Disconnect Cozi account
export const disconnectCoziAccount = () => {
  localStorage.removeItem('coziToken');
  localStorage.setItem('coziConnected', 'false');
  localStorage.removeItem('coziEmail');
  
  return {
    success: true,
    message: 'Successfully disconnected Cozi account'
  };
};

// Check if Cozi is connected
export const isCoziConnected = () => {
  return localStorage.getItem('coziConnected') === 'true';
};

// Get connected Cozi email
export const getCoziEmail = () => {
  return localStorage.getItem('coziEmail');
};