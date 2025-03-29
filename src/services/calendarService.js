import ical from 'node-ical';

const COZI_CALENDAR_URL = 'https://rest.cozi.com/api/ext/1103/b4aed401-01a9-45e7-8082-4d88db3fa35a/icalendar/feed/feed.ics';

export const fetchCalendarEvents = () => {
  return new Promise((resolve, reject) => {
    ical.fromURL(COZI_CALENDAR_URL, {}, (err, data) => {
      if (err) {
        console.error('Error fetching calendar events:', err);
        reject(err);
        return;
      }
      
      const events = [];
      
      for (let k in data) {
        if (data[k].type === 'VEVENT') {
          const event = data[k];
          events.push({
            id: event.uid,
            title: event.summary,
            start: event.start,
            end: event.end || event.start,
            description: event.description,
            location: event.location
          });
        }
      }
      
      resolve(events);
    });
  });
};
