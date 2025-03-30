const fetch = require('node-fetch');
const ical = require('ical');

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { url } = event.queryStringParameters;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing Cozi URL parameter' }),
    };
  }

  try {
    // Fetch iCal data from Cozi
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const icalData = await response.text();
    
    // Parse iCal data
    const parsedData = ical.parseICS(icalData);
    
    // Transform data into a more convenient format
    const events = Object.values(parsedData)
      .filter(item => item.type === 'VEVENT')
      .map(event => ({
        id: event.uid,
        summary: event.summary,
        description: event.description || '',
        location: event.location || '',
        start: event.start ? event.start.toISOString() : null,
        end: event.end ? event.end.toISOString() : null,
        allDay: !event.start || !event.start.getHours(),
        categories: event.categories || []
      }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify(events)
    };
  } catch (error) {
    console.error('Error fetching Cozi calendar:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch Cozi calendar data',
        details: error.message
      })
    };
  }
};