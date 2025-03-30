/**
 * Calendar Service
 * Fetches and processes calendar data from the Cozi Calendar integration
 */

// Load the pre-fetched calendar data from the public directory
export const fetchCalendarEvents = async () => {
  try {
    const response = await fetch('/calendar-data.json');
    if (!response.ok) {
      throw new Error(Failed to fetch calendar data: );
    }
    
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Format a date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Get upcoming events (next 7 days)
export const getUpcomingEvents = (events) => {
  if (!events || !Array.isArray(events)) return [];
  
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  
  return events
    .filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
};
