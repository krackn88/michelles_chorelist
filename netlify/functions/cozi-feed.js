const fetch = require('node-fetch');
const ical = require('ical');

exports.handler = async function(event, context) {
  // Set CORS headers for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  console.log('Received request for Cozi feed');
  
  try {
    // Get the Cozi feed URL from the query string
    const coziUrl = event.queryStringParameters.url;
    
    if (!coziUrl) {
      console.log('Error: No URL provided');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'No URL provided'
        })
      };
    }
    
    console.log(`Fetching Cozi calendar from URL: ${coziUrl}`);
    
    // Fetch the iCal feed
    const response = await fetch(coziUrl, {
      headers: {
        'User-Agent': 'Family Chore Manager/1.0',
        'Accept': 'text/calendar,application/calendar+xml'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      console.log(`Error fetching feed: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: `Failed to fetch Cozi calendar: ${response.statusText}`,
          status: response.status
        })
      };
    }
    
    const icalData = await response.text();
    
    console.log(`Received iCal data, length: ${icalData.length} characters`);
    
    if (!icalData || icalData.length < 10) {
      console.log('Error: Empty or invalid iCal data received');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Empty or invalid iCal data received from Cozi'
        })
      };
    }
    
    // Parse the iCal data
    const parsedEvents = ical.parseICS(icalData);
    
    console.log(`Parsed ${Object.keys(parsedEvents).length} events from iCal data`);
    
    // Transform the events to a more usable format
    const events = Object.values(parsedEvents)
      .filter(event => event.type === 'VEVENT')
      .map(event => {
        console.log(`Processing event: ${event.summary}, start: ${event.start}`);
        return {
          id: event.uid,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start,
          end: event.end,
          allDay: !event.start || !event.start.hasOwnProperty('hour'),
          organizer: event.organizer ? event.organizer.params?.CN : '',
          created: event.created,
          lastModified: event.lastModified
        };
      });
    
    console.log(`Returning ${events.length} formatted events`);
    
    // Return the events as JSON
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      },
      body: JSON.stringify({
        success: true,
        events: events
      })
    };
    
  } catch (error) {
    console.error('Error processing Cozi calendar:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to process Cozi calendar',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 