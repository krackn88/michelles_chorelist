import axios from 'axios';
import ICAL from 'ical.js';

// Cozi iCalendar feed URL
const COZI_ICALENDAR_FEED_URL = 'https://rest.cozi.com/api/ext/1103/b4aed401-01a9-45e7-8082-4d88db3fa35a/icalendar/feed/feed.ics';

// Fetch calendar events from Cozi iCalendar feed
export const fetchCoziCalendarEvents = async () => {
  try {
    const response = await axios.get(COZI_ICALENDAR_FEED_URL);
    const parsedEvents = parseICalendar(response.data);
    
    return parsedEvents.map(event => ({
      id: event.uid,
      title: event.summary,
      start: new Date(event.start),
      end: new Date(event.end),
      location: event.location,
      notes: event.description,
      type: 'cozi'
    }));
  } catch (error) {
    console.error('Error fetching Cozi calendar events:', error);
    return [];
  }
};

// Parse iCalendar feed using ical.js
const parseICalendar = (icsData) => {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  
  return vevents.map(vevent => {
    const event = new ICAL.Event(vevent);
    return {
      uid: event.uid,
      summary: event.summary,
      start: event.startDate.toJSDate(),
      end: event.endDate.toJSDate(),
      location: event.location,
      description: event.description
    };
  });
};
